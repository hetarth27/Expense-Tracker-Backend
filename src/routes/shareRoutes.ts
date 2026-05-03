import { Router } from 'express';
import {
  generateShareToken,
  getPublicExpenses,
  revokeShareToken,
} from '../controllers/shareController';
import { protect } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Public route: the shared link must be readable without a logged-in session.
router.get('/expenses/:token', asyncHandler(getPublicExpenses));

// Protected routes: only authenticated users can create or revoke share links.
router.use(protect);
router.post('/generate', asyncHandler(generateShareToken));
router.delete('/revoke', asyncHandler(revokeShareToken));

export default router;
