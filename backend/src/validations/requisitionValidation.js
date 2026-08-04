/**
 * Middleware ตรวจสอบข้อมูลคำขอเบิกพัสดุ
 */
export const validateRequisitionInput = (req, res, next) => {
  const { items, reason } = req.body;
  const errors = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ (items)');
  } else {
    // ตรวจสอบแต่ละรายการว่ามี id และ qty
    items.forEach((item, idx) => {
      if (!item.id) errors.push(`รายการที่ ${idx + 1}: ไม่มี id ของวัสดุ`);
      if (!item.qty || Number(item.qty) <= 0) {
        errors.push(`รายการที่ ${idx + 1}: จำนวน (qty) ต้องมากกว่า 0`);
      }
    });
  }

  if (!reason || !reason.trim()) {
    errors.push('กรุณากรอกเหตุผลในการเบิกใช้ (reason)');
  } else if (reason.trim().length < 10) {
    errors.push('เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง',
      errors
    });
  }

  next();
};

/**
 * Middleware ตรวจสอบข้อมูลการอนุมัติ/ปฏิเสธ
 */
export const validateApprovalInput = (req, res, next) => {
  const { approvedBy } = req.body;
  const errors = [];

  if (!approvedBy || !approvedBy.trim()) {
    errors.push('กรุณาระบุชื่อผู้อนุมัติ (approvedBy)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลไม่ครบถ้วน',
      errors
    });
  }

  next();
};
