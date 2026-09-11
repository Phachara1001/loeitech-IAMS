import * as dashboardRepository from '../repositories/dashboardRepository.js';

const THAI_FISCAL_MONTHS = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];

// ปีงบประมาณไทย: 1 ต.ค. - 30 ก.ย. ปีถัดไป
export function getCurrentFiscalYearRange(referenceDate = new Date()) {
  const month = referenceDate.getMonth(); // 0 = ม.ค., 9 = ต.ค.
  const year = referenceDate.getFullYear();
  const startYear = month >= 9 ? year : year - 1;
  const startDate = new Date(startYear, 9, 1); // 1 ต.ค.
  const endDate = new Date(startYear + 1, 9, 1); // 1 ต.ค. ปีถัดไป (exclusive)
  return { startDate, endDate, fiscalYearBE: startYear + 1 + 543 };
}

// ==========================================
// ส่วนที่ 1: ข้อมูลครุภัณฑ์ (Assets)
// ==========================================
export async function getAssetOverview(canSeeDetails) {
  const [totalCount, totalValueAgg, statusGroups, pendingRepairs, pendingBorrows, recentRepairs] = await Promise.all([
    dashboardRepository.countAssets(),
    dashboardRepository.sumAssetValue(),
    dashboardRepository.countAssetsByStatus(),
    dashboardRepository.countPendingRepairs(),
    dashboardRepository.countPendingBorrows(),
    canSeeDetails ? dashboardRepository.findRecentRepairs(5) : Promise.resolve([])
  ]);

  const totalValue = totalValueAgg._sum.unitPrice || 0;
  
  // แปลง Array ของ status group เป็น Object
  const statusDistribution = statusGroups.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {});

  return {
    total: totalCount,
    totalValue,
    pendingRepairs,
    pendingBorrows,
    statusDistribution,
    recentRepairs: recentRepairs.map(r => ({
      id: r.id,
      assetName: r.asset.name,
      assetSeq: r.asset.seq,
      requester: r.reporterName,
      createdAt: r.createdAt
    }))
  };
}

// ==========================================
// ส่วนที่ 2: ข้อมูลพัสดุสิ้นเปลือง (Consumables)
// ==========================================
export async function getConsumableOverview() {
  const { startDate, endDate, fiscalYearBE } = getCurrentFiscalYearRange();

  const [totalItems, inventoryValueRaw, lowStockResult, pendingRequisitions, requisitions, topRequested] = await Promise.all([
    dashboardRepository.countItems(),
    dashboardRepository.sumInventoryValue(),
    dashboardRepository.countLowStockItems(),
    dashboardRepository.countPendingRequisitions(),
    dashboardRepository.findRequisitionDatesInRange(startDate, endDate),
    dashboardRepository.findTopRequestedItems(startDate, endDate, 5)
  ]);

  const totalValue = Array.isArray(inventoryValueRaw) ? Number(inventoryValueRaw[0]?.total || 0) : 0;
  const lowStockItems = Array.isArray(lowStockResult) ? Number(lowStockResult[0]?.count || 0) : 0;

  // คำนวณ Monthly Chart
  const buckets = THAI_FISCAL_MONTHS.map((label) => ({ month: label, count: 0 }));
  for (const req of requisitions) {
    const diffMonths = (req.createdAt.getFullYear() - startDate.getFullYear()) * 12 + (req.createdAt.getMonth() - startDate.getMonth());
    if (diffMonths >= 0 && diffMonths < 12) {
      buckets[diffMonths].count += 1;
    }
  }

  // เติมข้อมูล Item ลงใน Top Requested
  let topItems = [];
  if (topRequested.length > 0) {
    const itemIds = topRequested.map(tr => tr.itemId);
    const items = await dashboardRepository.findItemsByIds(itemIds);
    const itemMap = new Map(items.map(i => [i.id, i]));
    
    topItems = topRequested.map(tr => {
      const item = itemMap.get(tr.itemId);
      return {
        id: item?.id,
        name: item?.name || 'Unknown',
        sku: item?.sku || '-',
        unit: item?.unit || '-',
        totalRequested: tr._sum.approvedQty
      };
    });
  }

  return {
    totalItems,
    totalValue,
    lowStock: lowStockItems,
    pendingRequisitions,
    monthlyChart: { fiscalYearBE, data: buckets },
    topItems
  };
}

// ==========================================
// เมนูหลัก
// ==========================================
const ACTION_STATUS_MAP = { INSERT: 'success', UPDATE: 'info', DELETE: 'danger', LOGIN: 'info', INSERT_BATCH: 'success' };
const ENTITY_TYPE_LABEL = {
  ASSET: 'ครุภัณฑ์',
  ITEM: 'พัสดุสิ้นเปลือง',
  REQUISITION: 'คำขอเบิก',
  USER: 'ผู้ใช้งาน',
  REPAIR_REQUEST: 'แจ้งซ่อม',
  BORROW_TRANSACTION: 'ยืมคืน'
};
const ACTION_LABEL = {
  INSERT: 'เพิ่มข้อมูล',
  INSERT_BATCH: 'เพิ่มข้อมูลชุด',
  UPDATE: 'แก้ไขข้อมูล',
  DELETE: 'ลบข้อมูล',
  LOGIN: 'เข้าสู่ระบบ'
};

export async function getRecentActivities(limit = 10) {
  const logs = await dashboardRepository.findRecentActivities(limit);
  return logs.map((log) => ({
    id: log.id,
    action: ACTION_LABEL[log.action] || log.action,
    item: log.details || `${ENTITY_TYPE_LABEL[log.entityType] || log.entityType}${log.entityId ? ' #' + log.entityId : ''}`,
    user: log.user?.name || log.user?.username || 'ระบบ',
    status: ACTION_STATUS_MAP[log.action] || 'warning',
    createdAt: log.createdAt
  }));
}

export async function getOverview(role) {
  const canSeeDetails = ['ADMIN', 'STAFF'].includes(String(role).toUpperCase());

  const [assets, consumables, recentActivities] = await Promise.all([
    getAssetOverview(canSeeDetails),
    getConsumableOverview(),
    canSeeDetails ? getRecentActivities(10) : Promise.resolve([])
  ]);

  return { assets, consumables, recentActivities };
}