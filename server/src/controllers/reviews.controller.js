// controllers/review.controllers.js
import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// Add review
export const addReview = catchAsync(async (req, res, next) => {
  const { movieId, media_type, rating, comment, spoiler } = req.body;

  if (!movieId || !media_type || !rating || !comment) {
    return next(new AppError("movieId, media_type, rating and comment are required", 400));
  }

  const existing = await Review.findOne({
    movieId,
    user: req.user._id,
    media_type,
  });
  if (existing) {
    return next(new AppError("You have already reviewed this movie", 400));
  }

  const review = await Review.create({
    movieId,
    media_type,
    rating,
    comment,
    spoiler: spoiler || false,
    user: req.user._id,
  });

  const populatedReview = await Review.findById(review._id).populate("user", "username email avatar");

  await User.findByIdAndUpdate(req.user._id, {
    $push: { reviews: review._id },
  });

  res.status(201).json({ success: true, data: populatedReview });
});

// Get all reviews for a movie
export const getMovieReviews = catchAsync(async (req, res, next) => {
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
    .populate("user", "username email avatar")
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
});

// Get my reviews
export const getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate("user", "username email avatar")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    total: reviews.length,
    data: reviews,
  });
});

// Edit review
export const updateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, comment, spoiler } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to edit this review", 403));
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (spoiler !== undefined) review.spoiler = spoiler;

  await review.save();

  const populatedReview = await Review.findById(review._id).populate("user", "username email avatar");

  res.status(200).json({ success: true, data: populatedReview });
});

// Toggle spoiler
export const toggleSpoiler = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to toggle spoiler", 403));
  }

  review.spoiler = !review.spoiler;
  await review.save();

  const populatedReview = await Review.findById(review._id).populate("user", "username email avatar");

  res.status(200).json({ success: true, data: populatedReview });
});

// Like/Dislike review
export const likeDislikeReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { action } = req.body;

  if (!["like", "dislike", "unlike", "undislike"].includes(action)) {
    return next(new AppError("Invalid action. Use 'like', 'dislike', 'unlike', or 'undislike'", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  const userId = req.user._id;
  const alreadyLiked = review.likedBy.includes(userId);
  const alreadyDisliked = review.dislikedBy.includes(userId);

  if (action === "like") {
    if (alreadyLiked) {
      review.likedBy = review.likedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      review.likes = Math.max(0, review.likes - 1);
    } else {
      if (alreadyDisliked) {
        review.dislikedBy = review.dislikedBy.filter(
          (id) => id.toString() !== userId.toString()
        );
        review.dislikes = Math.max(0, review.dislikes - 1);
      }
      review.likedBy.push(userId);
      review.likes += 1;
    }
  } else if (action === "dislike") {
    if (alreadyDisliked) {
      review.dislikedBy = review.dislikedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      review.dislikes = Math.max(0, review.dislikes - 1);
    } else {
      if (alreadyLiked) {
        review.likedBy = review.likedBy.filter(
          (id) => id.toString() !== userId.toString()
        );
        review.likes = Math.max(0, review.likes - 1);
      }
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
});

// Delete review
export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not authorized to delete this review", 403));
  }

  await review.deleteOne();

  await User.findByIdAndUpdate(review.user, {
    $pull: { reviews: review._id },
  });

  res.status(200).json({ success: true, message: "Review deleted successfully" });
});
