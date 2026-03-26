import express from "express";
import { smartSearch } from "../controllers/smartSearch.controller.js";
const smartRouter = express.Router();
smartRouter.post("/ai", smartSearch);

export default smartRouter;
