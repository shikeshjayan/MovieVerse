import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getRecommendations, evaluateModel } from "../controllers/recommendation.controller.js";
import { triggerRetrain, getModelState } from "../jobs/trainJob.js";
import TF_CONFIG from "../utils/tfConfig.js";

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

recommendationRouter.get("/model-info", protect, (req, res) => {
  const { isModelReady, modelMeta } = getModelState();
  res.status(200).json({
    success: true,
    model: {
      name:        TF_CONFIG.MODEL_NAME,
      version:     TF_CONFIG.MODEL_VERSION,
      description: TF_CONFIG.MODEL_DESCRIPTION,
      algorithm:   TF_CONFIG.ALGORITHM,
      isReady:     isModelReady,
      stats: isModelReady ? {
        users:        modelMeta?.numUsers,
        items:        modelMeta?.numItems,
        interactions: modelMeta?.allInteractions?.length,
      } : null,
      config: {
        embeddingDim:      TF_CONFIG.EMBEDDING_DIM,
        cfWeight:          TF_CONFIG.CF_WEIGHT,
        contentWeight:     TF_CONFIG.CONTENT_WEIGHT,
        popularityWeight:  TF_CONFIG.POPULARITY_WEIGHT,
        explorationRate:   TF_CONFIG.EXPLORATION_RATE,
        diversityMaxGenre: TF_CONFIG.DIVERSITY_MAX_SAME_GENRE,
      },
    },
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