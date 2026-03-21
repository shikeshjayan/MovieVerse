import { generateToken, generateUserResponse } from "../utils/jwt.utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Register controller
export const register = async (req, res) => {
  try {
    const { email, password, username, adminKey } = req.body;

    const role = adminKey === process.env.ADMIN_SECRET_KEY ? "admin" : "user";

    console.log("Register payload:", {
      email,
      username,
      passwordLength: password?.length,
      role,
    });

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (username, email, password, adminKey) are required",
      });
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
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message =
        field === "email"
          ? "Email is already in use"
          : field === "username"
            ? "Username is already taken"
            : `${field} already exists`;
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

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
    console.error("Get me error:", error);
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

// Password reset controller
export const updatePassword = async (req, res) => {
  console.log("req.user:", req.user);
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
    console.error("UPDATE PASSWORD ERROR:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
