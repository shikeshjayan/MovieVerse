/**
 * TMDB API Service
 * Handles all communication with The Movie Database API
 * Provides movie/TV show data, search, and metadata
 */
import axios from "axios";
import Movie from "../models/movie.model.js";
import {
  withRetry,
  tmdbClient,
  wait,
  getGenreMap,
} from "../utils/genreUtils.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Batch configuration for bulk operations
const BATCH_SIZE = 5;
const PAGE_DELAY = 200;

/**
 * Fetch multiple pages of data concurrently
 * Used for bulk data import operations
 */
const fetchPageBatch = async (type, pages) => {
  const [moviesRes, tvRes] = await Promise.all([
    Promise.all(
      pages.map((page) =>
        tmdbClient.get(`/${type}/popular`, { params: { page } }),
      ),
    ),
    Promise.all(
      pages.map((page) => tmdbClient.get(`/tv/popular`, { params: { page } })),
    ),
  ]);

  return {
    movies: moviesRes.flatMap((res) => res.data.results),
    tv: tvRes.flatMap((res) => res.data.results),
  };
};

export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/**
 * Generate TMDB image URL with specified size
 * @param {string} path - Image path from TMDB
 * @param {string} size - Image size preset (default: w500)
 * @returns {string|null} Full image URL
 */
export const getImageUrl = (path, size = "w500") => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

/**
 * Convert genre IDs to human-readable names
 * @param {number[]} genreIds - Array of TMDB genre IDs
 * @returns {string[]} Array of genre names
 */
export const getGenreNames = async (genreIds) => {
  const map = await getGenreMap();
  return (genreIds || []).map((id) => map[id]).filter(Boolean);
};

export const getPopularMovies = async (page = 1) => {
  const res = await tmdbClient.get("/movie/popular", { params: { page } });
  return res.data.results;
};

export const getPopularTV = async (page = 1) => {
  const res = await tmdbClient.get("/tv/popular", { params: { page } });
  return res.data.results;
};

export const searchMedia = async (query, page = 1) => {
  const res = await tmdbClient.get("/search/multi", {
    params: { query, page },
  });
  return res.data;
};

export const getMovieDetails = async (id) => {
  const res = await tmdbClient.get(`/movie/${id}`);
  return res.data;
};

export const getTVDetails = async (id) => {
  const res = await tmdbClient.get(`/tv/${id}`);
  return res.data;
};

export const discover = async (type, page = 1) => {
  const res = await tmdbClient.get(`/discover/${type}`, {
    params: { page },
  });
  return res.data.results;
};

export const getMoviesByCategory = async (category, page = 1) => {
  const endpoints = {
    popular: "/movie/popular",
    top_rated: "/movie/top_rated",
    now_playing: "/movie/now_playing",
    trending: "/trending/movie/week",
    upcoming: "/movie/upcoming",
    tv_popular: "/tv/popular",
    tv_top_rated: "/tv/top_rated",
    tv_airing_today: "/tv/airing_today",
    tv_on_the_air: "/tv/on_the_air",
  };

  const url = endpoints[category];
  if (!url) return [];

  const res = await tmdbClient.get(url, { params: { page } });
  return res.data.results;
};

/**
 * Get YouTube trailer URL for a movie or TV show
 * @param {number} id - TMDB ID
 * @param {string} type - "movie" or "tv"
 * @returns {string|null} YouTube URL or null if no trailer found
 */
export const getMovieTrailer = async (id, type = "movie") => {
  return withRetry(async () => {
    const res = await tmdbClient.get(`/${type}/${id}/videos`);
    const videos = res.data.results;
    const trailer = videos.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  });
};

/**
 * Get cast and crew information for a movie or TV show
 * @param {number} id - TMDB ID
 * @param {string} type - "movie" or "tv"
 * @returns {Object} Directors and cast members
 */
export const getMovieCredits = async (id, type = "movie") => {
  return withRetry(async () => {
    const res = await tmdbClient.get(`/${type}/${id}/credits`);
    const data = res.data;
    return {
      directors: data.crew
        .filter((c) => c.job === "Director")
        .map((c) => c.name),
      cast: data.cast
        .slice(0, 10)
        .map((c) => ({ name: c.name, character: c.character })),
    };
  });
};

export const getExternalIds = async (id, type = "movie") => {
  return withRetry(async () => {
    const res = await tmdbClient.get(`/${type}/${id}/external_ids`);
    return res.data;
  });
};

export const getReviews = async (id, type = "movie") => {
  return withRetry(async () => {
    const res = await tmdbClient.get(`/${type}/${id}/reviews`);
    return res.data.results.slice(0, 10).map((r) => ({
      id: r.id,
      author: r.author,
      content: r.content,
      created_at: r.created_at,
      rating: r.author_details?.rating,
    }));
  });
};

/**
 * Generic TMDB endpoint fetcher with API key injection
 * @param {string} endpoint - TMDB API endpoint (e.g., "/movie/123")
 * @returns {Object} TMDB API response data
 */
export const fetchFromTMDB = async (endpoint) => {
  const fullUrl = `${TMDB_BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  const params = new URLSearchParams(url.search);
  params.set('api_key', process.env.TMDB_API_KEY);
  
  const res = await axios.get(`${url.origin}${url.pathname}`, {
    params: Object.fromEntries(params),
  });
  return res.data;
};

export const getTrending = async (timeWindow = "day") => {
  const res = await tmdbClient.get(`/trending/all/${timeWindow}`);
  return res.data;
};

export const getDiscoverByGenre = async (type, genreId, page = 1) => {
  const res = await tmdbClient.get(`/discover/${type}`, {
    params: { with_genres: genreId, page },
  });
  return res.data;
};

export const getSimilar = async (type, id, page = 1) => {
  const res = await tmdbClient.get(`/${type}/${id}/similar`, { params: { page } });
  return res.data;
};

export const getCredits = async (type, id) => {
  const res = await tmdbClient.get(`/${type}/${id}/credits`);
  return res.data;
};

export const getMediaReviews = async (type, id, page = 1) => {
  const res = await tmdbClient.get(`/${type}/${id}/reviews`, { params: { page } });
  return res.data;
};

export const getAiringToday = async (page = 1) => {
  const res = await tmdbClient.get("/tv/airing_today", { params: { page } });
  return res.data;
};

export const getTopRatedMovies = async (page = 1) => {
  const res = await tmdbClient.get("/movie/top_rated", { params: { page } });
  return res.data.results;
};

export const getUpcomingMovies = async (page = 1) => {
  const res = await tmdbClient.get("/movie/upcoming", { params: { page } });
  return res.data.results;
};

export const getAiringTodayTV = async (page = 1) => {
  const res = await tmdbClient.get("/tv/on_the_air", { params: { page } });
  return res.data;
};
