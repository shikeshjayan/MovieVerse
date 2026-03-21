import express from "express";
import {
  login,
  register,
  getMe,
  logout,
  updatePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
export const authRouter = express.Router();
// Auth routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
// Protected route to get current user info
authRouter.get("/me", protect, getMe);
// Password recovery
authRouter.patch("/update-my-password", protect, updatePassword);
