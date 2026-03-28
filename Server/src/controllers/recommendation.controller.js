import Media from "../models/media.model.js";
import History from "../models/history.model.js";
import WatchLater from "../models/watchLater.model.js";
import Wishlist from "../models/wishlist.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import { getModelState } from "../jobs/trainJob.js";
import { getRecommendationsWithDiversity, calculateEvaluationMetrics, applyRecencyWeighting } from "../services/tfRecommend.js";
import TF_CONFIG from "../utils/tfConfig.js";
import WEIGHTS from "../utils/scoreWeights.js";

const transformMediaToTMDB = (media, reason = null) => ({
  id: media.tmdbId,
  title: media.title,
  name: media.title,
  mediaType: media.mediaType,
  overview: media.overview,
  poster_path: media.posterPath,
  backdrop_path: media.backdropPath,
  genres: media.genres,
  release_date: media.releaseDate,
  first_air_date: media.releaseDate,
  popularity: media.popularity,
  vote_average: media.voteAverage,
  vote_count: media.voteCount,
  genre_ids: media.genres,
  reason: reason,
});

export const getRecommendations = async (req, res) => {
  try {
    const { type, mode = 'personalized' } = req.query;
    const userId = req.user._id;

    let baseQuery = {};
    if (type) baseQuery.mediaType = type;

    const { modelState, modelMeta, isModelReady } = getModelState();
    
    const [history, watchLater, wishlist] = await Promise.all([
      History.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
      WatchLater.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
      Wishlist.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
    ]);

    const userHistory = [];
    const allInteractions = [];
    
    const addInteraction = (item, source, weight, timestamp) => {
      if (!item) return;
      const existing = userHistory.find(h => h.tmdbId === item.tmdbId);
      if (!existing) {
        userHistory.push({ 
          tmdbId: item.tmdbId, 
          genres: item.genres || [],
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
          timestamp,
        });
      }
      allInteractions.push({ tmdbId: item.tmdbId, source, weight, timestamp });
    };
    
    history.forEach((h, idx) => {
      addInteraction(h.media, 'history', WEIGHTS.history, h.createdAt);
    });
    watchLater.forEach(w => {
      addInteraction(w.media, 'watchlater', WEIGHTS.watchlater, w.createdAt);
    });
    wishlist.forEach(w => {
      addInteraction(w.media, 'wishlist', WEIGHTS.wishlist, w.createdAt);
    });
    
    const recencyWeightedHistory = applyRecencyWeighting(userHistory);

    const userTmdbIds = userHistory.map(h => Number(h.tmdbId));

    const [poolMedia, userInteractedMedia] = await Promise.all([
      Media.find(baseQuery)
        .select('tmdbId mediaType genres releaseDate popularity voteAverage')
        .sort({ popularity: -1 })
        .limit(500)
        .lean(),
      Media.find({ ...baseQuery, tmdbId: { $in: userTmdbIds } })
        .select('tmdbId mediaType genres releaseDate popularity voteAverage')
        .lean(),
    ]);

    const seenIds = new Set(poolMedia.map(m => m.tmdbId));
    const allMedia = [
      ...poolMedia,
      ...userInteractedMedia.filter(m => !seenIds.has(m.tmdbId)),
    ];

    const allMediaItems = allMedia.map(m => ({
      tmdbId: String(m.tmdbId),
      mediaType: m.mediaType,
      genres: m.genres || [],
      releaseDate: m.releaseDate,
      popularity: m.popularity || 0,
    }));

    const hasUserInteractions = userHistory.length > 0;
    let topGenresForResponse = [];
    let generateReasonFn = null;

    if (hasUserInteractions) {
      const genreScores = {};
      const yearScores = [];
      
      const weightedInteractions = applyRecencyWeighting(allInteractions);
      weightedInteractions.forEach(wi => {
        const idx = userHistory.findIndex(h => h.tmdbId === wi.tmdbId);
        if (idx >= 0) {
          const item = userHistory[idx];
          (item.genres || []).forEach(g => {
            genreScores[g.toLowerCase()] = (genreScores[g.toLowerCase()] || 0) + wi.weightedScore;
          });
          if (item.year) yearScores.push(item.year);
        }
      });
      
      const topGenres = Object.keys(genreScores)
        .sort((a, b) => genreScores[b] - genreScores[a])
        .slice(0, 5);
      topGenresForResponse = topGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1));
      
      const avgYear = yearScores.length > 0 
        ? yearScores.reduce((a, b) => a + b, 0) / yearScores.length 
        : TF_CONFIG.DEFAULT_YEAR;
      
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

      generateReasonFn = (movieGenres, voteAverage, popularity, rec = {}) => {
        if (rec?.isExploration) {
          return "Something new to try";
        }

        if (rec?.isPopular) {
          return "Trending this week";
        }

        const genres = (movieGenres || []).map(g =>
          typeof g === "string" ? g.toLowerCase() : ""
        );

        const matchingGenres = genres.filter(g => topGenres.includes(g));
        
        if (matchingGenres.length >= 2) {
          const g1 = capitalize(matchingGenres[0]);
          const g2 = capitalize(matchingGenres[1]);
          return `Matches your love of ${g1} & ${g2}`;
        }
        if (matchingGenres.length === 1) {
          return `Because you love ${capitalize(matchingGenres[0])}`;
        }

        if (rec?.confidence >= 0.85) {
          return "CineMatch is confident you'll enjoy this";
        }

        if (voteAverage >= 8.5) return "One of the highest rated ever";
        if (voteAverage >= 8.0) return "Critically acclaimed";

        if (popularity > 1000) return "Everyone's watching this";
        if (popularity > 500) return "Trending now";

        return "Recommended for you";
      };
    }
    
    if (mode === 'popular' || mode === 'exploration') {
      const recs = await getRecommendationsWithDiversity(
        userId.toString(), 
        modelState, 
        modelMeta, 
        recencyWeightedHistory, 
        20, 
        allMediaItems,
        { mode, includeDiversity: false }
      );
      
      if (recs.length > 0) {
        const recIds = recs.map(r => Number(r.tmdbId));
        const media = await Media.find({ tmdbId: { $in: recIds }, ...baseQuery }).limit(20);
        const sortedResults = recIds.map(id => media.find(m => m.tmdbId === id)).filter(Boolean).map(transformMediaToTMDB);
        return res.status(200).json({ success: true, data: sortedResults, source: mode, topGenres: topGenresForResponse });
      }
    }
    
    let tfRecs = [];
    let recSource = 'popular';
    if (isModelReady && modelState && userHistory.length > 0) {
      const tfPromise = getRecommendationsWithDiversity(
        userId.toString(), 
        modelState, 
        modelMeta, 
        recencyWeightedHistory, 
        TF_CONFIG.RECOMMEND_TOP_N, 
        allMediaItems,
        { mode: 'personalized', includeDiversity: true, includeExploration: true }
      );
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, TF_CONFIG.TIMEOUT_MS));
      tfRecs = await Promise.race([tfPromise, timeoutPromise]) || [];
      if (tfRecs.length > 0) recSource = tfRecs.some(r => r.isExploration) ? 'ml+exploration' : 'ml';
    }
    
    if (tfRecs.length > 0) {
      const tfRecIds = tfRecs.map(r => Number(r.tmdbId));
      const tfMedia = await Media.find({
        tmdbId: { $in: tfRecIds },
        ...baseQuery,
      }).limit(20);

      if (tfMedia.length > 0) {
        const recMap = Object.fromEntries(tfRecs.map(r => [r.tmdbId, r]));
        const sortedResults = tfRecIds
          .map(id => ({ media: tfMedia.find(m => m.tmdbId === id), rec: recMap[String(id)] }))
          .filter(item => item.media)
          .map(({ media, rec }) => transformMediaToTMDB(media, generateReasonFn ? generateReasonFn(media.genres, media.voteAverage, media.popularity, rec) : null));
        return res.status(200).json({ success: true, data: sortedResults, source: recSource, topGenres: topGenresForResponse });
      }
    }
    
    if (hasUserInteractions && generateReasonFn) {
      const genreScores = {};
      const yearScores = [];
      
      const weightedInteractions = applyRecencyWeighting(allInteractions);
      weightedInteractions.forEach(wi => {
        const idx = userHistory.findIndex(h => h.tmdbId === wi.tmdbId);
        if (idx >= 0) {
          const item = userHistory[idx];
          (item.genres || []).forEach(g => {
            genreScores[g.toLowerCase()] = (genreScores[g.toLowerCase()] || 0) + wi.weightedScore;
          });
          if (item.year) yearScores.push(item.year);
        }
      });
      
      const topGenres = Object.keys(genreScores)
        .sort((a, b) => genreScores[b] - genreScores[a])
        .slice(0, 5);
      
      const avgYear = yearScores.length > 0 
        ? yearScores.reduce((a, b) => a + b, 0) / yearScores.length 
        : TF_CONFIG.DEFAULT_YEAR;
      
      const userInteractedIds = new Set(userHistory.map(h => String(h.tmdbId)));
      
      const contentBasedRecs = allMediaItems
        .filter(m => !userInteractedIds.has(String(m.tmdbId)))
        .map(m => {
          let score = 0;
          (m.genres || []).forEach(g => {
            if (topGenres.includes(g.toLowerCase())) {
              score += genreScores[g.toLowerCase()];
            }
          });
          const year = m.releaseDate ? new Date(m.releaseDate).getFullYear() : TF_CONFIG.DEFAULT_YEAR;
          score -= Math.abs(year - avgYear) / 10;
          const debiasedPop = Math.log10((m.popularity || 1) + 1) * TF_CONFIG.POPULARITY_WEIGHT;
          const inversePop = 1 - (m.popularity || 1) / 1000;
          score += debiasedPop * Math.max(TF_CONFIG.MIN_POPULARITY_BOOST, inversePop);
          
          return { ...m, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(m => ({ tmdbId: m.tmdbId, mediaType: m.mediaType, score: m.score, confidence: 0.6 }));
      
      if (contentBasedRecs.length > 0) {
        const recIds = contentBasedRecs.map(r => Number(r.tmdbId));
        const contentMedia = await Media.find({
          tmdbId: { $in: recIds },
          ...baseQuery,
        }).limit(20);
        
        if (contentMedia.length > 0) {
          const recMap = Object.fromEntries(contentBasedRecs.map(r => [String(r.tmdbId), r]));
          const sortedResults = recIds
            .map(id => ({ media: contentMedia.find(m => m.tmdbId === id), rec: recMap[String(id)] }))
            .filter(item => item.media)
            .map(({ media, rec }) => transformMediaToTMDB(media, generateReasonFn(media.genres, media.voteAverage, media.popularity, rec)));
          return res.status(200).json({ success: true, data: sortedResults, source: 'content-based', topGenres: topGenresForResponse });
        }
      }
    }

    if (!hasUserInteractions) {
      const user = await User.findById(userId).select('preferredGenres').lean();
      const preferredGenres = user?.preferredGenres || [];

      if (preferredGenres.length > 0) {
        const coldStartMedia = await Media.find({
          ...baseQuery,
          genres: { $in: preferredGenres },
        })
          .sort({ popularity: -1, voteAverage: -1 })
          .limit(20)
          .lean();

        if (coldStartMedia.length > 0) {
          const primaryGenre = preferredGenres[0].charAt(0).toUpperCase() + preferredGenres[0].slice(1);
          return res.status(200).json({
            success: true,
            data: coldStartMedia.map(m => transformMediaToTMDB(m, `Because you love ${primaryGenre}`)),
            source: 'cold-start-genres',
            topGenres: preferredGenres,
          });
        }
      }

      const popularMedia = await Media.find(baseQuery)
        .sort({ popularity: -1 })
        .limit(20)
        .lean();

      return res.status(200).json({
        success: true,
        data: popularMedia.map(m => transformMediaToTMDB(m)),
        source: 'popular',
        topGenres: [],
      });
    }

    const popularMedia = await Media.find(baseQuery)
      .sort({ voteCount: -1 })
      .limit(20)
      .lean();
    
    const transformedPopular = popularMedia.map(transformMediaToTMDB);
    res.status(200).json({ success: true, data: transformedPopular, source: recSource, topGenres: topGenresForResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const evaluateModel = async (req, res) => {
  try {
    const { kValues = '5,10,20' } = req.query;
    const kArr = kValues.split(',').map(Number);
    
    const { modelState, modelMeta, isModelReady } = getModelState();
    
    if (!isModelReady || !modelState) {
      return res.status(200).json({ 
        success: true, 
        metrics: null, 
        message: 'Model not ready' 
      });
    }

    const [histories, reviews] = await Promise.all([
      History.find({}).populate('media', 'tmdbId').lean(),
      Review.find({}).lean(),
    ]);

    const userTestItems = {};
    histories.forEach(h => {
      if (h.media && h.user) {
        const uid = String(h.user);
        if (!userTestItems[uid]) userTestItems[uid] = new Set();
        userTestItems[uid].add(String(h.media.tmdbId));
      }
    });

    const allMetrics = [];
    
    for (const [userId, groundTruth] of Object.entries(userTestItems)) {
      if (groundTruth.size < 3) continue;
      
      const testItems = [...groundTruth];
      const trainItems = testItems.slice(0, Math.floor(testItems.length * 0.8));
      const evalItems = new Set(testItems.slice(Math.floor(testItems.length * 0.8)));
      
      if (evalItems.size === 0) continue;
      
      const predictions = trainItems.map(tmdbId => ({
        tmdbId,
        score: 1,
      }));
      
      const metrics = calculateEvaluationMetrics(predictions, evalItems, kArr);
      allMetrics.push(metrics);
    }
    
    if (allMetrics.length === 0) {
      return res.status(200).json({
        success: true,
        metrics: null,
        message: 'Not enough data for evaluation',
      });
    }
    
    const avgMetrics = {};
    for (const key of Object.keys(allMetrics[0])) {
      avgMetrics[key] = allMetrics.reduce((sum, m) => sum + m[key], 0) / allMetrics.length;
      avgMetrics[key] = Math.round(avgMetrics[key] * 1000) / 1000;
    }

    res.status(200).json({
      success: true,
      metrics: avgMetrics,
      numUsersEvaluated: allMetrics.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
