import crypto from "crypto";
import { sendResetEmail } from "../utils/sendEmail.js";
import { generateToken, generateUserResponse } from "../utils/jwt.utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// Login controller
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid credentials", 401));
  }

  if (user.isBanned) {
    return res.status(403).json({
      success: false,
      message: "Your account has been banned",
      banReason: user.banReason,
    });
  }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

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

  const token = generateToken({ userId: user._id, email: user.email });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user: generateUserResponse(user),
  });
});

// Get current user profile (protected route)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: generateUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

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
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Check if input is missing
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new passwords are required",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3. Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // 4. Hash new password and update
    user.password = await bcrypt.hash(newPassword, 12);

    // 5. Save and return
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    // ✅ Generic message — prevents email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link was sent.",
      });
    }

    // ✅ createPasswordResetToken() should hash + save to DB, return raw token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendResetEmail(email, resetToken);
    } catch (emailErr) {
      // ✅ If email fails, clear the token so it's not stuck in DB
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email send error:", emailErr);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "If that email exists, a reset link was sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body; // ✅ use token from request body

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required.",
    });
  }

  try {
    // ✅ Hash the incoming token to compare with what's stored in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token) // token from req.body, NOT a new random one
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid or expired.",
      });
    }

    // ✅ Set new password — let your User model's pre-save hook hash it
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
// GET /api/auth/verify-reset-token?token=xxx
export const verifyResetToken = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false });

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });
  res.json({ success: true });
};