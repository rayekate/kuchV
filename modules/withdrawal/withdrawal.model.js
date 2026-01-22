// modules/withdrawal/withdrawal.model.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    asset: {
      type: String, // BTC, USDT
      required: true
    },

    network: {
      type: String, // TRC20, ERC20, BSC
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    destinationAddress: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "FUNDS_LOCKED",
        "ADMIN_REVIEW",
        "ADMIN_PROCESSING",
        "COMPLETED",
        "REJECTED",
        "FAILED"
      ],
      default: "FUNDS_LOCKED"
    },

    txHash: String,
    proofScreenshot: String,
    rejectionReason: String,

    lockedLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger"
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
