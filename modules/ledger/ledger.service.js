// src/modules/ledger/ledger.service.js
import mongoose from "mongoose";
import Ledger from "./ledger.model.js";
import Wallet from "../wallet/wallet.model.js";
import { getOrCreateWallet } from "../wallet/wallet.service.js";

export const creditWalletFromDeposit = async ({
  userId,
  coin,
  network,
  amount,
  referenceId,
  session,
  addToLiquid = true
}) => {
  const wallet = await getOrCreateWallet(userId, session);

  if (wallet.locked) {
    throw new Error("Wallet is locked");
  }

  const key = (coin === 'USDT' || coin === 'USDC') ? coin : `${coin}_${network}`;
  const before = wallet.balances.get(key)
    ? Number(wallet.balances.get(key))
    : 0;

  const after = addToLiquid ? (before + Number(amount)) : before;

  // 1️⃣ Insert ledger entry
  await Ledger.create(
    [{
      userId,
      type: "DEPOSIT",
      referenceId,
      coin,
      network,
      amount,
      balanceBefore: before,
      balanceAfter: after
    }],
    { session }
  );

  // 2️⃣ Update wallet balance ONLY IF addToLiquid is true
  if (addToLiquid) {
      wallet.balances.set(key, after);
      await wallet.save({ session });
  }
};
