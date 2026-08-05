import { Router } from 'express';
import * as borrowController from '../controllers/borrowController.js';
import {
  validateBorrowInput,
  validateApprovalInput,
  validateReturnInput
} from '../validations/borrowValidation.js';

const router = Router();

// GET /api/borrows - ดึงประวัติยืมทั้งหมด
router.get('/', borrowController.getBorrows);

// POST /api/borrows - ยื่นเรื่องขอยืม
router.post('/', validateBorrowInput, borrowController.createBorrow);

// PUT /api/borrows/:id/approve - อนุมัติยืม
router.put('/:id/approve', validateApprovalInput, borrowController.approveBorrow);

// PUT /api/borrows/:id/reject - ปฏิเสธการยืม
router.put('/:id/reject', borrowController.rejectBorrow);

// PUT /api/borrows/:id/return - รับคืนครุภัณฑ์
router.put('/:id/return', validateReturnInput, borrowController.returnBorrow);

export default router;
