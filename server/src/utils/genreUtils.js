/**
 * TMDB genre utilities for fetching and managing movie/TV genres.
 * Provides cached genre mappings and retry-enabled API calls.
 */
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: API_KEY },
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a function with automatic retry on rate limiting.
 * Retries up to {retries} times with exponential backoff on 429 responses.
 * @param {Function} fn - Async function to execute.
 * @param {number} [retries=3] - Maximum retry attempts.
 * @param {number} [delay=1000] - Base delay between retries in ms.
 */
export const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 429 && i < retries - 1) {
        console.warn(`Rate limited, retrying in ${delay * (i + 1)}ms...`);
        await wait(delay * (i + 1));
        continue;
      }
      if (err.response?.status === 404) return null;
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
};

let genreMapCache = null;

/**
 * Gets the genre map from TMDB, with in-memory caching.
 * @param {boolean} [forceRefresh=false] - Skip cache and fetch fresh data.
 * @returns {Promise<Object>} Map of genre ID to genre name.
 */
export const getGenreMap = async (forceRefresh = false) => {
  if (genreMapCache && !forceRefresh) return genreMapCache;

  const [movieGenres, tvGenres] = await Promise.all([
    tmdbClient.get("/genre/movie/list"),
    tmdbClient.get("/genre/tv/list"),
  ]);

  genreMapCache = {};
  [...movieGenres.data.genres, ...tvGenres.data.genres].forEach((g) => {
    genreMapCache[g.id] = g.name;
  });

  return genreMapCache;
};

/**
 * Converts an array of genre IDs to genre names.
 * @param {number[]} genreIds - Array of TMDB genre IDs.
 * @returns {Promise<string[]>} Array of genre names.
 */
export const getGenreNames = async (genreIds) => {
  const map = await getGenreMap();
  return (genreIds || []).map((id) => map[id]).filter(Boolean);
};

/**
 * Fetches all movie and TV genres directly from TMDB API.
 * @returns {Promise<Object>} Combined genre map for movies and TV shows.
 */
export const fetchGenresFromTMDB = async () => {
  const [movieGenresRes, tvGenresRes] = await Promise.all([
    axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${API_KEY}`),
    axios.get(`${TMDB_BASE_URL}/genre/tv/list?api_key=${API_KEY}`),
  ]);

  const genreMap = {};
  [...movieGenresRes.data.genres, ...tvGenresRes.data.genres].forEach((g) => {
    genreMap[g.id] = g.name;
  });

  return genreMap;
};

export { tmdbClient, wait };
