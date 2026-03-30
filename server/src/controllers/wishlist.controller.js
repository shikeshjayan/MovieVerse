import Wishlist from "../models/wishlist.model.js";
import Media from "../models/media.model.js";
import { findOrCreateMedia, updateMediaStats, emitSocketEvent, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.find({ user: req.user._id })
    .populate("media")
    .sort({ addedAt: -1 });
  res.status(200).json({ success: true, data: wishlist });
});

export const addToWishlist = catchAsync(async (req, res, next) => {
  const { tmdbId, media_type, ...mediaData } = req.body;

  if (!tmdbId || !media_type) {
    return next(new AppError("tmdbId and media_type are required", 400));
  }

  const mediaType = getMediaType(media_type);
  const media = await findOrCreateMedia({ tmdbId, ...mediaData }, mediaType);

  const existing = await Wishlist.findOne({ user: req.user._id, media: media._id });

  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    await updateMediaStats(tmdbId, mediaType, "wishlistCount", -1);
    emitSocketEvent(req, "wishlistUpdate", { action: "remove", tmdbId });
    return res.status(200).json({ success: true, message: "Removed from wishlist", action: "removed" });
  }

  const item = await Wishlist.create({ user: req.user._id, media: media._id });
  await updateMediaStats(tmdbId, mediaType, "wishlistCount", 1);
  const populated = await Wishlist.findById(item._id).populate("media");

  emitSocketEvent(req, "wishlistUpdate", { action: "add", data: populated });
  res.status(201).json({ success: true, data: populated, action: "added" });
});

export const removeFromWishlist = catchAsync(async (req, res, next) => {
  const numericId = parseNumericId(req.params.tmdbId);
  if (!numericId) {
    return next(new AppError("Invalid tmdbId", 400));
  }

  const mediaType = getMediaType(req.query.type);
  const media = await Media.findOne({ tmdbId: numericId, mediaType });
  if (!media) {
    return next(new AppError("Media not found", 404));
  }

  const item = await Wishlist.findOneAndDelete({ user: req.user._id, media: media._id });
  if (!item) {
    return next(new AppError("Item not found in wishlist", 404));
  }

  emitSocketEvent(req, "wishlistUpdate", { action: "remove", tmdbId: numericId });
  res.status(200).json({ success: true, message: "Removed from wishlist" });
});

export const clearWishlist = catchAsync(async (req, res, next) => {
  await Wishlist.deleteMany({ user: req.user._id });
  emitSocketEvent(req, "wishlistUpdate", { action: "clear" });
  res.status(200).json({ success: true, message: "Wishlist cleared" });
});

export const checkWishlist = catchAsync(async (req, res, next) => {
  const numericId = parseNumericId(req.params.tmdbId);
  if (!numericId) {
    return next(new AppError("Invalid tmdbId", 400));
  }

  const mediaList = await Media.find({ tmdbId: numericId });
  const mediaIds = mediaList.map(m => m._id);

  const item = await Wishlist.findOne({ user: req.user._id, media: { $in: mediaIds } });
  res.status(200).json({ success: true, isInWishlist: !!item });
});
