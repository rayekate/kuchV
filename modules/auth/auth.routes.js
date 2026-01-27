import express from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { loginValidation, registerValidation, } from "./auth.validation.js";



const router = express.Router();

console.log("DEBUG: Registering Auth Routes...");
router.post("/signup", registerValidation, authController.register);
router.post("/gulugulugulu/randibazz", registerValidation, authController.registerAdmin);
router.post("/verify-otp", authController.verifyEmailOtp);
router.post("/login", loginValidation, authController.login);
router.post("/refresh", authController.refreshToken);
router.get("/profile", authenticate, authController.getProfile);

router.post("/logout", authController.logout);

router.post("/forgot-password", (req, res, next) => { console.log("DEBUG: HIT /forgot-password"); next(); }, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
