import { Expense } from '../types/expense';
import { invokeLambda } from './lambda';

export const saveExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const response = await invokeLambda('SaveExpenseLambda', expense);
  return { ...expense, id: response.expenseId };
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  const response = await invokeLambda('GetExpensesLambda', { userId });
  return response.expenses.map((exp: any) => ({
    id: exp.expenseId, // Map expenseId from DynamoDB to id for frontend
    receiptUrl: exp.s3_key, // Map s3_key from DynamoDB to receiptUrl
    ...exp,
    amount: Number(exp.amount), // Convert amount back to number
  }));
};

export const updateExpense = async (expense: Expense): Promise<Expense> => {
  await invokeLambda('UpdateExpenseLambda', expense);
  return expense;
};

export const deleteExpense = async (expenseId: string, userId: string): Promise<void> => {
  try {
    const response = await invokeLambda('DeleteExpenseLambda', { expenseId, userId });
    console.log("Delete Lambda response:", response);
  } catch (error) {
    console.error("Error in deleteExpense data service:", error);
    throw error;
  }
};

export const updateUserPreferences = async (userId: string, notificationsEnabled: boolean): Promise<void> => {
  await invokeLambda('UpdateUserPreferencesLambda', { userId, notificationsEnabled });
};