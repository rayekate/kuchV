import { sendNotification } from "../../notification/notification.service.js"; // Correct Path
import { sendTransactionalEmail } from "../../notification/email-notification.service.js";
// modules/withdrawal/controllers/admin.withdrawal.controller.js
import Withdrawal from "../withdrawal.model.js";
import mongoose from "mongoose";
import Ledger from "../../ledger/ledger.model.js";
import { sendEmail } from "../../../config/email.service.js";
import { buildWithdrawalCompletedHTML } from "../emails/withdrawalCompleted.email.js";
import User from "../../user/user.model.js";
import { buildWithdrawalRejectedHTML } from "../emails/withdrawalRejected.email.js";
import cloudinary from "../../upload/cloudinary.js";
import Wallet from "../../wallet/wallet.model.js";
import { getOrCreateWallet } from "../../wallet/wallet.service.js";

export const getAllWithdrawals = async (req, res) => {
  const withdrawals = await Withdrawal.find()
    .populate("userId", "email customerId name")
    .sort({ createdAt: -1 });

  res.json(withdrawals);
};


export const rejectWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await Withdrawal.findById(id).session(session);
    if (!withdrawal) throw new Error("Withdrawal not found");

    if (!["FUNDS_LOCKED", "ADMIN_PROCESSING"].includes(withdrawal.status)) {
      throw new Error("Withdrawal cannot be rejected at this stage");
    }

    // 1. Update Wallet Balances
    const userWallet = await Wallet.findOne({ userId: withdrawal.userId }).session(session);
    if (!userWallet) throw new Error("User wallet not found");

    const key = (withdrawal.asset === 'USDT' || withdrawal.asset === 'USDC') ? withdrawal.asset : `${withdrawal.asset}_${withdrawal.network}`;
    
    // Logic: We deducted from Liquid first, then Investment. 
    // Refund should ideally go back to where it was taken from.
    // However, for simplicity and user clarity, let's refund everything to LIQUID balance first?
    // OR: Track how much was taken from where. 
    // Since we don't track original split in the Withdrawal object, we'll try to restore Liquid up to a reasonable limit or just refund all to Liquid.
    // Refunding to LIQUID is safest for the user to try again.
    
    const currentLiquid = userWallet.balances.get(key) ? parseFloat(userWallet.balances.get(key).toString()) : 0;
    userWallet.balances.set(key, currentLiquid + withdrawal.amount);
    await userWallet.save({ session });

    const refId = withdrawal._id; 
    console.log("DEBUG: Rejecting Withdrawal ID:", refId);

    // 2. Create refund ledger entry
    await Ledger.create(
      [
        {
          userId: withdrawal.userId,
          coin: withdrawal.asset,
          network: withdrawal.network,
          type: "WITHDRAWAL_REFUND",
          amount: withdrawal.amount,
          balanceBefore: currentLiquid,
          balanceAfter: currentLiquid + withdrawal.amount,
          referenceId: refId // Ensuring explicit assignment
        }
      ],
      { session }
    );

    // 3. Update withdrawal
    withdrawal.status = "REJECTED";
    withdrawal.rejectionReason = reason;
    withdrawal.adminId = adminId;
    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();
      
      const user = await User.findById(withdrawal.userId);

      if (user) {
        sendTransactionalEmail(user, "WITHDRAWAL_REJECTED", {
            amount: withdrawal.amount,
            coin: withdrawal.asset,
            reason: withdrawal.rejectionReason
        }).catch(err => console.error("[WITHDRAWAL_REJECTED_NOTIFICATION] Error:", err.message));
      }

    sendNotification(
        withdrawal.userId,
        "Withdrawal Rejected",
        `Your withdrawal request for $${withdrawal.amount} was rejected. Reason: ${withdrawal.rejectionReason}`,
        "withdrawal"
    );

    return res.json({
      message: "Withdrawal rejected and funds refunded"
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      message: err.message
    });
  }
};


// admin.withdrawal.controller.js
export const approveWithdrawal = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  const withdrawal = await Withdrawal.findOneAndUpdate(
    {
      _id: id,
      status: "FUNDS_LOCKED"
    },
    {
      status: "ADMIN_PROCESSING",
      adminId
    },
    { new: true }
  );

  if (!withdrawal) {
    return res.status(400).json({
      message: "Withdrawal cannot be approved"
    });
  }

  // NOTIFICATION
  sendNotification(
      withdrawal.userId,
      "Withdrawal Approved",
      "Your withdrawal request has been approved and is processing.",
      "withdrawal"
  );

  // Email Notification
  const user = await User.findById(withdrawal.userId);
  if (user) {
    sendTransactionalEmail(user, "WITHDRAWAL_APPROVED", {
        amount: withdrawal.amount,
        coin: withdrawal.asset,
        address: withdrawal.destinationAddress
    }).catch(err => console.error("[WITHDRAWAL_APPROVED_NOTIFICATION] Error:", err.message));
  }

  res.json({
    message: "Withdrawal approved. Awaiting transaction confirmation."
  });
};

export const confirmWithdrawal = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { id } = req.params;
      const { txHash } = req.body;
      const adminId = req.user.userId;
  
      const withdrawal = await Withdrawal.findOne({
        _id: id,
        status: { $in: ["ADMIN_PROCESSING", "FUNDS_LOCKED"] }
      }).session(session);
  
      if (!withdrawal) {
        throw new Error("Invalid withdrawal state or not found");
      }

      withdrawal.adminId = adminId;
  
      // txHash uniqueness check
      if (txHash) {
          const exists = await Withdrawal.findOne({ txHash, _id: { $ne: id } });
          if (exists) {
            throw new Error("Transaction hash already used");
          }
      }
  
      let proofScreenshot = req.body.proofScreenshot; // Fallback to URL if provided

      if (req.file) {
          console.log("DEBUG: confirmWithdrawal - Uploading proof to Cloudinary...");
          // Helper to handle upload stream in a transaction-like way (though cloudinary isn't transactional)
          const uploadToCloudinary = () => {
              return new Promise((resolve, reject) => {
                  const stream = cloudinary.uploader.upload_stream(
                      { folder: "withdrawal-proofs" },
                      (error, result) => {
                          if (error) reject(error);
                          else resolve(result.secure_url);
                      }
                  );
                  stream.end(req.file.buffer);
              });
          };
          proofScreenshot = await uploadToCloudinary();
          console.log("DEBUG: confirmWithdrawal - Proof uploaded:", proofScreenshot);
      }
  
      withdrawal.status = "COMPLETED";
      if (txHash) withdrawal.txHash = txHash;
      if (proofScreenshot) withdrawal.proofScreenshot = proofScreenshot;
      await withdrawal.save({ session });
  
      // Ledger lock is now FINAL — no new entry needed
  
      await session.commitTransaction();
      session.endSession();
        
      const user = await User.findById(withdrawal.userId);
      if (!user) {
        throw new Error("Withdrawal user not found");
      }

      // NOTIFICATION
      sendNotification(
          withdrawal.userId,
          "Withdrawal Completed",
          `Your withdrawal of $${withdrawal.amount} has been sent. ${withdrawal.txHash ? 'TxHash: ' + withdrawal.txHash : ''}`,
          "withdrawal"
      );

      // Email Notification
      sendTransactionalEmail(user, "WITHDRAWAL_APPROVED", { // Re-using approved template or can add COMPLETED
        amount: withdrawal.amount,
        coin: withdrawal.asset,
        txid: withdrawal.txHash
      }).catch(err => console.error("[WITHDRAWAL_COMPLETED_NOTIFICATION] Error:", err.message));
  
      return res.json({
        message: "Withdrawal completed successfully with proof",
        proofScreenshot
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
  
      return res.status(400).json({
        message: err.message
      });
    }
};
  
export const createManualWithdrawal = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const adminId = req.user.userId;
        const { userId, asset, network, amount, destinationAddress, status = 'COMPLETED', txHash } = req.body;

        if (!userId || !amount || !asset || !network || !destinationAddress) {
            throw new Error("Missing required fields (userId, amount, asset, network, destinationAddress)");
        }

        const wallet = await getOrCreateWallet(userId, session);
        if (!wallet) throw new Error("User wallet not found");

        // Balance Deduction logic (Mirrored from user-side createWithdrawal)
        const key = (asset === 'USDT' || asset === 'USDC') ? asset : `${asset}_${network}`;
        
        const getLiquidBalance = (w, k) => {
            if (!w.balances) return 0;
            const val = w.balances.get(k);
            if (!val) return 0;
            return parseFloat(val.toString());
        };

        const liquidBalance = getLiquidBalance(wallet, key);
        let totalAvailable = liquidBalance;
        if (asset === 'USDT' || asset === 'USDC') {
            totalAvailable += parseFloat(wallet.investmentBalanceUSD || 0);
        }

        if (totalAvailable < amount) {
            throw new Error(`Insufficient funds. Available: ${totalAvailable}`);
        }

        const withdrawalId = new mongoose.Types.ObjectId();
        let remainingToDeduct = amount;
        
        const deductFromLiquid = Math.min(liquidBalance, remainingToDeduct);
        wallet.balances.set(key, liquidBalance - deductFromLiquid);
        remainingToDeduct -= deductFromLiquid;

        if (remainingToDeduct > 0) {
            wallet.investmentBalanceUSD = parseFloat(wallet.investmentBalanceUSD || 0) - remainingToDeduct;
            const ProfitAccrual = mongoose.model("ProfitAccrual");
            const accruals = await ProfitAccrual.find({ userId, status: "ACTIVE" }).sort({ createdAt: 1 }).session(session);
            
            let pool = remainingToDeduct;
            for (const accrual of accruals) {
                if (pool <= 0) break;
                const deduct = Math.min(accrual.principalUSD, pool);
                accrual.principalUSD -= deduct;
                pool -= deduct;
                if (accrual.principalUSD <= 0) accrual.status = "COMPLETED";
                await accrual.save({ session });
            }
        }

        await wallet.save({ session });

        // Ledger
        await Ledger.create([{
            userId,
            coin: asset,
            network: network,
            type: "WITHDRAWAL",
            amount,
            balanceBefore: totalAvailable,
            balanceAfter: totalAvailable - amount,
            referenceId: withdrawalId,
            remark: "Manual withdrawal by admin"
        }], { session });

        // Withdrawal Record
        const withdrawal = await Withdrawal.create([{
            _id: withdrawalId,
            userId,
            asset,
            network,
            amount,
            destinationAddress,
            status,
            txHash,
            adminId
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Notify user
        sendNotification(userId, "Manual Withdrawal", `An admin has processed a withdrawal of $${amount} for you.`, "withdrawal");

        res.json({
            message: "Manual withdrawal created successfully",
            withdrawal: withdrawal[0]
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};
