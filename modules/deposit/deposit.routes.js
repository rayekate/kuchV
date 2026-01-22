// src/modules/deposit/deposit.routes.js
import express from "express";
import {getDepositOptions, createDeposit, getMyDeposits, getAllDeposits, approveDeposit, rejectDeposit} from "./deposit.controller.js";
import upload from "../upload/upload.middleware.js";
import { authorizeRoles } from "../auth/auth.middleware.js";
import { authenticate, requireActiveUser} from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/options", authenticate, requireActiveUser, getDepositOptions);
router.post("/", authenticate, requireActiveUser, upload.single("screenshot"), createDeposit);
router.get("/me", authenticate, requireActiveUser, getMyDeposits);
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllDeposits);

// src/modules/deposit/deposit.routes.js
router.post( "/:depositId/approve", authenticate, authorizeRoles("ADMIN"), requireActiveUser, approveDeposit);

router.post( "/:depositId/reject", authenticate, authorizeRoles("ADMIN"), requireActiveUser, rejectDeposit);


export default router;
