import prisma from '../prisma/index.js';

/**
 * ดึงวัสดุสิ้นเปลืองทั้งหมด (รองรับ query: search, category)
 */
export const findAll = async ({ search = '', category = '' } = {}) => {
  return await prisma.item.findMany({
    where: {
      AND: [
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
 * ดึงวัสดุตาม ID
 */
export const findById = async (id) => {
  return await prisma.item.findUnique({
    where: { id: Number(id) }
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
 * ลบวัสดุ
 */
export const remove = async (id) => {
  return await prisma.item.delete({
    where: { id: Number(id) }
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
 */
export const findTransactionsByItemId = async (itemId) => {
  return await prisma.stockTransaction.findMany({
    where: { itemId: Number(itemId) },
    orderBy: { createdAt: 'desc' }
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
