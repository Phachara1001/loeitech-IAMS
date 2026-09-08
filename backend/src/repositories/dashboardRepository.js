import prisma from '../prisma/index.js';

// ==========================================
// สถิติการ์ดสรุป (4 การ์ดบนสุดของแดชบอร์ด)
// ==========================================
export function countAssets() {
  return prisma.asset.count();
}

export function countActiveAssets() {
  return prisma.asset.count({ where: { status: 'Active' } });
}

export function countLowStockItems() {
  // ใกล้หมดคลัง = คงเหลือ <= จุดเตือนสั่งซื้อ (minThreshold)
  // ใช้ raw query เพราะ Prisma ไม่รองรับเทียบ 2 คอลัมน์กันตรงๆ ผ่าน .count() ปกติ
  return prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM items WHERE quantity <= "minThreshold"`;
}

export function countPendingRequisitions() {
  return prisma.requisition.count({ where: { status: 'PENDING' } });
}

// ==========================================
// กราฟแท่ง: จำนวนคำขอเบิกรายเดือน ภายในช่วงปีงบประมาณที่ระบุ
// ==========================================
export function findRequisitionDatesInRange(startDate, endDate) {
  return prisma.requisition.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    select: { createdAt: true }
  });
}

// ==========================================
// ตารางกิจกรรมล่าสุด
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