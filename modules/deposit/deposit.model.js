// models/Deposit.js
import mongoose from "mongoose";

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    coin: {
      type: String,
      required: true
    },
    
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },

    network: {
      type: String,
      required: true
    },

    claimedAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },

    screenshotUrl: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    approvedAmount: {
      type: mongoose.Schema.Types.Decimal128
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
        },
        txHash: {
            type: String,
            trim: true,
            index: true
          },
          
          paymentLink: {
            type: String,
            trim: true
          },

    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Deposit", depositSchema);
