import express from "express";
import {
  login,
  register,
  getMe,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/authMiddleware.js";
import { forgotPasswordLimiter } from "../middlewares/forgotPasswordLimiter.js";
export const authRouter = express.Router();
// Auth routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
// Protected route to get current user info
authRouter.get("/me", protect, getMe);
// Password recovery
authRouter.patch("/update-my-password", protect, updatePassword);

authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
authRouter.post("/reset-password", resetPassword);

authRouter.get("/verify-reset-token", verifyResetToken);
