import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { recordFeedback, getFeedbackStats } from "../controllers/feedback.controller.js";

export const feedbackRouter = express.Router();

feedbackRouter.post("/", protect, recordFeedback);
feedbackRouter.get("/stats", protect, getFeedbackStats);
