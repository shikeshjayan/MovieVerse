import History from "../models/history.model.js";
import Media from "../models/media.model.js";

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
    const {
      movieId,
      title,
      poster_path,
      backdrop_path,
      media_type,
      overview,
      release_date,
      vote_average,
    } = req.body;

    if (!movieId || !media_type) {
      return res.status(400).json({
        success: false,
        message: "movieId and media_type are required",
      });
    }

    const numericId = Number(movieId);
    const mediaType = media_type === "tv" ? "tv" : "movie";

    // Find or create the Media document
    let media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      try {
        media = await Media.create({
          tmdbId: numericId,
          mediaType,
          title,
          overview,
          posterPath: poster_path,
          backdropPath: backdrop_path,
          releaseDate: release_date || null,
          voteAverage: vote_average,
        });
      } catch (createErr) {
        if (createErr.code === 11000) {
          media = await Media.findOne({ tmdbId: numericId, mediaType });
        } else {
          throw createErr;
        }
      }
    }

    if (!media) {
      return res.status(500).json({
        success: false,
        message: "Failed to find or create media record",
      });
    }

    // Upsert the history entry: update watchedAt if exists, create if not
    const historyItem = await History.findOneAndUpdate(
      { user: req.user._id, media: media._id },
      { $set: { watchedAt: new Date() } },
      { new: true, upsert: true },
    );

    const populated = await History.findById(historyItem._id).populate("media");

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("historyUpdate", {
        action: "add",
        data: populated,
      });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Already in history (index conflict handled)",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeHistoryItem = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { type } = req.query;
    const numericId = Number(movieId);

    const media = await Media.findOne({
      tmdbId: numericId,
      mediaType: type || "movie",
    });

    if (!media) {
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });
    }

    const result = await History.deleteMany({
      user: req.user._id,
      media: media._id,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "History item not found" });
    }

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("historyUpdate", {
        action: "remove",
        movieId: numericId,
      });
    }

    res.status(200).json({ success: true, message: "Removed from history" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ user: req.user._id });

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("historyUpdate", { action: "clear" });
    }

    res.status(200).json({ success: true, message: "History cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
