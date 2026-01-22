// modules/ticket/ticket.model.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      enum: ["WITHDRAWAL", "DEPOSIT", "GENERAL"],
      required: true
    },

    subject: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },

    relatedRefId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
      // withdrawalId (optional)
    },

    messages: [
      {
        senderRole: {
          type: String,
          enum: ["USER", "ADMIN"],
          required: true
        },
        message: {
          type: String,
          required: true
        },
        sentAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
