import express from "express";
import { getCache, setCache, invalidateCache } from "../utils/cache.js";
import {
  getPopularMovies,
  getPopularTV,
  getTrending,
  getTopRatedMovies,
  getUpcomingMovies,
  getAiringTodayTV,
} from "../services/tmdbService.js";

const router = express.Router();

const CACHE_KEY = "homepage_data";
const CACHE_TTL = 10 * 60 * 1000;

router.get("/", async (req, res) => {
  const cached = getCache(CACHE_KEY);
  if (cached) {
    return res.json(cached);
  }

  try {
    const [trending, popularMovies, popularTV, topRated, upcoming, airingToday] = 
      await Promise.all([
        getTrending("week"),
        getPopularMovies(1),
        getPopularTV(1),
        getTopRatedMovies(1),
        getUpcomingMovies(1),
        getAiringTodayTV(1),
      ]);

    const data = {
      trending: trending?.results || [],
      popularMovies: popularMovies || [],
      popularTV: popularTV || [],
      topRated: topRated || [],
      upcoming: upcoming || [],
      airingToday: airingToday?.results || [],
      cachedAt: Date.now(),
    };

    setCache(CACHE_KEY, data, CACHE_TTL);
    res.json(data);
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).json({ error: "Failed to fetch homepage data" });
  }
});

router.post("/invalidate", (req, res) => {
  invalidateCache("homepage");
  res.json({ message: "Cache invalidated" });
});

export default router;