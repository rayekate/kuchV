import mongoose from "mongoose";
import Wallet from "../../wallet/wallet.model.js";
import User from "../../user/user.model.js";

export const adminFreezeWallet = async (req, res) => {
  const { userId } = req.params;
  console.log(`[Admin] Freezing wallet for user: ${userId}`);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("[Admin] Invalid User ID format");
      return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
      const id = new mongoose.Types.ObjectId(userId);

      // 1. Suspend Wallet
      const wallet = await Wallet.findOneAndUpdate(
        { userId: id },
        { status: "SUSPENDED", locked: true },
        { new: true }
      );
      
      // 2. Deactivate User (Prevent Login)
      const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
      
      console.log(`[Admin] Freeze Result - User Active: ${user?.isActive}, Wallet Status: ${wallet?.status}`);

      res.json({ message: "User suspended", wallet, user });
  } catch (err) {
      console.error("[Admin] Freeze error:", err);
      res.status(500).json({ message: "Freeze failed" });
  }
};

export const adminUnfreezeWallet = async (req, res) => {
  const { userId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
      const id = new mongoose.Types.ObjectId(userId);

      // 1. Activate Wallet
      await Wallet.findOneAndUpdate(
        { userId: id },
        { status: "ACTIVE", locked: false },
        { new: true }
      );

      // 2. Activate User
      await User.findByIdAndUpdate(id, { isActive: true }, { new: true });
      
      res.json({ message: "User activated" });
  } catch (error) {
     res.status(500).json({ message: "Unfreeze failed" });
  }
};

export const adminUpdateWalletBalance = async (req, res) => {
    const { userId } = req.params;
    const { liquid, invested } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }

    try {
        const updateData = {};
        if (liquid !== undefined) {
             // Updating liquid balance implies updating USDT balance
             updateData['balances.USDT'] = parseFloat(liquid);
             // Ensure legacy structure if used
             updateData['balance'] = parseFloat(liquid);
        }
        if (invested !== undefined) {
            updateData['investmentBalanceUSD'] = parseFloat(invested);
        }

        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!wallet) return res.status(404).json({ message: "Wallet not found" });
        
        console.log(`[Admin] Balance updated for ${userId}: Liquid=${liquid}, Invested=${invested}`);
        res.json({ success: true, wallet });
    } catch (error) {
        console.error("Balance update error:", error);
        res.status(500).json({ message: "Failed to update balance" });
    }
};