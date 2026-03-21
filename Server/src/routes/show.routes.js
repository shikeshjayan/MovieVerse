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

showRouter.get("/popular", getPopularTVShows);
showRouter.get("/airing_today", getAiringToday);
showRouter.get("/discover", discoverTVShows);
showRouter.get("/trending", getTrendingTV);
showRouter.get("/search", searchTVShows);

showRouter.get("/:id", getTVShowByID);
showRouter.get("/:id/trailer", getTVShowTrailer);
showRouter.get("/:id/similar", getSimilarTVShows);
showRouter.get("/:id/credits", getTVCredits);
showRouter.get("/:id/reviews", getTVReviews);
