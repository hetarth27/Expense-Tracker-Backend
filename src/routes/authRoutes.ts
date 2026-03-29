import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validation';
import { protect } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.post('/register', registerValidation, asyncHandler(register));
router.post('/login', loginValidation, asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));

export default router;
