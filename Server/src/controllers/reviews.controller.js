// controllers/review.controllers.js
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

// Add review
export const addReview = async (req, res) => {
  try {
    const { movieId, media_type, rating, comment, spoiler } = req.body;

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
      spoiler: spoiler || false,
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
    const sort = req.query.sort || "latest";
    const mediaType = type === "tv" ? "tv" : "movie";

    let sortOption = {};
    if (sort === "top") {
      sortOption = { likes: -1, rating: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const query = {
      movieId: Number(movieId),
      media_type: mediaType,
    };

    const reviews = await Review.find(query)
      .populate("user", "username email")
      .sort(sortOption);

    const visibleReviews = reviews.filter(r => !r.isHidden);

    if (visibleReviews.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      total: visibleReviews.length,
      data: visibleReviews,
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

    const reviewsWithStatus = reviews.map(r => ({
      ...r.toObject(),
      isHidden: r.isHidden,
    }));

    res.status(200).json({
      success: true,
      total: reviews.length,
      data: reviewsWithStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, spoiler } = req.body;

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

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (spoiler !== undefined) review.spoiler = spoiler;

    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle spoiler
export const toggleSpoiler = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Only owner can toggle spoiler
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to toggle spoiler",
      });
    }

    review.spoiler = !review.spoiler;
    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Like/Dislike review
export const likeDislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // "like" or "dislike"

    if (!["like", "dislike", "unlike", "undislike"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'like', 'dislike', 'unlike', or 'undislike'",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = review.likedBy.includes(userId);
    const alreadyDisliked = review.dislikedBy.includes(userId);

    if (action === "like") {
      if (alreadyLiked) {
        // Unlike
        review.likedBy = review.likedBy.filter(
          (id) => id.toString() !== userId.toString()
        );
        review.likes = Math.max(0, review.likes - 1);
      } else {
        // Remove from disliked if exists
        if (alreadyDisliked) {
          review.dislikedBy = review.dislikedBy.filter(
            (id) => id.toString() !== userId.toString()
          );
          review.dislikes = Math.max(0, review.dislikes - 1);
        }
        // Add like
        review.likedBy.push(userId);
        review.likes += 1;
      }
    } else if (action === "dislike") {
      if (alreadyDisliked) {
        // Undislike
        review.dislikedBy = review.dislikedBy.filter(
          (id) => id.toString() !== userId.toString()
        );
        review.dislikes = Math.max(0, review.dislikes - 1);
      } else {
        // Remove from liked if exists
        if (alreadyLiked) {
          review.likedBy = review.likedBy.filter(
            (id) => id.toString() !== userId.toString()
          );
          review.likes = Math.max(0, review.likes - 1);
        }
        // Add dislike
        review.dislikedBy.push(userId);
        review.dislikes += 1;
      }
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        likes: review.likes,
        dislikes: review.dislikes,
        likedBy: review.likedBy,
        dislikedBy: review.dislikedBy,
      },
    });
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
