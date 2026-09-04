import prisma from '../prisma/index.js';

/**
 * ดึงวัสดุสิ้นเปลืองทั้งหมด (รองรับ query: search, category)
 */
export const findAll = async ({ search = '', category = '' } = {}) => {
  return await prisma.item.findMany({
    where: {
      AND: [
        { isDeleted: false },
        category ? { category } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {}
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * ดึงวัสดุตาม ID (ไม่รวมรายการที่ถูกลบแบบ Soft Delete ไปแล้ว)
 */
export const findById = async (id) => {
  return await prisma.item.findFirst({
    where: { id: Number(id), isDeleted: false }
  });
};

/**
 * สร้างวัสดุใหม่
 */
export const create = async (data) => {
  return await prisma.item.create({ data });
};

/**
 * อัปเดตข้อมูลวัสดุ
 */
export const update = async (id, data) => {
  return await prisma.item.update({
    where: { id: Number(id) },
    data
  });
};

/**
 * Soft Delete วัสดุ — ซ่อนออกจากรายการแทนการลบจริง เพื่อไม่ให้กระทบ
 * ประวัติ stock transaction ที่อาจผูกอยู่ (ป้องกัน foreign key constraint error)
 */
export const softDelete = async (id) => {
  return await prisma.item.update({
    where: { id: Number(id) },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

/**
 * ดึงวัสดุล่าสุด (สำหรับ generate SKU)
 */
export const findLatestItem = async () => {
  return await prisma.item.findFirst({
    orderBy: { id: 'desc' }
  });
};

/**
 * ดึงประวัติ stock transaction ของวัสดุรายการหนึ่ง (Running Balance)
 * รองรับกรองตามปี (ค.ศ.) ของ receivedDate ที่ database เลย แทนที่จะดึงทั้งหมดมากรองฝั่ง frontend
 * @param {number|string} itemId
 * @param {object} [options]
 * @param {number|string} [options.year] - ปี ค.ศ. เช่น 2026 (ไม่ส่งมา = ดึงทุกปี)
 */
export const findTransactionsByItemId = async (itemId, { year } = {}) => {
  const where = { itemId: Number(itemId) };

  if (year) {
    const yearNum = Number(year);
    where.receivedDate = {
      gte: new Date(yearNum, 0, 1),
      lt: new Date(yearNum + 1, 0, 1)
    };
  }

  return await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * ดึงประวัติ stock transaction ของวัสดุทั้งหมด
 */
export const findAllTransactions = async ({ year } = {}) => {
  const where = {};
  if (year) {
    const yearNum = Number(year);
    where.receivedDate = {
      gte: new Date(yearNum, 0, 1),
      lt: new Date(yearNum + 1, 0, 1)
    };
  }
  return await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { item: { select: { sku: true, name: true, unit: true } } }
  });
};

/**
 * บันทึก StockTransaction ประเภท ADJUSTMENT (ผลตรวจนับ)
 */
export const createAdjustmentTransaction = async ({ itemId, quantity, remark, operatorName }) => {
  return await prisma.stockTransaction.create({
    data: {
      itemId: Number(itemId),
      transactionType: 'ADJUSTMENT',
      quantity: Number(quantity),
      unitPrice: 0,
      totalPrice: 0,
      remarks: remark || null,
      operatorName: operatorName || null,
      receivedDate: new Date()
    }
  });
};