/**
 * MovieVerse API Server
 * Express server with Socket.IO for real-time features
 * Integrates TMDB API, ML recommendation engine, and user management
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath =
  process.env.NODE_ENV === "production" ? "../../.env" : "../../.env";

dotenv.config({ path: path.resolve(__dirname, envPath) });

import "./jobs/trainJob.js";
import "./jobs/notificationReminderJob.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import AppError from "./utils/AppError.js";
import connectDB from "./config/db.config.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { reviewRouter } from "./routes/review.routes.js";
import { WatchlaterRouter } from "./routes/watchLater.routes.js";
import { recommendationRouter } from "./routes/recommendation.routes.js";
import { wishlistRouter } from "./routes/wishlist.routes.js";
import { historyRouter } from "./routes/history.routes.js";
import { movieRouter } from "./routes/movie.routes.js";
import { feedbackRouter } from "./routes/feedback.routes.js";
import { showRouter } from "./routes/show.routes.js";
import searchRouter from "./routes/search.routes.js";
import smartSearchRouter from "./routes/smartSearch.routes.js";
import trendingRouter from "./routes/trending.routes.js";
import homeRouter from "./routes/home.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { mediaAdminRouter } from "./routes/mediaAdmin.routes.js";
import { adminReviewRouter } from "./routes/adminReview.routes.js";
import { adminMovieRouter } from "./routes/adminMovie.routes.js";
import { supportRouter } from "./routes/support.routes.js";
import {
  authLimiter,
  apiLimiter,
  searchLimiter,
  recommendationLimiter,
} from "./utils/rateLimiter.js";
import { initializeSocket } from "./services/socketService.js";

const app = express();
const httpServer = createServer(app);
const io = initializeSocket(httpServer);
global.io = io;

const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://movieverse-ai.vercel.app",
  "https://movieverse-git-main-shikesh-jayans-projects.vercel.app/"
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      const isVercelPreview =
        /^https:\/\/movieverse-frontend-.*-shikesh-jayans-projects\.vercel\.app$/.test(
          cleanOrigin,
        );

      if (allowedOrigins.includes(cleanOrigin) || isVercelPreview) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", apiLimiter, userRouter);
app.use("/api/reviews", apiLimiter, reviewRouter);
app.use("/api/wishlist", apiLimiter, wishlistRouter);
app.use("/api/watchlater", apiLimiter, WatchlaterRouter);
app.use("/api/history", apiLimiter, historyRouter);

app.use("/api/recommendations", recommendationLimiter, recommendationRouter);
app.use("/api/feedback", apiLimiter, feedbackRouter);

app.use("/api/movies", apiLimiter, movieRouter);
app.use("/api/tv", apiLimiter, showRouter);
app.use("/api/search", searchLimiter, searchRouter);
app.use("/api/smart-search", searchLimiter, smartSearchRouter);
app.use("/api/trending", apiLimiter, trendingRouter);
app.use("/api/home", apiLimiter, homeRouter);
app.use("/api/admin", apiLimiter, adminRouter);
app.use("/api/admin/movies", apiLimiter, adminMovieRouter);
app.use("/api/media-admin", apiLimiter, mediaAdminRouter);
app.use("/api/admin-reviews", apiLimiter, adminReviewRouter);
app.use("/api/support", apiLimiter, supportRouter);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const value = err.errmsg
      ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
      : "Duplicate field";
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    error = new AppError(message, 400);
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
