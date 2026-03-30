import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // max 3 requests per IP per 15 min
  message: { success: false, message: "Too many requests, try again later." },
});
