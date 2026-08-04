import prisma from '../prisma/index.js';

/**
 * หาผู้ใช้งานจากอีเมล
 */
export const findByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

/**
 * หาผู้ใช้งานจากชื่อผู้ใช้งาน
 */
export const findByUsername = async (username) => {
  return await prisma.user.findUnique({ where: { username } });
};

/**
 * หาผู้ใช้งานจาก ID
 */
export const findById = async (id) => {
  return await prisma.user.findUnique({ where: { id: Number(id) } });
};

/**
 * สร้างผู้ใช้งานใหม่
 */
export const create = async (data) => {
  return await prisma.user.create({ data });
};

/**
 * อัปเดตรหัสผ่าน (ต้อง hash มาก่อนแล้ว)
 */
export const updatePassword = async (id, hashedPassword) => {
  return await prisma.user.update({
    where: { id: Number(id) },
    data: { password: hashedPassword }
  });
};

/**
 * บันทึกรหัสยืนยันสำหรับลืมรหัสผ่าน พร้อมเวลาหมดอายุ
 */
export const setResetCode = async (id, code, expiresAt) => {
  return await prisma.user.update({
    where: { id: Number(id) },
    data: { resetPasswordCode: code, resetPasswordExpires: expiresAt }
  });
};

/**
 * ล้างรหัสยืนยัน หลังจากตั้งรหัสผ่านใหม่สำเร็จ (หรือรหัสหมดอายุ)
 */
export const clearResetCode = async (id) => {
  return await prisma.user.update({
    where: { id: Number(id) },
    data: { resetPasswordCode: null, resetPasswordExpires: null }
  });
};