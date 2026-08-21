import prisma from '../prisma/index.js';

// เงื่อนไข "รายการที่มีสิทธิ์จำหน่ายได้" — ชำรุด (Broken) หรือกำลังซ่อม (Repaired)
// ไม่รวม Active (ยังใช้งานปกติ) และไม่รวม Scrapped (จำหน่ายไปแล้ว)
// ปรับเงื่อนไขนี้ได้ถ้าต้องการนิยาม "มีสิทธิ์จำหน่าย" ต่างจากนี้
const ELIGIBLE_STATUSES = ['Broken', 'Repaired'];

/**
 * ดึงรายการครุภัณฑ์ที่มีสิทธิ์สร้างคำขอจำหน่ายได้ (สำหรับ dropdown ในฟอร์ม)
 */
export const findEligibleAssets = async () => {
  return await prisma.asset.findMany({
    where: { status: { in: ELIGIBLE_STATUSES } },
    select: {
      id: true,
      seq: true,
      name: true,
      status: true,
      department: true,
      location: { select: { building: true, name: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
};

/**
 * ดึงคำขอจำหน่ายทั้งหมด (รองรับค้นหาจากชื่อครุภัณฑ์หรือรหัสคำขอ)
 */
export const findAll = async ({ search = '' } = {}) => {
  return await prisma.disposalRequest.findMany({
    where: search
      ? {
          OR: [
            { disposalCode: { contains: search, mode: 'insensitive' } },
            { asset: { name: { contains: search, mode: 'insensitive' } } },
            { asset: { seq: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {},
    include: { asset: { select: { seq: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const findById = async (id) => {
  return await prisma.disposalRequest.findUnique({
    where: { id: Number(id) },
    include: { asset: true }
  });
};

/**
 * นับจำนวนคำขอที่สร้างไปแล้วในปีงบประมาณนี้ (สำหรับ generate เลขที่คำขอ)
 */
export const countByYearPrefix = async (prefix) => {
  return await prisma.disposalRequest.count({
    where: { disposalCode: { startsWith: prefix } }
  });
};

export const create = async (data) => {
  return await prisma.disposalRequest.create({
    data,
    include: { asset: { select: { seq: true, name: true } } }
  });
};

export const updateStatus = async (id, data) => {
  return await prisma.disposalRequest.update({
    where: { id: Number(id) },
    data,
    include: { asset: { select: { seq: true, name: true } } }
  });
};

/**
 * บันทึกจำหน่ายแล้ว + ตัดยอด Asset.status เป็น Scrapped พร้อมกันในธุรกรรมเดียว (atomic)
 */
export const markDisposedWithAssetUpdate = async (id, assetId) => {
  return await prisma.$transaction([
    prisma.disposalRequest.update({
      where: { id: Number(id) },
      data: { status: 'DISPOSED', disposedAt: new Date() },
      include: { asset: { select: { seq: true, name: true } } }
    }),
    prisma.asset.update({
      where: { id: Number(assetId) },
      data: { status: 'Scrapped' }
    })
  ]);
};