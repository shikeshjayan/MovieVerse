import History from "../models/history.model.js";
import Media from "../models/media.model.js";
import { findOrCreateMedia, emitSocketEvent, getMediaType, parseNumericId } from "../utils/mediaListUtils.js";

export const getHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user._id })
      .populate("media")
      .sort({ watchedAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToHistory = async (req, res) => {
  try {
    const { movieId, media_type, ...mediaData } = req.body;

    if (!movieId || !media_type) {
      return res.status(400).json({ success: false, message: "movieId and media_type are required" });
    }

    const mediaType = getMediaType(media_type);
    const media = await findOrCreateMedia({ tmdbId: movieId, ...mediaData }, mediaType);

    if (!media) {
      return res.status(500).json({ success: false, message: "Failed to find or create media record" });
    }

    const historyItem = await History.findOneAndUpdate(
      { user: req.user._id, media: media._id },
      { $set: { watchedAt: new Date() } },
      { new: true, upsert: true }
    );

    const populated = await History.findById(historyItem._id).populate("media");
    emitSocketEvent(req, "historyUpdate", { action: "add", data: populated });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ success: true, message: "Already in history (index conflict handled)" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeHistoryItem = async (req, res) => {
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

    const result = await History.deleteMany({ user: req.user._id, media: media._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "History item not found" });
    }

    emitSocketEvent(req, "historyUpdate", { action: "remove", movieId: numericId });
    res.status(200).json({ success: true, message: "Removed from history" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ user: req.user._id });
    emitSocketEvent(req, "historyUpdate", { action: "clear" });
    res.status(200).json({ success: true, message: "History cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
