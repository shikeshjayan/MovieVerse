/**
 * Search routes
 * Multi-type search for movies and TV shows with hidden content filtering
 */
import express from "express";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { filterHiddenMedia } from "../middlewares/hiddenMedia.middleware.js";

const router = express.Router();

router.get("/multi", async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    const key = `search_multi_${query.toLowerCase().replace(/\s+/g, "_")}_page_${page}`;
    const data = await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
    
    if (data && data.results) {
      // Filter out hidden content and person results from search
      const movieResults = await filterHiddenMedia(
        data.results.filter(r => r.media_type === "movie"),
        "movie"
      );
      const tvResults = await filterHiddenMedia(
        data.results.filter(r => r.media_type === "tv"),
        "tv"
      );
      // Remove person results (only keep movies and tv)
      data.results = [...movieResults, ...tvResults];
      data.total_results = data.results.length;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
