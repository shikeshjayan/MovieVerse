import History from "../models/history.model.js";
import Media from "../models/media.model.js";
import Notification from "../models/notification.model.js";
import { findOrCreateMedia, emitSocketEvent, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const getHistory = catchAsync(async (req, res, next) => {
  const history = await History.find({ user: req.user._id })
    .populate("media")
    .sort({ watchedAt: -1 });
  res.status(200).json({ success: true, data: history });
});

export const addToHistory = catchAsync(async (req, res, next) => {
  const { movieId, media_type, ...mediaData } = req.body;

  if (!movieId || !media_type) {
    return next(new AppError("movieId and media_type are required", 400));
  }

  const mediaType = getMediaType(media_type);
  const media = await findOrCreateMedia({ tmdbId: movieId, ...mediaData }, mediaType);

  if (!media) {
    return next(new AppError("Failed to find or create media record", 500));
  }

  const historyItem = await History.findOneAndUpdate(
    { user: req.user._id, media: media._id },
    { $set: { watchedAt: new Date() } },
    { returnDocument: 'after', upsert: true }
  );

  const populated = await History.findById(historyItem._id).populate("media");
  emitSocketEvent(req, "historyUpdate", { action: "add", data: populated });

  const historyCount = await History.countDocuments({ user: req.user._id });
  Notification.create({
    type: "media_update",
    title: "Added to History",
    message: `${media.title} added to your watch history!`,
    userId: req.user._id,
    tmdbId: media.tmdbId,
    mediaType: media.mediaType,
    mediaTitle: media.title,
    mediaPoster: media.posterPath,
  }).catch(err => console.error("Failed to create notification:", err));

  res.status(201).json({ success: true, data: populated });
});

export const removeHistoryItem = catchAsync(async (req, res, next) => {
  const numericId = parseNumericId(req.params.movieId);
  if (!numericId) {
    return next(new AppError("Invalid movie ID", 400));
  }

  const mediaType = getMediaType(req.query.type);
  const media = await Media.findOne({ tmdbId: numericId, mediaType });

  if (!media) {
    return next(new AppError("Media not found", 404));
  }

  const result = await History.deleteMany({ user: req.user._id, media: media._id });

  if (result.deletedCount === 0) {
    return next(new AppError("History item not found", 404));
  }

  emitSocketEvent(req, "historyUpdate", { action: "remove", movieId: numericId });
  res.status(200).json({ success: true, message: "Removed from history" });
});

export const clearHistory = catchAsync(async (req, res, next) => {
  await History.deleteMany({ user: req.user._id });
  emitSocketEvent(req, "historyUpdate", { action: "clear" });
  res.status(200).json({ success: true, message: "History cleared" });
});
