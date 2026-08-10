import { Router } from 'express';
import * as assetDistributionController from '../controllers/assetDistributionController.js';

const router = Router();

router.get('/', assetDistributionController.getDistributions);
router.post('/', assetDistributionController.createDistribution);

export default router;
