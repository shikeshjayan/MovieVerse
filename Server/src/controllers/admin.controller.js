import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import History from "../models/history.model.js";
import Wishlist from "../models/wishlist.model.js";

export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalReviews,
      mostPopularMovie,
      mostActiveUser,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),

      User.countDocuments({
        role: "user",
        $or: [
          { updatedAt: { $gte: startOfToday } },
          { lastLogin: { $gte: startOfToday } },
        ],
      }),

      User.countDocuments({
        role: "user",
        $or: [
          { updatedAt: { $gte: startOfWeek } },
          { lastLogin: { $gte: startOfWeek } },
        ],
      }),

      Review.countDocuments(),

      Review.aggregate([
        {
          $group: {
            _id: { movieId: "$movieId", media_type: "$media_type" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      User.aggregate([
        { $match: { role: "user" } },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "user",
            as: "reviews",
          },
        },
        {
          $lookup: {
            from: "wishlists",
            localField: "_id",
            foreignField: "user",
            as: "wishlists",
          },
        },
        {
          $lookup: {
            from: "histories",
            localField: "_id",
            foreignField: "user",
            as: "history",
          },
        },
        {
          $project: {
            username: 1,
            email: 1,
            avatar: 1,
            reviewCount: { $size: "$reviews" },
            wishlistCount: { $size: "$wishlists" },
            historyCount: { $size: "$history" },
            activityScore: {
              $add: [
                { $multiply: [{ $size: "$reviews" }, 3] },
                { $size: "$wishlists" },
                { $size: "$history" },
              ],
            },
          },
        },
        { $sort: { activityScore: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const mostReviewed = mostPopularMovie[0] || null;
    let mostReviewedDetails = null;
    if (mostReviewed) {
      mostReviewedDetails = {
        movieId: mostReviewed._id.movieId,
        media_type: mostReviewed._id.media_type,
        count: mostReviewed.count,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsersToday,
        activeUsersWeek,
        totalReviews,
        mostPopularMovie: mostReviewedDetails,
        mostActiveUser: mostActiveUser[0] || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
