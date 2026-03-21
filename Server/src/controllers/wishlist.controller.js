import Wishlist from "../models/wishlist.model.js";
import Media from "../models/media.model.js";

// GET /api/wishlist
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

// POST /api/wishlist (Toggle)
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      tmdbId,
      title,
      poster_path,
      backdrop_path,
      media_type,
      overview,
      release_date,
      vote_average,
      genres,
    } = req.body;

    if (!tmdbId || !media_type) {
      return res.status(400).json({
        success: false,
        message: "tmdbId and media_type are required",
      });
    }

    const numericId = Number(tmdbId);
    const mediaType = media_type === "tv" ? "tv" : "movie";

    // Find or create media document
    let media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      media = new Media({
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
      await media.save();
    }

    // Toggle behavior
    const existing = await Wishlist.findOne({ user: userId, media: media._id });
    const io = req.app.get("io");

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      
      if (io) {
        io.to(userId.toString()).emit("wishlistUpdate", { action: "remove", tmdbId: numericId });
      }

      return res.status(200).json({ success: true, message: "Removed from wishlist", action: "removed" });
    }

    const item = await Wishlist.create({
      user: userId,
      media: media._id,
    });

    const populated = await Wishlist.findById(item._id).populate("media");

    if (io) {
      io.to(userId.toString()).emit("wishlistUpdate", { action: "add", data: populated });
    }

    res.status(201).json({ success: true, data: populated, action: "added" });
  } catch (error) {
    console.error("Wishlist add error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/:tmdbId
export const removeFromWishlist = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const numericId = Number(tmdbId);

    if (!tmdbId || Number.isNaN(numericId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tmdbId" });
    }

    const type = req.query.type || "movie";
    const mediaType = type === "tv" ? "tv" : "movie";

    const media = await Media.findOne({ tmdbId: numericId, mediaType });
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    const item = await Wishlist.findOneAndDelete({
      user: req.user._id,
      media: media._id,
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in wishlist" });
    }

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("wishlistUpdate", { action: "remove", tmdbId: numericId });
    }

    res.status(200).json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/clear
export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ user: req.user._id });

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("wishlistUpdate", { action: "clear" });
    }

    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/wishlist/check/:tmdbId
export const checkWishlist = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const numericId = Number(tmdbId);
    
    const mediaList = await Media.find({ tmdbId: numericId });
    const mediaIds = mediaList.map(m => m._id);

    const item = await Wishlist.findOne({
      user: req.user._id,
      media: { $in: mediaIds },
    });
    res.status(200).json({ success: true, isInWishlist: !!item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
