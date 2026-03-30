import MediaStats from "../models/mediaStats.model.js";
import { fetchFromTMDB } from "../services/tmdbService.js";
import { fetchWithCache } from "../utils/mediaCache.js";
import { filterHiddenMedia, isMediaHidden } from "../middlewares/hiddenMedia.middleware.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const filterHiddenFromResponse = async (data, mediaType = "tv") => {
  if (!data || !data.results) return data;
  const filtered = await filterHiddenMedia(data.results, mediaType);
  return {
    ...data,
    results: filtered,
    total_results: filtered.length,
  };
};

export const getPopularTVShows = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const key = `tv_popular_page_${page}`;
  const { data } = await fetchWithCache(key, `/tv/popular?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});

export const getTVShowByID = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const hidden = await isMediaHidden(id, "tv");
  if (hidden) {
    return next(new AppError("TV show not found", 404));
  }
  
  const key = `tv_${id}`;
  const { data } = await fetchWithCache(key, `/tv/${id}`);

  if (!data || !data.id) {
    return next(new AppError("TV show not found", 404));
  }
  
  MediaStats.findOneAndUpdate(
    { tmdbId: parseInt(id), mediaType: "tv" },
    { $inc: { views: 1 }, lastViewedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  ).catch(() => {});
  
  res.json(data);
});

export const getTVShowTrailer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const hidden = await isMediaHidden(id, "tv");
  if (hidden) {
    return next(new AppError("No trailer available", 404));
  }
  
  const key = `tv_${id}_videos`;
  const { data } = await fetchWithCache(key, `/tv/${id}/videos`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No trailer available", 404));
  }

  const trailer = data.results.find(
    (vid) => vid.type === "Trailer" && vid.site === "YouTube"
  );
  res.json(trailer || data.results[0]);
});

export const getAiringToday = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const key = `tv_airing_today_page_${page}`;
  const { data } = await fetchWithCache(key, `/tv/airing_today?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});

export const getSimilarTVShows = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const key = `tv_${id}_similar_page_${page}`;
  const { data } = await fetchWithCache(key, `/tv/${id}/similar?page=${page}`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No similar TV shows found", 404));
  }
  
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});

export const getTVCredits = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const key = `tv_${id}_credits`;
  const { data } = await fetchWithCache(key, `/tv/${id}/credits`);

  if (!data || (!data.cast && !data.crew)) {
    return next(new AppError("No credits found", 404));
  }
  res.json({ cast: data.cast || [], crew: data.crew || [] });
});

export const getTVReviews = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = req.query.page || 1;
  const key = `tv_${id}_reviews_page_${page}`;
  const { data } = await fetchWithCache(key, `/tv/${id}/reviews?page=${page}`);

  if (!data || !data.results || data.results.length === 0) {
    return next(new AppError("No reviews found", 404));
  }
  res.json({ page: data.page, results: data.results });
});

export const discoverTVShows = catchAsync(async (req, res, next) => {
  const { page = 1, ...filters } = req.query;
  const params = new URLSearchParams({ page, ...filters }).toString();
  const endpoint = `/discover/tv?${params}`;
  
  const data = await fetchFromTMDB(endpoint);
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});

export const getTrendingTV = catchAsync(async (req, res, next) => {
  const { timeWindow = "day", page = 1 } = req.query;
  const key = `trending_tv_${timeWindow}_page_${page}`;
  const { data } = await fetchWithCache(key, `/trending/tv/${timeWindow}?page=${page}`);
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});

export const searchTVShows = catchAsync(async (req, res, next) => {
  const { query, page = 1 } = req.query;
  if (!query) {
    return next(new AppError("Query is required", 400));
  }
  const key = `search_tv_${query.toLowerCase().replace(/\s+/g, "_")}_page_${page}`;
  const { data } = await fetchWithCache(key, `/search/tv?query=${encodeURIComponent(query)}&page=${page}`, { ttl: 1 });
  const filteredData = await filterHiddenFromResponse(data, "tv");
  res.json(filteredData);
});
