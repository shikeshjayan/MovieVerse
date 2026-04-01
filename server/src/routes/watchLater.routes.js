/**
 * Watch Later routes
 * User's queue of media to watch
 */
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
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
