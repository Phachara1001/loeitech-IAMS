import * as activityLogRepository from '../repositories/activityLogRepository.js';

export const getAllLogs = async () => {
  const logs = await activityLogRepository.findAll();

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    ipAddress: log.ipAddress,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt,
    userName: log.user?.name || log.user?.username || 'ระบบ'
  }));
};