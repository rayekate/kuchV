// models/AdminWallet.js
import mongoose from "mongoose";

const adminWalletSchema = new mongoose.Schema(
  {
    coin: {
      type: String,
      required: true
    },

    network: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    logoUrl: {
      type: String,
      default: '' // or null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

adminWalletSchema.index({ coin: 1, network: 1 }, { unique: true });

export default mongoose.model("AdminWallet", adminWalletSchema);
