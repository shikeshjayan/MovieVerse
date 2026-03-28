import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  banUser,
  bulkBanUsers,
  bulkDeleteUsers,
  updatePreferences,
} from "../controllers/user.controller.js";
import { admin, protect } from "../middlewares/authMiddleware.js";

export const userRouter = express.Router();

userRouter.get("/", protect, admin, getAllUsers);
userRouter.get("/:id", protect, admin, getUserById);
userRouter.put("/:id", protect, admin, updateUser);
userRouter.patch("/:id/ban", protect, admin, banUser);
userRouter.patch("/update-profile", protect, updateProfile);
userRouter.patch("/preferences", protect, updatePreferences);
userRouter.delete("/:id", protect, admin, deleteUser);
userRouter.post("/bulk-ban", protect, admin, bulkBanUsers);
userRouter.post("/bulk-delete", protect, admin, bulkDeleteUsers);
