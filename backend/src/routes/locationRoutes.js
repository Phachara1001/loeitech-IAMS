import { Router } from 'express';
import * as locationController from '../controllers/locationController.js';
import { validateLocationInput } from '../validations/locationValidation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', locationController.getLocations);

router.post('/', authorize('ADMIN'), validateLocationInput, locationController.createLocation);
router.put('/:id', authorize('ADMIN'), validateLocationInput, locationController.updateLocation);
router.delete('/:id', authorize('ADMIN'), locationController.deleteLocation);

export default router;