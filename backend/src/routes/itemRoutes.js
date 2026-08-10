import { Router } from 'express';
import * as itemController from '../controllers/itemController.js';
import { validateItemInput } from '../validations/itemValidation.js';

const router = Router();

// GET /api/items?search=...&category=...
router.get('/', itemController.getItems);

// GET /api/items/:id/transactions  (ต้องอยู่ก่อน /:id เพื่อไม่ให้ชนกัน)
router.get('/:id/transactions', itemController.getItemTransactions);

// GET /api/items/:id
router.get('/:id', itemController.getItemById);

// POST /api/items
router.post('/', validateItemInput, itemController.createItem);

// PUT /api/items/:id
router.put('/:id', validateItemInput, itemController.updateItem);

// PATCH /api/items/:id/adjust  — บันทึกผลตรวจนับ (Inventory Check ADJUSTMENT)
router.patch('/:id/adjust', itemController.adjustItem);

// DELETE /api/items/:id
router.delete('/:id', itemController.deleteItem);

export default router;
