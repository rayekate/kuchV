// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailOtp: {
      code: String,
      expiresAt: Date
    },

    lastLoginAt: {
      type: Date
    },

    // Profile Fields
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Settings
    savedWallets: [{
        coin: String,     // e.g. USDT
        network: String,  // e.g. TRC20
        address: String,
        label: String
    }],

    notificationPreferences: {
        platform: { type: Boolean, default: true },
        deposit: { type: Boolean, default: true },
        price: { type: Boolean, default: false },
        security: { type: Boolean, default: true }
    },

    level: {
        type: String,
        enum: ["Bronze", "Silver", "Gold", "Premium", "Elite"],
        default: "Bronze"
    },

    points: {
        type: Number,
        default: 0
    },

    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allow nulls for old users until updated
    },

    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Telegram Integration
    telegramChatId: {
        type: String,
        unique: true,
        sparse: true
    },
    telegramUsername: {
        type: String
    },
    is2faEnabled: {
        type: Boolean,
        default: false
    },
    requireWithdrawVerification: {
        type: Boolean,
        default: false
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
