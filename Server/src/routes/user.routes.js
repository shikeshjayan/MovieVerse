import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { admin, protect } from "../middlewares/authMiddleware.js";
// User routes
export const userRouter = express.Router();
// Admin-only routes
userRouter.get("/", protect, admin, getAllUsers);
userRouter.put("/:id", protect, admin, updateUser);
userRouter.patch("/update-profile", protect, updateProfile);
userRouter.delete("/:id", protect, admin, deleteUser);
