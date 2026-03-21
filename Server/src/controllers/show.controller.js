import MediaCache from "../models/MediaCache.js";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { isExpired, isStale, getCacheTTL } from "../utils/cacheHelper.js";

const saveCache = async (key, data, ttl = 7) => {
  await MediaCache.findOneAndUpdate(
    { key },
    { data, updatedAt: new Date(), expiresAt: getCacheTTL(ttl) },
    { upsert: true }
  );
};

const fetchWithCache = async (key, tmdbEndpoint, options = {}) => {
  const { allowStale = true, ttl = 7 } = options;
  
  let cache = await MediaCache.findOne({ key });
  
  if (cache && !isExpired(cache.updatedAt)) {
    return { data: cache.data, fromCache: true };
  }
  
  try {
    const data = await fetchFromTMDB(tmdbEndpoint);
    await saveCache(key, data, ttl);
    return { data, fromCache: false };
  } catch (error) {
    if (allowStale && cache) {
      return { data: cache.data, fromCache: true, stale: true };
    }
    throw error;
  }
};

export const getPopularTVShows = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `tv_popular_page_${page}`;
    const { data } = await fetchWithCache(key, `/tv/popular?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No TV shows found" });
    }
    res.json({ page: data.page, results: data.results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVShowByID = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `tv_${id}`;
    const { data } = await fetchWithCache(key, `/tv/${id}`);

    if (!data || !data.id) {
      return res.status(404).json({ message: "TV show not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVShowTrailer = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `tv_${id}_videos`;
    const { data } = await fetchWithCache(key, `/tv/${id}/videos`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No trailer found" });
    }

    const trailer = data.results.find(
      (vid) => vid.type === "Trailer" && vid.site === "YouTube"
    );
    res.json(trailer || data.results[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAiringToday = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `tv_airing_today_page_${page}`;
    const { data } = await fetchWithCache(key, `/tv/airing_today?page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSimilarTVShows = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const key = `tv_${id}_similar_page_${page}`;
    const { data } = await fetchWithCache(key, `/tv/${id}/similar?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No similar TV shows found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `tv_${id}_credits`;
    const { data } = await fetchWithCache(key, `/tv/${id}/credits`);

    if (!data || (!data.cast && !data.crew)) {
      return res.status(404).json({ message: "No credits found" });
    }
    res.json({ cast: data.cast || [], crew: data.crew || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const key = `tv_${id}_reviews_page_${page}`;
    const { data } = await fetchWithCache(key, `/tv/${id}/reviews?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    res.json({ page: data.page, results: data.results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const discoverTVShows = async (req, res) => {
  try {
    const { page = 1, genre } = req.query;
    const key = genre 
      ? `discover_tv_genre_${genre}_page_${page}`
      : `discover_tv_page_${page}`;
    const endpoint = genre 
      ? `/discover/tv?page=${page}&with_genres=${genre}`
      : `/discover/tv?page=${page}`;
    const { data } = await fetchWithCache(key, endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrendingTV = async (req, res) => {
  try {
    const { timeWindow = "day", page = 1 } = req.query;
    const key = `trending_tv_${timeWindow}_page_${page}`;
    const { data } = await fetchWithCache(key, `/trending/tv/${timeWindow}?page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchTVShows = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    const key = `search_tv_${query.toLowerCase().replace(/\s+/g, "_")}_page_${page}`;
    const { data } = await fetchWithCache(key, `/search/tv?query=${encodeURIComponent(query)}&page=${page}`, { ttl: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
