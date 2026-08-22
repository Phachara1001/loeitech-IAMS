import ExcelJS from 'exceljs';
import prisma from '../prisma/index.js';
import * as reportRepository from '../repositories/reportRepository.js';

const REPORT_LABELS = {
  asset_register: 'ทะเบียนครุภัณฑ์',
  consumable_ledger: 'บัญชีคุมพัสดุสิ้นเปลือง'
};

// รองรับแค่ 2 รายงานนี้ก่อนในรอบนี้ ที่เหลือ (asset_distribution, movement_history, damaged_assets)
// ยังไม่ได้ทำ — ถ้าเลือกมาจะโดนกรองออกแล้วแจ้งเตือนกลับไปว่ายังไม่รองรับ
const SUPPORTED_REPORT_KEYS = Object.keys(REPORT_LABELS);

function styleHeaderRow(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
}

async function addAssetRegisterSheet(workbook, filters) {
  const assets = await reportRepository.findAssetsForRegister(filters);
  const sheet = workbook.addWorksheet('ทะเบียนครุภัณฑ์');

  sheet.columns = [
    { header: 'ลำดับครุภัณฑ์', key: 'seq', width: 16 },
    { header: 'ชื่อพัสดุ', key: 'name', width: 30 },
    { header: 'หมวดหมู่', key: 'category', width: 18 },
    { header: 'หน่วยงาน', key: 'department', width: 20 },
    { header: 'ยี่ห้อ/รุ่น', key: 'brand', width: 18 },
    { header: 'หมายเลขเครื่อง', key: 'serialNumber', width: 18 },
    { header: 'สถานที่', key: 'locationLabel', width: 20 },
    { header: 'วันที่ได้มา', key: 'acquiredDate', width: 14 },
    { header: 'วิธีการได้มา', key: 'acquisitionMethod', width: 16 },
    { header: 'แหล่งเงิน', key: 'budgetType', width: 14 },
    { header: 'ราคาต่อหน่วย (บาท)', key: 'unitPrice', width: 16 },
    { header: 'สถานะ', key: 'status', width: 12 },
    { header: 'หมายเหตุ', key: 'remark', width: 24 }
  ];
  styleHeaderRow(sheet.getRow(1));

  assets.forEach((a) => {
    sheet.addRow({
      seq: a.seq,
      name: a.name,
      category: a.category,
      department: a.department,
      brand: a.brand || '-',
      serialNumber: a.serialNumber || '-',
      locationLabel: a.location ? `${a.location.building || ''} ${a.location.name}`.trim() : '-',
      acquiredDate: a.acquiredDate ? a.acquiredDate.toLocaleDateString('th-TH') : '-',
      acquisitionMethod: a.acquisitionMethod,
      budgetType: a.budgetType,
      unitPrice: a.unitPrice,
      status: a.status,
      remark: a.remark || ''
    });
  });

  sheet.getColumn('unitPrice').numFmt = '#,##0.00';
}

async function addConsumableLedgerSheet(workbook, filters) {
  const items = await reportRepository.findItemsForLedger(filters);
  const sheet = workbook.addWorksheet('บัญชีคุมพัสดุสิ้นเปลือง');

  sheet.columns = [
    { header: 'รหัสวัสดุ', key: 'sku', width: 14 },
    { header: 'ชื่อวัสดุ', key: 'name', width: 30 },
    { header: 'หมวดหมู่', key: 'category', width: 18 },
    { header: 'หน่วยนับ', key: 'unit', width: 12 },
    { header: 'รับเข้าช่วงที่เลือก', key: 'periodIn', width: 16 },
    { header: 'จ่ายออกช่วงที่เลือก', key: 'periodOut', width: 16 },
    { header: 'คงเหลือปัจจุบัน', key: 'quantity', width: 14 },
    { header: 'จุดสั่งซื้อเพิ่ม', key: 'minThreshold', width: 14 },
    { header: 'ราคาต่อหน่วย (บาท)', key: 'unitPrice', width: 16 }
  ];
  styleHeaderRow(sheet.getRow(1));

  items.forEach((it) => {
    sheet.addRow({
      sku: it.sku,
      name: it.name,
      category: it.category || '-',
      unit: it.unit || '-',
      periodIn: it.periodIn,
      periodOut: it.periodOut,
      quantity: it.quantity,
      minThreshold: it.minThreshold,
      unitPrice: it.unitPrice
    });
  });

  sheet.getColumn('unitPrice').numFmt = '#,##0.00';
}

/**
 * สร้างไฟล์ Excel รวมทุกรายงานที่เลือก (คนละ sheet) แล้วคืนเป็น Buffer
 * @param {string[]} reportKeys
 * @param {object} filters - { department, category, dateFrom, dateTo }
 * @returns {Promise<{buffer: Buffer, unsupportedKeys: string[]}>}
 */
export async function generateExcelReport(reportKeys, filters) {
  const supported = reportKeys.filter((k) => SUPPORTED_REPORT_KEYS.includes(k));
  const unsupportedKeys = reportKeys.filter((k) => !SUPPORTED_REPORT_KEYS.includes(k));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TCAIMS';
  workbook.created = new Date();

  if (supported.includes('asset_register')) {
    await addAssetRegisterSheet(workbook, filters);
  }
  if (supported.includes('consumable_ledger')) {
    await addConsumableLedgerSheet(workbook, filters);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, unsupportedKeys };
}

/**
 * บันทึกประวัติการส่งออกลง activity_logs (ใช้ entityType 'REPORT', action 'EXPORT')
 * action เป็น String ธรรมดา ไม่ใช่ Prisma enum จึงใช้ค่าใหม่ 'EXPORT' ได้โดยไม่ต้อง migrate เพิ่ม
 */
export async function logExportHistory({ req, reportKeys, format, userId }) {
  const names = reportKeys.map((k) => REPORT_LABELS[k] || k).join(', ');
  await prisma.activityLog.create({
    data: {
      userId: userId ?? req.user?.id ?? null,
      action: 'EXPORT',
      entityType: 'REPORT',
      details: `ส่งออกรายงาน: ${names} (${format === 'excel' ? 'Excel' : 'PDF'})`
    }
  });
}

/**
 * ดึงประวัติการส่งออกล่าสุด (สำหรับแสดงในหน้า ReportExport.vue)
 */
export async function getExportHistory(limit = 10) {
  const logs = await prisma.activityLog.findMany({
    where: { entityType: 'REPORT', action: 'EXPORT' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, username: true } } }
  });

  return logs.map((log) => {
    // details มีรูปแบบ "ส่งออกรายงาน: <ชื่อรายงาน> (<Excel|PDF>)" — แยกชื่อกับรูปแบบไฟล์ออกมาแสดงแยก column
    const match = log.details?.match(/ส่งออกรายงาน: (.+) \((Excel|PDF)\)/);
    return {
      id: log.id,
      name: match ? match[1] : log.details,
      format: match ? match[2] : '-',
      date: log.createdAt.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
      by: log.user?.name || log.user?.username || 'ระบบ'
    };
  });
}

export { SUPPORTED_REPORT_KEYS, REPORT_LABELS };