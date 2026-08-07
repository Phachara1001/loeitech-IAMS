import * as departmentService from '../services/departmentService.js';

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: API สำหรับจัดการข้อมูลหน่วยงาน/ฝ่าย
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: ดึงรายชื่อหน่วยงาน/ฝ่ายทั้งหมด
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(200).json({ status: 'success', data: departments });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: เพิ่มหน่วยงาน/ฝ่ายใหม่ (Admin เท่านั้น)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       409:
 *         description: รหัสหรือชื่อซ้ำ
 */
export const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({ status: 'success', data: department, message: 'เพิ่มหน่วยงาน/ฝ่ายสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: แก้ไขหน่วยงาน/ฝ่าย (Admin เท่านั้น)
 *     tags: [Departments]
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
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: department, message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: ลบหน่วยงาน/ฝ่าย (Admin เท่านั้น)
 *     tags: [Departments]
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
export const deleteDepartment = async (req, res, next) => {
  try {
    await departmentService.deleteDepartment(req.params.id);
    res.status(200).json({ status: 'success', message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    next(error);
  }
};