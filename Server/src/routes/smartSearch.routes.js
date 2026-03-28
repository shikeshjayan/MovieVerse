import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { smartSearch } from "../controllers/smartSearch.controller.js";
const smartRouter = express.Router();
smartRouter.post("/ai", protect, smartSearch);

export default smartRouter;
