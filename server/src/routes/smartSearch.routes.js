/**
 * Smart Search routes
 * AI-powered search using Gemini for contextual recommendations
 */
import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { protect } from "../middlewares/authMiddleware.js";
import { smartSearch } from "../controllers/smartSearch.controller.js";

const smartRouter = express.Router();

// Stricter rate limit - uses user ID if authenticated, IP otherwise
const smartSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 requests per minute
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: { success: false, message: "Too many searches. Please wait a moment." },
});

smartRouter.post("/ai", protect, smartSearchLimiter, smartSearch);

export default smartRouter;
