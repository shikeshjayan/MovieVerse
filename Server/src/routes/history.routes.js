import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getHistory,
  addToHistory,
  removeHistoryItem,
  clearHistory
} from "../controllers/history.controller.js";

export const historyRouter = express.Router();

historyRouter.get("/", protect, getHistory);
historyRouter.post("/", protect, addToHistory);
historyRouter.delete("/clear", protect, clearHistory);
historyRouter.delete("/:movieId", protect, removeHistoryItem);