import User from "../../user/user.model.js";
import bcrypt from "bcrypt";
import Wallet from "../../wallet/wallet.model.js";
import Transaction from "../../deposit/deposit.model.js";
import UserPlan from "../models/userPlan.model.js";

export const adminGetAllUsers = async (req, res) => {
  const { search } = req.query;
  let query = {};

  if (search) {
      query = {
          $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
          ]
      };
  }

  const users = await User.find(query).lean();

  const result = await Promise.all(
    users.map(async (u) => {
      const wallet = await Wallet.findOne({ userId: u._id }).lean();
      const plan = await UserPlan.findOne({ userId: u._id, status: "ACTIVE" })
        .populate("planId");

      return {
        user: u,
        wallet,
        plan
      };
    })
  );

  res.json(result);
};

export const adminGetUserDetails = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  const wallet = await Wallet.findOne({ userId });
  const transactions = await Transaction.find({ userId });
  const plan = await UserPlan.findOne({ userId, status: "ACTIVE" })
    .populate("planId");

  res.json({ user, wallet, transactions, plan });
};

export const adminUpdateUser = async (req, res) => {
  const { userId } = req.params;
  const { 
      name, 
      email, 
      role, 
      isActive, 
      isEmailVerified, 
      level, 
      points, 
      telegramUsername,
      password 
  } = req.body;

  try {
      const user = await User.findById(userId);
      if(!user) return res.status(404).json({ message: "User not found" });

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (typeof isActive === 'boolean') user.isActive = isActive;
      if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;
      if (level) user.level = level;
      if (points !== undefined) user.points = points;
      if (telegramUsername !== undefined) user.telegramUsername = telegramUsername;

      if (password && password.trim() !== "") {
          user.passwordHash = await bcrypt.hash(password, 10);
      }
      
      await user.save();
      res.json(user);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update user" });
  }
};

export const adminDeleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        await User.findByIdAndDelete(userId);
        // Clean up related data? Wallet, etc. 
        // For now, soft delete or just user delete. Mongoose middleware can handle cascading if set up.
        res.json({ success: true, message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};

export const adminBulkDeleteUsers = async (req, res) => {
    const { userIds } = req.body; // Expecting an array of IDs
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Invalid request. Provide an array of userIds." });
    }

    try {
        const result = await User.deleteMany({ _id: { $in: userIds } });
        // Ideally clean up related data here too (wallets, deposits, etc.)

        res.json({ 
            success: true, 
            message: `${result.deletedCount} users deleted successfully`,
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error("Bulk delete error:", error);
        res.status(500).json({ message: "Failed to delete users" });
    }
};
