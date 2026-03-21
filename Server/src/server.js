import "./jobs/trainJob.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
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
import trendingRouter from "./routes/trending.routes.js";
import homeRouter from "./routes/home.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../.env.production") });
} else {
  dotenv.config();
}

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  "https://movieverse-frontend.vercel.app", // your production domain
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (Postman, server-to-server)
      if (!origin) return cb(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      // Allow any Vercel preview URL for your project
      const isVercelPreview =
        /^https:\/\/movieverse-frontend-.*-shikesh-jayans-projects\.vercel\.app$/.test(
          cleanOrigin,
        );

      if (allowedOrigins.includes(cleanOrigin) || isVercelPreview) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options(
  "*",
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      const isVercelPreview =
        /^https:\/\/movieverse-frontend-.*-shikesh-jayans-projects\.vercel\.app$/.test(
          cleanOrigin,
        );
      if (allowedOrigins.includes(cleanOrigin) || isVercelPreview)
        cb(null, true);
      else cb(new Error("CORS not allowed"));
    },
    credentials: true,
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/watchlater", WatchlaterRouter);
app.use("/api/history", historyRouter);

app.use("/api/recommendations", recommendationRouter);
app.use("/api/feedback", feedbackRouter);

app.use("/api/movies", movieRouter);
app.use("/api/tv", showRouter);
app.use("/api/search", searchRouter);
app.use("/api/trending", trendingRouter);
app.use("/api/home", homeRouter);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
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
