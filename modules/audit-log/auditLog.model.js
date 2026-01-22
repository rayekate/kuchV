// models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true
    },

    entity: {
      type: String,
      required: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },

    before: {
      type: Object
    },

    after: {
      type: Object
    },

    ip: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
