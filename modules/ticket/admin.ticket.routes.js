// modules/ticket/admin.ticket.routes.js
import express from "express";
import {
  adminGetAllTickets,
  adminReplyTicket
} from "./controllers/admin.ticket.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { authorizeRoles } from "../auth/auth.middleware.js";
const adminOnly = authorizeRoles("ADMIN");
const router = express.Router();

router.get("/tickets", authenticate, adminOnly, adminGetAllTickets);
router.post("/tickets/:id/reply", authenticate, adminOnly, adminReplyTicket);
export default router;