import mongoose from "mongoose";

const userPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    coin: String,
    network: String,
    investedAmount: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_CHANGE", "BLOCKED"],
      default: "ACTIVE"
    },
    lastCalculatedAt: Date
  },
  { timestamps: true }
);
export default mongoose.model("UserPlan", userPlanSchema);