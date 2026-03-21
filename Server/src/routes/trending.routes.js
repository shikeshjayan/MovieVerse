import express from "express";
import { fetchFromTMDB } from "../services/tmdbService.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { timeWindow = "day", page = 1 } = req.query;
    const key = `trending_all_${timeWindow}_page_${page}`;
    const data = await fetchFromTMDB(`/trending/all/${timeWindow}?page=${page}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
