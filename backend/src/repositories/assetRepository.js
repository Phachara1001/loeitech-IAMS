import prisma from '../prisma/index.js';

/**
 * ดึงข้อมูลครุภัณฑ์ทั้งหมด
 */
export const findAll = async () => {
  return await prisma.asset.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * ดึงข้อมูลครุภัณฑ์ตาม ID
 */
export const findById = async (id) => {
  return await prisma.asset.findUnique({
    where: { id: Number(id) }
  });
};

/**
 * สร้างครุภัณฑ์ใหม่
 */
export const create = async (data) => {
  return await prisma.asset.create({
    data
  });
};

/**
 * อัปเดตข้อมูลครุภัณฑ์
 */
export const update = async (id, data) => {
  return await prisma.asset.update({
    where: { id: Number(id) },
    data
  });
};

/**
 * ลบข้อมูลครุภัณฑ์
 */
export const remove = async (id) => {
  return await prisma.asset.delete({
    where: { id: Number(id) }
  });
};

/**
 * หาข้อมูลครุภัณฑ์ล่าสุด (เพื่อเอาไปทำเลข Sequence)
 */
export const findLatestAsset = async () => {
  return await prisma.asset.findFirst({
    orderBy: { id: 'desc' }
  });
};
