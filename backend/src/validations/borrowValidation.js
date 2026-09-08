import { body, validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

export const validateBorrowInput = [
  body('assetId').isInt().withMessage('assetId ต้องเป็นตัวเลขจำนวนเต็ม'),
  body('borrowerName').trim().notEmpty().withMessage('กรุณาระบุชื่อผู้ยืม'),
  body('borrowerDept').trim().notEmpty().withMessage('กรุณาระบุหน่วยงานผู้ยืม'),
  body('borrowDate').isISO8601().withMessage('วันที่ยืมต้องอยู่ในรูปแบบวันที่ที่ถูกต้อง'),
  body('dueDate').isISO8601().withMessage('กำหนดส่งคืนต้องอยู่ในรูปแบบวันที่ที่ถูกต้อง'),
  body('purpose').trim().notEmpty().withMessage('กรุณาระบุวัตถุประสงค์การยืม'),
  validate
];

export const validateApprovalInput = [
  body('approvedBy').trim().notEmpty().withMessage('กรุณาระบุชื่อผู้อนุมัติ/ผู้ดำเนินการ'),
  validate
];

export const validateReturnInput = [
  body('returnedTo').trim().notEmpty().withMessage('กรุณาระบุชื่อผู้รับคืน'),
  validate
];
