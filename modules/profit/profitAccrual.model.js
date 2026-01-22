import mongoose from "mongoose";

const profitAccrualSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: "Deposit", required: false, unique: true, sparse: true },

    principalUSD: { type: Number, required: true },
    profitPercent: { type: Number, required: true },
    intervalHours: { type: Number, required: true },
    durationDays: { type: Number, required: true },

    startAt: { type: Date, required: true },
    nextProfitAt: { type: Date, required: true, index: true },

    totalCredited: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "COMPLETED"], default: "ACTIVE", index: true }
  },
  { timestamps: true }
);

export default mongoose.model("ProfitAccrual", profitAccrualSchema);
