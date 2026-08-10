import { Router } from 'express';
import * as activityLogController from '../controllers/activityLogController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), activityLogController.getLogs);

export default router;