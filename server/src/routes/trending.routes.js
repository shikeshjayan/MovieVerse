import express from "express";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { filterHiddenMedia } from "../middlewares/hiddenMedia.middleware.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { timeWindow = "day", page = 1 } = req.query;
    const key = `trending_all_${timeWindow}_page_${page}`;
    const data = await fetchFromTMDB(`/trending/all/${timeWindow}?page=${page}`);
    
    if (data && data.results) {
      const movieResults = await filterHiddenMedia(
        data.results.filter(r => r.media_type === "movie"),
        "movie"
      );
      const tvResults = await filterHiddenMedia(
        data.results.filter(r => r.media_type === "tv"),
        "tv"
      );
      data.results = [...movieResults, ...tvResults];
      data.total_results = data.results.length;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
