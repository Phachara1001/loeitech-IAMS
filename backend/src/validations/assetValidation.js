export const validateAssetInput = (req, res, next) => {
  const { name, category, department, acquiredDate, acquisitionMethod, budgetType, unitPrice } = req.body;

  const errors = [];

  if (!name) errors.push('ชื่อพัสดุ (name) เป็นข้อมูลที่จำเป็น');
  if (!category) errors.push('หมวดหมู่/ประเภท (category) เป็นข้อมูลที่จำเป็น');
  if (!department) errors.push('แผนก/หน่วยงาน (department) เป็นข้อมูลที่จำเป็น');
  if (!acquiredDate) errors.push('วันที่ได้มา (acquiredDate) เป็นข้อมูลที่จำเป็น');
  if (!acquisitionMethod) errors.push('วิธีการได้มา (acquisitionMethod) เป็นข้อมูลที่จำเป็น');
  if (!budgetType) errors.push('แหล่งเงิน (budgetType) เป็นข้อมูลที่จำเป็น');
  
  if (unitPrice === undefined || unitPrice === null) {
    errors.push('ราคาต่อหน่วย (unitPrice) เป็นข้อมูลที่จำเป็น');
  } else if (isNaN(parseFloat(unitPrice))) {
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

export const validateAssetBatchInput = (req, res, next) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'รูปแบบข้อมูลไม่ถูกต้อง ต้องเป็น Array ที่มีข้อมูล'
    });
  }

  // Check the first item just to be sure required fields exist
  const firstItem = req.body[0];
  if (!firstItem.name || !firstItem.category || !firstItem.seq) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลใน Array ไม่ครบถ้วนหรือไม่ถูกต้อง'
    });
  }

  next();
};
