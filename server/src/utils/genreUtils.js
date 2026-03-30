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

export const getGenreNames = async (genreIds) => {
  const map = await getGenreMap();
  return (genreIds || []).map((id) => map[id]).filter(Boolean);
};

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
