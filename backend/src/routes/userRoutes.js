import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import {
  validateUpdateProfileInput,
  validateChangePasswordInput,
  validateCreateUserInput,
  validateUpdateUserByAdminInput
} from '../validations/userValidation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// ทุก route ในไฟล์นี้ต้องล็อกอินก่อนถึงจะเข้าถึงได้
router.use(authenticate);

// ----- โปรไฟล์ของตัวเอง (ต้องอยู่ก่อน /:id เสมอ ไม่งั้น Express จะเข้าใจว่า "me" เป็น :id) -----
router.get('/me', userController.getMe);
router.put('/me', validateUpdateProfileInput, userController.updateMe);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);
router.put('/me/password', validateChangePasswordInput, userController.changePassword);

// ----- Admin จัดการผู้ใช้งานคนอื่น -----
router.get('/', authorize('ADMIN', 'STAFF'), userController.listUsers);
router.post('/', authorize('ADMIN'), validateCreateUserInput, userController.createUser);
router.patch('/:id/approve', authorize('ADMIN'), userController.approveUserById);
router.patch('/:id/reject', authorize('ADMIN'), userController.rejectUserById);
router.put('/:id', authorize('ADMIN'), validateUpdateUserByAdminInput, userController.updateUserById);
router.delete('/:id', authorize('ADMIN'), userController.deleteUserById);

export default router;