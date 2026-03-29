import { Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense';
import { AuthRequest, ExpenseFilters } from '../types';
import { createError } from '../middleware/errorHandler';

// ─── Helper: Build date-range match ──────────────────────────────────────────
const buildDateFilter = (
  userId: string,
  filters: ExpenseFilters
): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  const now = new Date();
  const year = filters.year ?? now.getFullYear();
  const month = filters.month ?? now.getMonth() + 1;

  if (filters.month !== undefined || filters.year !== undefined) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    match.date = { $gte: start, $lt: end };
  }

  if (filters.type) match.type = filters.type;
  if (filters.category) match.category = filters.category;

  return match;
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const expense = await Expense.create({ ...req.body, userId });

  res.status(201).json({ success: true, data: { expense } });
};

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    month,
    year,
    type,
    category,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const filters: ExpenseFilters = {
    ...(month && { month: parseInt(month) }),
    ...(year && { year: parseInt(year) }),
    ...(type && { type: type as ExpenseFilters['type'] }),
    ...(category && { category: category as ExpenseFilters['category'] }),
  };

  const matchQuery = buildDateFilter(userId, filters);

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [expenses, total] = await Promise.all([
    Expense.find(matchQuery).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
    Expense.countDocuments(matchQuery),
  ]);

  res.status(200).json({
    success: true,
    data: {
      expenses,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getExpenseById = async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!expense) throw createError('Expense not found', 404);

  res.status(200).json({ success: true, data: { expense } });
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!expense) throw createError('Expense not found', 404);

  res.status(200).json({ success: true, data: { expense } });
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!expense) throw createError('Expense not found', 404);

  res.status(200).json({ success: true, message: 'Expense deleted successfully' });
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const currentYear = parseInt((req.query.year as string) || String(now.getFullYear()));
  const currentMonth = parseInt((req.query.month as string) || String(now.getMonth() + 1));
  const typeFilter = req.query.type as string | undefined;

  const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const currentMonthEnd = new Date(currentYear, currentMonth, 1);
  const prevMonthStart = new Date(currentYear, currentMonth - 2, 1);
  const prevMonthEnd = new Date(currentYear, currentMonth - 1, 1);

  const baseMatch: Record<string, unknown> = { userId: userObjectId };
  if (typeFilter) baseMatch.type = typeFilter;

  // Current month total + category breakdown
  const [currentMonthAgg, prevMonthAgg, monthlyTrend, recentExpenses] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          ...baseMatch,
          date: { $gte: currentMonthStart, $lt: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Previous month total
    Expense.aggregate([
      {
        $match: {
          ...baseMatch,
          date: { $gte: prevMonthStart, $lt: prevMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),

    // Last 6 months trend
    Expense.aggregate([
      {
        $match: {
          ...baseMatch,
          date: { $gte: new Date(currentYear, currentMonth - 7, 1), $lt: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),

    // Recent 5 expenses
    Expense.find({ userId: userObjectId })
      .sort({ date: -1 })
      .limit(5)
      .lean(),
  ]);

  const currentMonthTotal = currentMonthAgg.reduce((sum, c) => sum + c.total, 0);
  const previousMonthTotal = prevMonthAgg[0]?.total ?? 0;

  let percentageChange = 0;
  if (previousMonthTotal > 0) {
    percentageChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
  }

  const categoryBreakdown = currentMonthAgg.map((c) => ({
    category: c._id,
    total: c.total,
    count: c.count,
  }));

  res.status(200).json({
    success: true,
    data: {
      currentMonthTotal,
      previousMonthTotal,
      percentageChange: Math.round(percentageChange * 100) / 100,
      highestCategory: categoryBreakdown[0] ?? null,
      categoryBreakdown,
      monthlyTrend,
      recentExpenses,
    },
  });
};

// ─── Aggregations ─────────────────────────────────────────────────────────────

export const getCategoryTotals = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { month, year, type } = req.query as Record<string, string>;

  const filters: ExpenseFilters = {
    ...(month && { month: parseInt(month) }),
    ...(year && { year: parseInt(year) }),
    ...(type && { type: type as ExpenseFilters['type'] }),
  };

  const matchQuery = buildDateFilter(userId, filters);

  const result = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: { _id: 0, category: '$_id', total: 1, count: 1 },
    },
    { $sort: { total: -1 } },
  ]);

  res.status(200).json({ success: true, data: { categoryTotals: result } });
};

export const getMonthlyTotals = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { year, type } = req.query as Record<string, string>;

  const matchQuery: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (year) {
    const y = parseInt(year);
    matchQuery.date = {
      $gte: new Date(y, 0, 1),
      $lt: new Date(y + 1, 0, 1),
    };
  }

  if (type) matchQuery.type = type;

  const result = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        total: 1,
        count: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  res.status(200).json({ success: true, data: { monthlyTotals: result } });
};
