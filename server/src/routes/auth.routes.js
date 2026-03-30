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
import { validate } from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../utils/validationSchemas.js";

export const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);

authRouter.get("/me", protect, getMe);

authRouter.patch("/update-my-password", protect, validate(updatePasswordSchema), updatePassword);

authRouter.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);

authRouter.get("/verify-reset-token", verifyResetToken);
