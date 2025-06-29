import React from 'react';
import { Expense } from '../types/expense';

interface ExpenseChartProps {
  expenses: Expense[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses }) => {
  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  const chartData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5 categories

  const colors = [
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h3>
      
      <div className="space-y-4">
        {chartData.map((item, index) => (
          <div key={item.category} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {item.category}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${Number(item.amount || 0).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${colors[index]}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Spending</span>
          <span className="text-lg font-bold text-gray-900">
            ${Number(totalAmount || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};