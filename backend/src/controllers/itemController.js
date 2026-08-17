import * as itemService from '../services/itemService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: API สำหรับจัดการทะเบียนวัสดุสิ้นเปลือง (InventoryStock)
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: ดึงรายการวัสดุทั้งหมด
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: ค้นหาตามชื่อหรือรหัส (SKU)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: กรองตามหมวดหมู่
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getItems = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const items = await itemService.getAllItems({ search, category });
    res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: ดึงข้อมูลวัสดุตาม ID
 *     tags: [Items]
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
export const getItemById = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: เพิ่มวัสดุสิ้นเปลืองใหม่
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, unit]
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               unit:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minThreshold:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 */
export const createItem = async (req, res, next) => {
  try {
    const newItem = await itemService.createItem(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'ITEM',
      entityId: newItem.id,
      newValue: newItem,
      details: `เพิ่มวัสดุสิ้นเปลือง "${newItem.name}" (${newItem.sku})`
    });

    res.status(201).json({ status: 'success', data: newItem, message: 'เพิ่มวัสดุสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลวัสดุ
 *     tags: [Items]
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
export const updateItem = async (req, res, next) => {
  try {
    const before = await itemService.getItemById(req.params.id);
    const updated = await itemService.updateItem(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'ITEM',
      entityId: updated.id,
      oldValue: before,
      newValue: updated,
      details: `แก้ไขวัสดุสิ้นเปลือง "${updated.name}" (${updated.sku})`
    });

    res.status(200).json({ status: 'success', data: updated, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: ลบวัสดุ
 *     tags: [Items]
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
export const deleteItem = async (req, res, next) => {
  try {
    const before = await itemService.getItemById(req.params.id);
    await itemService.deleteItem(req.params.id);

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'ITEM',
      entityId: before.id,
      oldValue: before,
      details: `ลบวัสดุสิ้นเปลือง "${before.name}" (${before.sku})`
    });

    res.status(200).json({ status: 'success', message: 'ลบวัสดุสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/items/{id}/transactions:
 *   get:
 *     summary: ดูประวัติ Running Balance ของวัสดุ
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: กรองเฉพาะปีที่ระบุ (ค.ศ.)
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getItemTransactions = async (req, res, next) => {
  try {
    const txs = await itemService.getItemTransactions(req.params.id, { year: req.query.year });
    res.status(200).json({ status: 'success', data: txs });
  } catch (error) {
    next(error);
  }
};