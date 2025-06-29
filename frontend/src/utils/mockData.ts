import { Expense, WeeklyReport } from '../types/expense';

export const mockExpenses: Expense[] = [
  {
    id: '1',
    vendor: 'Starbucks Coffee',
    amount: 12.99,
    category: 'Food & Dining',
    date: '2025-01-15',
    description: 'Morning coffee and pastry',
  },
  {
    id: '2',
    vendor: 'Uber',
    amount: 25.50,
    category: 'Transportation',
    date: '2025-01-14',
    description: 'Ride to downtown',
  },
  {
    id: '3',
    vendor: 'Amazon',
    amount: 89.99,
    category: 'Shopping',
    date: '2025-01-13',
    description: 'Office supplies',
  },
  {
    id: '4',
    vendor: 'Shell Gas Station',
    amount: 45.20,
    category: 'Transportation',
    date: '2025-01-12',
    description: 'Fuel fill-up',
  },
  {
    id: '5',
    vendor: 'Whole Foods',
    amount: 127.83,
    category: 'Groceries',
    date: '2025-01-11',
    description: 'Weekly grocery shopping',
  },
  {
    id: '6',
    vendor: 'Netflix',
    amount: 15.99,
    category: 'Entertainment',
    date: '2025-01-10',
    description: 'Monthly subscription',
    isRecurring: true,
  },
];

export const mockWeeklyReport: WeeklyReport = {
  totalSpent: 317.50,
  budgetLimit: 400,
  percentUnderBudget: 21,
  topCategories: [
    { category: 'Groceries', amount: 127.83, percentage: 40 },
    { category: 'Shopping', amount: 89.99, percentage: 28 },
    { category: 'Transportation', amount: 70.70, percentage: 22 },
    { category: 'Food & Dining', amount: 12.99, percentage: 4 },
  ],
};

export const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Groceries',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Travel',
  'Other',
];