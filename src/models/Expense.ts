import mongoose, { Schema } from 'mongoose';
import { IExpense, EXPENSE_CATEGORIES } from '../types';

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    type: {
      type: String,
      required: [true, 'Expense type is required'],
      enum: {
        values: ['personal', 'household'],
        message: '{VALUE} is not a valid type',
      },
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'UPI', 'card'],
        message: '{VALUE} is not a valid payment method',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1, date: -1 });
ExpenseSchema.index({ userId: 1, type: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
