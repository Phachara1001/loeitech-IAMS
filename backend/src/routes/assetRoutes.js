import { Router } from 'express';
import * as assetController from '../controllers/assetController.js';
import { validateAssetInput, validateAssetBatchInput } from '../validations/assetValidation.js';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', assetController.getAssets);
router.post('/upload', upload.single('image'), assetController.uploadImage);
router.get('/:id', assetController.getAssetById);
router.get('/:id/timeline', assetController.getAssetTimeline);
router.post('/batch', validateAssetBatchInput, assetController.createAssetsBatch);
router.post('/', validateAssetInput, assetController.createAsset);
router.put('/:id', validateAssetInput, assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

// Asset Components
router.get('/components/:id/timeline', assetController.getComponentTimeline);
router.post('/:id/components', assetController.createAssetComponent);
router.put('/:id/components/:componentId', assetController.updateAssetComponent);
router.delete('/:id/components/:componentId', assetController.deleteAssetComponent);

export default router;