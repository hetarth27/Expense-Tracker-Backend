import crypto from 'crypto';
import { Response } from 'express';
import { createError } from '../middleware/errorHandler';
import Expense from '../models/Expense';
import ShareToken from '../models/ShareToken';
import { AuthRequest } from '../types';

// ─── Generate Share Token ─────────────────────────────────────────────────────
export const generateShareToken = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Remove any existing tokens for this user
    await ShareToken.deleteMany({ userId });

    // Create new token
    const shareToken = await ShareToken.create({
        userId,
        token,
        expiresAt,
    });

    res.status(201).json({
        success: true,
        data: {
            token: shareToken.token,
            expiresAt: shareToken.expiresAt,
            shareUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/public/expenses/${shareToken.token}`,
        },
    });
};

// ─── Get Public Expenses ─────────────────────────────────────────────────────
export const getPublicExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
    const { token } = req.params;

    // Find the share token
    const shareToken = await ShareToken.findOne({ token }).populate('userId', 'name');

    if (!shareToken) {
        throw createError('Invalid or expired share link', 404);
    }

    // Check if token is expired
    if (shareToken.expiresAt < new Date()) {
        await ShareToken.deleteOne({ _id: shareToken._id });
        throw createError('Share link has expired', 410);
    }

    // Get user's expenses (last 50 for public view)
    const publicExpenses = await Expense.find({ userId: shareToken.userId })
        .sort({ date: -1 })
        .limit(50)
        .select('_id amount category type note date paymentMethod createdAt')
        .lean();

    res.status(200).json({
        success: true,
        data: {
            userName: (shareToken.userId as any).name,
            expenses: publicExpenses,
        },
    });
};

// ─── Revoke Share Token ──────────────────────────────────────────────────────
export const revokeShareToken = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await ShareToken.deleteMany({ userId });

    res.status(200).json({
        success: true,
        message: 'Share link revoked successfully',
    });
};