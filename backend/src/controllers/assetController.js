import * as assetService from '../services/assetService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: API สำหรับจัดการข้อมูลครุภัณฑ์
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: ดึงข้อมูลครุภัณฑ์ทั้งหมด
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: สำเร็จ ส่งคืนรายการครุภัณฑ์
 */
export const getAssets = async (req, res, next) => {
  try {
    const assets = await assetService.getAllAssets();
    res.status(200).json({ status: 'success', data: assets });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: ดึงข้อมูลครุภัณฑ์ตาม ID
 *     tags: [Assets]
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
export const getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    res.status(200).json({ status: 'success', data: asset });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: เพิ่มข้อมูลครุภัณฑ์ใหม่
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               department:
 *                 type: string
 *               acquiredDate:
 *                 type: string
 *                 format: date
 *               acquisitionMethod:
 *                 type: string
 *               budgetType:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
export const createAsset = async (req, res, next) => {
  try {
    const newAsset = await assetService.createAsset(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'ASSET',
      entityId: newAsset.id,
      newValue: newAsset,
      details: `เพิ่มครุภัณฑ์ "${newAsset.name}" (${newAsset.seq})`
    });

    res.status(201).json({ status: 'success', data: newAsset, message: 'บันทึกครุภัณฑ์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลครุภัณฑ์
 *     tags: [Assets]
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
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 */
export const updateAsset = async (req, res, next) => {
  try {
    const before = await assetService.getAssetById(req.params.id);
    const updatedAsset = await assetService.updateAsset(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'ASSET',
      entityId: updatedAsset.id,
      oldValue: before,
      newValue: updatedAsset,
      details: `แก้ไขครุภัณฑ์ "${updatedAsset.name}" (${updatedAsset.seq})`
    });

    res.status(200).json({ status: 'success', data: updatedAsset, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: ลบข้อมูลครุภัณฑ์
 *     tags: [Assets]
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
export const deleteAsset = async (req, res, next) => {
  try {
    const before = await assetService.getAssetById(req.params.id);
    await assetService.deleteAsset(req.params.id);

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'ASSET',
      entityId: before.id,
      oldValue: before,
      details: `ลบครุภัณฑ์ "${before.name}" (${before.seq})`
    });

    res.status(200).json({ status: 'success', message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/assets/upload:
 *   post:
 *     summary: อัปโหลดรูปภาพครุภัณฑ์
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: อัปโหลดสำเร็จ
 *       400:
 *         description: ไม่มีไฟล์แนบ
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาแนบไฟล์รูปภาพ' });
    }
    const imageUrl = await assetService.uploadImageToMinio(req.file);
    res.status(200).json({ status: 'success', data: { imageUrl }, message: 'อัปโหลดรูปภาพสำเร็จ' });
  } catch (error) {
    next(error);
  }
};
