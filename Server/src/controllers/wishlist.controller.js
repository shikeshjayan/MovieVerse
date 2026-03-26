import Wishlist from "../models/wishlist.model.js";
import Media from "../models/media.model.js";
import { findOrCreateMedia, updateMediaStats, emitSocketEvent, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate("media")
      .sort({ addedAt: -1 });
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { tmdbId, media_type, ...mediaData } = req.body;

    if (!tmdbId || !media_type) {
      return res.status(400).json({
        success: false,
        message: "tmdbId and media_type are required",
      });
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
  } catch (error) {
    console.error("Wishlist add error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const numericId = parseNumericId(req.params.tmdbId);
    if (!numericId) {
      return res.status(400).json({ success: false, message: "Invalid tmdbId" });
    }

    const mediaType = getMediaType(req.query.type);
    const media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    const item = await Wishlist.findOneAndDelete({ user: req.user._id, media: media._id });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in wishlist" });
    }

    emitSocketEvent(req, "wishlistUpdate", { action: "remove", tmdbId: numericId });
    res.status(200).json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ user: req.user._id });
    emitSocketEvent(req, "wishlistUpdate", { action: "clear" });
    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const numericId = parseNumericId(req.params.tmdbId);
    if (!numericId) {
      return res.status(400).json({ success: false, message: "Invalid tmdbId" });
    }

    const mediaList = await Media.find({ tmdbId: numericId });
    const mediaIds = mediaList.map(m => m._id);

    const item = await Wishlist.findOne({ user: req.user._id, media: { $in: mediaIds } });
    res.status(200).json({ success: true, isInWishlist: !!item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
