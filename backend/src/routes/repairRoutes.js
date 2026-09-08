import { Router } from 'express';
import * as repairController from '../controllers/repairController.js';
import {
  validateRepairInput,
  validateStatusUpdate
} from '../validations/repairValidation.js';

const router = Router();

// GET /api/repairs - ดึงรายการแจ้งซ่อมทั้งหมด
router.get('/', repairController.getRepairs);

// POST /api/repairs - บันทึกแจ้งซ่อมใหม่
router.post('/', validateRepairInput, repairController.createRepair);

// PUT /api/repairs/:id/status - อัปเดตสถานะ (อนุมัติ, เริ่มซ่อม, ซ่อมสำเร็จ)
router.put('/:id/status', validateStatusUpdate, repairController.updateRepairStatus);

export default router;
