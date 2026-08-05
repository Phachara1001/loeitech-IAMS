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
 * ตัดข้อมูลที่ไม่ควรส่งกลับให้ client (รหัสผ่าน, รหัสยืนยัน) ออกจาก object ผู้ใช้งาน
 */
const toSafeUser = (user) => {
  const { password, resetPasswordCode, resetPasswordExpires, ...safeUser } = user;
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
    role: 'USER'
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
 * ขอรหัสยืนยันเพื่อตั้งรหัสผ่านใหม่ (ส่งอีเมล)
 * หมายเหตุ: ถ้าไม่พบอีเมลในระบบ จะไม่ throw error และไม่ส่งอีเมล
 * เพื่อป้องกันการสุ่มเช็คว่าอีเมลไหนมีอยู่ในระบบบ้าง (user enumeration)
 */
export const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);
  if (!user) return;

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

  await authRepository.setResetCode(user.id, code, expiresAt);

  await sendMail({
    to: user.email,
    subject: 'รหัสยืนยันสำหรับตั้งรหัสผ่านใหม่ - ระบบบริหารครุภัณฑ์ (TCAIMS)',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F3D26; margin-bottom: 4px;">รีเซ็ตรหัสผ่าน</h2>
        <p style="color: #64748b; margin-top: 0;">ระบบบริหารครุภัณฑ์ · วิทยาลัยเทคนิค</p>
        <p>สวัสดีคุณ ${user.name || user.username},</p>
        <p>คุณได้ทำรายการขอตั้งรหัสผ่านใหม่ กรุณากรอกรหัสยืนยันด้านล่างนี้ในระบบ:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1B5E3C; text-align: center; background: #F6FAF7; padding: 16px; border-radius: 12px;">
          ${code}
        </p>
        <p style="color: #64748b; font-size: 14px;">รหัสนี้จะหมดอายุภายใน ${RESET_CODE_EXPIRY_MINUTES} นาที</p>
        <p style="color: #94a3b8; font-size: 13px;">หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านของคุณจะไม่ถูกเปลี่ยนแปลง</p>
      </div>
    `
  });
};

/**
 * ตั้งรหัสผ่านใหม่ด้วยรหัสยืนยันที่ได้รับทางอีเมล
 */
export const resetPassword = async ({ email, code, newPassword }) => {
  const user = await authRepository.findByEmail(email);

  if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
    const err = new Error('รหัสยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่');
    err.status = 400;
    throw err;
  }

  if (user.resetPasswordCode !== code) {
    const err = new Error('รหัสยืนยันไม่ถูกต้อง');
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.resetPasswordExpires)) {
    const err = new Error('รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updatePassword(user.id, hashedPassword);
  await authRepository.clearResetCode(user.id);
};