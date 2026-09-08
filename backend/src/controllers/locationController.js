import * as locationService from '../services/locationService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: API สำหรับจัดการข้อมูลอาคารและห้อง
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: ดึงรายชื่ออาคาร/ห้องทั้งหมด
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getLocations = async (req, res, next) => {
  try {
    const locations = await locationService.getAllLocations();
    res.status(200).json({ status: 'success', data: locations });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: เพิ่มอาคาร/ห้องใหม่ (Admin เท่านั้น)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               building:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       409:
 *         description: ห้องนี้ในอาคารนี้มีอยู่แล้ว
 */
export const createLocation = async (req, res, next) => {
  try {
    const location = await locationService.createLocation(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'LOCATION',
      entityId: location.id,
      newValue: location,
      details: `เพิ่มอาคาร/ห้อง "${location.building || ''} ${location.name}"`
    });

    res.status(201).json({ status: 'success', data: location, message: 'เพิ่มอาคาร/ห้องสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: แก้ไขอาคาร/ห้อง (Admin เท่านั้น)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 */
export const updateLocation = async (req, res, next) => {
  try {
    const before = await locationService.getLocationById(req.params.id);
    const location = await locationService.updateLocation(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'LOCATION',
      entityId: location.id,
      oldValue: before,
      newValue: location,
      details: `แก้ไขอาคาร/ห้อง "${location.building || ''} ${location.name}"`
    });

    res.status(200).json({ status: 'success', data: location, message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: ลบอาคาร/ห้อง (Admin เท่านั้น)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const before = await locationService.getLocationById(req.params.id);
    await locationService.deleteLocation(req.params.id);

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'LOCATION',
      entityId: before.id,
      oldValue: before,
      details: `ลบอาคาร/ห้อง "${before.building || ''} ${before.name}"`
    });

    res.status(200).json({ status: 'success', message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};