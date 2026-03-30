import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { protect } from "../middlewares/authMiddleware.js";
import { smartSearch } from "../controllers/smartSearch.controller.js";

const smartRouter = express.Router();

const smartSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  message: { success: false, message: "Too many searches. Please wait a moment." },
});

smartRouter.post("/ai", protect, smartSearchLimiter, smartSearch);

export default smartRouter;
