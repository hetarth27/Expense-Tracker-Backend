import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Auth ───────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  familyGroupId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthPayload {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// ─── Expense ─────────────────────────────────────────────
export type ExpenseType = 'personal' | 'household';
export type PaymentMethod = 'cash' | 'UPI' | 'card';

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Medicines',
  'Utilities',
  'Housing',
  'Education',
  'Travel',
  'Groceries',
  'Fruits & Vegetables',
  'Subscriptions',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface IExpense extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  note?: string;
  date: Date;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Budget ───────────────────────────────────────────────
export interface IBudget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category: ExpenseCategory;
  monthlyLimit: number;
  month: number; // 1-12
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Query Filters ────────────────────────────────────────
export interface ExpenseFilters {
  month?: number;
  year?: number;
  type?: ExpenseType;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
}

// ─── Aggregation Results ──────────────────────────────────
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  total: number;
  count: number;
}

export interface DashboardInsights {
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentageChange: number;
  highestCategory: CategoryTotal | null;
  categoryBreakdown: CategoryTotal[];
  monthlyTrend: MonthlyTotal[];
  recentExpenses: IExpense[];
}

// ─── API Response ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
