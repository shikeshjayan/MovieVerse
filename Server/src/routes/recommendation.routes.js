import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getRecommendations, evaluateModel } from "../controllers/recommendation.controller.js";
import { triggerRetrain, getModelState } from "../jobs/trainJob.js";
export const recommendationRouter = express.Router();

recommendationRouter.get("/", protect, getRecommendations);
recommendationRouter.get("/status", protect, (req, res) => {
  const { isModelReady, modelMeta } = getModelState();
  res.status(200).json({ 
    success: true, 
    isModelReady,
    numUsers: modelMeta?.numUsers,
    numItems: modelMeta?.numItems,
  });
});
recommendationRouter.get("/evaluate", protect, evaluateModel);
recommendationRouter.post("/retrain", protect, async (req, res) => {
  try {
    const result = await triggerRetrain(true);
    res.status(200).json({ success: true, message: "Model retrained", ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});