/**
 * Rate limiting middleware for API protection
 * Prevents abuse by limiting request frequency per IP/user
 */
import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Rate limiter for authentication endpoints (login, register, password reset)
 * More restrictive to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000, // Dev: 1 min, Prod: 15 min
  max: isDev ? 1000 : 50, // Dev: unlimited, Prod: 50 requests per window
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Skip rate limiting in development
});

/**
 * General API rate limiter for most endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter for search endpoints
 * Stricter limits due to expensive database operations
 */
export const searchLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 60 * 1000, // 1 minute window
  max: isDev ? 1000 : 60, // Dev: unlimited, Prod: 60 requests per minute
  message: { success: false, message: "Too many search requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter for recommendation endpoints
 * ML model inference is resource-intensive
 */
export const recommendationLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 60 * 1000,
  max: isDev ? 1000 : 60,
  message: { success: false, message: "Too many recommendation requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});
