import express from "express";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import { getMyInvestments, investFromWallet } from "./profit.controller.js";
import { runProfitEngine } from "./profit.engine.js";

const router = express.Router();

// Cron Job Endpoint (Now Admin Protected for Manual Trigger)
router.get(
    "/process-profits",
    async (req, res, next) => {
        // Allow Vercel Crons to skip auth
        const vercelCron = req.headers['x-vercel-cron'];
        if (vercelCron) {
            console.log("Vercel Cron detected, authenticating...");
            return next();
        }
        // Otherwise, require Admin
        authenticate(req, res, () => {
            authorizeRoles("ADMIN")(req, res, next);
        });
    },
    async (req, res) => {
    console.log("Processing manual profit run...");
    try {
        await runProfitEngine();
        res.json({ success: true, message: "Profit engine executed successfully" });
    } catch (error) {
        console.error("Profit engine failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post("/purchase", authenticate, investFromWallet);
router.get("/", authenticate, getMyInvestments);

export default router;