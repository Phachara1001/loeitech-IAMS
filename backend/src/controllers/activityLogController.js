import * as activityLogService from '../services/activityLogService.js';

/**
 * @swagger
 * tags:
 *   name: ActivityLogs
 *   description: API สำหรับดึงประวัติการใช้งานระบบ (Admin เท่านั้น)
 */

/**
 * @swagger
 * /api/activity-logs:
 *   get:
 *     summary: ดึงประวัติการใช้งานระบบทั้งหมด (Admin เท่านั้น)
 *     tags: [ActivityLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง
 */
export const getLogs = async (req, res, next) => {
  try {
    const logs = await activityLogService.getAllLogs();
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    next(error);
  }
};