import express from "express";
import {
  getAllWithdrawals,
  rejectWithdrawal,
  approveWithdrawal,
  confirmWithdrawal,
  createManualWithdrawal
} from "./controllers/admin.withdrawal.controller.js";

import { authenticate } from "../auth/auth.middleware.js";
import { authorizeRoles } from "../auth/auth.middleware.js";
import upload from "../upload/upload.middleware.js";

const router = express.Router();

/**
 * Admin – list pending withdrawals
 */
router.get(
  "/withdrawals",
  authenticate,
  authorizeRoles("ADMIN"),
  getAllWithdrawals
);

/**
 * Admin – reject withdrawal
 */
router.post(
  "/withdrawals/:id/reject",
  authenticate,
  authorizeRoles("ADMIN"),
  rejectWithdrawal
);

/**
 * Admin – approve withdrawal (move to ADMIN_PROCESSING)
 */
router.post(
  "/withdrawals/:id/approve",
  authenticate,
  authorizeRoles("ADMIN"),
  approveWithdrawal
);

/**
 * Admin – confirm blockchain transaction
 */
router.post(
  "/withdrawals/:id/confirm",
  authenticate,
  authorizeRoles("ADMIN"),
  upload.single('proof'),
  confirmWithdrawal
);

/**
 * Admin – create manual withdrawal for user
 */
router.post(
  "/manual",
  authenticate,
  authorizeRoles("ADMIN"),
  createManualWithdrawal
);

export default router;
