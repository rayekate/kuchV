import User from "./user.model.js";
import bcrypt from "bcrypt";

export const getMe = async (req, res) => {
    const user = await User.findById(req.user.userId);
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        name: user.name,
        name: user.name,
        payoutWallet: user.payoutWallet, // Keep for backward compatibility if needed, or remove
        savedWallets: user.savedWallets,
        notificationPreferences: user.notificationPreferences,
        telegramChatId: user.telegramChatId,
        telegramUsername: user.telegramUsername,
        is2faEnabled: user.is2faEnabled,
        requireWithdrawVerification: user.requireWithdrawVerification,
        lastLoginAt: user.lastLoginAt
      }
    });
};

export const updateProfile = async (req, res) => {
    try {
        const { name, payoutWallet, notificationPreferences, telegramChatId, telegramUsername, requireWithdrawVerification } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (!user) {
             return res.status(404).json({ message: "User not found" });
        }

        if (name !== undefined) user.name = name;
        if (payoutWallet !== undefined) user.payoutWallet = payoutWallet;
        if (notificationPreferences !== undefined) user.notificationPreferences = notificationPreferences;
        if (telegramChatId !== undefined) user.telegramChatId = telegramChatId;
        if (telegramUsername !== undefined) user.telegramUsername = telegramUsername;
        if (req.body.is2faEnabled !== undefined) user.is2faEnabled = req.body.is2faEnabled;
        if (requireWithdrawVerification !== undefined) user.requireWithdrawVerification = requireWithdrawVerification;
        
        await user.save();
        res.json({ success: true, message: "Profile updated", user });
    } catch (error) {
        console.error("Profile update error", error);
        res.status(500).json({ message: "Update failed" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        res.json({ success: true, message: "Password updated" });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

export const addSavedWallet = async (req, res) => {
    try {
        const { coin, network, address, label } = req.body;
        
        if (!coin || !address || !network) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const user = await User.findById(req.user.userId);
        
        // Simple check for duplicates
        const exists = user.savedWallets.some(w => w.address === address && w.network === network);
        if (exists) {
            return res.status(400).json({ message: "Wallet already saved" });
        }

        user.savedWallets.push({ coin, network, address, label: label || `${coin} Wallet` });
        await user.save();

        res.json({ success: true, message: "Wallet added successfully", savedWallets: user.savedWallets });
    } catch (error) {
        console.error("Add wallet error", error);
        res.status(500).json({ message: "Failed to add wallet" });
    }
};

export const removeSavedWallet = async (req, res) => {
    try {
        const { walletId } = req.params;
        const user = await User.findById(req.user.userId);

        user.savedWallets = user.savedWallets.filter(w => w._id.toString() !== walletId);
        await user.save();

        res.json({ success: true, message: "Wallet removed", savedWallets: user.savedWallets });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove wallet" });
    }
};
  