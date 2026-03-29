import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDashboard,
  getCategoryTotals,
  getMonthlyTotals,
} from '../controllers/expenseController';
import { protect } from '../middleware/auth';
import {
  expenseValidation,
  expenseUpdateValidation,
  expenseQueryValidation,
  mongoIdValidation,
  idParamRule,
  validate,
} from '../middleware/validation';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.use(protect);

// ─── Dashboard & analytics (must be BEFORE /:id to avoid route collision) ───
router.get('/dashboard', asyncHandler(getDashboard));
router.get('/analytics/categories', asyncHandler(getCategoryTotals));
router.get('/analytics/monthly', asyncHandler(getMonthlyTotals));

// ─── CRUD ────────────────────────────────────────────────────────────────────
router.get('/', expenseQueryValidation, asyncHandler(getExpenses));
router.post('/', expenseValidation, asyncHandler(createExpense));
router.get('/:id', mongoIdValidation, asyncHandler(getExpenseById));

// PUT: validate :id param + body fields in one pass (single validate call)
router.put(
  '/:id',
  [idParamRule, ...expenseUpdateValidation.slice(0, -1), validate],
  asyncHandler(updateExpense)
);

router.delete('/:id', mongoIdValidation, asyncHandler(deleteExpense));

export default router;
