import * as requisitionService from '../services/requisitionService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: Requisitions
 *   description: API สำหรับระบบยื่นคำขอเบิกพัสดุสิ้นเปลือง (NewRequisition)
 */

/**
 * @swagger
 * /api/requisitions:
 *   get:
 *     summary: ดึงรายการคำขอเบิกทั้งหมด
 *     tags: [Requisitions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: กรองตามสถานะ
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getRequisitions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const data = await requisitionService.getAllRequisitions({ status });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/requisitions/{id}:
 *   get:
 *     summary: ดึงคำขอเบิกตาม ID
 *     tags: [Requisitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       404:
 *         description: ไม่พบข้อมูล
 */
export const getRequisitionById = async (req, res, next) => {
  try {
    const data = await requisitionService.getRequisitionById(req.params.id);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/requisitions:
 *   post:
 *     summary: ยื่นคำขอเบิกพัสดุใหม่
 *     tags: [Requisitions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, reason]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID ของวัสดุ
 *                     qty:
 *                       type: integer
 *                       description: จำนวนที่ขอเบิก
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: เหตุผลในการเบิกใช้
 *               requesterId:
 *                 type: integer
 *                 description: ID ผู้ยื่นคำขอ (optional)
 *     responses:
 *       201:
 *         description: ยื่นคำขอสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
export const createRequisition = async (req, res, next) => {
  try {
    req.body.requesterId = req.user?.id;
    const data = await requisitionService.createRequisition(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'REQUISITION',
      entityId: data.id,
      newValue: data,
      details: `ยื่นคำขอเบิกพัสดุ ${data.reqCode || ''} เหตุผล: ${req.body.reason}`
    });

    res.status(201).json({
      status: 'success',
      data,
      message: 'ยื่นคำขอเบิกพัสดุสำเร็จ'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/requisitions/{id}/approve:
 *   put:
 *     summary: อนุมัติคำขอเบิกพัสดุ (ตัด stock OUT อัตโนมัติ)
 *     tags: [Requisitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approvedBy]
 *             properties:
 *               approvedBy:
 *                 type: string
 *               remark:
 *                 type: string
 *               approvedQtyMap:
 *                 type: object
 *                 description: "{ [requisitionItemId]: approvedQty } ถ้าไม่ส่ง จะอนุมัติเต็มจำนวนที่ขอ"
 *     responses:
 *       200:
 *         description: อนุมัติสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง หรือสต๊อกไม่เพียงพอ
 *       404:
 *         description: ไม่พบคำขอ
 */
export const approveRequisition = async (req, res, next) => {
  try {
    req.body.approverId = req.user?.id;
    const before = await requisitionService.getRequisitionById(req.params.id);
    const data = await requisitionService.approveRequisition(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'REQUISITION',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `อนุมัติคำขอเบิกพัสดุ ${data.reqCode || ''} โดย ${req.body.approvedBy}`
    });

    res.status(200).json({
      status: 'success',
      data,
      message: 'อนุมัติคำขอเบิกพัสดุสำเร็จ'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/requisitions/{id}/reject:
 *   put:
 *     summary: ปฏิเสธคำขอเบิกพัสดุ
 *     tags: [Requisitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approvedBy]
 *             properties:
 *               approvedBy:
 *                 type: string
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: ปฏิเสธสำเร็จ
 */
export const rejectRequisition = async (req, res, next) => {
  try {
    const before = await requisitionService.getRequisitionById(req.params.id);
    const data = await requisitionService.rejectRequisition(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'REQUISITION',
      entityId: data.id,
      oldValue: before,
      newValue: data,
      details: `ปฏิเสธคำขอเบิกพัสดุ ${data.reqCode || ''} โดย ${req.body.approvedBy}`
    });

    res.status(200).json({
      status: 'success',
      data,
      message: 'ปฏิเสธคำขอเบิกพัสดุแล้ว'
    });
  } catch (error) {
    next(error);
  }
};