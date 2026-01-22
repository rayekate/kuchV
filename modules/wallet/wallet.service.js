// src/modules/wallet/wallet.service.js
import mongoose from "mongoose";
import Wallet from "./wallet.model.js";

/**
 * Get or create wallet for a user
 * SAFE to call multiple times
 */
export const getOrCreateWallet = async (userId, session = null) => {
  // Ensure we are working with an ObjectId to avoid casting issues in queries
  const idToUse = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  
  console.log("DEBUG: getOrCreateWallet - Searching for userId:", idToUse);
  let wallet = await Wallet.findOne({ userId: idToUse }).session(session);

  if (!wallet) {
    console.log("DEBUG: getOrCreateWallet - wallet NOT found, creating for:", idToUse);
    // Use array syntax for transactions compatibility
    const createdArray = await Wallet.create(
      [{ userId: idToUse, balances: new Map() }],
      { session }
    );
    wallet = createdArray[0];
    console.log("DEBUG: getOrCreateWallet - wallet created successfully:", !!wallet);
  } else {
    console.log("DEBUG: getOrCreateWallet - wallet found in database.");
  }

  return wallet;
};

/**
 * Lock wallet (admin or system action)
 */
export const lockWallet = async (userId, session = null) => {
  await Wallet.updateOne(
    { userId },
    { locked: true },
    { session }
  );
};

/**
 * Unlock wallet (admin only)
 */
export const unlockWallet = async (userId, session = null) => {
  await Wallet.updateOne(
    { userId },
    { locked: false },
    { session }
  );
};
