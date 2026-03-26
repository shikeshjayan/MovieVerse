// services/tfRecommend.js - HYBRID NEURAL COLLABORATIVE FILTERING
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import WEIGHTS from '../utils/scoreWeights.js';
import TF_CONFIG from '../utils/tfConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMBEDDING_DIM = TF_CONFIG.EMBEDDING_DIM;

const GENRE_LIST = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];
const GENRE_TO_IDX = Object.fromEntries(GENRE_LIST.map((g, i) => [g.toLowerCase(), i]));

function encodeGenres(genres, maxGenres = 3) {
  const encoding = new Array(GENRE_LIST.length).fill(0);
  const genreArr = Array.isArray(genres) ? genres.slice(0, maxGenres) : [];
  genreArr.forEach(g => {
    const idx = GENRE_TO_IDX[String(g).toLowerCase()];
    if (idx !== undefined) encoding[idx] = 1;
  });
  return encoding;
}

function extractYear(releaseDate) {
  if (!releaseDate) return 2000;
  const year = new Date(releaseDate).getFullYear();
  return isNaN(year) ? 2000 : Math.max(1900, Math.min(2026, year));
}

export async function buildInteractionMatrix(History, WatchLater, Wishlist, Review, Media) {
  console.log('[TF] Fetching data...');
  const [histories, watchlaters, wishlists, reviews, mediaDocs] = await Promise.all([
    History.find({}).populate('media', 'tmdbId mediaType genres releaseDate').lean().maxTimeMS(10000),
    WatchLater.find({}).populate('media', 'tmdbId mediaType genres releaseDate').lean().maxTimeMS(10000),
    Wishlist.find({}).populate('media', 'tmdbId mediaType genres releaseDate').lean().maxTimeMS(10000),
    Review.find({}).lean().maxTimeMS(10000),
    Media.find({}).select('tmdbId mediaType genres releaseDate popularity').limit(2000).lean().maxTimeMS(10000),
  ]);
  console.log('[TF] Data fetched - History:', histories.length, 'WatchLater:', watchlaters.length, 'Wishlist:', wishlists.length, 'Reviews:', reviews.length, 'Media:', mediaDocs.length);

  const mediaTypeMap = {};
  const mediaGenresMap = {};
  const mediaYearMap = {};
  mediaDocs.forEach(m => {
    mediaTypeMap[m.tmdbId] = m.mediaType;
    mediaGenresMap[m.tmdbId] = m.genres || [];
    mediaYearMap[m.tmdbId] = extractYear(m.releaseDate);
  });

  const userSet  = new Set();
  const itemSet = new Set();
  const allInteractions = [];
  const itemPopularity = {};
  const itemMediaType = {};
  const itemGenreEncoding = {};
  const itemYear = {};

  function processItem(userId, tmdbId, score, mediaType, genres = []) {
    const key = `${tmdbId}:${mediaType}`;
    userSet.add(String(userId));
    itemSet.add(key);
    itemPopularity[key] = (itemPopularity[key] || 0) + score;
    itemMediaType[key] = mediaType;
    itemGenreEncoding[key] = encodeGenres(genres.length ? genres : mediaGenresMap[tmdbId]);
    itemYear[key] = extractYear(mediaYearMap[tmdbId]);
    allInteractions.push({ userId: String(userId), itemId: key, tmdbId, mediaType, score, genres: genres.length ? genres : mediaGenresMap[tmdbId] });
  }

  histories.forEach(doc => {
    if (doc.media) {
      const tmdbId = doc.media.tmdbId;
      const mediaType = doc.media.mediaType || mediaTypeMap[tmdbId] || 'movie';
      processItem(doc.userId, String(tmdbId), WEIGHTS.history, mediaType, doc.media.genres);
    }
  });

  watchlaters.forEach(doc => {
    if (doc.media) {
      const tmdbId = doc.media.tmdbId;
      const mediaType = doc.media.mediaType || mediaTypeMap[tmdbId] || 'movie';
      processItem(doc.userId, String(tmdbId), WEIGHTS.watchlater, mediaType, doc.media.genres);
    }
  });

  wishlists.forEach(doc => {
    if (doc.media) {
      const tmdbId = doc.media.tmdbId;
      const mediaType = doc.media.mediaType || mediaTypeMap[tmdbId] || 'movie';
      processItem(doc.userId, String(tmdbId), WEIGHTS.wishlist, mediaType, doc.media.genres);
    }
  });

  reviews.forEach(doc => {
    const mediaType = doc.media_type || 'movie';
    const weightKey = `review_${Math.round(doc.rating)}`;
    const score = WEIGHTS[weightKey] ?? 0;
    const genres = mediaGenresMap[doc.movieId] || [];
    processItem(doc.userId, String(doc.movieId), score, mediaType, genres);
  });

  const userList  = [...userSet];
  const itemList = [...itemSet];
  const userIndex  = new Map(userList.map((id, i)  => [id, i]));
  const itemIndex = new Map(itemList.map((id, i) => [id, i]));

  const numUsers  = userList.length;
  const numItems = itemList.length;

  const matrix = Array.from({ length: numUsers }, () => new Float32Array(numItems));
  allInteractions.forEach(({ userId, itemId, score }) => {
    const u = userIndex.get(userId);
    const i = itemIndex.get(itemId);
    if (u !== undefined && i !== undefined) matrix[u][i] += score;
  });

  return { matrix, userList, itemList, userIndex, itemIndex, numUsers, numItems, itemPopularity, itemMediaType, itemGenreEncoding, itemYear, allInteractions };
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitDataByUser(userIds, movieIds, scores, testSplit) {
  const userInteractions = {};
  userIds.forEach((u, i) => {
    if (!userInteractions[u]) userInteractions[u] = [];
    userInteractions[u].push({ movie: movieIds[i], score: scores[i] });
  });

  const train = [];
  const test = [];

  Object.entries(userInteractions).forEach(([userId, interactions]) => {
    const shuffled = shuffleArray(interactions);
    const minTrain = Math.min(1, shuffled.length);
    const splitIdx = Math.max(minTrain, Math.floor(shuffled.length * (1 - testSplit)));
    shuffled.slice(0, splitIdx).forEach(item => {
      train.push({ user: parseInt(userId), movie: item.movie, score: item.score });
    });
    shuffled.slice(splitIdx).forEach(item => {
      if (item.score > 0) {
        test.push({ user: parseInt(userId), movie: item.movie, score: item.score });
      }
    });
  });

  shuffleArray(train);
  shuffleArray(test);

  return {
    trainUsers: train.map(t => t.user),
    trainMovies: train.map(t => t.movie),
    trainScores: train.map(t => t.score),
    testUsers: test.map(t => t.user),
    testMovies: test.map(t => t.movie),
    testScores: test.map(t => t.score),
  };
}

function generateNegativeSamples(userIds, movieIds, numItems, numNegatives = 4) {
  const userItems = {};
  userIds.forEach((u, i) => {
    if (!userItems[u]) userItems[u] = new Set();
    userItems[u].add(movieIds[i]);
  });

  const negUsers = [];
  const negMovies = [];
  const negScores = [];

  Object.entries(userItems).forEach(([userId, items]) => {
    const user = parseInt(userId);
    const numSamples = Math.min(numNegatives, numItems - items.size);
    for (let i = 0; i < numSamples; i++) {
      let negItem;
      do {
        negItem = Math.floor(Math.random() * numItems);
      } while (items.has(negItem));
      
      negUsers.push(user);
      negMovies.push(negItem);
      negScores.push(0);
    }
  });

  return { negUsers, negMovies, negScores };
}

async function calculateRMSE(predictions, actual) {
  let sumSquaredError = 0;
  for (let i = 0; i < predictions.length; i++) {
    const error = predictions[i] - actual[i];
    sumSquaredError += error * error;
  }
  return Math.sqrt(sumSquaredError / predictions.length);
}

function l2Regularization(variables, lambda) {
  let loss = 0;
  for (const v of variables) {
    loss += lambda * tf.sum(v.square());
  }
  return loss;
}

export async function trainModel({ matrix, userList, itemList, numUsers, numItems, itemGenreEncoding, itemYear, itemPopularity, itemMediaType, allInteractions }, saveModel = true) {
  const userIds = [], itemIds = [], scores = [];
  const userGenrePrefs = {};
  const userYearPrefs = {};

  for (let u = 0; u < numUsers; u++) {
    userGenrePrefs[u] = new Array(GENRE_LIST.length).fill(0);
    userYearPrefs[u] = { sum: 0, count: 0 };
  }

  for (let u = 0; u < numUsers; u++) {
    for (let i = 0; i < numItems; i++) {
      if (matrix[u][i] !== 0) {
        userIds.push(u);
        itemIds.push(i);
        scores.push(matrix[u][i]);

        const genreEncoding = itemGenreEncoding[itemList[i]] || new Array(GENRE_LIST.length).fill(0);
        const weight = matrix[u][i];
        for (let g = 0; g < GENRE_LIST.length; g++) {
          userGenrePrefs[u][g] += genreEncoding[g] * weight;
        }
        const year = itemYear[itemList[i]] || 2000;
        userYearPrefs[u].sum += year * weight;
        userYearPrefs[u].count += weight;
      }
    }
  }

  for (let u = 0; u < numUsers; u++) {
    if (userYearPrefs[u].count > 0) {
      userYearPrefs[u] = userYearPrefs[u].sum / userYearPrefs[u].count;
    } else {
      userYearPrefs[u] = 2015;
    }
    const totalWeight = scores.filter((_, i) => userIds[i] === u).reduce((a, b) => a + b, 0) || 1;
    for (let g = 0; g < GENRE_LIST.length; g++) {
      userGenrePrefs[u][g] /= totalWeight;
    }
  }

  console.log('[TF] Building matrix - users:', numUsers, 'items:', numItems, 'interactions:', userIds.length);
  if (userIds.length === 0) {
    console.log('[TF] No interactions found, skipping training');
    return null;
  }

  const { trainUsers, trainMovies, trainScores, testUsers, testMovies, testScores } = splitDataByUser(
    userIds, itemIds, scores, TF_CONFIG.TEST_SPLIT
  );

  const { negUsers, negMovies, negScores } = generateNegativeSamples(
    trainUsers, trainMovies, numItems, TF_CONFIG.NUM_NEGATIVES
  );

  const allTrainUsers = [...trainUsers, ...negUsers];
  const allTrainMovies = [...trainMovies, ...negMovies];
  const allTrainScores = [...trainScores, ...negScores];

  const combined = shuffleArray(allTrainUsers.map((u, i) => ({
    user: u, movie: allTrainMovies[i], score: allTrainScores[i]
  })));

  const finalTrainUsers = combined.map(c => c.user);
  const finalTrainMovies = combined.map(c => c.movie);
  const finalTrainScores = combined.map(c => c.score);

  const userEmbedding  = tf.variable(tf.randomUniform([numUsers,  EMBEDDING_DIM], -0.05, 0.05));
  const itemEmbedding = tf.variable(tf.randomUniform([numItems, EMBEDDING_DIM], -0.05, 0.05));
  const userBias  = tf.variable(tf.zeros([numUsers, 1]));
  const itemBias = tf.variable(tf.zeros([numItems, 1]));

  const variables = [userEmbedding, itemEmbedding, userBias, itemBias];
  let learningRate = TF_CONFIG.LEARNING_RATE;
  let bestRMSE = Infinity;
  let patienceCounter = 0;
  let bestEpoch = 0;
  let optimizer;

  for (let epoch = 0; epoch < TF_CONFIG.EPOCHS; epoch++) {
    optimizer = tf.train.adam(learningRate);
    const batchSize = TF_CONFIG.BATCH_SIZE;
    
    for (let i = 0; i < finalTrainUsers.length; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, finalTrainUsers.length);
      const batchUsers = finalTrainUsers.slice(i, batchEnd);
      const batchItems = finalTrainMovies.slice(i, batchEnd);
      const batchScores = finalTrainScores.slice(i, batchEnd);

      optimizer.minimize(() => {
        const uEmb  = tf.gather(userEmbedding,  tf.tensor1d(batchUsers, 'int32'));
        const iEmb  = tf.gather(itemEmbedding, tf.tensor1d(batchItems, 'int32'));
        const uBias = tf.gather(userBias,  tf.tensor1d(batchUsers, 'int32'));
        const iBias = tf.gather(itemBias, tf.tensor1d(batchItems, 'int32'));

        const dot  = tf.sum(tf.mul(uEmb, iEmb), 1);
        
        const pred = tf.sigmoid(tf.add(tf.add(dot, tf.squeeze(uBias)), tf.squeeze(iBias)));
        
        const mse = tf.losses.meanSquaredError(tf.tensor1d(batchScores, 'float32'), pred);
        const reg = l2Regularization(variables.slice(0, 2), TF_CONFIG.L2_REGULARIZATION);
        
        uEmb.dispose();
        iEmb.dispose();
        uBias.dispose();
        iBias.dispose();
        dot.dispose();
        pred.dispose();
        
        return tf.add(mse, reg);
      });
    }

    if ((epoch + 1) % 5 === 0) {
      const testPredictions = [];
      for (let i = 0; i < testUsers.length; i += TF_CONFIG.BATCH_SIZE) {
        const batchU = testUsers.slice(i, i + TF_CONFIG.BATCH_SIZE);
        const batchI = testMovies.slice(i, i + TF_CONFIG.BATCH_SIZE);
        
        const uEmb = tf.gather(userEmbedding, tf.tensor1d(batchU, 'int32'));
        const iEmb = tf.gather(itemEmbedding, tf.tensor1d(batchI, 'int32'));
        const uBias = tf.gather(userBias, tf.tensor1d(batchU, 'int32'));
        const iBias = tf.gather(itemBias, tf.tensor1d(batchI, 'int32'));

        const dot = tf.sum(tf.mul(uEmb, iEmb), 1);
        const pred = tf.sigmoid(tf.add(tf.add(dot, tf.squeeze(uBias)), tf.squeeze(iBias)));
        const predArr = await pred.array();
        testPredictions.push(...predArr);
        
        uEmb.dispose();
        iEmb.dispose();
        uBias.dispose();
        iBias.dispose();
        dot.dispose();
        pred.dispose();
      }

      const rmse = await calculateRMSE(testPredictions, testScores);
      console.log(`[TF] Epoch ${epoch + 1}/${TF_CONFIG.EPOCHS} - RMSE: ${rmse.toFixed(4)} - LR: ${learningRate.toFixed(5)}`);

      if (rmse < bestRMSE - TF_CONFIG.EARLY_STOPPING_MIN_DELTA) {
        bestRMSE = rmse;
        bestEpoch = epoch + 1;
        patienceCounter = 0;
      } else {
        patienceCounter++;
      }

      if (patienceCounter >= TF_CONFIG.EARLY_STOPPING_PATIENCE) {
        console.log(`[TF] Early stopping at epoch ${epoch + 1}. Best RMSE: ${bestRMSE.toFixed(4)} at epoch ${bestEpoch}`);
        break;
      }
    }

    learningRate *= TF_CONFIG.LEARNING_RATE_DECAY;
  }

  if (saveModel) {
    await saveModelToDisk(userEmbedding, itemEmbedding, userBias, itemBias, userGenrePrefs, userYearPrefs, userList, itemList, itemGenreEncoding, itemYear, itemPopularity, itemMediaType);
  }

  return { userEmbedding, itemEmbedding, userBias, itemBias, userGenrePrefs, userYearPrefs, userList, rmse: bestRMSE };
}

async function saveModelToDisk(userEmbedding, itemEmbedding, userBias, itemBias, userGenrePrefs, userYearPrefs, userList, itemList, itemGenreEncoding, itemYear, itemPopularity, itemMediaType) {
  const modelDir = TF_CONFIG.MODEL_DIR;
  
  const userEmbData = await userEmbedding.array();
  const itemEmbData = await itemEmbedding.array();
  const userBiasData = await userBias.array();
  const itemBiasData = await itemBias.array();

  const version = Date.now();
  const modelData = {
    version,
    createdAt: new Date().toISOString(),
    config: {
      embeddingDim: EMBEDDING_DIM,
      numUsers: userEmbData.length,
      numItems: itemEmbData.length,
    },
    userEmbedding: userEmbData,
    itemEmbedding: itemEmbData,
    userBias: userBiasData,
    itemBias: itemBiasData,
    userGenrePrefs: userGenrePrefs,
    userYearPrefs: userYearPrefs,
    userList: userList,
    itemList: itemList,
    itemGenreEncoding: itemGenreEncoding,
    itemYear: itemYear,
    itemPopularity: itemPopularity,
    itemMediaType: itemMediaType,
    genreList: GENRE_LIST,
  };

  fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(modelData));
  fs.writeFileSync(path.join(modelDir, `model_${version}.json`), JSON.stringify(modelData));
  console.log(`[TF] Hybrid model saved to ${modelDir} (v${version})`);
}

export async function loadModelFromDisk(numUsers, numItems) {
  const modelDir = TF_CONFIG.MODEL_DIR;
  const modelPath = path.join(modelDir, 'model.json');
  
  try {
    if (!fs.existsSync(modelPath)) {
      throw new Error('No saved model');
    }
    
    const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    const userEmbedding = tf.variable(tf.tensor2d(modelData.userEmbedding));
    const itemEmbedding = tf.variable(tf.tensor2d(modelData.itemEmbedding));
    const userBias = tf.variable(tf.tensor2d(modelData.userBias));
    const itemBias = tf.variable(tf.tensor2d(modelData.itemBias));
    
    console.log(`[TF] Hybrid model loaded from disk (v${modelData.version})`);
    return { 
      userEmbedding, 
      itemEmbedding, 
      userBias, 
      itemBias,
      userGenrePrefs: modelData.userGenrePrefs,
      userYearPrefs: modelData.userYearPrefs,
      userList: modelData.userList,
      itemList: modelData.itemList,
      itemGenreEncoding: modelData.itemGenreEncoding,
      itemYear: modelData.itemYear,
      itemPopularity: modelData.itemPopularity,
      itemMediaType: modelData.itemMediaType,
      modelVersion: modelData.version,
      createdAt: modelData.createdAt,
    };
  } catch (err) {
    console.log('[TF] No saved model found, will train from scratch');
    return null;
  }
}

export async function getPopularItems(itemList, itemPopularity, itemMediaType, topN = 20) {
  return itemList
    .map(id => ({ id, score: itemPopularity[id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(r => {
      const [tmdbId, mediaType] = r.id.split(':');
      return { tmdbId, mediaType: itemMediaType[r.id] || mediaType || 'movie' };
    });
}

export async function getRecommendations(userId, modelState, meta, userHistory = [], topN = 20, allMediaItems = []) {
  const userList = modelState?.userList || meta?.userList || [];
  const userIndexMap = new Map(userList.map((id, i) => [id, i]));
  const userIdx = userIndexMap.get(String(userId)) ?? -1;
  
   const userGenrePrefs = userIdx >= 0 ? modelState?.userGenrePrefs?.[userIdx] : null;
   const userYearPref = userIdx >= 0 ? modelState?.userYearPrefs?.[userIdx] || TF_CONFIG.DEFAULT_YEAR : TF_CONFIG.DEFAULT_YEAR;
  
  const itemList = modelState?.itemList || meta?.itemList || [];
  const itemGenreEncoding = modelState?.itemGenreEncoding || meta?.itemGenreEncoding || {};
  const itemYear = modelState?.itemYear || meta?.itemYear || {};
  const itemPopularity = modelState?.itemPopularity || meta?.itemPopularity || {};
  const itemMediaType = modelState?.itemMediaType || meta?.itemMediaType || {};
  
  if (userIdx === -1 || !modelState || !userGenrePrefs) {
    if (userHistory.length > 0) {
      const genreScores = {};
      let yearSum = 0, yearCount = 0;
      
      userHistory.forEach(item => {
        (item.genres || []).forEach(genre => {
          genreScores[genre.toLowerCase()] = (genreScores[genre.toLowerCase()] || 0) + 1;
        });
        if (item.year) {
          yearSum += item.year;
          yearCount++;
        }
      });
      
      const topGenres = Object.keys(genreScores)
        .sort((a, b) => genreScores[b] - genreScores[a])
        .slice(0, 5);
      
      const avgYear = yearCount > 0 ? yearSum / yearCount : TF_CONFIG.DEFAULT_YEAR;
      const userInteractedIds = new Set(userHistory.map(h => String(h.tmdbId)));
      
      const fallbackItems = itemList
        .filter(id => {
          const [tmdbId] = id.split(':');
          return !userInteractedIds.has(String(tmdbId));
        })
        .map(id => {
          const [tmdbId, mediaType] = id.split(':');
          const itemGenres = itemGenreEncoding?.[id] || new Array(GENRE_LIST.length).fill(0);
          const itemYr = itemYear?.[id] || TF_CONFIG.DEFAULT_YEAR;
          
          let genreScore = 0;
          topGenres.forEach(g => {
            const idx = GENRE_LIST.findIndex(gg => gg.toLowerCase() === g.toLowerCase());
            if (idx >= 0) genreScore += itemGenres[idx];
          });
          
          const yearPenalty = Math.abs(itemYr - avgYear) / 20;
          const popularity = itemPopularity[id] || 0;
          
          return { 
            id, 
            tmdbId, 
            mediaType: itemMediaType[id] || mediaType || 'movie',
            popularity,
            genreScore,
            yearPenalty,
            score: genreScore * 2 + Math.log10(popularity + 1) - yearPenalty,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map(r => ({ tmdbId: r.tmdbId, mediaType: r.mediaType }));
      
      return fallbackItems.map(r => ({
        tmdbId: r.tmdbId,
        mediaType: r.mediaType,
        confidence: 0.3,
        score: r.score,
      }));
    }
    
    const shuffled = [...itemList].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, topN).map(id => {
      const [tmdbId, mediaType] = id.split(':');
      return { tmdbId, mediaType: itemMediaType[id] || mediaType || 'movie', confidence: 0.2 };
    });
  }

  const { userEmbedding, itemEmbedding, userBias, itemBias: modelItemBias } = modelState;
  const existingItemSet = new Set(itemList);

  const coldStartItems = allMediaItems
    ? allMediaItems.filter(m => !existingItemSet.has(`${m.tmdbId}:${m.mediaType}`))
    : [];

  const uEmb  = tf.gather(userEmbedding, tf.scalar(userIdx, 'int32'));
  const uBias = tf.gather(userBias, tf.scalar(userIdx, 'int32'));

  const dots   = tf.sum(tf.mul(itemEmbedding, uEmb), 1);
  const scores = tf.sigmoid(tf.add(tf.add(dots, tf.squeeze(uBias)), tf.squeeze(modelItemBias)));
  const scoresArr = await scores.array();

  uEmb.dispose();
  uBias.dispose();
  scores.dispose();
  dots.dispose();

  const cfScores = scoresArr
    .map((score, i) => ({ item: itemList[i], cfScore: score }))
    .sort((a, b) => b.cfScore - a.cfScore)
    .slice(0, topN * 3);

  const userInteractedIds = new Set(userHistory.map(h => String(h.tmdbId)));

  const finalScores = cfScores.map(({ item, cfScore }) => {
    const [tmdbId, mediaType] = item.split(':');
    
    if (userInteractedIds.has(String(tmdbId))) {
      return { tmdbId, mediaType: itemMediaType[item] || mediaType || 'movie', score: -1 };
    }

    const itemGenres = itemGenreEncoding?.[item] || new Array(GENRE_LIST.length).fill(0);
    const itemYr = itemYear?.[item] || TF_CONFIG.DEFAULT_YEAR;
    
    let contentScore = 0;
    if (userGenrePrefs) {
      for (let g = 0; g < GENRE_LIST.length; g++) {
        contentScore += userGenrePrefs[g] * itemGenres[g];
      }
    }
    
    const yearPenalty = Math.abs(itemYr - userYearPref) / 30;
    const popularity = Math.log10((itemPopularity[item] || 1) + 1) * TF_CONFIG.POPULARITY_WEIGHT;
    
    const finalScore = (cfScore * TF_CONFIG.CF_WEIGHT) + 
                       (contentScore * TF_CONFIG.CONTENT_WEIGHT) + 
                       (popularity) - 
                       (yearPenalty * TF_CONFIG.YEAR_PENALTY_WEIGHT);
    
    return { 
      tmdbId, 
      mediaType: itemMediaType[item] || mediaType || 'movie',
      score: finalScore,
      cfScore,
      contentScore,
    };
  });

  const scoredResults = finalScores
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const coldStartRecs = coldStartItems
    .filter(item => {
      const key = `${item.tmdbId}:${item.mediaType}`;
      return !userInteractedIds.has(String(item.tmdbId));
    })
    .map(item => {
      const itemGenres = encodeGenres(item.genres || []);
      let contentScore = 0;
      if (userGenrePrefs) {
        for (let g = 0; g < GENRE_LIST.length; g++) {
          contentScore += userGenrePrefs[g] * itemGenres[g];
        }
      }
      const year = extractYear(item.releaseDate);
      const yearPenalty = Math.abs(year - userYearPref) / 30;
      const popularity = Math.log10((item.popularity || 1) + 1) * TF_CONFIG.POPULARITY_WEIGHT;

      return {
        tmdbId: item.tmdbId,
        mediaType: item.mediaType || 'movie',
        score: (contentScore * 0.5) + (popularity * 0.5) - (yearPenalty * TF_CONFIG.YEAR_PENALTY_WEIGHT),
        isColdStart: true,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.ceil(topN * TF_CONFIG.COLD_START_RATIO));

  const allRecs = [...scoredResults, ...coldStartRecs]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const recScores = allRecs.map(r => r.score);
  const maxScore = Math.max(...recScores);
  const minScore = Math.min(...recScores);
  const scoreRange = maxScore - minScore;

  return allRecs.map(r => ({
    tmdbId: r.tmdbId,
    mediaType: r.mediaType,
    confidence: r.isColdStart ? 0.25 : (scoreRange > 0 ? (r.score - minScore) / scoreRange : 0.5),
    score: Math.round(r.score * 100) / 100,
  }));
}

export function applyDiversity(items, itemGenreEncoding, maxSameGenre = TF_CONFIG.DIVERSITY_MAX_SAME_GENRE) {
  if (items.length <= maxSameGenre) return items;
  
  const result = [];
  const genreCounts = {};
  
  const sortedItems = [...items].sort((a, b) => b.score - a.score);
  
  for (const item of sortedItems) {
    const genreEncoding = itemGenreEncoding?.[item.id] || [];
    const primaryGenre = GENRE_LIST[genreEncoding.findIndex(g => g === 1)] || 'Unknown';
    
    genreCounts[primaryGenre] = (genreCounts[primaryGenre] || 0) + 1;
    
    if (genreCounts[primaryGenre] <= maxSameGenre) {
      result.push(item);
    } else {
      result.push({ ...item, score: item.score * 0.5, reason: 'diversity_penalized' });
    }
  }
  
  return result.slice(0, items.length);
}

export function applyPopularityDebiasing(scoredItems, itemPopularity, itemList) {
  if (!scoredItems.length) return scoredItems;
  
  const maxPop = Math.max(...itemList.map(id => itemPopularity[id] || 1));
  const minPop = Math.min(...itemList.map(id => itemPopularity[id] || 0));
  const popRange = maxPop - minPop || 1;
  
  return scoredItems.map(item => {
    const rawPopularity = itemPopularity?.[item.id] || 0;
    const normalizedPop = (rawPopularity - minPop) / popRange;
    
    const inversePopularity = 1 - normalizedPop;
    const debiasBoost = Math.max(
      TF_CONFIG.MIN_POPULARITY_BOOST,
      Math.pow(inversePopularity, TF_CONFIG.POPULARITY_DECAY)
    );
    
    return {
      ...item,
      score: item.score + (debiasBoost * TF_CONFIG.EXPLORATION_MIN_INVERSE_POPULARITY),
      rawPopularity,
      debiased: normalizedPop > 0.7,
    };
  });
}

export function addExplorationItems(items, allMediaItems, itemGenreEncoding, itemPopularity, topN, explorationRate = TF_CONFIG.EXPLORATION_RATE) {
  if (!items.length || !allMediaItems.length) return items;
  
  const existingIds = new Set(items.map(i => i.tmdbId));
  const numToExplore = Math.max(1, Math.floor(topN * explorationRate));
  
  const unviewedItems = allMediaItems.filter(m => !existingIds.has(String(m.tmdbId)));
  if (!unviewedItems.length) return items;
  
  const maxPop = Math.max(...unviewedItems.map(m => m.popularity || 1));
  
  const explorationCandidates = unviewedItems
    .map(item => {
      const inversePop = 1 - ((item.popularity || 1) / maxPop);
      const randomBoost = Math.random() * 0.5;
      const id = `${item.tmdbId}:${item.mediaType}`;
      const genreEncoding = itemGenreEncoding?.[id];
      let genreNovelty = 1;
      if (genreEncoding) {
        const primaryGenre = GENRE_LIST[genreEncoding.findIndex(g => g === 1)] || 'Unknown';
        genreNovelty = 1.2;
      }
      return {
        ...item,
        id,
        score: (inversePop * 0.6) + (randomBoost * 0.2) + (genreNovelty * 0.2),
        isExploration: true,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, numToExplore);
  
  const nonExplorationItems = items
    .filter(i => !i.isExploration)
    .sort((a, b) => b.score - a.score);
  
  const result = [...nonExplorationItems];
  for (const exploreItem of explorationCandidates) {
    result.push(exploreItem);
  }
  
  return result.slice(0, topN);
}

export function applyRecencyWeighting(interactions) {
  const now = Date.now();
  const decayMs = TF_CONFIG.RECENCY_DECAY_DAYS * 24 * 60 * 60 * 1000;
  const maxWeight = TF_CONFIG.RECENCY_WEIGHT_RECENT;
  const minWeight = TF_CONFIG.RECENCY_WEIGHT_OLD;
  
  return interactions.map(interaction => {
    const timestamp = new Date(interaction.timestamp || interaction.createdAt).getTime();
    const daysAgo = (now - timestamp) / decayMs;
    const recencyWeight = maxWeight - (maxWeight - minWeight) * Math.min(1, daysAgo);
    
    return {
      ...interaction,
      recencyWeight,
      weightedScore: interaction.score * recencyWeight,
    };
  });
}

export function calculateEvaluationMetrics(predictions, groundTruth, kValues = TF_CONFIG.EVAL_K_VALUES) {
  const metrics = {};
  
  for (const k of kValues) {
    const topK = predictions.slice(0, k);
    const hits = topK.filter(p => groundTruth.has(String(p.tmdbId)));
    
    const precision = groundTruth.size > 0 ? hits.length / k : 0;
    const recall = groundTruth.size > 0 ? hits.length / groundTruth.size : 0;
    
    let dcg = 0;
    for (let i = 0; i < topK.length; i++) {
      if (groundTruth.has(String(topK[i].tmdbId))) {
        dcg += 1 / Math.log2(i + 2);
      }
    }
    
    const idealOrder = [...groundTruth].slice(0, k);
    let idcg = 0;
    for (let i = 0; i < Math.min(k, idealOrder.length); i++) {
      idcg += 1 / Math.log2(i + 2);
    }
    
    const ndcg = idcg > 0 ? dcg / idcg : 0;
    
    const hitRate = groundTruth.size > 0 ? (hits.length > 0 ? 1 : 0) : 0;
    
    metrics[`precision@${k}`] = Math.round(precision * 1000) / 1000;
    metrics[`recall@${k}`] = Math.round(recall * 1000) / 1000;
    metrics[`ndcg@${k}`] = Math.round(ndcg * 1000) / 1000;
    metrics[`hitRate@${k}`] = hitRate;
  }
  
  return metrics;
}

export async function getRecommendationsWithDiversity(
  userId, 
  modelState, 
  meta, 
  userHistory = [], 
  topN = 20, 
  allMediaItems = [],
  options = {}
) {
  const {
    mode = 'personalized',
    includeDiversity = true,
    includeExploration = true,
    recencyWeighted = true,
  } = options;
  
  let recommendations = await getRecommendations(userId, modelState, meta, userHistory, topN * 2, allMediaItems);
  
  if (mode === 'exploration') {
    return addExplorationItems(recommendations, allMediaItems, meta?.itemGenreEncoding, meta?.itemPopularity, topN, 0.4);
  }
  
  if (mode === 'popular') {
    const existingIds = new Set(recommendations.map(r => r.tmdbId));
    const popularUnseen = allMediaItems
      .filter(m => !existingIds.has(String(m.tmdbId)))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, topN)
      .map(m => ({ tmdbId: String(m.tmdbId), mediaType: m.mediaType, confidence: 0.3, score: m.popularity || 0, isPopular: true }));
    
    return popularUnseen;
  }
  
  let scoredRecs = recommendations.map(r => ({
    ...r,
    id: `${r.tmdbId}:${r.mediaType}`,
  }));
  
  if (includeDiversity) {
    scoredRecs = applyDiversity(scoredRecs, meta?.itemGenreEncoding);
  }
  
  scoredRecs = applyPopularityDebiasing(scoredRecs, meta?.itemPopularity, meta?.itemList || []);
  
  if (includeExploration && mode === 'personalized') {
    scoredRecs = addExplorationItems(scoredRecs, allMediaItems, meta?.itemGenreEncoding, meta?.itemPopularity, topN, TF_CONFIG.EXPLORATION_RATE);
  }
  
  return scoredRecs
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(r => ({
      tmdbId: r.tmdbId,
      mediaType: r.mediaType,
      confidence: r.confidence || 0.5,
      score: Math.round(r.score * 100) / 100,
      isExploration: r.isExploration || false,
      isPopular: r.isPopular || false,
    }));
}
