/**
 * Review routes
 * Handles user reviews, ratings, likes/dislikes, and spoiler marking
 */
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

// User's own reviews (must be before parameterized routes)
reviewRouter.get("/my-reviews", protect, getMyReviews);

// Public route - get reviews for a specific media
reviewRouter.get("/:movieId", getMovieReviews);

// Protected routes for review management
reviewRouter.post("/", protect, validate(reviewSchema), addReview);
reviewRouter.patch("/:reviewId", protect, updateReview);
reviewRouter.patch("/:reviewId/spoiler", protect, toggleSpoiler);
reviewRouter.post("/:reviewId/like-dislike", protect, likeDislikeReview);
reviewRouter.delete("/:reviewId", protect, deleteReview);
