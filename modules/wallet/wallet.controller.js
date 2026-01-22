// src/modules/wallet/wallet.controller.js
import Wallet from "./wallet.model.js";
import { getOrCreateWallet } from "./wallet.service.js";

import Ledger from "../ledger/ledger.model.js";

export const getMyWallet = async (req, res) => {
  const wallet = await getOrCreateWallet(req.user.userId);
  
  // Calculate total profit from Ledger (Includes Weekly ROI & Referral Bonuses)
  const profitAggregate = await Ledger.aggregate([
    { $match: { userId: wallet.userId, type: { $in: ["PROFIT_CREDIT", "REFERRAL_BONUS"] } } },
    { $group: { _id: null, totalProfit: { $sum: { $toDouble: "$amount" } } } }
  ]);

  const totalProfit = profitAggregate.length > 0 ? profitAggregate[0].totalProfit : 0;

  // Convert Mongoose Map to plain object for JSON response
  const walletObj = wallet.toObject();
  walletObj.balances = wallet.balances ? Object.fromEntries(wallet.balances) : {};
  
  // Use persisted totalProfit if available, otherwise fallback to aggregation
  const modelProfit = wallet.totalProfit ? parseFloat(wallet.totalProfit.toString()) : 0;
  walletObj.totalProfit = modelProfit > 0 ? modelProfit : totalProfit;
  
  res.json(walletObj);
};

export const getUserWalletByAdmin = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.params.userId });

  if (!wallet) {
    return res.status(404).json({ message: "Wallet not found" });
  }

  res.json(wallet);
};
