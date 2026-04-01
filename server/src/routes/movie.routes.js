/**
 * Movie routes
 * TMDB movie data endpoints including categories, details, and related content
 */
import express from "express";
import {
  getDiscoverMovies,
  getMovieByID,
  getMovieCredits,
  getMovieRecommendations,
  getMovieReviews,
  getMovieTrailer,
  getNowPlayingMovies,
  getPopularMovies,
  getSimilarMovie,
  getTrending,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getActionMovies,
} from "../controllers/movie.controller.js";

export const movieRouter = express.Router();

// Category endpoints (must be before /:id to avoid conflict)
movieRouter.get("/popular", getPopularMovies);
movieRouter.get("/now_playing", getNowPlayingMovies);
movieRouter.get("/discover", getDiscoverMovies);
movieRouter.get("/trending", getTrending);
movieRouter.get("/top_rated", getTopRatedMovies);
movieRouter.get("/upcoming", getUpcomingMovies);
movieRouter.get("/search", searchMovies);
movieRouter.get("/action", getActionMovies);

// Individual movie endpoints
movieRouter.get("/:id", getMovieByID);
movieRouter.get("/:id/trailer", getMovieTrailer);
movieRouter.get("/:id/similar", getSimilarMovie);
movieRouter.get("/:id/credits", getMovieCredits);
movieRouter.get("/:id/reviews", getMovieReviews);
movieRouter.get("/:id/recommendations", getMovieRecommendations);
