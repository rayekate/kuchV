import express from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { getMe, updateProfile, changePassword } from "./user.controller.js";

const router = express.Router();



router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.put("/password", authenticate, changePassword);

// Wallet Management
import { addSavedWallet, removeSavedWallet } from "./user.controller.js";
router.post("/wallets", authenticate, addSavedWallet);
router.delete("/wallets/:walletId", authenticate, removeSavedWallet);

export default router;
