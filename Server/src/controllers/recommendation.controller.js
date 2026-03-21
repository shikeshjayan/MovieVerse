import Media from "../models/media.model.js";
import History from "../models/history.model.js";
import WatchLater from "../models/watchLater.model.js";
import Wishlist from "../models/wishlist.model.js";
import { getModelState } from "../jobs/trainJob.js";
import { getRecommendationsWithDiversity, calculateEvaluationMetrics, applyRecencyWeighting } from "../services/tfRecommend.js";
import TF_CONFIG from "../utils/tfConfig.js";
import WEIGHTS from "../utils/scoreWeights.js";

const transformMediaToTMDB = (media) => ({
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
});

export const getRecommendations = async (req, res) => {
  try {
    const { type, mode = 'personalized' } = req.query;
    const userId = req.user._id;

    console.log('[Recommendations] userId:', userId, 'mode:', mode);

    let baseQuery = {};
    if (type) baseQuery.mediaType = type;

    const { modelState, modelMeta, isModelReady } = getModelState();
    console.log('[Recommendations] Model ready:', isModelReady);
    
    const [history, watchLater, wishlist] = await Promise.all([
      History.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
      WatchLater.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
      Wishlist.find({ user: userId }).populate("media").sort({ createdAt: -1 }),
    ]);

    console.log('[Recommendations] User interactions - History:', history.length, 'WatchLater:', watchLater.length, 'Wishlist:', wishlist.length);

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

    const allMedia = await Media.find(baseQuery)
      .select('tmdbId mediaType genres releaseDate popularity voteAverage')
      .limit(500)
      .lean();
    console.log('[Recommendations] Total media in DB:', allMedia.length);
    const allMediaItems = allMedia.map(m => ({
      tmdbId: String(m.tmdbId),
      mediaType: m.mediaType,
      genres: m.genres || [],
      releaseDate: m.releaseDate,
      popularity: m.popularity || 0,
    }));

    const hasUserInteractions = userHistory.length > 0;
    
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
        return res.status(200).json({ success: true, data: sortedResults, source: mode });
      }
    }
    
    let tfRecs = [];
    let recSource = 'popular';
    if (isModelReady && modelState && userHistory.length > 0) {
      console.log('[Recommendations] Calling TF recommendation service...');
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
      console.log('[Recommendations] TF recs count:', tfRecs.length);
      if (tfRecs.length > 0) recSource = tfRecs.some(r => r.isExploration) ? 'ml+exploration' : 'ml';
    }
    
    if (tfRecs.length > 0) {
      const tfRecIds = tfRecs.map(r => Number(r.tmdbId));
      const tfMedia = await Media.find({
        tmdbId: { $in: tfRecIds },
        ...baseQuery,
      }).limit(20);

      console.log('[Recommendations] TF media found:', tfMedia.length);
      if (tfMedia.length > 0) {
        const sortedResults = tfRecIds
          .map(id => tfMedia.find(m => m.tmdbId === id))
          .filter(Boolean)
          .map(transformMediaToTMDB);
        return res.status(200).json({ success: true, data: sortedResults, source: recSource });
      }
    }
    
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
          const sortedResults = recIds
            .map(id => contentMedia.find(m => m.tmdbId === id))
            .filter(Boolean)
            .map(transformMediaToTMDB);
          console.log('[Recommendations] Returning content-based, count:', sortedResults.length);
          return res.status(200).json({ success: true, data: sortedResults, source: 'content-based' });
        } else {
          console.log('[Recommendations] Content-based: no media found, falling through to popular');
        }
      }
    }

    const popularMedia = await Media.find(baseQuery)
      .sort({ voteCount: -1 })
      .limit(20)
      .lean();
    
    const transformedPopular = popularMedia.map(transformMediaToTMDB);
    console.log('[Recommendations] Returning popular media, count:', transformedPopular.length);
    res.status(200).json({ success: true, data: transformedPopular, source: recSource });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
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
