import prisma from '../prisma/index.js';

/**
 * บันทึก StockTransaction ประเภท IN และอัปเดต item.quantity (ใช้ Prisma Transaction)
 */
export const createReceiveTransaction = async ({
  itemId,
  quantity,
  unitPrice,
  totalPrice,
  receivedDate,
  acquisitionMethod,
  budgetType,
  operatorName,
  reference,
  remarks
}) => {
  return await prisma.$transaction(async (tx) => {
    // 1. อัปเดตยอดคงเหลือ
    const updatedItem = await tx.item.update({
      where: { id: itemId },
      data: { quantity: { increment: quantity } }
    });

    // 2. บันทึก transaction history
    const stockTx = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: 'IN',
        quantity,
        unitPrice: unitPrice || 0,
        totalPrice: totalPrice || 0,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        acquisitionMethod: acquisitionMethod || null,
        budgetType: budgetType || null,
        operatorName: operatorName || null,
        reference: reference || null,
        remarks: remarks || null
      }
    });

    return { updatedItem, stockTx };
  });
};

/**
 * สร้าง Item ใหม่ (กรณีวัสดุใหม่ที่ยังไม่มีในระบบ) พร้อมบันทึก transaction
 */
export const createNewItemAndReceive = async ({
  sku,
  name,
  category,
  unit,
  minStock = 5,
  quantity,
  unitPrice,
  totalPrice,
  receivedDate,
  acquisitionMethod,
  budgetType,
  operatorName,
  reference,
  remarks
}) => {
  return await prisma.$transaction(async (tx) => {
    // 1. สร้าง Item ใหม่ในระบบ
    const newItem = await tx.item.create({
      data: {
        sku,
        name,
        category: category || null,
        unit: unit || null,
        quantity,
        minThreshold: minStock,
        unitPrice: unitPrice || 0
      }
    });

    // 2. บันทึก transaction history
    const stockTx = await tx.stockTransaction.create({
      data: {
        itemId: newItem.id,
        transactionType: 'IN',
        quantity,
        unitPrice: unitPrice || 0,
        totalPrice: totalPrice || 0,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        acquisitionMethod: acquisitionMethod || null,
        budgetType: budgetType || null,
        operatorName: operatorName || null,
        reference: reference || null,
        remarks: remarks || null
      }
    });

    return { newItem, stockTx };
  });
};

/**
 * ดึงประวัติรับเข้าล่าสุด (transactionType = IN)
 */
export const findRecentReceives = async (limit = 10) => {
  return await prisma.stockTransaction.findMany({
    where: { transactionType: 'IN' },
    include: { item: { select: { id: true, sku: true, name: true, unit: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

/**
 * Generate SKU ถัดไปสำหรับวัสดุใหม่
 */
export const generateNextSku = async () => {
  const latest = await prisma.item.findFirst({ orderBy: { id: 'desc' } });
  if (latest && latest.sku) {
    const parts = latest.sku.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      const nextNum = parseInt(parts[1], 10) + 1;
      return `${parts[0]}-${String(nextNum).padStart(4, '0')}`;
    }
  }
  return 'CS-0001';
};
