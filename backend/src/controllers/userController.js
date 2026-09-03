import * as userService from '../services/userService.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API สำหรับจัดการโปรไฟล์ของผู้ใช้งานที่ล็อกอินอยู่
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: ดึงข้อมูลโปรไฟล์ของผู้ใช้งานปัจจุบัน
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       401:
 *         description: ยังไม่ได้เข้าสู่ระบบ
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: แก้ไขข้อมูลโปรไฟล์ (ชื่อ, เบอร์โทรศัพท์, ตำแหน่ง)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
export const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ status: 'success', data: user, message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: อัปโหลด/เปลี่ยนรูปโปรไฟล์
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: อัปโหลดสำเร็จ
 *       400:
 *         description: ไม่มีไฟล์แนบ
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    const user = await userService.updateAvatar(req.user.id, req.file);
    res.status(200).json({ status: 'success', data: user, message: 'เปลี่ยนรูปโปรไฟล์สำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสผ่านปัจจุบัน)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *       400:
 *         description: รหัสผ่านปัจจุบันไม่ถูกต้อง หรือข้อมูลไม่ครบถ้วน
 */
export const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    res.status(200).json({ status: 'success', message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   Admin จัดการผู้ใช้งานคนอื่น (หน้าจัดการข้อมูลพื้นฐานระบบ)
   ========================================================== */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงรายชื่อผู้ใช้งานทั้งหมด (Admin เท่านั้น)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง
 */
export const listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Admin สร้างผู้ใช้งานใหม่ (ระบบส่งอีเมลเชิญให้ตั้งรหัสผ่านเอง)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       409:
 *         description: อีเมลถูกใช้งานแล้ว
 */
export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUserByAdmin(req.body);

    await logActivity({
      req,
      action: 'INSERT',
      entityType: 'USER',
      entityId: user.id,
      newValue: { name: user.name, email: user.email, username: user.username, role: user.role },
      details: `เพิ่มผู้ใช้งาน "${user.name}" (${user.email})`
    });

    res.status(201).json({
      status: 'success',
      data: user,
      message: 'สร้างผู้ใช้งานสำเร็จ ระบบได้ส่งอีเมลเชิญตั้งรหัสผ่านไปให้แล้ว'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Admin แก้ไขข้อมูลผู้ใช้งานคนอื่น (ชื่อ, อีเมล, ระดับสิทธิ์)
 *     tags: [Users]
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
export const updateUserById = async (req, res, next) => {
  try {
    const before = await userService.getProfile(req.params.id);
    const user = await userService.updateUserByAdmin(req.params.id, req.body);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      oldValue: { name: before.name, email: before.email, role: before.role },
      newValue: { name: user.name, email: user.email, role: user.role },
      details: `แก้ไขผู้ใช้งาน "${user.name}"`
    });

    res.status(200).json({ status: 'success', data: user, message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}/approve:
 *   patch:
 *     summary: Admin อนุมัติบัญชีผู้ใช้งานที่รออนุมัติ (PENDING → ACTIVE)
 *     tags: [Users]
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
 *         description: อนุมัติสำเร็จ
 */
export const approveUserById = async (req, res, next) => {
  try {
    const before = await userService.getProfile(req.params.id);
    const user = await userService.approveUser(req.params.id);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      oldValue: { accountStatus: before.accountStatus },
      newValue: { accountStatus: user.accountStatus },
      details: `อนุมัติบัญชีผู้ใช้งาน "${user.name}" (${user.email})`
    });

    res.status(200).json({ status: 'success', data: user, message: 'อนุมัติบัญชีผู้ใช้งานสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}/reject:
 *   patch:
 *     summary: Admin ไม่อนุมัติบัญชีผู้ใช้งานที่รออนุมัติ (PENDING → REJECTED)
 *     tags: [Users]
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
 *         description: บันทึกการไม่อนุมัติสำเร็จ
 */
export const rejectUserById = async (req, res, next) => {
  try {
    const before = await userService.getProfile(req.params.id);
    const user = await userService.rejectUser(req.params.id);

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      oldValue: { accountStatus: before.accountStatus },
      newValue: { accountStatus: user.accountStatus },
      details: `ไม่อนุมัติบัญชีผู้ใช้งาน "${user.name}" (${user.email})`
    });

    res.status(200).json({ status: 'success', data: user, message: 'บันทึกการไม่อนุมัติบัญชีแล้ว' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Admin ลบผู้ใช้งาน
 *     tags: [Users]
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
export const deleteUserById = async (req, res, next) => {
  try {
    const before = await userService.getProfile(req.params.id);
    await userService.deleteUserByAdmin(req.params.id);

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'USER',
      entityId: before.id,
      oldValue: { name: before.name, email: before.email, role: before.role },
      details: `ลบผู้ใช้งาน "${before.name}" (${before.email})`
    });

    res.status(200).json({ status: 'success', message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    next(error);
  }
};