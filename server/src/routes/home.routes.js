/**
 * Home routes for fetching homepage data and featured media.
 * Provides aggregated data for trending, popular, top-rated, and upcoming content.
 */
import express from "express";
import { getCache, setCache, invalidateCache } from "../utils/cache.js";
import {
  getPopularMovies,
  getPopularTV,
  getTrending,
  getTopRatedMovies,
  getUpcomingMovies,
  getAiringTodayTV,
  fetchFromTMDB,
} from "../services/tmdbService.js";
import MediaStats from "../models/mediaStats.model.js";
import MediaCache from "../models/MediaCache.js";

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

router.get("/featured", async (req, res) => {
  try {
    const featured = await MediaStats.find({ featured: true, isHidden: false }).limit(10);
    
    const statsWithTMDB = await Promise.all(
      featured.map(async (stat) => {
        try {
          const endpoint = stat.mediaType === "movie" ? `/movie/${stat.tmdbId}` : `/tv/${stat.tmdbId}`;
          const cacheKey = `${stat.mediaType}_${stat.tmdbId}`;
          const cache = await MediaCache.findOne({ key: cacheKey });
          const tmdbData = cache?.data || await fetchFromTMDB(endpoint);
          return {
            tmdbId: stat.tmdbId,
            mediaType: stat.mediaType,
            title: tmdbData.title || tmdbData.name,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            overview: tmdbData.overview,
            vote_average: tmdbData.vote_average,
          };
        } catch {
          return { tmdbId: stat.tmdbId, mediaType: stat.mediaType, title: `ID: ${stat.tmdbId}` };
        }
      })
    );
    
    res.json({ success: true, data: statsWithTMDB });
  } catch (error) {
    console.error("Error fetching featured:", error);
    res.status(500).json({ error: "Failed to fetch featured media" });
  }
});

export default router;