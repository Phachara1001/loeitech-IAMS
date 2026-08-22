import prisma from '../prisma/index.js';

/**
 * ดึงข้อมูลครุภัณฑ์ทั้งหมดสำหรับรายงาน "ทะเบียนครุภัณฑ์"
 * รองรับกรองตามหน่วยงานและช่วงวันที่ได้มา (acquiredDate)
 */
export const findAssetsForRegister = async ({ department, dateFrom, dateTo } = {}) => {
  const where = {};

  if (department && department !== 'ทุกหน่วยงาน') {
    where.department = department;
  }
  if (dateFrom || dateTo) {
    where.acquiredDate = {};
    if (dateFrom) where.acquiredDate.gte = new Date(dateFrom);
    if (dateTo) where.acquiredDate.lte = new Date(dateTo);
  }

  return await prisma.asset.findMany({
    where,
    include: { location: { select: { building: true, name: true } } },
    orderBy: { seq: 'asc' }
  });
};

/**
 * ดึงข้อมูลวัสดุสิ้นเปลืองทั้งหมดสำหรับรายงาน "บัญชีคุมพัสดุสิ้นเปลือง"
 * พร้อมสรุปยอดรับเข้า (IN) / จ่ายออก (OUT) ภายในช่วงวันที่ที่กำหนด (อิง StockTransaction.receivedDate)
 */
export const findItemsForLedger = async ({ dateFrom, dateTo } = {}) => {
  const items = await prisma.item.findMany({
    where: { isDeleted: false },
    orderBy: { sku: 'asc' }
  });

  const txWhere = {};
  if (dateFrom || dateTo) {
    txWhere.receivedDate = {};
    if (dateFrom) txWhere.receivedDate.gte = new Date(dateFrom);
    if (dateTo) txWhere.receivedDate.lte = new Date(dateTo);
  }

  // ดึงยอดสรุป IN/OUT ต่อ item ภายในช่วงที่กำหนด แบบ group by
  const grouped = await prisma.stockTransaction.groupBy({
    by: ['itemId', 'transactionType'],
    where: txWhere,
    _sum: { quantity: true }
  });

  const summaryByItem = {};
  for (const row of grouped) {
    if (!summaryByItem[row.itemId]) summaryByItem[row.itemId] = { in: 0, out: 0 };
    if (row.transactionType === 'IN') summaryByItem[row.itemId].in = row._sum.quantity || 0;
    if (row.transactionType === 'OUT') summaryByItem[row.itemId].out = Math.abs(row._sum.quantity || 0);
  }

  return items.map((item) => ({
    ...item,
    periodIn: summaryByItem[item.id]?.in || 0,
    periodOut: summaryByItem[item.id]?.out || 0
  }));
};