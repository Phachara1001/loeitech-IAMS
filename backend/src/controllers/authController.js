import * as authService from '../services/authService.js';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API สำหรับการยืนยันตัวตน สมัครสมาชิก และจัดการรหัสผ่าน
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิกใหม่
 *     tags: [Auth]
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
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       409:
 *         description: อีเมลนี้ถูกใช้งานแล้ว
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: user, message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: กรอกได้ทั้งชื่อผู้ใช้งานหรืออีเมล
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ ส่งคืน JWT token
 *       401:
 *         description: ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ status: 'success', data: result, message: 'เข้าสู่ระบบสำเร็จ' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: ขอรหัสยืนยันเพื่อตั้งรหัสผ่านใหม่ (ระบบจะส่งรหัสไปยังอีเมลที่ระบุ)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: ส่งคำขอสำเร็จ (ระบบจะส่งอีเมลไปให้หากมีบัญชีนี้อยู่จริงในระบบ)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัสยืนยันไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: ตั้งรหัสผ่านใหม่ด้วยรหัสยืนยันที่ได้รับทางอีเมล
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: ตั้งรหัสผ่านใหม่สำเร็จ
 *       400:
 *         description: รหัสยืนยันไม่ถูกต้องหรือหมดอายุ
 */
export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json({ status: 'success', message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง' });
  } catch (error) {
    next(error);
  }
};