import express from "express";
import { authorizeRoles, authenticate } from "../auth/auth.middleware.js";

import {
  adminGetAllUsers,
  adminGetUserDetails,
  adminUpdateUser,
  adminDeleteUser,
  adminBulkDeleteUsers
} from "./controllers/admin.user.controller.js";
import { getActivePlansForUsers } from "./controllers/admin.plan.controller.js";

import {
  adminCreatePlan,
  adminGetPlans,
  adminUpdatePlan,
  adminDisablePlan
} from "./controllers/admin.plan.controller.js";
import { getAllInvestments, adminUpdateInvestment } from "./controllers/admin.investment.controller.js";
import { 
  adminFreezeWallet, 
  adminUnfreezeWallet,
  adminUpdateWalletBalance 
} from "./controllers/admin.wallet.controller.js";
import { getDashboardStats } from "./controllers/admin.dashboard.controller.js";

const router = express.Router();

router.get("/stats", authenticate, authorizeRoles("ADMIN"), getDashboardStats);
router.get("/investments", authenticate, authorizeRoles("ADMIN"), getAllInvestments);

/* UPDATE ROUTES */
router.put("/investments/:investmentId", authenticate, authorizeRoles("ADMIN"), adminUpdateInvestment);
router.put("/wallet/:userId/balance", authenticate, authorizeRoles("ADMIN"), adminUpdateWalletBalance);

/* USERS */
router.get("/users", authenticate, authorizeRoles("ADMIN"), adminGetAllUsers);
// Place bulk delete BEFORE generic /:userId to avoid conflict
router.delete("/users/bulk", authenticate, authorizeRoles("ADMIN"), adminBulkDeleteUsers);
router.get("/users/:userId", authenticate, authorizeRoles("ADMIN"), adminGetUserDetails);
router.put("/users/:userId", authenticate, authorizeRoles("ADMIN"), adminUpdateUser);
router.delete("/users/:userId", authenticate, authorizeRoles("ADMIN"), adminDeleteUser);

/* PLANS */
router.post("/plans", authenticate, authorizeRoles("ADMIN"), adminCreatePlan);
router.get("/plans", authenticate, authorizeRoles("ADMIN"), adminGetPlans);
router.put("/plans/:planId", authenticate, authorizeRoles("ADMIN"), adminUpdatePlan);
router.patch("/plans/:planId/disable", authenticate, authorizeRoles("ADMIN"), adminDisablePlan);

router.get("/public/plans", getActivePlansForUsers);

// router.post(
//   "/users/:userId/assign-plan",
//   authorizeRoles("ADMIN"),
//   adminAssignPlanToUser
// );

router.post(
  "/wallet/:userId/freeze",
  authenticate,
  authorizeRoles("ADMIN"),
  adminFreezeWallet
);
router.post(
  "/wallet/:userId/unfreeze",
  authenticate,
  authorizeRoles("ADMIN"),
  adminUnfreezeWallet
);

export default router;
