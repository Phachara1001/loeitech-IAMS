/**
 * Middleware ตรวจสอบข้อมูลการรับพัสดุเข้าคลัง
 */
export const validateStockReceiveInput = (req, res, next) => {
  const { itemSourceType, selectedItemId, newItemName, qty, unitPrice, receivedDate } = req.body;
  const errors = [];

  // itemSourceType ต้องเป็น EXISTING หรือ NEW
  if (!itemSourceType || !['EXISTING', 'NEW'].includes(itemSourceType)) {
    errors.push('ประเภทวัสดุ (itemSourceType) ต้องเป็น EXISTING หรือ NEW');
  }

  // กรณีวัสดุเดิม ต้องมี selectedItemId
  if (itemSourceType === 'EXISTING' && !selectedItemId) {
    errors.push('กรุณาเลือกรายการวัสดุที่มีอยู่ (selectedItemId)');
  }

  // กรณีวัสดุใหม่ ต้องมีชื่อ
  if (itemSourceType === 'NEW' && (!newItemName || !newItemName.trim())) {
    errors.push('กรุณากรอกชื่อวัสดุใหม่ (newItemName)');
  }

  // จำนวนต้องมีและต้องมากกว่า 0
  if (qty === undefined || qty === null) {
    errors.push('จำนวนที่รับเข้า (qty) เป็นข้อมูลที่จำเป็น');
  } else if (Number(qty) <= 0) {
    errors.push('จำนวนที่รับเข้า (qty) ต้องมากกว่า 0');
  }

  // ราคาต่อหน่วย
  if (unitPrice !== undefined && isNaN(parseFloat(unitPrice))) {
    errors.push('ราคาต่อหน่วย (unitPrice) ต้องเป็นตัวเลข');
  }

  // วันที่รับ
  if (!receivedDate) {
    errors.push('วันที่รับ (receivedDate) เป็นข้อมูลที่จำเป็น');
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
