import MediaStats from "../models/mediaStats.model.js";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { fetchWithCache } from "../utils/mediaCache.js";
import { filterHiddenMedia, isMediaHidden } from "../middlewares/hiddenMedia.middleware.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const filterHiddenFromResponse = async (data, mediaType = "movie") => {
  if (!data || !data.results) return data;
  const filtered = await filterHiddenMedia(data.results, mediaType);
  return {
    ...data,
    results: filtered,
    total_results: filtered.length,
  };
};

export const getPopularMovies = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const key = `popular_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/popular?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getNowPlayingMovies = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const key = `now_playing_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/now_playing?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getDiscoverMovies = catchAsync(async (req, res, next) => {
  const { page = 1, ...filters } = req.query;
  const params = new URLSearchParams({ page, ...filters }).toString();
  const endpoint = `/discover/movie?${params}`;
  
  const data = await fetchFromTMDB(endpoint);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getMovieByID = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const key = `movie_${id}`;
  
  const hidden = await isMediaHidden(id, "movie");
  if (hidden) {
    return next(new AppError("Movie not found", 404));
  }
  
  const { data } = await fetchWithCache(key, `/movie/${id}`);

  MediaStats.findOneAndUpdate(
    { tmdbId: parseInt(id), mediaType: "movie" },
    { $inc: { views: 1 }, lastViewedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  ).catch(() => {});

  res.json(data);
});

export const getMovieTrailer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const hidden = await isMediaHidden(id, "movie");
  if (hidden) {
    return next(new AppError("No trailer available", 404));
  }
  
  const key = `movie_${id}_videos`;
  const { data } = await fetchWithCache(key, `/movie/${id}/videos`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No trailer available", 404));
  }

  const trailer = data.results.find(
    (vid) => vid.type === "Trailer" && vid.site === "YouTube"
  );
  res.json(trailer || data.results[0]);
});

export const getSimilarMovie = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const key = `movie_${id}_similar_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/${id}/similar?page=${page}`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No similar movies found", 404));
  }
  
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getMovieCredits = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const key = `movie_${id}_credits`;
  const { data } = await fetchWithCache(key, `/movie/${id}/credits`);

  if (!data || (!data.cast && !data.crew)) {
    return next(new AppError("No credits found", 404));
  }
  res.json({ cast: data.cast || [], crew: data.crew || [] });
});

export const getMovieReviews = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const key = `movie_${id}_reviews_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/${id}/reviews?page=${page}`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No reviews found", 404));
  }
  res.json({ page: data.page, results: data.results });
});

export const getMovieRecommendations = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const key = `movie_${id}_recommendations_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/${id}/recommendations?page=${page}`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No recommendations found", 404));
  }
  
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getTrending = catchAsync(async (req, res, next) => {
  const { timeWindow = "day", page = 1 } = req.query;
  const key = `trending_movie_${timeWindow}_page_${page}`;
  const { data } = await fetchWithCache(key, `/trending/movie/${timeWindow}?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getTopRatedMovies = catchAsync(async (req, res, next) => {
  const { page = 1 } = req.query;
  const key = `top_rated_movies_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/top_rated?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const searchMovies = catchAsync(async (req, res, next) => {
  const { query, page = 1 } = req.query;
  if (!query) {
    return next(new AppError("Query is required", 400));
  }
  const key = `search_movie_${query.toLowerCase().replace(/\s+/g, "_")}_page_${page}`;
  const { data } = await fetchWithCache(key, `/search/movie?query=${encodeURIComponent(query)}&page=${page}`, { ttl: 1 });
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getUpcomingMovies = catchAsync(async (req, res, next) => {
  const { page = 1 } = req.query;
  const key = `upcoming_movies_page_${page}`;
  const { data } = await fetchWithCache(key, `/movie/upcoming?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});

export const getActionMovies = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const key = `action_movies_page_${page}`;
  const { data } = await fetchWithCache(key, `/discover/movie?page=${page}&with_genres=28`);
  const filteredData = await filterHiddenFromResponse(data);
  res.json(filteredData);
});
