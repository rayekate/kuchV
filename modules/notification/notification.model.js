import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // null for global broadcast
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['system', 'deposit', 'withdrawal', 'ticket', 'broadcast', 'profit', 'security', 'info', 'success', 'warning', 'error'], 
    default: 'system' 
  },
  isGlobal: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);
