import express from "express";
import { getMarketHistory } from "./market.controller.js";

const router = express.Router();

// Public route (no auth needed for charts usually unless specified)
router.get("/history/:symbol/:interval", getMarketHistory);

export default router;
