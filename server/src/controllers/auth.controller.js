import crypto from "crypto";
import { sendResetEmail } from "../utils/sendEmail.js";
import { generateToken, generateUserResponse } from "../utils/jwt.utils.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// Login controller
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 15 * 60 * 1000;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return next(new AppError(`Account locked. Try again in ${remainingMinutes} minutes`, 403));
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;
    
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_DURATION;
      user.failedLoginAttempts = 0;
    }
    
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Invalid credentials", 401));
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  if (user.isBanned) {
    return res.status(403).json({
      success: false,
      message: "Your account has been banned",
      banReason: user.banReason,
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const ipAddress = req.ip || req.connection?.remoteAddress || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";

  await Notification.create({
    type: "login",
    title: "User Logged In",
    message: `${user.username} (${user.email}) logged in`,
    userEmail: user.email,
    userId: null,
    username: user.username,
    role: user.role,
    ipAddress,
    userAgent,
    read: false,
  });

  const token = generateToken({ userId: user._id, email: user.email });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res
    .cookie("token", token, cookieOptions)
    .status(200)
    .json({
      success: true,
      token,
      user: generateUserResponse(user),
    });
});

// Register controller
export const register = catchAsync(async (req, res, next) => {
  const { email, password, username, adminKey } = req.body;

  const role = adminKey === process.env.ADMIN_SECRET_KEY ? "admin" : "user";

  if (!email || !password || !username) {
    return next(new AppError("All fields (username, email, password, adminKey) are required", 400));
  }

  const user = await User.create({
    username,
    email,
    password,
    role,
  });

  // Notify admin about new user registration
  const ipAddress = req.ip || req.connection?.remoteAddress || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";

  await Notification.create({
    type: "register",
    title: "New User Registered",
    message: `New user: ${user.username} (${user.email}) registered`,
    userEmail: user.email,
    userId: null,
    username: user.username,
    role: user.role,
    ipAddress,
    userAgent,
    read: false,
  });

  const token = generateToken({ userId: user._id, email: user.email });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user: generateUserResponse(user),
  });
});

// Get current user profile (protected route)
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user: generateUserResponse(user),
  });
});

// Logout controller
export const logout = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// Password update controller
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Both current and new passwords are required", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError("Current password is incorrect", 401));
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Password updated successfully" });
});
// POST /api/auth/forgot-password
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: true,
      message: "If that email exists, a reset link was sent.",
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendResetEmail(email, resetToken);
  } catch (emailErr) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Email send error:", emailErr);
    return next(new AppError("Failed to send reset email. Please try again.", 500));
  }

  res.json({
    success: true,
    message: "If that email exists, a reset link was sent.",
  });
});

// POST /api/auth/reset-password
export const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new AppError("Token and new password are required.", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired.", 400));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: "Password reset successfully." });
});

// GET /api/auth/verify-reset-token?token=xxx
export const verifyResetToken = catchAsync(async (req, res, next) => {
  const { token } = req.query;
  if (!token) return next(new AppError("Token is required.", 400));

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Invalid or expired token", 400));
  res.json({ success: true });
});