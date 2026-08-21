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

export async function getStats() {
  const [totalAssets, activeAssets, lowStockResult, pendingRequisitions] = await Promise.all([
    dashboardRepository.countAssets(),
    dashboardRepository.countActiveAssets(),
    dashboardRepository.countLowStockItems(),
    dashboardRepository.countPendingRequisitions()
  ]);

  const lowStockItems = Array.isArray(lowStockResult) ? Number(lowStockResult[0]?.count || 0) : 0;

  return { totalAssets, activeAssets, lowStockItems, pendingRequisitions };
}

export async function getMonthlyRequisitions() {
  const { startDate, endDate, fiscalYearBE } = getCurrentFiscalYearRange();
  const requisitions = await dashboardRepository.findRequisitionDatesInRange(startDate, endDate);

  const buckets = THAI_FISCAL_MONTHS.map((label) => ({ month: label, count: 0 }));

  for (const req of requisitions) {
    const diffMonths =
      (req.createdAt.getFullYear() - startDate.getFullYear()) * 12 + (req.createdAt.getMonth() - startDate.getMonth());
    if (diffMonths >= 0 && diffMonths < 12) {
      buckets[diffMonths].count += 1;
    }
  }

  return { fiscalYearBE, data: buckets };
}

const ACTION_STATUS_MAP = { INSERT: 'success', UPDATE: 'info', DELETE: 'danger', LOGIN: 'info' };

const ENTITY_TYPE_LABEL = {
  ASSET: 'ครุภัณฑ์',
  ITEM: 'พัสดุสิ้นเปลือง',
  REQUISITION: 'คำขอเบิก',
  USER: 'ผู้ใช้งาน'
};

const ACTION_LABEL = {
  INSERT: 'เพิ่มข้อมูลใหม่',
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
  const canSeeDetails = ['ADMIN', 'STAFF'].includes(String(role).toUpperCase())

  const [stats, monthly, recentActivities] = await Promise.all([
    getStats(),
    getMonthlyRequisitions(),
    canSeeDetails ? getRecentActivities(10) : Promise.resolve([])
  ]);

  return { stats, monthlyRequisitions: monthly, recentActivities };
}