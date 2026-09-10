import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authRepository from '../repositories/authRepository.js';
import { sendMail } from '../config/mailer.js';

const SALT_ROUNDS = 10;
const RESET_CODE_EXPIRY_MINUTES = 15;

/**
 * สุ่มรหัสยืนยัน 6 หลัก สำหรับฟีเจอร์ลืมรหัสผ่าน
 */
const generateResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * สร้าง username อัตโนมัติจากอีเมล (เพราะฟอร์มสมัครสมาชิกฝั่ง frontend ไม่มีช่องกรอก username)
 * ถ้าชื่อซ้ำ จะต่อท้ายด้วยตัวเลขสุ่มจนกว่าจะไม่ซ้ำ
 */
const generateUniqueUsername = async (email) => {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
  let username = base;
  let attempt = 0;

  while (await authRepository.findByUsername(username)) {
    attempt += 1;
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    if (attempt > 10) {
      username = `${base}${Date.now()}`;
      break;
    }
  }

  return username;
};

/**
 * ตัดข้อมูลที่ไม่ควรส่งกลับให้ client (รหัสผ่าน) ออกจาก object ผู้ใช้งาน
 */
const toSafeUser = (user) => {
  const { password, resetPasswordExpires, ...safeUser } = user;
  return safeUser;
};

/**
 * สมัครสมาชิกใหม่
 */
export const register = async ({ name, email, password }) => {
  const existingEmail = await authRepository.findByEmail(email);
  if (existingEmail) {
    const err = new Error('อีเมลนี้ถูกใช้งานแล้ว');
    err.status = 409;
    throw err;
  }

  const username = await generateUniqueUsername(email);
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepository.create({
    name,
    email,
    username,
    password: hashedPassword,
    role: 'USER',
    accountStatus: 'PENDING' // สมัครเองต้องรอ Admin อนุมัติก่อน ถึงจะ login ได้
  });

  return toSafeUser(user);
};

/**
 * เข้าสู่ระบบ (รองรับกรอกได้ทั้ง username หรือ email)
 */
export const login = async ({ username, password }) => {
  const user =
    (await authRepository.findByUsername(username)) ||
    (await authRepository.findByEmail(username));

  if (!user) {
    const err = new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    err.status = 401;
    throw err;
  }

  if (user.accountStatus === 'PENDING') {
    const err = new Error('บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอการอนุมัติก่อนเข้าสู่ระบบ');
    err.status = 403;
    throw err;
  }
  if (user.accountStatus === 'REJECTED') {
    const err = new Error('บัญชีของคุณไม่ได้รับการอนุมัติให้ใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ');
    err.status = 403;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { user: toSafeUser(user), token, refreshToken };
};

/**
 * ขอตั้งรหัสผ่านใหม่
 * เปลี่ยนสถานะเป็น PENDING เพื่อรอ Admin อนุมัติ (ไม่มีการส่งอีเมล)
 */
export const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);
  if (!user) return null; // ป้องกัน User Enumeration

  if (user.resetPasswordCode === 'APPROVED') {
    return 'ALREADY_APPROVED';
  }

  await authRepository.setResetCode(user.id, 'PENDING', null);
  return 'PENDING';
};

/**
 * ตั้งรหัสผ่านใหม่ (ต้องได้รับการอนุมัติจาก Admin ก่อน คือ resetPasswordCode === 'APPROVED')
 */
export const resetPassword = async ({ email, newPassword }) => {
  const user = await authRepository.findByEmail(email);

  if (!user || user.resetPasswordCode !== 'APPROVED') {
    const err = new Error('คำขอตั้งรหัสผ่านใหม่ของคุณยังไม่ได้รับการอนุมัติ หรือคำขอไม่ถูกต้อง');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updatePassword(user.id, hashedPassword);
  await authRepository.clearResetCode(user.id);
};