import { sendNotification } from "../notification/notification.service.js";
import { sendTransactionalEmail } from "../notification/email-notification.service.js";
import { Settings } from "../settings/settings.model.js";
import { sendTelegramAdminNotification } from "../notification/telegram-notification.service.js";
// src/modules/deposit/deposit.controller.js
import Deposit from "./deposit.model.js";
import AdminWallet from "../admin-wallet/adminWallet.model.js";
import cloudinary from "../upload/cloudinary.js";
import mongoose from "mongoose";

import { creditWalletFromDeposit } from "../ledger/ledger.service.js";
import { logAdminAction } from "../audit-log/auditLog.service.js";

import Wallet from "../wallet/wallet.model.js";
import Plan from "../admin/models/plan.model.js";
import ProfitAccrual from "../profit/profitAccrual.model.js";
import User from "../user/user.model.js";
import Ledger from "../ledger/ledger.model.js";

/**
 * USER: get available deposit options
 */
export const getDepositOptions = async (req, res) => {
  const options = await AdminWallet.find(
    { isActive: true },
    { coin: 1, network: 1, address: 1 }
  ).sort({ coin: 1 });

  res.json(options);
};

/**
 * USER: create deposit request
 */
export const createDeposit = async (req, res) => {
  const { adminWalletId, claimedAmount, txHash, paymentLink, planId } = req.body;

  const settings = await Settings.getSingleton();
  
  // Validation: Check fields based on settings
  if (!adminWalletId || !claimedAmount || !req.file) {
      return res.status(400).json({ status: false, message: "Missing required fields (Wallet, Amount, Screenshot)" });
  }

  // Check TxHash if required
  if (settings.requireTxHash && !txHash) {
      return res.status(400).json({ status: false, message: "Transaction Hash is required" });
  }

  const adminWallet = await AdminWallet.findOne({
    _id: adminWalletId,
    isActive: true
  });

  if (!adminWallet) {
    return res.status(400).json({
      message: "Invalid or inactive deposit option"
    });
  }
  
  const uploadResult = await cloudinary.uploader.upload_stream(
    { folder: "crypto-deposits" },
    async (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      const screenshotUrl = result.secure_url;

      const deposit = await Deposit.create({
        userId: req.user.userId,
        coin: adminWallet.coin,
        network: adminWallet.network,
        claimedAmount,
        screenshotUrl,
        txHash,
        paymentLink,
        planId // Save the plan ID
      });

      res.status(201).json({
        message: "Deposit submitted successfully",
        deposit
      });

      // Notify user via email
      console.log(`[DEPOSIT] Attempting to find user ${req.user.userId} for email...`);
      const user = await User.findById(req.user.userId);
      
      // Fetch Plan details for email
      const plan = await Plan.findById(planId);

      if (user) {
        console.log(`[DEPOSIT] User found: ${user.email}. Triggering DEPOSIT_REQUESTED email.`);
        sendTransactionalEmail(user, "DEPOSIT_REQUESTED", {
            amount: claimedAmount,
            coin: adminWallet.coin,
            planName: plan ? plan.name : 'Investment Plan',
            planRoi: plan ? plan.dailyRoi : 0,
            planDuration: plan ? plan.durationDays : 0
        }).catch(err => 
            console.error("[DEPOSIT_REQUEST_NOTIFICATION] Error:", err.message)
        );

        // Telegram Notification for Admin
        const telegramMessage = `🔔 *New Deposit Request*\n\n` +
            `👤 *User Name:* ${user.name || "N/A"}\n` +
            `📧 *Email:* ${user.email || "N/A"}\n` +
            `💰 *Amount:* ${claimedAmount} USDT\n` +
            `📝 *Plan:* ${plan ? plan.name : 'Default'}\n` + 
            `🔗 *TxHash:* \`${txHash}\`\n`;
            
        sendTelegramAdminNotification(telegramMessage).catch(err => 
            console.error("[TELEGRAM_NOTIFICATION] Error:", err.message)
        );
      } else {
        console.error(`[DEPOSIT] User ${req.user.userId} NOT found for email.`);
      }
    }
  );

  uploadResult.end(req.file.buffer);
};

/**
 * USER: view own deposits
 */
export const getMyDeposits = async (req, res) => {
  const deposits = await Deposit.find({ userId: req.user.userId })
    .populate('planId')
    .sort({ createdAt: -1 });

  res.json(deposits);
};


// src/modules/deposit/deposit.controller.js


/**
 * ADMIN: Approve deposit
 */
export const approveDeposit = async (req, res) => {
  const { depositId } = req.params;
  const { approvedAmount } = req.body;

  if (!approvedAmount || Number(approvedAmount) <= 0) {
    return res.status(400).json({
      message: "Approved amount must be greater than zero"
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Lock deposit
    const deposit = await Deposit.findOne(
      { _id: depositId, status: "PENDING" }
    ).session(session);

    if (!deposit) {
      throw new Error("Deposit not found or already processed");
    }

    // 2️⃣ Credit wallet (USD principal only)
    await creditWalletFromDeposit({
      userId: deposit.userId,
      coin: deposit.coin,
      network: deposit.network,
      amount: approvedAmount, // USD entered manually
      referenceId: deposit._id,
      session,
      addToLiquid: false // Critical Fix: Do not add to liquid balance, only Log it.
    });

    const wallet = await Wallet.findOne({ userId: deposit.userId }).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }
  
    wallet.investmentBalanceUSD =
      Number(wallet.investmentBalanceUSD || 0) + Number(approvedAmount);
    
    await wallet.save({ session });


    // 4️⃣ Fetch plan (template)
    const plan = await Plan.findById(deposit.planId).session(session);
    if (!plan || !plan.isActive) {
      throw new Error("Invalid or inactive plan");
    }

    // 5️⃣ CREATE PROFIT CLOCK (CRITICAL PART)
    const approvedAt = new Date();

    await ProfitAccrual.create([{
      userId: deposit.userId,
      walletId: wallet._id,
      depositId: deposit._id,

      principalUSD: approvedAmount,

      profitPercent: plan.dailyRoi, // Use dailyRoi
      intervalHours: 24, // Daily means 24 hours
      durationDays: plan.durationDays,

      startAt: approvedAt,
      nextProfitAt: new Date(
        approvedAt.getTime() + 24 * 60 * 60 * 1000
      ),

      totalCredited: 0,
      status: "ACTIVE"
    }], { session });

    // 6️⃣ Update deposit status
    deposit.status = "APPROVED";
    deposit.approvedAmount = approvedAmount;
    deposit.adminId = req.user.userId;
    deposit.approvedAt = approvedAt;
    await deposit.save({ session });


    // 7️⃣ Audit log
    await logAdminAction({
      adminId: req.user.userId,
      action: "APPROVE_DEPOSIT",
      entity: "Deposit",
      entityId: deposit._id,
      before: { status: "PENDING" },
      after: { status: "APPROVED", approvedAmount },
      session
    });

    // 8️⃣ Send Notification
    sendNotification(
        deposit.userId, 
        "Deposit Approved", 
        `Your deposit of $${approvedAmount} has been approved and invested successfully.`, 
        "deposit"
    );

    // Email Notification
    console.log(`[DEPOSIT] Attempting to find user ${deposit.userId} for approval email...`);
    const depositUser = await User.findById(deposit.userId).session(session);
    if (depositUser) {
        console.log(`[DEPOSIT] User found: ${depositUser.email}. Triggering PLAN_APPROVED email.`);
        sendTransactionalEmail(depositUser, "PLAN_APPROVED", {
            planName: plan.name,
            startDate: new Date().toLocaleDateString(),
            amount: approvedAmount,
            planRoi: plan.dailyRoi,
            planDuration: plan.durationDays
        }).catch(err => console.error("[PLAN_APPROVED_NOTIFICATION] Error:", err.message));
    } else {
        console.error(`[DEPOSIT] User ${deposit.userId} NOT found for approval email.`);
    }

    // 9️⃣ Referral Bonus Logic
    const user = await User.findById(deposit.userId).session(session);
    const isFirstDeposit = (await Deposit.countDocuments({ 
        userId: deposit.userId, 
        status: "APPROVED",
        _id: { $ne: deposit._id } // Don't count current one yet, or count if it's 0 before this
    }).session(session)) === 0;

    if (isFirstDeposit && user.referredBy) {
        const bonusAmount = Number(approvedAmount) * 0.10; // 10% bonus
        const referrerWallet = await Wallet.findOne({ userId: user.referredBy }).session(session);
        
        if (referrerWallet) {
            // Credit referrer's liquid balance (USDT)
            const oldBal = referrerWallet.balances.get("USDT") ? parseFloat(referrerWallet.balances.get("USDT").toString()) : 0;
            const oldProfit = referrerWallet.totalProfit ? parseFloat(referrerWallet.totalProfit.toString()) : 0;
            
            referrerWallet.balances.set("USDT", oldBal + bonusAmount);
            referrerWallet.totalProfit = oldProfit + bonusAmount;
            
            await referrerWallet.save({ session });

            // Create Ledger Entry for Referrer
            await Ledger.create([{
                userId: user.referredBy,
                type: "REFERRAL_BONUS",
                coin: "USDT",
                network: "SYSTEM",
                amount: bonusAmount,
                balanceBefore: oldBal,
                balanceAfter: oldBal + bonusAmount,
                referenceId: deposit._id
            }], { session });

            sendNotification(
                user.referredBy,
                "Referral Bonus!",
                `You received $${bonusAmount.toFixed(2)} referral bonus from ${user.name || user.email}'s first deposit.`,
                "success"
            );
        }
    }

    // 🔟 Update User Level and Points
    user.points = (user.points || 0) + Number(approvedAmount);
    
    // Level Logic: 1000=Silver, 5000=Gold, 20000=Premium, 100000=Elite
    const pts = user.points;
    let nextLevel = "Bronze";
    if (pts >= 100000) nextLevel = "Elite";
    else if (pts >= 20000) nextLevel = "Premium";
    else if (pts >= 5000) nextLevel = "Gold";
    else if (pts >= 1000) nextLevel = "Silver";

    if (user.level !== nextLevel) {
        user.level = nextLevel;
        sendNotification(
            user._id,
            "Rank Up!",
            `Congratulations! You have been promoted to ${nextLevel} level.`,
            "success"
        );
    }
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Deposit approved. Profit will be added automatically."
    });

  } catch (error) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    session.endSession();

    res.status(400).json({
      message: error.message
    });
  }
};

/**
 * ADMIN: Get All Deposits
 */
export const getAllDeposits = async (req, res) => {
    const deposits = await Deposit.find()
      .populate('userId', 'name email') // Populate user details
      .populate('planId', 'name dailyRoi durationDays')
      .sort({ createdAt: -1 });
    res.json(deposits);
};

export const rejectDeposit = async (req, res) => {
    const { depositId } = req.params;
    const { remarks } = req.body;
  
    const deposit = await Deposit.findOne({
      _id: depositId,
      status: "PENDING"
    });
  
    if (!deposit) {
      return res.status(400).json({
        message: "Deposit not found or already processed"
      });
    }
  
    deposit.status = "REJECTED";
    deposit.adminId = req.user.userId;
    deposit.remarks = remarks;
    await deposit.save();
  
    await logAdminAction({
      adminId: req.user.userId,
      action: "REJECT_DEPOSIT",
      entity: "Deposit",
      entityId: deposit._id,
      before: { status: "PENDING" },
      after: { status: "REJECTED" }
    });

    sendNotification(
        deposit.userId, 
        "Deposit Rejected", 
        `Your deposit was rejected. Reason: ${remarks}`, 
        "deposit"
    );

    // Email Notification
    console.log(`[DEPOSIT] Attempting to find user ${deposit.userId} for rejection email...`);
    // Populate plan to get name
    const depositWithPlan = await Deposit.findById(deposit._id).populate('planId');
    const planName = depositWithPlan.planId ? depositWithPlan.planId.name : 'Classic Plan';

    const depositUser = await User.findById(deposit.userId);
    if (depositUser) {
        console.log(`[DEPOSIT] User found: ${depositUser.email}. Triggering DEPOSIT_REJECTED email.`);
        sendTransactionalEmail(depositUser, "DEPOSIT_REJECTED", {
            amount: deposit.claimedAmount,
            coin: deposit.coin,
            reason: remarks,
            planName: planName
        }).catch(err => console.error("[DEPOSIT_REJECTED_NOTIFICATION] Error:", err.message));
    } else {
        console.error(`[DEPOSIT] User ${deposit.userId} NOT found for rejection email.`);
    }
  
    res.json({ success: true });
  };
  
