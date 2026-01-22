// src/modules/ledger/ledger.integrity.js
import Ledger from "./ledger.model.js";
import Wallet from "../wallet/wallet.model.js";

/**
 * Verify wallet balance against ledger sum
 */
export const verifyUserWalletIntegrity = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) return { ok: true };

  const ledgerEntries = await Ledger.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { coin: "$coin", network: "$network" },
        total: { $sum: "$amount" }
      }
    }
  ]);

  const issues = [];

  for (const entry of ledgerEntries) {
    const key = `${entry._id.coin}_${entry._id.network}`;
    const walletBalance = wallet.balances.get(key)
      ? Number(wallet.balances.get(key))
      : 0;

    if (Number(entry.total) !== walletBalance) {
      issues.push({
        key,
        ledger: entry.total,
        wallet: walletBalance
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
};
