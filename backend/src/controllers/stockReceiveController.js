import * as stockReceiveService from '../services/stockReceiveService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: StockReceive
 *   description: API สำหรับบันทึกการรับพัสดุเข้าคลัง (InventoryReceive)
 */

/**
 * @swagger
 * /api/stock-receive:
 *   post:
 *     summary: บันทึกการรับพัสดุเข้าคลัง
 *     tags: [StockReceive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemSourceType, qty, receivedDate]
 *             properties:
 *               itemSourceType:
 *                 type: string
 *                 enum: [EXISTING, NEW]
 *                 description: EXISTING = วัสดุเดิม, NEW = วัสดุใหม่
 *               selectedItemId:
 *                 type: integer
 *                 description: ID ของวัสดุเดิม (ใช้เมื่อ itemSourceType = EXISTING)
 *               newItemName:
 *                 type: string
 *                 description: ชื่อวัสดุใหม่ (ใช้เมื่อ itemSourceType = NEW)
 *               newItemCategory:
 *                 type: string
 *               newItemUnit:
 *                 type: string
 *               qty:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               acquisitionMethod:
 *                 type: string
 *               budgetType:
 *                 type: string
 *               remark:
 *                 type: string
 *               operatorName:
 *                 type: string
 *     responses:
 *       201:
 *         description: บันทึกสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       404:
 *         description: ไม่พบวัสดุที่เลือก
 */
export const receiveStock = async (req, res, next) => {
  try {
    const result = await stockReceiveService.receiveStock(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'ITEM',
      entityId: result?.item?.id ?? result?.id ?? null,
      newValue: result,
      details: result.isNew
        ? `รับวัสดุใหม่เข้าคลัง "${req.body.newItemName || result?.item?.name || ''}" จำนวน ${req.body.qty}`
        : `รับวัสดุเข้าคลัง (Item ID: ${req.body.selectedItemId}) จำนวน ${req.body.qty}`
    });

    res.status(201).json({
      status: 'success',
      data: result,
      message: result.isNew
        ? 'บันทึกรับวัสดุใหม่เข้าคลังสำเร็จ'
        : 'บันทึกรับวัสดุเข้าคลังสำเร็จ'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/stock-receive:
 *   get:
 *     summary: ดูประวัติการรับพัสดุเข้าคลังล่าสุด
 *     tags: [StockReceive]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getRecentReceives = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await stockReceiveService.getRecentReceives(limit);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};