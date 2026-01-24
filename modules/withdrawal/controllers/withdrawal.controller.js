import User from "../../user/user.model.js";
import { sendTransactionalEmail } from "../../notification/email-notification.service.js";
import { Settings } from "../../settings/settings.model.js";
import { getOrCreateWallet } from "../../wallet/wallet.service.js";
import Withdrawal from "../withdrawal.model.js";
import Ledger from "../../ledger/ledger.model.js";
import { sendNotification } from "../../notification/notification.service.js";
import crypto from "crypto";
import mongoose from "mongoose";

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const requestWithdrawalOtp = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.emailOtp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    };
    await user.save();

    await sendTransactionalEmail(user, "LOGIN_OTP", { otp });
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.userId;
    const { asset, network, amount, destinationAddress, otp } = req.body;
    console.log("DEBUG: createWithdrawal - userId:", userId, "body:", req.body);

    // 0. Check Settings for OTP Requirement
    const settings = await Settings.getSingleton();
    const user = await User.findById(userId).session(session);
    if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
    }

    const isOtpRequired = (settings && settings.requireWithdrawVerification === true) || user.requireWithdrawVerification === true;
    
    console.log(`DEBUG: createWithdrawal - Global Req: ${settings.requireWithdrawVerification}, User Req: ${user.requireWithdrawVerification}, Final: ${isOtpRequired}, OTP provided: ${!!otp}`);

    if (isOtpRequired) {
      if (!otp) {
        const otpCode = generateOtp();
        console.log(`[OTP] Generating for ${user.email}: ${otpCode}`);
        
        user.emailOtp = {
            code: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        };
        await user.save({ session });
        
        // Send OTP via Email
        await sendTransactionalEmail(user, "LOGIN_OTP", { otp: otpCode });
        
        await session.commitTransaction();
        session.endSession();
        return res.status(400).json({ message: "OTP required for withdrawal", requiresOtp: true });
      }

      // Verification Case
      const storedOtp = user.emailOtp?.code;
      const isMatch = storedOtp === otp;
      const isExpired = user.emailOtp?.expiresAt && new Date(user.emailOtp.expiresAt).getTime() < Date.now();

      console.log(`[OTP] Verify Attempt - User: ${user.email}, Input: [${otp}], Stored: [${storedOtp}], Match: ${isMatch}, Expired: ${isExpired}`);

      if (!isMatch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "The verification code you entered is incorrect. Please check your email and try again." });
      }

      if (isExpired) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "The verification code has expired. Please request a new one." });
      }

      // Clear OTP after successful use
      user.emailOtp = undefined;
      await user.save({ session });
      console.log(`[OTP] Verification successful for ${user.email}`);
    }

    if (!userId) {
        throw new Error("User ID missing from request. Please re-login.");
    }

    // 1. Get wallet (Safe lookup/creation)
    const wallet = await getOrCreateWallet(userId, session);
    console.log("DEBUG: createWithdrawal - wallet found/created:", !!wallet);

    if (!wallet) {
        throw new Error(`[ERR-W-100] Wallet not found for user ID: ${userId}.`);
    }

    // Check Balance (Liquid + Investment)
    const key = (asset === 'USDT' || asset === 'USDC') ? asset : `${asset}_${network}`;
    
    // Convert Mongoose Map balance safely
    const getLiquidBalance = (w, k) => {
        if (!w.balances) return 0;
        const val = w.balances.get(k);
        if (!val) return 0;
        return parseFloat(val.toString());
    };

    const liquidBalance = getLiquidBalance(wallet, key);
    
    let totalAvailable = liquidBalance;
    let btcPrice = 1; // Default for USD-based assets

    // If withdrawing a non-USD asset, we only count its liquid balance for now
    // If withdrawing USDT/USDC, we count liquid + investmentBalanceUSD
    if (asset === 'USDT' || asset === 'USDC') {
        totalAvailable += parseFloat(wallet.investmentBalanceUSD || 0);
    } 

    if (totalAvailable < amount) {
      throw new Error(`Insufficient funds. Available: ${totalAvailable} (Liquid: ${liquidBalance} + Invested: ${asset === 'USDT' ? wallet.investmentBalanceUSD : 0})`);
    }

    // 2. Generate ID first
    const withdrawalId = new mongoose.Types.ObjectId();

    // 3. Deduct Balance Logic
    let remainingToDeduct = amount;
    
    // Deduct from liquid first
    const deductFromLiquid = Math.min(liquidBalance, remainingToDeduct);
    wallet.balances.set(key, liquidBalance - deductFromLiquid);
    remainingToDeduct -= deductFromLiquid;

    // Deduct from investmentBalanceUSD if still remaining
    if (remainingToDeduct > 0) {
        wallet.investmentBalanceUSD = parseFloat(wallet.investmentBalanceUSD || 0) - remainingToDeduct;
        
        // Also need to reduce the principal in ProfitAccrual records
        // We reduce from the oldest active accruals first
        const ProfitAccrual = mongoose.model("ProfitAccrual");
        const accruals = await ProfitAccrual.find({ userId, status: "ACTIVE" }).sort({ createdAt: 1 }).session(session);
        
        let accrualDeductionPool = remainingToDeduct;
        for (const accrual of accruals) {
            if (accrualDeductionPool <= 0) break;
            
            const deduct = Math.min(accrual.principalUSD, accrualDeductionPool);
            accrual.principalUSD -= deduct;
            accrualDeductionPool -= deduct;
            
            if (accrual.principalUSD <= 0) {
                accrual.status = "COMPLETED"; // Or a new status like 'WITHDRAWN'
            }
            await accrual.save({ session });
        }
    }

    await wallet.save({ session });
    
    // 4. Create Ledger Entry
    await Ledger.create(
      [
        {
          userId,
          coin: asset,
          network: network,
          type: "WITHDRAWAL",
          amount,
          balanceBefore: totalAvailable,
          balanceAfter: totalAvailable - amount,
          referenceId: withdrawalId
        }
      ],
      { session }
    );

    // 4. Create withdrawal
    const withdrawal = await Withdrawal.create(
      [
        {
          _id: withdrawalId,
          userId,
          asset,
          network,
          amount,
          destinationAddress,
          status: "FUNDS_LOCKED", 
          // lockedLedgerId: ledgerEntry[0]._id // Optional
        }
      ],
      { session }
    );

    // 6. Notify User
    sendNotification(
        userId,
        "Withdrawal Requested",
        `Your withdrawal request for $${amount} (${asset}) has been submitted and is pending approval.`,
        "withdrawal"
    );

    // Email Notification
    if (user) {
        sendTransactionalEmail(user, "WITHDRAWAL_REQUESTED", {
            amount,
            coin: asset,
            address: destinationAddress
        }).catch(err => console.error("[WITHDRAWAL_REQUEST_NOTIFICATION] Error:", err.message));
    }

    // 5. Commit
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Withdrawal request submitted. It will be processed after admin approval.",
      withdrawalId: withdrawal[0]._id
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.userId })
       .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};
