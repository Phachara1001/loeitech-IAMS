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
    where: {
      OR: [
        { status: { in: ELIGIBLE_STATUSES } },
        { components: { some: { status: { in: ELIGIBLE_STATUSES } } } }
      ]
    },
    select: {
      id: true,
      seq: true,
      name: true,
      status: true,
      department: true,
      unitPrice: true,
      location: { select: { building: true, name: true } },
      components: {
        where: { status: { in: ELIGIBLE_STATUSES } },
        select: { id: true, name: true, status: true }
      }
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
            { asset: { seq: { contains: search, mode: 'insensitive' } } },
            { assetComponent: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {},
    include: { 
      asset: { select: { seq: true, name: true } },
      assetComponent: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const findById = async (id) => {
  return await prisma.disposalRequest.findUnique({
    where: { id: Number(id) },
    include: { asset: true, assetComponent: true }
  });
};

/**
 * นับจำนวนคำขอที่สร้างไปแล้วในปีงบประมาณนี้ (สำหรับ generate เลขที่คำขอ)
 */
export const countByYearPrefix = async (prefix) => {
  const lastRequest = await prisma.disposalRequest.findFirst({
    where: { disposalCode: { startsWith: prefix } },
    orderBy: { disposalCode: 'desc' },
    select: { disposalCode: true }
  });

  if (!lastRequest) return 0;

  // prefix is something like "DSP-2569-"
  // lastRequest.disposalCode will be "DSP-2569-001"
  const parts = lastRequest.disposalCode.split('-');
  if (parts.length >= 3) {
    const lastNum = parseInt(parts[2], 10);
    return isNaN(lastNum) ? 0 : lastNum;
  }
  return 0;
};

export const create = async (data) => {
  return await prisma.disposalRequest.create({
    data,
    include: { 
      asset: { select: { seq: true, name: true, unitPrice: true } },
      assetComponent: { select: { name: true } }
    }
  });
};

export const createMany = async (dataArray) => {
  return await prisma.disposalRequest.createMany({
    data: dataArray
  });
};

export const updateStatus = async (id, data) => {
  return await prisma.disposalRequest.update({
    where: { id: Number(id) },
    data,
    include: { 
      asset: { select: { seq: true, name: true, unitPrice: true } },
      assetComponent: { select: { name: true } }
    }
  });
};

export const updateStatusByDisposalCode = async (disposalCode, data) => {
  return await prisma.disposalRequest.updateMany({
    where: { disposalCode },
    data
  });
};

export const findByDisposalCode = async (disposalCode) => {
  return await prisma.disposalRequest.findMany({
    where: { disposalCode },
    include: { 
      asset: { select: { id: true, seq: true, name: true, unitPrice: true } },
      assetComponent: { select: { id: true, name: true } }
    }
  });
};

export const markDisposedWithAssetUpdate = async (id, assetId, assetComponentId = null) => {
  const transactions = [
    prisma.disposalRequest.update({
      where: { id: Number(id) },
      data: { status: 'DISPOSED', disposedAt: new Date() },
      include: { asset: { select: { seq: true, name: true } } }
    })
  ];

  if (assetComponentId) {
    transactions.push(
      prisma.assetComponent.update({
        where: { id: Number(assetComponentId) },
        data: { status: 'Scrapped' }
      })
    );
    // You could also check if all components are scrapped here, but keeping it simple for now
    transactions.push(
      prisma.asset.update({
        where: { id: Number(assetId) },
        data: { status: 'Partially Disposed' }
      })
    );
  } else {
    transactions.push(
      prisma.asset.update({
        where: { id: Number(assetId) },
        data: { status: 'Scrapped' }
      })
    );
  }

  return await prisma.$transaction(transactions);
};

/**
 * บันทึกจำหน่ายแล้วแบบกลุ่ม
 */
export const markDisposedBatchWithAssetUpdate = async (disposalCode, assetIds) => {
  const transactions = [
    prisma.disposalRequest.updateMany({
      where: { disposalCode },
      data: { status: 'DISPOSED', disposedAt: new Date() }
    })
  ];
  
  for (const assetId of assetIds) {
    transactions.push(
      prisma.asset.update({
        where: { id: Number(assetId) },
        data: { status: 'Scrapped' }
      })
    );
  }
  
  return await prisma.$transaction(transactions);
};