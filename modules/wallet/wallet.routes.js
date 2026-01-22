// src/modules/wallet/wallet.routes.js
import express from "express";
import {
  getMyWallet,
  getUserWalletByAdmin
} from "./wallet.controller.js";

import { authenticate,
  authorizeRoles,
  requireActiveUser
} from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * USER: view own wallet
 */
router.get("/me", authenticate, requireActiveUser, getMyWallet);

/**
 * ADMIN: view any wallet
 */
router.get("/:userId", authenticate, authorizeRoles("ADMIN"), requireActiveUser, getUserWalletByAdmin);

export default router;
