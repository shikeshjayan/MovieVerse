/**
 * TV Show routes
 * TMDB TV show data endpoints including categories, details, and related content
 */
import express from "express";
import {
  getPopularTVShows,
  getTVShowByID,
  getTVShowTrailer,
  getAiringToday,
  getSimilarTVShows,
  getTVCredits,
  getTVReviews,
  discoverTVShows,
  getTrendingTV,
  searchTVShows,
} from "../controllers/show.controller.js";

export const showRouter = express.Router();

// Category endpoints (must be before /:id)
showRouter.get("/popular", getPopularTVShows);
showRouter.get("/airing_today", getAiringToday);
showRouter.get("/discover", discoverTVShows);
showRouter.get("/trending", getTrendingTV);
showRouter.get("/search", searchTVShows);

// Individual TV show endpoints
showRouter.get("/:id", getTVShowByID);
showRouter.get("/:id/trailer", getTVShowTrailer);
showRouter.get("/:id/similar", getSimilarTVShows);
showRouter.get("/:id/credits", getTVCredits);
showRouter.get("/:id/reviews", getTVReviews);
