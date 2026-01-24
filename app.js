import "./utils/loadEnv.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import authRoutes from "./modules/auth/auth.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import adminWalletRoutes from "./modules/admin-wallet/adminWallet.routes.js";
import depositRoutes from "./modules/deposit/deposit.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { registerProfitCron } from "./modules/profit/profit.cron.js";
import withdrawalRoutes from "./modules/withdrawal/withdrawal.routes.js";
import adminWithdrawalRoutes from "./modules/withdrawal/admin.withdrawal.routes.js";
import adminTicketRoutes from "./modules/ticket/admin.ticket.routes.js";
import ticketRoutes from "./modules/ticket/ticket.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import settingRoutes from "./modules/settings/settings.routes.js";
import mailTestRoutes from "./modules/admin/mailTest.routes.js";
import { loggingMiddleware } from "./utils/logging.middleware.js";





const app = express();

console.log("Starting server... Environment:", process.env.NODE_ENV);
console.log("MONGO_URI is set:", !!process.env.MONGO_URI);
console.log("CLIENT_URL is set:", !!process.env.CLIENT_URL);

connectDB().catch(err => {
    console.error("Failed to connect to DB at startup:", err.message);
    // Do not exit, allow server to start so we can see logs
});
registerProfitCron();

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Global Logging Middleware (After body parsing so we can log request body)
app.use(loggingMiddleware);

// Cookies (refresh token support)
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Middleware: Ensure Database Connection
app.use(async (req, res, next) => {
  // Skip DB check for ping/health check
  if (req.path === "/api/ping") return next();

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Connection/Middleware Error:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

/* ===========================
   ROUTES
=========================== */
import userRoutes from "./modules/user/user.routes.js";
app.get("/api/ping", (req, res) => res.json({ message: "pong" }));
// Auth (login, register, verify, refresh)
app.use("/api/auth", authRoutes);
app.get("/api/settings/test", (req, res) => res.json({ message: "settings test work" }));
app.get("/api/settings-raw", (req, res) => res.json({ message: "settings-raw work" }));
console.log("DEBUG: Mounting /api/settings router");
app.use("/api/settings", settingRoutes);
console.log("DEBUG: /api/settings router mounted");
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Wallet (user read-only, admin via admin module)
app.use("/api/wallet", walletRoutes);

// Admin authority layer (users, plans, profit, freeze, overrides)
app.use("/api/admin", adminRoutes);
app.use("/api/admin/mail-test", mailTestRoutes);


app.use("/api/admin-ticket", adminTicketRoutes);
app.use("/api/admin-withdrawals", adminWithdrawalRoutes);
// Admin treasury wallets (coin/network addresses)
app.use("/api/admin/wallets", adminWalletRoutes);

// Deposits (user submit, admin approve/reject)
app.use("/api/deposits", depositRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/tickets", ticketRoutes);

import ledgerRoutes from "./modules/ledger/ledger.routes.js";
import profitRoutes from "./modules/profit/profit.routes.js";
import marketRoutes from "./modules/market/market.routes.js";

app.use("/api/transactions", ledgerRoutes);
app.use('/api/investments', profitRoutes);
app.use('/api/market', marketRoutes);
//    res.json({ message: "pong" });
// });

/* ===========================
   404 HANDLER
=========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* ===========================
   ERROR HANDLER (IMPORTANT)
=========================== */

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

/* ===========================
   SERVER & SOCKET.IO
=========================== */
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log("New client connected:", socket.id);
  
  // Join user room for private notifications
  socket.on("join_user", (userId) => {
      socket.join(`user:${userId}`);
  });

  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Socket.io enabled)`);
  }).on("error", (err) => {
    console.error("\n[CRITICAL] Server failed to start:", err);
  });
}
// Force Restart 3 - Wallet IDs Standardized - 2026-01-12
console.log("Server Routes Loaded: /api/notifications should be active");

export default app;

// Global Error Handlers for Uncaught Exceptions and Unhandled Rejections
process.on("uncaughtException", (err) => {
  console.error("\n[CRITICAL] Uncaught Exception:", err);
  // Optional: Graceful shutdown or restart logic
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});
