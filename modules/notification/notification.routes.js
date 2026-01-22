import express from "express";
import { authenticate, authorizeRoles } from "../auth/auth.middleware.js";
import { getUserNotifications, markAsRead, markAllAsRead, createBroadcast, getRecentActivity } from "./notification.controller.js";

const router = express.Router();

// User
router.get("/", authenticate, getUserNotifications);
router.put("/read-all", authenticate, markAllAsRead);
router.put("/:id/read", authenticate, markAsRead);

// Admin
router.post("/broadcast", authenticate, authorizeRoles("ADMIN"), createBroadcast);
router.get("/recent-activity", authenticate, authorizeRoles("ADMIN"), getRecentActivity);

export default router;
