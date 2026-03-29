import { Router } from 'express';
import { upsertBudget, getBudgets, deleteBudget } from '../controllers/budgetController';
import { protect } from '../middleware/auth';
import { budgetValidation, mongoIdValidation } from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getBudgets));
router.post('/', budgetValidation, asyncHandler(upsertBudget));
router.delete('/:id', mongoIdValidation, asyncHandler(deleteBudget));

export default router;
