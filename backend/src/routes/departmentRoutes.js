import { Router } from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { validateDepartmentInput } from '../validations/departmentValidation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ทุก route ต้อง login ก่อน
router.use(authenticate);

// ดูรายชื่อหน่วยงานได้ทุก role (เผื่อใช้เป็น dropdown ในฟอร์มอื่น ๆ)
router.get('/', departmentController.getDepartments);

// เพิ่ม/แก้ไข/ลบ เฉพาะ Admin เท่านั้น
router.post('/', authorize('ADMIN'), validateDepartmentInput, departmentController.createDepartment);
router.put('/:id', authorize('ADMIN'), validateDepartmentInput, departmentController.updateDepartment);
router.delete('/:id', authorize('ADMIN'), departmentController.deleteDepartment);

export default router;