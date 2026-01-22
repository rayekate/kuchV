// modules/ticket/ticket.routes.js
import express from "express";
import {
  createTicket,
  getUserTickets,
  replyToTicket
} from "./controllers/ticket.controller.js";

import { authenticate } from "../auth/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createTicket);
router.get("/", authenticate, getUserTickets);
router.post("/:id/reply", authenticate, replyToTicket);

export default router;
