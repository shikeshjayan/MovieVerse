import express from "express";
import {
  addReview,
  deleteReview,
  getMyReviews,
  getMovieReviews,
  updateReview,
  toggleSpoiler,
  likeDislikeReview,
} from "../controllers/reviews.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { reviewSchema } from "../utils/validationSchemas.js";

export const reviewRouter = express.Router();

// Specific routes first (before parameterized routes)
reviewRouter.get("/my-reviews", protect, getMyReviews);

// Then parameterized routes
reviewRouter.post("/", protect, validate(reviewSchema), addReview);
reviewRouter.get("/:movieId", getMovieReviews);
reviewRouter.patch("/:reviewId", protect, updateReview);
reviewRouter.patch("/:reviewId/spoiler", protect, toggleSpoiler);
reviewRouter.post("/:reviewId/like-dislike", protect, likeDislikeReview);
reviewRouter.delete("/:reviewId", protect, deleteReview);
