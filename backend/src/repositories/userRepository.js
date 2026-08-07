import prisma from '../prisma/index.js';

/**
 * หาผู้ใช้งานจาก ID
 */
export const findById = async (id) => {
  return await prisma.user.findUnique({ where: { id: Number(id) } });
};

/**
 * หาผู้ใช้งานจากอีเมล (ใช้เช็คอีเมลซ้ำตอน Admin สร้างผู้ใช้ใหม่)
 */
export const findByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

/**
 * หาผู้ใช้งานจากชื่อผู้ใช้งาน (ใช้ตอนสุ่ม username ให้ไม่ซ้ำ)
 */
export const findByUsername = async (username) => {
  return await prisma.user.findUnique({ where: { username } });
};

/**
 * ดึงผู้ใช้งานทั้งหมด (สำหรับหน้าจัดการผู้ใช้งาน — Admin เท่านั้น)
 */
export const findAll = async () => {
  return await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
};

/**
 * สร้างผู้ใช้งานใหม่ (Admin เป็นคนสร้างให้)
 */
export const create = async (data) => {
  return await prisma.user.create({ data });
};

/**
 * อัปเดตข้อมูลผู้ใช้งาน (ใช้ได้ทั้งแก้โปรไฟล์, เปลี่ยนรูป, เปลี่ยนรหัสผ่าน, และ Admin แก้ผู้ใช้อื่น)
 */
export const update = async (id, data) => {
  return await prisma.user.update({
    where: { id: Number(id) },
    data
  });
};

/**
 * ลบผู้ใช้งาน (Admin เท่านั้น)
 */
export const remove = async (id) => {
  return await prisma.user.delete({ where: { id: Number(id) } });
};