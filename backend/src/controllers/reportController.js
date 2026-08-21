import * as reportService from '../services/reportService.js';

/**
 * POST /api/reports/export
 * body: { reportKeys: string[], format: 'excel' | 'pdf', filters: { department, category, dateFrom, dateTo } }
 */
export const exportReport = async (req, res, next) => {
  try {
    const { reportKeys = [], format = 'excel', filters = {} } = req.body;

    if (!Array.isArray(reportKeys) || reportKeys.length === 0) {
      return res.status(400).json({ status: 'error', message: 'กรุณาเลือกรายงานอย่างน้อย 1 รายการ' });
    }

    if (format === 'pdf') {
      // ยังไม่รองรับ PDF ในรอบนี้ (ทำแค่ Excel ของ 2 รายงานก่อนตามที่ตกลงกันไว้)
      return res.status(501).json({
        status: 'error',
        message: 'การส่งออกเป็น PDF ยังไม่รองรับในตอนนี้ กรุณาเลือกส่งออกเป็น Excel ไปก่อน'
      });
    }

    const { buffer, unsupportedKeys } = await reportService.generateExcelReport(reportKeys, filters);

    if (unsupportedKeys.length === reportKeys.length) {
      // ไม่มีรายงานที่รองรับเลยสักตัว ไม่ต้องสร้างไฟล์เปล่าให้ดาวน์โหลด
      return res.status(400).json({
        status: 'error',
        message: `รายงานที่เลือกยังไม่รองรับการส่งออก: ${unsupportedKeys.join(', ')}`
      });
    }

    const supportedKeys = reportKeys.filter((k) => !unsupportedKeys.includes(k));
    await reportService.logExportHistory({ req, reportKeys: supportedKeys, format });

    const filename = `report-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // แจ้งกลับผ่าน header ว่ามีรายงานไหนถูกข้ามไปบ้าง (เผื่อ frontend อยากเตือนผู้ใช้)
    if (unsupportedKeys.length > 0) {
      res.setHeader('X-Unsupported-Reports', unsupportedKeys.join(','));
    }
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export-history
 */
export const getExportHistory = async (req, res, next) => {
  try {
    const history = await reportService.getExportHistory(10);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};