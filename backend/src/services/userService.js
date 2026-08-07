import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as userRepository from '../repositories/userRepository.js';
import { minioClient, bucketName } from '../config/minio.js';
import { sendMail } from '../config/mailer.js';

const SALT_ROUNDS = 10;
const INVITE_CODE_EXPIRY_HOURS = 24;

/**
 * ตัดข้อมูลที่ไม่ควรส่งกลับให้ client (รหัสผ่าน, รหัสยืนยัน) ออกจาก object ผู้ใช้งาน
 */
const toSafeUser = (user) => {
  const { password, resetPasswordCode, resetPasswordExpires, ...safeUser } = user;
  return safeUser;
};

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้งานปัจจุบัน
 */
export const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('ไม่พบข้อมูลผู้ใช้งาน');
    err.status = 404;
    throw err;
  }
  return toSafeUser(user);
};

/**
 * แก้ไขข้อมูลโปรไฟล์ (เฉพาะ field ที่อนุญาตให้แก้เองได้)
 * หมายเหตุ: ไม่รวม email, username, role — เพื่อความปลอดภัย ห้ามแก้ผ่าน endpoint นี้
 */
export const updateProfile = async (userId, data) => {
  const allowedFields = ['name', 'phone', 'position'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const updated = await userRepository.update(userId, updateData);
  return toSafeUser(updated);
};

/**
 * อัปโหลด/เปลี่ยนรูปโปรไฟล์ ผ่าน MinIO (ใช้ pattern เดียวกับรูปครุภัณฑ์)
 */
export const updateAvatar = async (userId, file) => {
  if (!file) {
    const err = new Error('กรุณาแนบไฟล์รูปภาพ');
    err.status = 400;
    throw err;
  }

  const extension = file.originalname.split('.').pop();
  const fileName = `avatars/${crypto.randomUUID()}.${extension}`;

  await minioClient.putObject(
    bucketName,
    fileName,
    file.buffer,
    file.size,
    { 'Content-Type': file.mimetype }
  );

  const port = process.env.MINIO_PORT || '9000';
  const host = process.env.MINIO_ENDPOINT === 'minio' ? 'localhost' : (process.env.MINIO_ENDPOINT || 'localhost');
  const avatarUrl = `http://${host}:${port}/${bucketName}/${fileName}`;

  const updated = await userRepository.update(userId, { avatarUrl });
  return toSafeUser(updated);
};

/**
 * เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสผ่านปัจจุบันก่อนเสมอ)
 */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('ไม่พบข้อมูลผู้ใช้งาน');
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.update(userId, { password: hashedPassword });
};

/* ==========================================================
   ฟังก์ชันสำหรับ Admin จัดการผู้ใช้งานคนอื่น (หน้าจัดการข้อมูลพื้นฐานระบบ)
   ========================================================== */

/**
 * สร้าง username อัตโนมัติจากอีเมล (เหมือนตอนสมัครสมาชิกเอง) ถ้าซ้ำจะต่อเลขสุ่มให้
 */
const generateUniqueUsername = async (email) => {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
  let username = base;
  let attempt = 0;

  while (await userRepository.findByUsername(username)) {
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
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (Admin เท่านั้น)
 */
export const listUsers = async () => {
  const users = await userRepository.findAll();
  return users.map(toSafeUser);
};

/**
 * Admin สร้างผู้ใช้งานใหม่โดยตรง
 * เนื่องจากฟอร์มไม่มีช่องตั้งรหัสผ่าน ระบบจะ:
 *  1. สุ่มรหัสผ่านชั่วคราวเก็บไว้ก่อน (ผู้ใช้จะไม่มีวันเห็นรหัสนี้)
 *  2. สร้างรหัสยืนยัน 6 หลัก (อายุ 24 ชม.) แล้วส่งอีเมลเชิญให้ผู้ใช้ไปตั้งรหัสผ่านเองผ่านหน้า "ลืมรหัสผ่าน"
 */
export const createUserByAdmin = async ({ name, email, role }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error('อีเมลนี้ถูกใช้งานแล้ว');
    err.status = 409;
    throw err;
  }

  const username = await generateUniqueUsername(email);
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + INVITE_CODE_EXPIRY_HOURS * 60 * 60 * 1000);

  const user = await userRepository.create({
    name,
    email,
    username,
    password: hashedPassword,
    role: String(role || 'USER').toUpperCase(),
    resetPasswordCode: code,
    resetPasswordExpires: expiresAt
  });

  try {
    await sendMail({
      to: email,
      subject: 'บัญชีผู้ใช้งานระบบบริหารครุภัณฑ์ของท่านถูกสร้างแล้ว',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F3D26; margin-bottom: 4px;">ยินดีต้อนรับเข้าสู่ระบบ</h2>
          <p style="color: #64748b; margin-top: 0;">ระบบบริหารครุภัณฑ์ · วิทยาลัยเทคนิค</p>
          <p>สวัสดีคุณ ${name},</p>
          <p>ผู้ดูแลระบบได้สร้างบัญชีผู้ใช้งานให้ท่านแล้ว กรุณาตั้งรหัสผ่านของท่านเองโดยไปที่หน้า
          <strong>"ลืมรหัสผ่าน"</strong> ในหน้าเข้าสู่ระบบ แล้วกรอกอีเมลนี้พร้อมรหัสยืนยันด้านล่าง:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1B5E3C; text-align: center; background: #F6FAF7; padding: 16px; border-radius: 12px;">
            ${code}
          </p>
          <p style="color: #64748b; font-size: 14px;">รหัสนี้จะหมดอายุภายใน ${INVITE_CODE_EXPIRY_HOURS} ชั่วโมง</p>
          <p style="color: #94a3b8; font-size: 13px;">ชื่อผู้ใช้งานของท่านคือ: <strong>${username}</strong></p>
        </div>
      `
    });
  } catch (mailError) {
    // ถ้าส่งอีเมลไม่สำเร็จ (เช่น SMTP ยังไม่ได้ตั้งค่า) ไม่ต้อง throw ทับ เพราะบัญชีถูกสร้างสำเร็จแล้ว
    // แค่แจ้ง log ไว้เฉย ๆ ผู้ดูแลระบบยังสามารถให้รหัสยืนยันกับผู้ใช้ผ่านช่องทางอื่นได้
    console.error('ส่งอีเมลเชิญผู้ใช้งานใหม่ไม่สำเร็จ:', mailError.message);
  }

  return toSafeUser(user);
};

/**
 * Admin แก้ไขข้อมูลผู้ใช้งานคนอื่น (ชื่อ, อีเมล, ระดับสิทธิ์)
 */
export const updateUserByAdmin = async (id, data) => {
  const allowedFields = ['name', 'email', 'role'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'role' ? String(data[field]).toUpperCase() : data[field];
    }
  }

  try {
    const updated = await userRepository.update(id, updateData);
    return toSafeUser(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('อีเมลนี้ถูกใช้งานโดยผู้ใช้งานคนอื่นแล้ว');
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

/**
 * Admin ลบผู้ใช้งาน
 */
export const deleteUserByAdmin = async (id) => {
  await userRepository.remove(id);
};