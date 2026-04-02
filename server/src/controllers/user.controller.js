/**
 * User controller
 * Handles user profile management, preferences, and avatar uploads
 */
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import Wishlist from "../models/wishlist.model.js";
import History from "../models/history.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const uploadAvatarToCloudinary = async (base64Image, userId) => {
  try {
    const timestamp = Date.now();
    const result = await uploadToCloudinary(base64Image, {
      folder: 'avatars',
      public_id: `user_${userId}_${timestamp}`,
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error(error.message || 'Failed to upload avatar to cloud storage');
  }
};

const validateAvatar = (avatar) => {
  if (!avatar) return { valid: true };
  
  if (avatar.startsWith("data:image/")) {
    const base64Data = avatar.split(",")[1];
    if (!base64Data) return { valid: false, message: "Invalid image format" };
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > MAX_AVATAR_SIZE) {
      return { valid: false, message: `Image too large. Max size: ${MAX_AVATAR_SIZE / 1024}KB` };
    }
    return { valid: true, type: "base64" };
  }
  
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    try {
      new URL(avatar);
      return { valid: true, type: "url" };
    } catch {
      return { valid: false, message: "Invalid URL format" };
    }
  }
  
  return { valid: false, message: "Avatar must be a valid URL or base64 image" };
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search, role, isBanned, sort = "createdAt", order = "desc" } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === "true";

    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort(sortObj).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const [reviewCount, wishlistCount, historyCount] = await Promise.all([
          Review.countDocuments({ user: user._id }),
          Wishlist.countDocuments({ user: user._id }),
          History.countDocuments({ user: user._id }),
        ]);

        const activityScore = reviewCount * 3 + wishlistCount + historyCount;
        let activityLevel = "Low";
        if (activityScore > 20) activityLevel = "High";
        else if (activityScore > 5) activityLevel = "Medium";

        return {
          ...user.toObject(),
          reviewCount,
          wishlistCount,
          historyCount,
          activityScore,
          activityLevel,
        };
      })
    );

  res.status(200).json({
    success: true,
    data: usersWithActivity,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

    const [reviewCount, wishlistCount, historyCount] = await Promise.all([
      Review.countDocuments({ user: user._id }),
      Wishlist.countDocuments({ user: user._id }),
      History.countDocuments({ user: user._id }),
    ]);

    const activityScore = reviewCount * 3 + wishlistCount + historyCount;
    let activityLevel = "Low";
    if (activityScore > 20) activityLevel = "High";
    else if (activityScore > 5) activityLevel = "Medium";

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      reviewCount,
      wishlistCount,
      historyCount,
      activityScore,
      activityLevel,
    },
  });
});

export const banUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
    const { isBanned, banReason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned, banReason: banReason || "" },
      { returnDocument: 'after' }
    ).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({ success: true, data: user, message: isBanned ? "User banned" : "User unbanned" });
});

export const bulkBanUsers = catchAsync(async (req, res, next) => {
  const { userIds, isBanned } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return next(new AppError("No user IDs provided", 400));
  }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isBanned }
    );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} users ${isBanned ? "banned" : "unbanned"}`,
    modifiedCount: result.modifiedCount,
  });
});

export const bulkDeleteUsers = catchAsync(async (req, res, next) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return next(new AppError("No user IDs provided", 400));
  }

    const result = await User.deleteMany({ _id: { $in: userIds } });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} users deleted`,
    deletedCount: result.deletedCount,
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const { username, email, avatar, isActive, isBanned, banReason, role, ...otherUpdates } = req.body;

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return next(new AppError("User not found", 404));
  }

  if (username && username !== existingUser.username) {
    const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
    if (usernameExists) {
      return next(new AppError("Username already taken", 400));
    }
    existingUser.username = username;
  }

  if (email && email !== existingUser.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) {
      return next(new AppError("Email already in use", 400));
    }
    existingUser.email = email;
  }

  if (avatar !== undefined) {
    const validation = validateAvatar(avatar);
    if (!validation.valid) {
      return next(new AppError(validation.message, 400));
    }
    if (validation.type === "base64") {
      existingUser.avatar = await uploadAvatarToCloudinary(avatar, userId);
    } else {
      existingUser.avatar = avatar;
    }
  }

  if (isActive !== undefined) {
    existingUser.isActive = isActive;
  }

  if (isBanned !== undefined) {
    existingUser.isBanned = isBanned;
    existingUser.isActive = isBanned ? false : existingUser.isActive;
  }

  if (banReason !== undefined) {
    existingUser.banReason = banReason;
  }

  if (role !== undefined && ["user", "admin"].includes(role)) {
    existingUser.role = role;
  }

  await existingUser.save({ validateBeforeSave: false });

  return res.status(200).json({ success: true, data: existingUser });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { username, currentPassword, newPassword, avatar } = req.body;

  if (!username && !newPassword && avatar === undefined) {
    return next(new AppError("Nothing to update", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (username) {
    if (username.trim().length < 3) {
      return next(new AppError("Username must be at least 3 characters", 400));
    }
    const usernameExists = await User.findOne({ username, _id: { $ne: req.user._id } });
    if (usernameExists) {
      return next(new AppError("Username already taken", 400));
    }
    user.username = username;
  }

  if (avatar !== undefined) {
    const validation = validateAvatar(avatar);
    if (!validation.valid) {
      return next(new AppError(validation.message, 400));
    }
    if (validation.type === "base64") {
      user.avatar = await uploadAvatarToCloudinary(avatar, user._id.toString());
    } else {
      user.avatar = avatar;
    }
  }

  if (newPassword) {
    if (!currentPassword) {
      return next(new AppError("Current password is required to update password", 400));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return next(new AppError("New password must be different from current password", 400));
    }

    if (newPassword.length < 8) {
      return next(new AppError("New password must be at least 8 characters", 400));
    }

    user.password = newPassword;
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

export const updatePreferences = catchAsync(async (req, res, next) => {
  const { preferredGenres } = req.body;

  if (!Array.isArray(preferredGenres)) {
    return next(new AppError("preferredGenres must be an array", 400));
  }

  const validGenres = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
    "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"
  ];

  const invalidGenres = preferredGenres.filter(g => !validGenres.includes(g));
  if (invalidGenres.length > 0) {
    return next(new AppError(`Invalid genres: ${invalidGenres.join(", ")}`, 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferredGenres },
    { returnDocument: 'after' }
  );

  res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: { preferredGenres: user.preferredGenres },
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({ success: true, message: "User deleted successfully" });
});
