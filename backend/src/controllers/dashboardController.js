import * as dashboardService from '../services/dashboardService.js';

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: ดึงข้อมูลสรุปทั้งหมดสำหรับหน้าแดชบอร์ด (สถิติการ์ด, กราฟรายเดือน, กิจกรรมล่าสุด)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getOverview();
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}