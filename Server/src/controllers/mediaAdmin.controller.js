import MediaStats from "../models/mediaStats.model.js";
import MediaCache from "../models/MediaCache.js";
import Review from "../models/review.model.js";
import Wishlist from "../models/wishlist.model.js";
import WatchLater from "../models/watchLater.model.js";
import { fetchFromTMDB } from "../services/tmdbService.js";

export const getTMDBMovies = async (req, res) => {
  try {
    const { category = "popular", page = 1, search, mediaType = "movie" } = req.query;
    const type = mediaType === "tv" ? "tv" : "movie";
    let data;

    const searchEndpoint = type === "movie" ? "/search/movie" : "/search/tv";
    const categoryEndpoints = {
      movie: {
        popular: `/movie/popular?page=${page}`,
        top_rated: `/movie/top_rated?page=${page}`,
        now_playing: `/movie/now_playing?page=${page}`,
        upcoming: `/movie/upcoming?page=${page}`,
        trending: `/trending/movie/week?page=${page}`,
      },
      tv: {
        popular: `/tv/popular?page=${page}`,
        top_rated: `/tv/top_rated?page=${page}`,
        airing_today: `/tv/airing_today?page=${page}`,
        trending: `/trending/tv/week?page=${page}`,
      },
    };

    if (search) {
      const cacheKey = `search_${type}_${search}_page_${page}`;
      const cached = await MediaCache.findOne({ key: cacheKey });
      if (cached) {
        data = cached.data;
      } else {
        data = await fetchFromTMDB(`${searchEndpoint}?query=${encodeURIComponent(search)}&page=${page}`);
        await MediaCache.create({
          key: cacheKey,
          data,
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
    } else {
      const endpoints = categoryEndpoints[type];
      const endpoint = endpoints[category] || endpoints.popular;
      const cacheKey = `${type}_${category}_page_${page}`;
      const cached = await MediaCache.findOne({ key: cacheKey });
      if (cached) {
        data = cached.data;
      } else {
        data = await fetchFromTMDB(endpoint);
        await MediaCache.create({
          key: cacheKey,
          data,
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    const resultsWithStats = await Promise.all(
      (data.results || []).map(async (item) => {
        const title = item.title || item.name;
        const posterPath = item.poster_path;
        let stats = await MediaStats.findOne({ tmdbId: item.id, mediaType: type });
        if (!stats) {
          stats = await MediaStats.create({
            tmdbId: item.id,
            mediaType: type,
            title,
            posterPath,
          });
        }
        return {
          ...item,
          title,
          stats: {
            views: stats.views,
            wishlistCount: stats.wishlistCount,
            watchLaterCount: stats.watchLaterCount,
            reviewsCount: stats.reviewsCount,
            aiRecommendationCount: stats.aiRecommendationCount,
            isHidden: stats.isHidden,
            hideReason: stats.hideReason,
            tags: stats.tags,
            featured: stats.featured,
          },
        };
      })
    );

    res.json({
      success: true,
      data: resultsWithStats,
      pagination: {
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaStats = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "views", order = "desc", ...filters } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.mediaType) query.mediaType = filters.mediaType;
    if (filters.isHidden === "true") query.isHidden = true;
    if (filters.isHidden === "false") query.isHidden = false;
    if (filters.featured === "true") query.featured = true;
    if (filters.tag) query.tags = { $in: [filters.tag] };

    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    const [stats, total] = await Promise.all([
      MediaStats.find(query).sort(sortObj).skip(skip).limit(parseInt(limit)),
      MediaStats.countDocuments(query),
    ]);

    const statsWithTMDB = await Promise.all(
      stats.map(async (stat) => {
        try {
          const endpoint = stat.mediaType === "movie" ? `/movie/${stat.tmdbId}` : `/tv/${stat.tmdbId}`;
          const cacheKey = `${stat.mediaType}_${stat.tmdbId}`;
          const cache = await MediaCache.findOne({ key: cacheKey });
          const tmdbData = cache?.data || await fetchFromTMDB(endpoint);
          return {
            ...stat.toObject(),
            title: tmdbData.title || tmdbData.name,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            releaseDate: tmdbData.release_date || tmdbData.first_air_date,
            genres: tmdbData.genres?.map(g => g.name) || [],
            vote_average: tmdbData.vote_average,
            popularity: tmdbData.popularity,
            cached: !!cache,
            lastCached: cache?.updatedAt,
            cacheExpired: cache ? (Date.now() - new Date(cache.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000) : true,
          };
        } catch {
          return { ...stat.toObject(), title: `ID: ${stat.tmdbId}` };
        }
      })
    );

    res.json({
      success: true,
      data: statsWithTMDB,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMediaAnalytics = async (req, res) => {
  try {
    const [totalMovies, hiddenMovies, featuredMovies, topViewed, topWishlisted, topAIRecommended] = await Promise.all([
      MediaStats.countDocuments({ mediaType: "movie" }),
      MediaStats.countDocuments({ isHidden: true, mediaType: "movie" }),
      MediaStats.countDocuments({ featured: true, mediaType: "movie" }),
      MediaStats.find({ mediaType: "movie" }).sort({ views: -1 }).limit(10),
      MediaStats.find({ mediaType: "movie" }).sort({ wishlistCount: -1 }).limit(10),
      MediaStats.find({ mediaType: "movie" }).sort({ aiRecommendationCount: -1 }).limit(10),
    ]);

    const enrichedTopViewed = await Promise.all(
      topViewed.map(async (stat) => {
        try {
          const data = await fetchFromTMDB(`/movie/${stat.tmdbId}`);
          return { ...stat.toObject(), title: data.title, poster_path: data.poster_path };
        } catch {
          return { ...stat.toObject(), title: `Movie ${stat.tmdbId}` };
        }
      })
    );

    const totalViews = topViewed.reduce((sum, m) => sum + m.views, 0) || 1;
    const totalWishlists = topWishlisted.reduce((sum, m) => sum + m.wishlistCount, 0) || 1;

    res.json({
      success: true,
      data: {
        overview: { totalMovies, hiddenMovies, featuredMovies, visibleMovies: totalMovies - hiddenMovies },
        topViewed: enrichedTopViewed,
        topWishlisted: topWishlisted.map(m => ({ ...m.toObject(), engagementScore: ((m.views / totalViews) * 100 + (m.wishlistCount / totalWishlists) * 100) / 2 })),
        topAIRecommended,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMediaStatus = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const { isHidden, hideReason, tags, featured } = req.body;

    const update = {};
    if (typeof isHidden === "boolean") update.isHidden = isHidden;
    if (hideReason !== undefined) update.hideReason = hideReason;
    if (Array.isArray(tags)) update.tags = tags;
    if (typeof featured === "boolean") update.featured = featured;

    const stats = await MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(tmdbId), mediaType },
      update,
      { new: true, upsert: true }
    );

    if (typeof isHidden === "boolean") {
      const cacheKey = `${mediaType}_${tmdbId}`;
      await MediaCache.deleteOne({ key: cacheKey });
      await MediaCache.deleteMany({ key: { $regex: `^${mediaType}_${tmdbId}_` } });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addMediaTag = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const { tag } = req.body;

    if (!tag) return res.status(400).json({ success: false, message: "Tag is required" });

    const stats = await MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(tmdbId), mediaType },
      { $addToSet: { tags: tag } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMediaTag = async (req, res) => {
  try {
    const { tmdbId, mediaType, tag } = req.params;

    const stats = await MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(tmdbId), mediaType },
      { $pull: { tags: tag } },
      { new: true }
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshMediaCache = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;
    const endpoint = mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const cacheKey = `${mediaType}_${tmdbId}`;

    await MediaCache.deleteOne({ key: cacheKey });

    const data = await fetchFromTMDB(endpoint);

    await MediaCache.create({
      key: cacheKey,
      data,
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({ success: true, message: "Cache refreshed", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCacheStatus = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [caches, total] = await Promise.all([
      MediaCache.find().sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      MediaCache.countDocuments(),
    ]);

    const now = Date.now();
    const cacheList = caches.map((c) => ({
      key: c.key,
      updatedAt: c.updatedAt,
      expiresAt: c.expiresAt,
      isExpired: c.expiresAt ? new Date(c.expiresAt).getTime() < now : false,
      isStale: c.updatedAt ? (now - new Date(c.updatedAt).getTime() > 24 * 60 * 60 * 1000) : true,
    }));

    res.json({
      success: true,
      data: cacheList,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCache = async (req, res) => {
  try {
    const { type, key } = req.query;

    if (key) {
      await MediaCache.deleteOne({ key });
      return res.json({ success: true, message: `Cache key "${key}" cleared` });
    }

    if (type === "expired") {
      const result = await MediaCache.deleteMany({ expiresAt: { $lt: new Date() } });
      return res.json({ success: true, message: `Cleared ${result.deletedCount} expired cache entries` });
    }

    if (type === "all") {
      const result = await MediaCache.deleteMany({});
      return res.json({ success: true, message: `Cleared all ${result.deletedCount} cache entries` });
    }

    res.status(400).json({ success: false, message: "Invalid clear type" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const syncMediaStats = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const [wishlistCount, watchLaterCount, reviewsCount] = await Promise.all([
      Wishlist.countDocuments({ tmdbId: parseInt(tmdbId), mediaType }),
      WatchLater.countDocuments({ tmdbId: parseInt(tmdbId), mediaType }),
      Review.countDocuments({ movieId: parseInt(tmdbId), media_type: mediaType }),
    ]);

    const stats = await MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(tmdbId), mediaType },
      { wishlistCount, watchLaterCount, reviewsCount },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementView = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const stats = await MediaStats.findOneAndUpdate(
      { tmdbId: parseInt(tmdbId), mediaType },
      { $inc: { views: 1 }, lastViewedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, views: stats.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMovieDetails = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const cacheKey = `movie_${tmdbId}`;
    const cache = await MediaCache.findOne({ key: cacheKey });

    if (cache) {
      const stats = await MediaStats.findOne({ tmdbId: parseInt(tmdbId), mediaType: "movie" });
      return res.json({ success: true, data: cache.data, stats: stats || null });
    }

    const data = await fetchFromTMDB(`/movie/${tmdbId}`);
    await MediaCache.create({
      key: cacheKey,
      data,
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const stats = await MediaStats.findOne({ tmdbId: parseInt(tmdbId), mediaType: "movie" });
    res.json({ success: true, data, stats: stats || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTVDetails = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const cacheKey = `tv_${tmdbId}`;
    const cache = await MediaCache.findOne({ key: cacheKey });

    if (cache) {
      const stats = await MediaStats.findOne({ tmdbId: parseInt(tmdbId), mediaType: "tv" });
      return res.json({ success: true, data: cache.data, stats: stats || null });
    }

    const data = await fetchFromTMDB(`/tv/${tmdbId}`);
    await MediaCache.create({
      key: cacheKey,
      data,
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const stats = await MediaStats.findOne({ tmdbId: parseInt(tmdbId), mediaType: "tv" });
    res.json({ success: true, data, stats: stats || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkHideMedia = async (req, res) => {
  try {
    const { mediaItems } = req.body;

    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
      return res.status(400).json({ success: false, message: "No media items provided" });
    }

    const updatePromises = mediaItems.map(({ tmdbId, mediaType }) =>
      MediaStats.findOneAndUpdate(
        { tmdbId: parseInt(tmdbId), mediaType },
        { isHidden: true },
        { upsert: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: `${mediaItems.length} media items hidden` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUnhideMedia = async (req, res) => {
  try {
    const { mediaItems } = req.body;

    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
      return res.status(400).json({ success: false, message: "No media items provided" });
    }

    const updatePromises = mediaItems.map(({ tmdbId, mediaType }) =>
      MediaStats.findOneAndUpdate(
        { tmdbId: parseInt(tmdbId), mediaType },
        { isHidden: false, hideReason: "" },
        { upsert: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: `${mediaItems.length} media items unhidden` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addMediaToDatabase = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const existingMedia = await MediaStats.findOne({ tmdbId: parseInt(tmdbId), mediaType });
    if (existingMedia) {
      return res.status(400).json({ success: false, message: "Media already in database" });
    }

    const endpoint = mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const data = await fetchFromTMDB(endpoint);

    const newMedia = await MediaStats.create({
      tmdbId: parseInt(tmdbId),
      mediaType,
      title: data.title || data.name,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
    });

    res.json({ success: true, data: newMedia, message: "Media added to database" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMediaFromDatabase = async (req, res) => {
  try {
    const { tmdbId, mediaType } = req.params;

    const media = await MediaStats.findOneAndDelete({ tmdbId: parseInt(tmdbId), mediaType });

    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found in database" });
    }

    res.json({ success: true, message: "Media removed from database" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllMediaInDatabase = async (req, res) => {
  try {
    const { page = 1, limit = 20, mediaType, isHidden, sort = "createdAt", order = "desc" } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (mediaType) query.mediaType = mediaType;
    if (isHidden !== undefined) query.isHidden = isHidden === "true";

    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    const [media, total] = await Promise.all([
      MediaStats.find(query).sort(sortObj).skip(skip).limit(parseInt(limit)),
      MediaStats.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: media,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
