import cron from "node-cron";
import { runProfitEngine } from "./profit.engine.js";

export const registerProfitCron = () => {
  // 1. Daily ROI — Runs every day at 12:00 AM (midnight)
  // This is the main engine run that credits daily profits.
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Daily Profit engine started at 12:00 AM");
    await runProfitEngine();
  });

  // 2. Plan Completion Check — Runs every hour
  // This ensures that when a plan ends, the principal is returned sooner than the next midnight.
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Plan Completion check started (Hourly)");
    await runProfitEngine();
  });
};