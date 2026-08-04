import { Router } from 'express';
import * as stockReceiveController from '../controllers/stockReceiveController.js';
import { validateStockReceiveInput } from '../validations/stockReceiveValidation.js';

const router = Router();

// GET /api/stock-receive?limit=10  — ประวัติรับเข้าล่าสุด
router.get('/', stockReceiveController.getRecentReceives);

// POST /api/stock-receive  — บันทึกรับพัสดุเข้าคลัง
router.post('/', validateStockReceiveInput, stockReceiveController.receiveStock);

export default router;
