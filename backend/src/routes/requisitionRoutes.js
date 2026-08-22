import { Router } from 'express';
import * as requisitionController from '../controllers/requisitionController.js';
import {
  validateRequisitionInput,
  validateApprovalInput
} from '../validations/requisitionValidation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/requisitions?status=PENDING
router.get('/', requisitionController.getRequisitions);

// GET /api/requisitions/:id
router.get('/:id', requisitionController.getRequisitionById);

// POST /api/requisitions  — ยื่นคำขอเบิก (Admin, Staff, User ยื่นได้ทุกคน)
router.post('/', validateRequisitionInput, requisitionController.createRequisition);

// PUT /api/requisitions/:id/approve  — อนุมัติ (Admin, Staff เท่านั้น)
router.put('/:id/approve', authorize('ADMIN', 'STAFF'), validateApprovalInput, requisitionController.approveRequisition);

// PUT /api/requisitions/:id/reject  — ปฏิเสธ (Admin, Staff เท่านั้น)
router.put('/:id/reject', authorize('ADMIN', 'STAFF'), validateApprovalInput, requisitionController.rejectRequisition);

export default router;