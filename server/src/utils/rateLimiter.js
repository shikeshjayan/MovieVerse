import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 1000 : 50,
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const apiLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const searchLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 60 * 1000,
  max: isDev ? 1000 : 60,
  message: { success: false, message: "Too many search requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const recommendationLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 60 * 1000,
  max: isDev ? 1000 : 60,
  message: { success: false, message: "Too many recommendation requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});
