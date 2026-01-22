
import express from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { getMyTransactions } from "./ledger.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getMyTransactions);

export default router;
