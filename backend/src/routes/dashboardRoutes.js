import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', dashboardController.getOverview);

export default router;