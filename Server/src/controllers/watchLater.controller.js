import WatchLater from "../models/watchLater.model.js";
import Media from "../models/media.model.js";
import { findOrCreateMedia, updateMediaStats, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";

export const addToWatchLater = async (req, res) => {
  try {
    const { movieId, media_type, ...mediaData } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: "Movie ID is required" });
    }

    const mediaType = getMediaType(media_type);
    const media = await findOrCreateMedia({ tmdbId: movieId, ...mediaData }, mediaType);

    if (!media || !media._id) {
      return res.status(500).json({ success: false, message: "Failed to find or create media" });
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
  } catch (error) {
    console.error("WatchLater add error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWatchLater = async (req, res) => {
  try {
    const numericId = parseNumericId(req.params.movieId);
    if (!numericId) {
      return res.status(400).json({ success: false, message: "Invalid movie ID" });
    }

    const mediaType = getMediaType(req.query.type);
    const media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    const existing = await WatchLater.findOneAndDelete({ user: req.user._id, media: media._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Item not found in watch later" });
    }

    res.status(200).json({ success: true, message: "Item removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWatchLater = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(50, parseInt(req.query.limit) || 20);
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearWatchLater = async (req, res) => {
  try {
    await WatchLater.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: "Watch later list cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
