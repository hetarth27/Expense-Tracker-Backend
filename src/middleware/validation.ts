import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { EXPENSE_CATEGORIES } from '../types';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: errors
        .array()
        .map((e) => e.msg)
        .join(', '),
    });
    return;
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// POST — all required fields
export const expenseValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').isIn(EXPENSE_CATEGORIES).withMessage('Invalid category'),
  body('type').isIn(['personal', 'household']).withMessage('Type must be personal or household'),
  body('date').isISO8601().toDate().withMessage('Invalid date format'),
  body('paymentMethod').isIn(['cash', 'UPI', 'card']).withMessage('Payment method must be cash, UPI, or card'),
  body('note').optional().isString().isLength({ max: 500 }),
  validate,
];

// PUT — all fields optional (partial updates)
export const expenseUpdateValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn(EXPENSE_CATEGORIES).withMessage('Invalid category'),
  body('type').optional().isIn(['personal', 'household']).withMessage('Type must be personal or household'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
  body('paymentMethod').optional().isIn(['cash', 'UPI', 'card']).withMessage('Invalid payment method'),
  body('note').optional().isString().isLength({ max: 500 }),
  validate,
];

export const budgetValidation = [
  body('category').isIn(EXPENSE_CATEGORIES).withMessage('Invalid category'),
  body('monthlyLimit').isFloat({ min: 1 }).withMessage('Monthly limit must be positive'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Invalid year'),
  validate,
];

export const expenseQueryValidation = [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  query('year').optional().isInt({ min: 2000 }).withMessage('Invalid year'),
  query('type').optional().isIn(['personal', 'household']).withMessage('Invalid type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  validate,
];

// Single param validator (includes validate at the end — use alone on GET/DELETE)
export const mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate,
];

// Param-only rule without validate — safe to spread before other validators
export const idParamRule = param('id').isMongoId().withMessage('Invalid ID format');
