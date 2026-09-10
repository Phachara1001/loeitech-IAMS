import prisma from '../prisma/index.js';

/**
 * ดึงข้อมูลครุภัณฑ์ทั้งหมด
 */
export const findAll = async () => {
  return await prisma.asset.findMany({
    include: {
      distributions: {
        where: { isCurrent: true },
        include: { responsiblePerson: true }
      }
    },
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
 * สร้างครุภัณฑ์แบบชุด (Batch)
 */
export const createBatch = async (dataArray) => {
  return await prisma.asset.createMany({
    data: dataArray,
    skipDuplicates: true // ป้องกัน error ถ้ารหัสซ้ำบางรายการ (แล้วแต่ policy แต่ใส่ไว้ปลอดภัยกว่า)
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
  const assetId = Number(id);
  // ลบข้อมูลที่เกี่ยวข้องใน transaction เดียวกันเพื่อป้องกันปัญหา Foreign key constraint
  return await prisma.$transaction([
    prisma.assetDistribution.deleteMany({ where: { assetId } }),
    prisma.borrowTransaction.deleteMany({ where: { assetId } }),
    prisma.repairRequest.deleteMany({ where: { assetId } }),
    prisma.disposalRequest.deleteMany({ where: { assetId } }),
    prisma.asset.delete({ where: { id: assetId } })
  ]);
};

/**
 * หาข้อมูลครุภัณฑ์ล่าสุด (เพื่อเอาไปทำเลข Sequence)
 */
export const findLatestAsset = async () => {
  return await prisma.asset.findFirst({
    orderBy: { id: 'desc' }
  });
};

export const findTimelineData = async (id) => {
  const assetId = Number(id);
  const [asset, distributions, borrows, repairs] = await Promise.all([
    prisma.asset.findUnique({ where: { id: assetId } }),
    prisma.assetDistribution.findMany({
      where: { assetId },
      include: { responsiblePerson: { select: { name: true } } },
      orderBy: { assignDate: 'asc' }
    }),
    prisma.borrowTransaction.findMany({
      where: { assetId },
      orderBy: { borrowDate: 'asc' }
    }),
    prisma.repairRequest.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  return { asset, distributions, borrows, repairs };
};

