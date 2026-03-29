import { Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Expense from '../models/Expense';
import { AuthRequest } from '../types';
import { createError } from '../middleware/errorHandler';

export const upsertBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { category, monthlyLimit, month, year } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { userId, category, month, year },
    { monthlyLimit },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: { budget } });
};

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { month, year } = req.query as Record<string, string>;

  const now = new Date();
  const queryMonth = month ? parseInt(month) : now.getMonth() + 1;
  const queryYear = year ? parseInt(year) : now.getFullYear();

  // Fetch budgets
  const budgets = await Budget.find({
    userId,
    month: queryMonth,
    year: queryYear,
  }).lean();

  // Fetch actual spending per category for the same period
  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 1);

  const spendingAgg = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        spent: { $sum: '$amount' },
      },
    },
  ]);

  const spendingMap: Record<string, number> = {};
  spendingAgg.forEach((s) => {
    spendingMap[s._id] = s.spent;
  });

  const budgetsWithStatus = budgets.map((b) => {
    const spent = spendingMap[b.category] ?? 0;
    const percentage = Math.round((spent / b.monthlyLimit) * 100);
    return {
      ...b,
      spent,
      percentage,
      exceeded: spent > b.monthlyLimit,
      remaining: Math.max(b.monthlyLimit - spent, 0),
    };
  });

  res.status(200).json({ success: true, data: { budgets: budgetsWithStatus } });
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  const budget = await Budget.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!budget) throw createError('Budget not found', 404);

  res.status(200).json({ success: true, message: 'Budget deleted' });
};
