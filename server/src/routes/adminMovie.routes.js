/**
 * Admin Movie Management routes
 * CRUD operations for locally managed movie entries
 */
import express from "express";
import {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "../controllers/adminMovie.controller.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

export const adminMovieRouter = express.Router();

// Apply auth and admin middleware to all routes
adminMovieRouter.use(protect);
adminMovieRouter.use(admin);

// Movie management routes
adminMovieRouter.post("/", createMovie);
adminMovieRouter.get("/", getAllMovies);
adminMovieRouter.get("/:id", getMovieById);
adminMovieRouter.put("/:id", updateMovie);
adminMovieRouter.delete("/:id", deleteMovie);