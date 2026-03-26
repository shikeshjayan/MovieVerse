import Review from "../models/review.model.js";
import User from "../models/user.model.js";

export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "createdAt", order = "desc", search, userId, movieId, isReported, isHidden } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.comment = { $regex: search, $options: "i" };
    }
    if (userId) query.user = userId;
    if (movieId) query.movieId = parseInt(movieId);
    if (isReported === "true") query.reportCount = { $gt: 0 };
    if (isHidden === "true") query.isHidden = true;
    else if (isHidden === "false") query.isHidden = false;

    const sortObj = {};
    if (sort === "reportCount") {
      sortObj.reportCount = order === "desc" ? -1 : 1;
    } else {
      sortObj[sort] = order === "desc" ? -1 : 1;
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "username email avatar")
        .populate("likedBy", "username"),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReviewStats = async (req, res) => {
  try {
    const [totalReviews, hiddenReviews, reportedReviews] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ isHidden: true }),
      Review.countDocuments({ reportCount: { $gt: 0 } }),
    ]);

    const mostCommented = await Review.aggregate([
      { $group: { _id: { movieId: "$movieId", media_type: "$media_type" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const mostActiveUsers = await Review.aggregate([
      { $group: { _id: "$user", reviewCount: { $sum: 1 } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$user._id",
          username: "$user.username",
          email: "$user.email",
          reviewCount: 1,
        },
      },
    ]);

    const commentsLast7Days = await Review.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      data: {
        totalReviews,
        hiddenReviews,
        reportedReviews,
        visibleReviews: totalReviews - hiddenReviews,
        mostCommented,
        mostActiveUsers,
        commentsLast7Days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHidden, isInappropriate } = req.body;

    const update = {};
    if (typeof isHidden === "boolean") update.isHidden = isHidden;
    if (typeof isInappropriate === "boolean") update.isInappropriate = isInappropriate;

    const review = await Review.findByIdAndUpdate(reviewId, update, { new: true })
      .populate("user", "username email avatar");

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    await User.findByIdAndUpdate(review.user, {
      $pull: { reviews: review._id },
    });

    res.json({ success: false, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkDeleteReviews = async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ success: false, message: "No review IDs provided" });
    }

    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} reviews deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkHideReviews = async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ success: false, message: "No review IDs provided" });
    }

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { $set: { isHidden: true } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} reviews hidden`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearReport = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { reportCount: 0, reports: [] } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ reportCount: { $gt: 0 } })
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "username email avatar"),
      Review.countDocuments({ reportCount: { $gt: 0 } }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
