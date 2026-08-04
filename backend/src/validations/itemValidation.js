/**
 * Middleware ตรวจสอบข้อมูลวัสดุสิ้นเปลือง
 */
export const validateItemInput = (req, res, next) => {
  const { name, unit } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('ชื่อวัสดุ (name) เป็นข้อมูลที่จำเป็น');
  if (!unit || !unit.trim()) errors.push('หน่วยนับ (unit) เป็นข้อมูลที่จำเป็น');

  if (req.body.quantity !== undefined && isNaN(Number(req.body.quantity))) {
    errors.push('จำนวน (quantity) ต้องเป็นตัวเลข');
  }
  if (req.body.minThreshold !== undefined && isNaN(Number(req.body.minThreshold))) {
    errors.push('จุดเตือนขั้นต่ำ (minThreshold) ต้องเป็นตัวเลข');
  }
  if (req.body.unitPrice !== undefined && isNaN(parseFloat(req.body.unitPrice))) {
    errors.push('ราคาต่อหน่วย (unitPrice) ต้องเป็นตัวเลข');
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
