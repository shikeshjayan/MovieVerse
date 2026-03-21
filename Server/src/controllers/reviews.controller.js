// controllers/review.controllers.js
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

// Add review
export const addReview = async (req, res) => {
  try {
    const { movieId, media_type, rating, comment } = req.body;

    if (!movieId || !media_type || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "movieId, media_type, rating and comment are required",
      });
    }

    // Check if user already reviewed this movie
    const existing = await Review.findOne({
      movieId,
      user: req.user._id,
      media_type,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this movie" + media_type,
      });
    }

    const review = await Review.create({
      movieId,
      media_type,
      rating,
      comment,
      user: req.user._id,
    });

    // keep reference on user document so virtual counts and lookups stay in sync
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reviews: review._id },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reviews for a movie
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const type = req.query.type || "movie";
    const mediaType = type === "tv" ? "tv" : "movie";

    const reviews = await Review.find({
      movieId: Number(movieId),
      media_type: mediaType,
    })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      total: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my reviews
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Only owner can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this review",
      });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Only owner or admin can delete
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    await review.deleteOne();

    // remove reference from user document as well
    await User.findByIdAndUpdate(review.user, {
      $pull: { reviews: review._id },
    });

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
