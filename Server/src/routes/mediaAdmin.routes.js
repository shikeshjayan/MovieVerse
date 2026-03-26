import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import {
  getTMDBMovies,
  getMediaStats,
  getMediaAnalytics,
  getMovieDetails,
  getTVDetails,
  updateMediaStatus,
  addMediaTag,
  removeMediaTag,
  refreshMediaCache,
  getCacheStatus,
  clearCache,
  syncMediaStats,
  incrementView,
  bulkHideMedia,
  bulkUnhideMedia,
  addMediaToDatabase,
  removeMediaFromDatabase,
  getAllMediaInDatabase,
} from "../controllers/mediaAdmin.controller.js";

export const mediaAdminRouter = express.Router();

mediaAdminRouter.use(protect, admin);

mediaAdminRouter.get("/browse", getTMDBMovies);
mediaAdminRouter.get("/stats", getMediaStats);
mediaAdminRouter.get("/analytics", getMediaAnalytics);
mediaAdminRouter.get("/cache", getCacheStatus);
mediaAdminRouter.get("/database", getAllMediaInDatabase);
mediaAdminRouter.get("/movie/:tmdbId", getMovieDetails);
mediaAdminRouter.get("/tv/:tmdbId", getTVDetails);

mediaAdminRouter.patch("/:tmdbId/:mediaType/status", updateMediaStatus);
mediaAdminRouter.patch("/:tmdbId/:mediaType/tag", addMediaTag);
mediaAdminRouter.delete("/:tmdbId/:mediaType/tag/:tag", removeMediaTag);
mediaAdminRouter.post("/:tmdbId/:mediaType/refresh", refreshMediaCache);
mediaAdminRouter.post("/:tmdbId/:mediaType/sync", syncMediaStats);
mediaAdminRouter.post("/:tmdbId/:mediaType/view", incrementView);
mediaAdminRouter.post("/:tmdbId/:mediaType/add-to-db", addMediaToDatabase);
mediaAdminRouter.delete("/:tmdbId/:mediaType/remove-from-db", removeMediaFromDatabase);

mediaAdminRouter.post("/bulk-hide", bulkHideMedia);
mediaAdminRouter.post("/bulk-unhide", bulkUnhideMedia);

mediaAdminRouter.delete("/cache", clearCache);
