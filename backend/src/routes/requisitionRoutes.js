import { Router } from 'express';
import * as requisitionController from '../controllers/requisitionController.js';
import {
  validateRequisitionInput,
  validateApprovalInput
} from '../validations/requisitionValidation.js';

const router = Router();

// GET /api/requisitions?status=PENDING
router.get('/', requisitionController.getRequisitions);

// GET /api/requisitions/:id
router.get('/:id', requisitionController.getRequisitionById);

// POST /api/requisitions  — ยื่นคำขอเบิก
router.post('/', validateRequisitionInput, requisitionController.createRequisition);

// PUT /api/requisitions/:id/approve  — อนุมัติ
router.put('/:id/approve', validateApprovalInput, requisitionController.approveRequisition);

// PUT /api/requisitions/:id/reject  — ปฏิเสธ
router.put('/:id/reject', validateApprovalInput, requisitionController.rejectRequisition);

export default router;
