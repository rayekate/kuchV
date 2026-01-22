// src/modules/audit-log/auditLog.service.js
import AuditLog from "./auditLog.model.js";

export const logAdminAction = async ({
  adminId,
  action,
  entity,
  entityId,
  before,
  after,
  session
}) => {
  await AuditLog.create(
    [{
      adminId,
      action,
      entity,
      entityId,
      before,
      after
    }],
    { session }
  );
};
