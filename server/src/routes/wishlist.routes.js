import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlist,
} from "../controllers/wishlist.controller.js";

export const wishlistRouter = express.Router();

wishlistRouter.get("/", protect, getWishlist);
wishlistRouter.post("/", protect, addToWishlist);
wishlistRouter.delete("/clear", protect, clearWishlist);      // ✅ before /:tmdbId
wishlistRouter.delete("/:tmdbId", protect, removeFromWishlist);
wishlistRouter.get("/check/:tmdbId", protect, checkWishlist);