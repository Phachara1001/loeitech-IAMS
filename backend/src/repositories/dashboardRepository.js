import prisma from '../prisma/index.js';

// ==========================================
// ASSETS (ครุภัณฑ์)
// ==========================================
export function countAssets() {
  return prisma.asset.count();
}

export function sumAssetValue() {
  return prisma.asset.aggregate({ _sum: { unitPrice: true } });
}

export function countAssetsByStatus() {
  return prisma.asset.groupBy({
    by: ['status'],
    _count: { status: true }
  });
}

export function countPendingRepairs() {
  return prisma.repairRequest.count({ where: { status: 'PENDING' } });
}

export function countPendingBorrows() {
  return prisma.borrowTransaction.count({ where: { status: 'PENDING' } });
}

export function findRecentRepairs(limit = 5) {
  return prisma.repairRequest.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      asset: { select: { seq: true, name: true } }
    }
  });
}

// ==========================================
// CONSUMABLES (พัสดุสิ้นเปลือง)
// ==========================================
export function countItems() {
  return prisma.item.count({ where: { isDeleted: false } });
}

export function sumInventoryValue() {
  return prisma.$queryRaw`SELECT SUM(quantity * "unitPrice")::float AS total FROM items WHERE "isDeleted" = false`;
}

export function countLowStockItems() {
  return prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM items WHERE quantity <= "minThreshold" AND "isDeleted" = false`;
}

export function countPendingRequisitions() {
  return prisma.requisition.count({ where: { status: 'PENDING' } });
}

export function findTopRequestedItems(startDate, endDate, limit = 5) {
  return prisma.requisitionItem.groupBy({
    by: ['itemId'],
    _sum: { approvedQty: true },
    orderBy: { _sum: { approvedQty: 'desc' } },
    take: limit,
    where: {
      requisition: { createdAt: { gte: startDate, lt: endDate }, status: 'APPROVED' }
    }
  });
}

export function findItemsByIds(ids) {
  return prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, sku: true, unit: true }
  });
}

export function findRequisitionDatesInRange(startDate, endDate) {
  return prisma.requisition.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    select: { createdAt: true }
  });
}

// ==========================================
// COMMON (กิจกรรมล่าสุด)
// ==========================================
export function findRecentActivities(limit = 10) {
  return prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, username: true } }
    }
  });
}