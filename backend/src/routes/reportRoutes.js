import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/reports/export-history
router.get('/export-history', reportController.getExportHistory);

// POST /api/reports/export
router.post('/export', reportController.exportReport);

export default router;