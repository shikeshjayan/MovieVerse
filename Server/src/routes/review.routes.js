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

export const reviewRouter = express.Router();

reviewRouter.post("/", protect, addReview);
reviewRouter.get("/my-reviews", protect, getMyReviews);
reviewRouter.get("/:movieId", getMovieReviews);
reviewRouter.patch("/:reviewId", protect, updateReview);
reviewRouter.patch("/:reviewId/spoiler", protect, toggleSpoiler);
reviewRouter.post("/:reviewId/like-dislike", protect, likeDislikeReview);
reviewRouter.delete("/:reviewId", protect, deleteReview);
