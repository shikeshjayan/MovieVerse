import WatchLater from "../models/watchLater.model.js";
import Media from "../models/media.model.js";
import { findOrCreateMedia, updateMediaStats, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const addToWatchLater = catchAsync(async (req, res, next) => {
  const { movieId, media_type, ...mediaData } = req.body;

  if (!movieId) {
    return next(new AppError("Movie ID is required", 400));
  }

  const mediaType = getMediaType(media_type);
  const media = await findOrCreateMedia({ tmdbId: movieId, ...mediaData }, mediaType);

  if (!media || !media._id) {
    return next(new AppError("Failed to find or create media", 500));
  }

  const existing = await WatchLater.findOne({ user: req.user._id, media: media._id });

  if (existing) {
    await WatchLater.findByIdAndDelete(existing._id);
    await updateMediaStats(movieId, mediaType, "watchLaterCount", -1);
    return res.status(200).json({ success: true, message: "Removed from watch later", action: "removed" });
  }

  const watchLaterItem = await WatchLater.create({ user: req.user._id, media: media._id });
  await updateMediaStats(movieId, mediaType, "watchLaterCount", 1);
  const populated = await WatchLater.findById(watchLaterItem._id).populate("media");

  res.status(200).json({ success: true, message: "Added to watch later", action: "added", data: populated });
});

export const removeFromWatchLater = catchAsync(async (req, res, next) => {
  const numericId = parseNumericId(req.params.movieId);
  if (!numericId) {
    return next(new AppError("Invalid movie ID", 400));
  }

  const mediaType = getMediaType(req.query.type);
  const media = await Media.findOne({ tmdbId: numericId, mediaType });
  if (!media) {
    return next(new AppError("Media not found", 404));
  }

  const existing = await WatchLater.findOneAndDelete({ user: req.user._id, media: media._id });
  if (!existing) {
    return next(new AppError("Item not found in watch later", 404));
  }

  res.status(200).json({ success: true, message: "Item removed successfully" });
});

export const getWatchLater = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    WatchLater.find({ user: req.user._id }).populate("media").sort({ addedAt: -1 }).skip(skip).limit(limit),
    WatchLater.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page < Math.ceil(total / limit) },
  });
});

export const clearWatchLater = catchAsync(async (req, res, next) => {
  await WatchLater.deleteMany({ user: req.user._id });
  res.status(200).json({ success: true, message: "Watch later list cleared successfully" });
});
