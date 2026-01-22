// src/modules/admin-wallet/adminWallet.routes.js
import express from "express";
import {
  createAdminWallet,
  getAllAdminWallets,
  updateAdminWallet,
  deleteAdminWallet
} from "./adminWallet.controller.js";

import {
  authenticate,
  authorizeRoles,
  requireActiveUser
} from "../auth/auth.middleware.js";

import upload from "../upload/upload.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("ADMIN"), requireActiveUser);

router.post("/", upload.single("logo"), createAdminWallet); // Add logo support
router.get("/", getAllAdminWallets);
router.put("/:id", upload.single("logo"), updateAdminWallet); // Add logo support
router.delete("/:id", deleteAdminWallet);

export default router;
