import mongoose from "mongoose";
import { sendNotification } from "../notification/notification.service.js";
import ProfitAccrual from "./profitAccrual.model.js";
import Wallet from "../wallet/wallet.model.js";
import Ledger from "../ledger/ledger.model.js";
import UserPlan from "../admin/models/userPlan.model.js";

export const runProfitEngine = async () => {
  const now = new Date();

  // Find all ACTIVE accruals that are due for profit
  const accruals = await ProfitAccrual.find({
    status: "ACTIVE",
    nextProfitAt: { $lte: now }
  });

  for (const accrual of accruals) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findById(accrual.walletId).session(session);
      if (!wallet || wallet.locked) {
        console.warn(`[CRON] Skipping accrual ${accrual._id}: Wallet not found or locked.`);
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      // CATCH-UP LOGIC: Process all intervals between nextProfitAt and now
      let intervalsProcessed = 0;
      let totalProfitToCredit = 0;
      let tempNextProfit = new Date(accrual.nextProfitAt);
      
      const planEndAt = new Date(
        accrual.startAt.getTime() +
        accrual.durationDays * 24 * 60 * 60 * 1000
      );

      // We process profit only if tempNextProfit <= now AND tempNextProfit <= planEndAt
      while (tempNextProfit <= now && tempNextProfit <= planEndAt) {
          const intervalProfit = Number(accrual.principalUSD * (accrual.profitPercent / 100));
          totalProfitToCredit += intervalProfit;
          intervalsProcessed++;
          
          // Advance the clock
          tempNextProfit = new Date(
            tempNextProfit.getTime() +
            accrual.intervalHours * 60 * 60 * 1000
          );
      }

      if (intervalsProcessed === 0) {
          await session.abortTransaction();
          session.endSession();
          continue;
      }

      // Ledger entry (Profit Credit)
      const oldLiquid = Number(wallet.balances.get("USDT") || 0);
      const oldTotalProfit = Number(wallet.totalProfit || 0);
      
      await Ledger.create(
        [{
          userId: accrual.userId,
          type: "PROFIT_CREDIT",
          referenceId: accrual._id,
          amount: totalProfitToCredit,
          coin: "USDT",
          network: "SYSTEM",
          balanceBefore: oldLiquid,
          balanceAfter: oldLiquid + totalProfitToCredit
        }],
        { session }
      );

      // Update balances (USDT is withdrawable)
      wallet.balances.set("USDT", (oldLiquid + totalProfitToCredit).toFixed(2));
      wallet.totalProfit = (oldTotalProfit + totalProfitToCredit).toFixed(2);
      
      await wallet.save({ session });

      // Notify User
      sendNotification(
        accrual.userId,
        "ROI Accrued",
        `You received $${totalProfitToCredit.toFixed(2)} ROI from your active investment.`,
        "success"
      );

      // Update Accrual State
      accrual.totalCredited += totalProfitToCredit;
      accrual.nextProfitAt = tempNextProfit;

      // Final Completion Check (using the calculated planEndAt)
      if (now >= planEndAt || tempNextProfit > planEndAt) {
        accrual.status = "COMPLETED";
        
        // PRINCIPAL RETURN
        const principal = Number(accrual.principalUSD);
        
        // Deduct from Locked Investment
        wallet.investmentBalanceUSD = Math.max(0, Number(wallet.investmentBalanceUSD || 0) - principal);
        
        // Add to Liquid Balance
        const oldLiquidBal = Number(wallet.balances.get("USDT") || 0);
        wallet.balances.set("USDT", (oldLiquidBal + principal).toFixed(2));
        
        // Ledger Entry for Return
        await Ledger.create(
            [{
              userId: accrual.userId,
              type: "PRINCIPAL_RETURN",
              referenceId: accrual._id,
              amount: principal,
              coin: "USDT",
              network: "SYSTEM",
              balanceBefore: oldLiquidBal,
              balanceAfter: oldLiquidBal + principal
            }],
            { session }
        );
        
        await wallet.save({ session });

        // Sync UserPlan
        if (accrual.depositId) {
            await UserPlan.findOneAndUpdate(
                { userId: accrual.userId, status: "ACTIVE" }, 
                { status: "COMPLETED" },
                { session }
            );
        }

        sendNotification(
          accrual.userId,
          "Plan Matured",
          `Your investment cycle is complete. Principal of $${principal.toFixed(2)} has been returned.`,
          "success"
        );
      }

      await accrual.save({ session });

      await session.commitTransaction();
      session.endSession();
      console.log(`[CRON] Processed ${intervalsProcessed} profit intervals for accrual ${accrual._id}`);

    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      console.error("[CRON][PROFIT ERROR]", err.message);
    }
  }
};
