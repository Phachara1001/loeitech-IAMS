import { Router } from 'express';
import * as assetController from '../controllers/assetController.js';
import { validateAssetInput } from '../validations/assetValidation.js';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', assetController.getAssets);
router.post('/upload', upload.single('image'), assetController.uploadImage);
router.get('/:id', assetController.getAssetById);
//router.get('/:id/timeline', assetController.getAssetTimeline);
router.post('/', validateAssetInput, assetController.createAsset);
router.put('/:id', validateAssetInput, assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

export default router;