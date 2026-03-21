import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
// get all users controller
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Strip sensitive fields — never allow direct update
    const { password, ...safeUpdates } = req.body;

    const user = await User.findByIdAndUpdate(userId, safeUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update user controller (admin only)
export const updateProfile = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username && !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update username if provided
    if (username) {
      if (username.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters",
        });
      }
      user.username = username;
    }

// Update password if provided
     if (newPassword) {
       if (!currentPassword) {
         return res.status(400).json({
           success: false,
           message: "Current password is required to update password",
         });
       }

       const isMatch = await user.comparePassword(currentPassword);
       if (!isMatch) {
         return res.status(401).json({
           success: false,
           message: "Current password is incorrect",
         });
       }

       if (newPassword.length < 6) {
         return res.status(400).json({
           success: false,
           message: "New password must be at least 6 characters",
         });
       }

       user.password = await bcrypt.hash(newPassword, 12); // hash before save
     }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// delete user controller (admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
