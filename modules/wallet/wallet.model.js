// models/Wallet.js
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    /**
     * balances key example:
     * USDT_TRON, BTC_BTC, ETH_ERC20
     */
    balances: {
      type: Map,
      of: mongoose.Schema.Types.Decimal128,
      default: {}
    },

    investmentBalanceUSD: {
      type: Number,
      default: 0
    },
    
    totalProfit: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0
    },

    status: { 
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true
    },

    locked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
