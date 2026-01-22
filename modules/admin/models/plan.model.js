import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    dailyRoi: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    minDeposit: { type: Number, required: true },
    maxDeposit: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    isRecommended: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
