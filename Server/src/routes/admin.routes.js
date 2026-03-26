import express from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

export const adminRouter = express.Router();

adminRouter.get("/stats", protect, admin, getAdminStats);
