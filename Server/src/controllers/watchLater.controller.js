import WatchLater from "../models/watchLater.model.js";
import Media from "../models/media.model.js";

export const addToWatchLater = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      movieId,
      media_type,
      title,
      poster_path,
      backdrop_path,
      overview,
      release_date,
      vote_average,
      genres,
    } = req.body;

    const mediaType = ["movie", "tv"].includes(media_type)
      ? media_type
      : "movie";

    if (!movieId) {
      return res
        .status(400)
        .json({ success: false, message: "Movie ID is required" });
    }

    const numericId = Number(movieId);

    // Find or create media document
    let media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      try {
        media = await Media.create({
          tmdbId: numericId,
          mediaType,
          title,
          posterPath: poster_path,
          backdropPath: backdrop_path,
          overview,
          releaseDate: release_date,
          voteAverage: vote_average,
          genres,
        });
      } catch (createErr) {
        if (createErr.code === 11000) {
          media = await Media.findOne({ tmdbId: numericId, mediaType });
        } else {
          throw createErr;
        }
      }
    }

    if (!media || !media._id) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to find or create media" });
    }

    // Toggle behavior: Check if already in watch later
    const existing = await WatchLater.findOne({
      user: userId,
      media: media._id,
    });

    if (existing) {
      // Remove if exists (toggle)
      await WatchLater.findByIdAndDelete(existing._id);

      return res.status(200).json({
        success: true,
        message: "Removed from watch later",
        action: "removed",
      });
    }

    // Add to watch later
    const watchLaterItem = new WatchLater({
      user: userId,
      media: media._id,
    });

    await watchLaterItem.save();
    const populated = await WatchLater.findById(watchLaterItem._id).populate(
      "media",
    );

    res.status(200).json({
      success: true,
      message: "Added to watch later",
      action: "added",
      data: populated,
    });
  } catch (error) {
    console.error("WatchLater add error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWatchLater = async (req, res) => {
  try {
    const userId = req.user._id;
    const movieId = req.params.movieId;

    if (!movieId || Number.isNaN(Number(movieId))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid movie ID" });
    }

    const movieIdNumeric = Number(movieId);

    const type = req.query.type || "movie";
    const mediaType = type === "tv" ? "tv" : "movie";

    // Find the media document
    const media = await Media.findOne({ tmdbId: movieIdNumeric, mediaType });
    if (!media) {
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });
    }

    // Remove from watch later
    const existing = await WatchLater.findOneAndDelete({
      user: userId,
      media: media._id,
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in watch later" });
    }

    res
      .status(200)
      .json({ success: true, message: "Item removed successfully" });
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
      WatchLater.find({ user: req.user._id })
        .populate("media")
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(limit),
      WatchLater.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearWatchLater = async (req, res) => {
  try {
    await WatchLater.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: "Watch later list cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
