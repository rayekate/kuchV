import express from "express";
import { createWithdrawal, getMyWithdrawals, requestWithdrawalOtp } from "./controllers/withdrawal.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * User creates withdrawal request
 * Status → FUNDS_LOCKED
 */
router.post(
  "/",
  authenticate,
  createWithdrawal
);

router.post(
  "/request-otp",
  authenticate,
  requestWithdrawalOtp
);

router.get("/me", authenticate, getMyWithdrawals);

export default router;
