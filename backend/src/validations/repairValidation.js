import { body, validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

export const validateRepairInput = [
  body('assetId').isInt().withMessage('assetId ต้องเป็นตัวเลขจำนวนเต็ม'),
  body('reporterName').trim().notEmpty().withMessage('กรุณาระบุชื่อผู้แจ้งซ่อม'),
  body('description').trim().notEmpty().withMessage('กรุณาระบุรายละเอียดอาการชำรุด'),
  body('urgency').isIn(['NORMAL', 'URGENT', 'CRITICAL']).withMessage('ระดับความเร่งด่วนไม่ถูกต้อง'),
  validate
];

export const validateStatusUpdate = [
  body('status').isIn(['PENDING', 'APPROVED', 'REPAIRING', 'COMPLETED', 'REJECTED']).withMessage('สถานะไม่ถูกต้อง'),
  body('approvedBy').trim().notEmpty().withMessage('กรุณาระบุชื่อผู้ดำเนินการ'),
  validate
];
