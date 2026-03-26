import MediaStats from "../models/mediaStats.model.js";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { fetchWithCache } from "../utils/mediaCache.js";
import { filterHiddenMedia, isMediaHidden } from "../middlewares/hiddenMedia.middleware.js";

const filterHiddenFromResponse = async (data, mediaType = "tv") => {
  if (!data || !data.results) return data;
  const filtered = await filterHiddenMedia(data.results, mediaType);
  return {
    ...data,
    results: filtered,
    total_results: filtered.length,
  };
};

export const getPopularTVShows = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `tv_popular_page_${page}`;
    const { data } = await fetchWithCache(key, `/tv/popular?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVShowByID = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hidden = await isMediaHidden(id, "tv");
    if (hidden) {
      return res.status(404).json({ message: "TV show not found" });
    }
    
    const key = `tv_${id}`;
    const { data } = await fetchWithCache(key, `/tv/${id}`);

    if (!data || !data.id) {
      return res.status(404).json({ message: "TV show not found" });
    }
    
    MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(id), mediaType: "tv" },
      { $inc: { views: 1 }, lastViewedAt: new Date() },
      { upsert: true, new: true }
    ).catch(() => {});
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTVShowTrailer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hidden = await isMediaHidden(id, "tv");
    if (hidden) {
      return res.status(404).json({ message: "No trailer available" });
    }
    
    const key = `tv_${id}_videos`;
    const { data } = await fetchWithCache(key, `/tv/${id}/videos`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No trailer available" });
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
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
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
    
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
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
    const { page = 1, ...filters } = req.query;
    const params = new URLSearchParams({ page, ...filters }).toString();
    const endpoint = `/discover/tv?${params}`;
    
    const data = await fetchFromTMDB(endpoint);
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrendingTV = async (req, res) => {
  try {
    const { timeWindow = "day", page = 1 } = req.query;
    const key = `trending_tv_${timeWindow}_page_${page}`;
    const { data } = await fetchWithCache(key, `/trending/tv/${timeWindow}?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
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
    const filteredData = await filterHiddenFromResponse(data, "tv");
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
