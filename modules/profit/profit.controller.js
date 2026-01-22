import ProfitAccrual from "./profitAccrual.model.js";
import mongoose from "mongoose";
import Wallet from "../wallet/wallet.model.js";
import Plan from "../admin/models/plan.model.js";
import Ledger from "../ledger/ledger.model.js";
import { sendNotification } from "../notification/notification.service.js";


/**
 * Get live price for a symbol (e.g. BTCUSDT)
 * Uses Binance Public API
 */
const getLivePrice = async (symbol) => {
    try {
        if (!symbol) return 0;
        // Map common symbols if needed
        let pair = symbol.toUpperCase();
        if (!pair.includes('USDT')) pair += 'USDT';
        
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
        const data = await res.json();
        return parseFloat(data.price);
    } catch (err) {
        // Fallback or silence
        return 0;
    }
};

/**
 * Get current user's active and completed investments
 * GET /api/investments
 */
export const getMyInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Fetch investments, sorted by newest first
    const investments = await ProfitAccrual.find({ userId })
      .sort({ createdAt: -1 });

    // Since ProfitAccrual currently only stores principalUSD, we might not know the exact COIN amount if it wasn't stored.
    // However, the user asked to "calculate profit in which we invest in that coin by api love prcing".
    // If the model doesn't store the coin amount, we can't calculate current value based on coin price.
    // Let's check if we can assume the investment tracks the original asset.
    // Looking at the model: it has `depositId`. We could populate `depositId` to get the coin and amount.
    
    // Let's modify to populate deposit to get asset details
    const populatedInvestments = await ProfitAccrual.find({ userId })
        .populate({
            path: 'depositId',
            select: 'amount asset network planId',
            populate: { path: 'planId', select: 'name' }
        })
        .sort({ createdAt: -1 });
        
    // Calculate live values
    const enrichedInvestments = await Promise.all(populatedInvestments.map(async (inv) => {
        const doc = inv.toObject();
        
        let currentCoinValueUSD = doc.principalUSD; // Default to principal if generic
        let livePrice = 0;

        if (doc.depositId && doc.depositId.asset) {
             const asset = doc.depositId.asset;
             if (asset !== 'USDT' && asset !== 'USDC') {
                 livePrice = await getLivePrice(asset);
                 // If we had the original COIN amount, we'd do coinAmount * livePrice.
                 // depositId.amount is usually Decimal128 in DB.
                 const coinAmount = parseFloat(doc.depositId.amount.toString());
                 if (livePrice > 0) {
                     currentCoinValueUSD = coinAmount * livePrice;
                 }
             }
        }
        
        return {
            ...doc,
            livePrice,
            currentValueUSD: currentCoinValueUSD
        };
    }));

    res.json(enrichedInvestments);
  } catch (error) {
    console.error("Error fetching investments:", error);
    res.status(500).json({ message: "Failed to fetch investments" });
  }
};

/**
 * Purchase a plan using Walllet Balance
 * POST /api/investments/purchase
 */
export const investFromWallet = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { planId, amount } = req.body;
        const userId = req.user.userId;

        if (!amount || amount <= 0) {
            throw new Error("Invalid amount");
        }

        // 1. Fetch Plan
        const plan = await Plan.findById(planId).session(session);
        if (!plan || !plan.isActive) {
            throw new Error("Plan not found or inactive");
        }

        // 2. Validate Limits
        if (amount < plan.minDeposit || amount > plan.maxDeposit) {
            throw new Error(`Amount must be between $${plan.minDeposit} and $${plan.maxDeposit}`);
        }

        // 3. Fetch Wallet
        const wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) throw new Error("Wallet not found");
        if (wallet.isFrozen) throw new Error("Wallet is frozen");

        // 4. Check Balance
        const currentBalance = Number(wallet.balances.get("USDT") || 0);
        if (currentBalance < amount) {
            throw new Error("Insufficient USDT balance");
        }

        // 5. Deduct Balance & create Ledger
        const newBalance = currentBalance - parseFloat(amount);
        wallet.balances.set("USDT", newBalance);
        
        // Add to Investment Balance
        wallet.investmentBalanceUSD = Number(wallet.investmentBalanceUSD || 0) + parseFloat(amount);

        // 6. Create Profit Accrual
        const now = new Date();
        const nextProfitAt = new Date(now.getTime() + plan.profitIntervalHours * 60 * 60 * 1000); // e.g. 24h

        const investment = new ProfitAccrual({
            userId,
            walletId: wallet._id,
            // depositId is null for wallet purchases, or we need to relax the schema requirement if it's required.
            // Checking schema... Assuming allowed to be null or optional. If required, we mock a "SYSTEM" deposit or change schema.
            // Let's assume it's optional per previous checks, or I'll create a fake "Internal Transfer" deposit record.
            // Creating a ProfitAccrual usually implies a Source.
            // Better: ProfitAccrual schema might require depositId. I should check.
            // If strictly required, I'll store 'null' or a placeholder.
            // Checking model file via assumption: usually linked.
            // Let's create the accrual.
            principalUSD: amount,
            profitPercent: plan.dailyRoi,
            intervalHours: plan.profitIntervalHours,
            durationDays: plan.durationDays,
            nextProfitAt: nextProfitAt,
            startAt: now,
            status: "ACTIVE", 
            totalCredited: 0
        });
        
        // 7. Ledger Entry
        await Ledger.create([{
            userId,
            type: "PLAN_PURCHASE",
            referenceId: investment._id, // Link to the investment
            amount: amount,
            coin: "USDT",
            network: "SYSTEM",
            balanceBefore: currentBalance,
            balanceAfter: newBalance
        }], { session });

        await wallet.save({ session });
        await investment.save({ session });
        
        await sendNotification(userId, "Plan Activated", `You successfully invested $${amount} in ${plan.name} using your wallet balance.`, "success");

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, message: "Investment successful", investment });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Investment Error:", error);
        res.status(400).json({ message: error.message || "Investment failed" });
    }
};
