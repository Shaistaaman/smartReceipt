import { Expense } from '../types/expense';

export const saveExpenseToStorage = (expense: Expense) => {
  const expenses = getExpensesFromStorage(expense.userId);
  expenses.push(expense);
  localStorage.setItem(`expenses_${expense.userId}`, JSON.stringify(expenses));
};

export const getExpensesFromStorage = (userId: string): Expense[] => {
  const stored = localStorage.getItem(`expenses_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export const updateExpenseInStorage = (expense: Expense) => {
  const expenses = getExpensesFromStorage(expense.userId);
  const index = expenses.findIndex(e => e.id === expense.id);
  if (index !== -1) {
    expenses[index] = expense;
    localStorage.setItem(`expenses_${expense.userId}`, JSON.stringify(expenses));
  }
};

export const deleteExpenseFromStorage = (expenseId: string, userId: string) => {
  const expenses = getExpensesFromStorage(userId);
  const filtered = expenses.filter(e => e.id !== expenseId);
  localStorage.setItem(`expenses_${userId}`, JSON.stringify(filtered));
};