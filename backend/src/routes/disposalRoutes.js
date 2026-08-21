import { Router } from 'express';
import * as disposalController from '../controllers/disposalController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/disposal-requests/eligible-assets  (ต้องอยู่ก่อน endpoint อื่นที่มี /:id)
router.get('/eligible-assets', disposalController.getEligibleAssets);

// GET /api/disposal-requests?search=...
router.get('/', disposalController.getRequests);

// POST /api/disposal-requests
router.post('/', disposalController.createRequest);

// PATCH /api/disposal-requests/:id/approve
router.patch('/:id/approve', disposalController.approveRequest);

// PATCH /api/disposal-requests/:id/reject
router.patch('/:id/reject', disposalController.rejectRequest);

// PATCH /api/disposal-requests/:id/dispose
router.patch('/:id/dispose', disposalController.markDisposed);

// หมายเหตุ: หน้านี้ตั้งใจจำกัดสิทธิ์แค่ Admin/Staff ฝั่ง frontend (canAccess)
// ถ้าต้องการบังคับสิทธิ์ฝั่ง backend ด้วย ต้องมี middleware ตรวจ role เพิ่ม
// (ยังไม่ทำให้ตรงนี้ เพราะไม่มีไฟล์ middleware ตรวจ role ที่ยืนยันแล้วว่ามีอยู่จริงในโปรเจกต์)

export default router;