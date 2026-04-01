/**
 * Admin Review Management routes
 * Moderation tools for reviewing and managing user reviews
 */
import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import {
  getAllReviews,
  getReviewStats,
  updateReview,
  deleteReview,
  bulkDeleteReviews,
  bulkHideReviews,
  clearReport,
  getReportedReviews,
} from "../controllers/adminReview.controller.js";

export const adminReviewRouter = express.Router();

adminReviewRouter.use(protect, admin);

// Read-only routes
adminReviewRouter.get("/", getAllReviews);
adminReviewRouter.get("/stats", getReviewStats);
adminReviewRouter.get("/reported", getReportedReviews);

// Moderation actions
adminReviewRouter.patch("/:reviewId", updateReview);
adminReviewRouter.delete("/:reviewId", deleteReview);
adminReviewRouter.post("/bulk-delete", bulkDeleteReviews);
adminReviewRouter.post("/bulk-hide", bulkHideReviews);
adminReviewRouter.post("/:reviewId/clear-report", clearReport);
