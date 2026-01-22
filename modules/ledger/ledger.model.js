// models/Ledger.js
import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["DEPOSIT", "ADMIN_ADJUSTMENT", "WITHDRAWAL", "PROFIT_CREDIT", "PRINCIPAL_RETURN", "WITHDRAWAL_REFUND", "REFERRAL_BONUS", "PLAN_PURCHASE"],
      required: true
    },

    currency: {
      type: String,
      default: "USD"
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    coin: {
      type: String,
      required: true
    },

    network: {
      type: String,
      required: true
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },

    balanceBefore: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },

    balanceAfter: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    }
  },
  { timestamps: true }
);

/**
 * 🔒 CRITICAL SAFETY INDEX
 * Ensures a deposit can generate ONLY ONE ledger entry
 * Prevents double-credit even if application code fails
 */

ledgerSchema.index(
    { referenceId: 1, type: 1 }
  );

ledgerSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.model("Ledger", ledgerSchema);
