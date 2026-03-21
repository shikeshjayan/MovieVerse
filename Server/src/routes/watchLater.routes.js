import express from "express";
import { protect } from "../middlewares/authMiddleware.js"; // Your JWT protection middleware
import {
  addToWatchLater,
  clearWatchLater,
  getWatchLater,
  removeFromWatchLater,
} from "../controllers/watchLater.controller.js";

export const WatchlaterRouter = express.Router();

WatchlaterRouter.get("/", protect, getWatchLater);
WatchlaterRouter.delete("/clear", protect, clearWatchLater);
WatchlaterRouter.delete("/:movieId", protect, removeFromWatchLater);
WatchlaterRouter.post("/add", protect, addToWatchLater);
