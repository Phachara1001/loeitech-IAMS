import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', validateRegisterInput, authController.register);
router.post('/login', validateLoginInput, authController.login);
router.post('/forgot-password', validateForgotPasswordInput, authController.forgotPassword);
router.post('/reset-password', validateResetPasswordInput, authController.resetPassword);

export default router;