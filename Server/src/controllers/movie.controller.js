import Movie from "../models/movie.model.js";
import MediaStats from "../models/mediaStats.model.js";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { fetchWithCache } from "../utils/mediaCache.js";
import { filterHiddenMedia, isMediaHidden } from "../middlewares/hiddenMedia.middleware.js";

const filterHiddenFromResponse = async (data, mediaType = "movie") => {
  if (!data || !data.results) return data;
  const filtered = await filterHiddenMedia(data.results, mediaType);
  return {
    ...data,
    results: filtered,
    total_results: filtered.length,
  };
};

export const getPopularMovies = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `popular_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/popular?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNowPlayingMovies = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `now_playing_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/now_playing?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDiscoverMovies = async (req, res) => {
  try {
    const { page = 1, ...filters } = req.query;
    const params = new URLSearchParams({ page, ...filters }).toString();
    const endpoint = `/discover/movie?${params}`;
    
    const data = await fetchFromTMDB(endpoint);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieByID = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `movie_${id}`;
    
    const hidden = await isMediaHidden(id, "movie");
    if (hidden) {
      return res.status(404).json({ message: "Movie not found" });
    }
    
    const { data } = await fetchWithCache(key, `/movie/${id}`);

    MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(id), mediaType: "movie" },
      { $inc: { views: 1 }, lastViewedAt: new Date() },
      { upsert: true, new: true }
    ).catch(() => {});

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieTrailer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hidden = await isMediaHidden(id, "movie");
    if (hidden) {
      return res.status(404).json({ message: "No trailer available" });
    }
    
    const key = `movie_${id}_videos`;
    const { data } = await fetchWithCache(key, `/movie/${id}/videos`);

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

export const getSimilarMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const key = `movie_${id}_similar_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/${id}/similar?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No similar movies found" });
    }
    
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const key = `movie_${id}_credits`;
    const { data } = await fetchWithCache(key, `/movie/${id}/credits`);

    if (!data || (!data.cast && !data.crew)) {
      return res.status(404).json({ message: "No credits found" });
    }
    res.json({ cast: data.cast || [], crew: data.crew || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const key = `movie_${id}_reviews_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/${id}/reviews?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    res.json({ page: data.page, results: data.results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const key = `movie_${id}_recommendations_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/${id}/recommendations?page=${page}`);

    if (!data || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "No recommendations found" });
    }
    
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrending = async (req, res) => {
  try {
    const { timeWindow = "day", page = 1 } = req.query;
    const key = `trending_movie_${timeWindow}_page_${page}`;
    const { data } = await fetchWithCache(key, `/trending/movie/${timeWindow}?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopRatedMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const key = `top_rated_movies_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/top_rated?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    const key = `search_movie_${query.toLowerCase().replace(/\s+/g, "_")}_page_${page}`;
    const { data } = await fetchWithCache(key, `/search/movie?query=${encodeURIComponent(query)}&page=${page}`, { ttl: 1 });
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const key = `upcoming_movies_page_${page}`;
    const { data } = await fetchWithCache(key, `/movie/upcoming?page=${page}`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActionMovies = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const key = `action_movies_page_${page}`;
    const { data } = await fetchWithCache(key, `/discover/movie?page=${page}&with_genres=28`);
    const filteredData = await filterHiddenFromResponse(data);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
