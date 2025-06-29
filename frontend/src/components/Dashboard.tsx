import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Plus } from 'lucide-react';
import { UploadCard } from './UploadCard';
import { ExpenseCard } from './ExpenseCard';
import { ExpenseChart } from './ExpenseChart';
import { ManualExpenseModal } from './ManualExpenseModal';
import { Expense } from '../types/expense';
import { getExpenses, saveExpense, updateExpense, deleteExpense } from '../utils/dataService';

interface DashboardProps {
  onUpload: (file: File, extractedData: any) => void; // Updated prop signature
  isProcessing: boolean;
  userId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onUpload, isProcessing, userId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const userExpenses = await getExpenses(userId);
        setExpenses(userExpenses);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    };
    fetchExpenses();
  }, [userId]);

  const totalSpent = Number(expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0));
  const thisMonthExpenses = expenses.filter(expense => 
    new Date(expense.date).getMonth() === new Date().getMonth()
  );
  const thisMonthTotal = Number(thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
  const avgPerTransaction = expenses.length > 0 ? Number(totalSpent / expenses.length) : 0;

  const stats = [
    {
      title: 'Total Spent',
      value: `$${totalSpent.toFixed(2)}`,
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: DollarSign,
    },
    {
      title: 'This Month',
      value: `$${thisMonthTotal.toFixed(2)}`,
      change: '-8.2%',
      changeType: 'decrease' as const,
      icon: TrendingDown,
    },
    {
      title: 'Avg per Transaction',
      value: `$${avgPerTransaction.toFixed(2)}`,
      change: '+5.7%',
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
    {
      title: 'Total Receipts',
      value: expenses.length.toString(),
      change: '+3',
      changeType: 'increase' as const,
      icon: Receipt,
    },
  ];

  const handleSaveManualExpense = async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    try {
      if (editingExpense) {
        await updateExpense({ ...editingExpense, ...expenseData, userId });
      } else {
        await saveExpense({ ...expenseData, userId });
      }
      const updatedExpenses = await getExpenses(userId);
      setExpenses(updatedExpenses);
      setIsManualModalOpen(false);
    } catch (error) {
      console.error("Error saving manual expense:", error);
      // TODO: Show error message to user
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsManualModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    console.log("Attempting to delete expense with ID:", expenseId); // Added log
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId, userId);
        const updatedExpenses = await getExpenses(userId);
        setExpenses(updatedExpenses);
      } catch (error) {
        console.error("Error deleting expense:", error);
        // TODO: Show error message to user
      }
    }
  };

  const handleCloseModal = () => {
    setIsManualModalOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Snap. Upload. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">Done.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Expense tracking powered by AI. Upload your receipts and let our smart system categorize everything automatically.
        </p>
      </div>

      {/* Upload Card */}
      <UploadCard onUpload={onUpload} isProcessing={isProcessing} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Expenses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
            <button 
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual</span>
            </button>
          </div>
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
                <p className="text-gray-600">Upload a receipt or add a manual expense to get started.</p>
              </div>
            ) : (
              expenses.slice(0, 5).map((expense, index) => (
                <div
                  key={expense.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ExpenseCard 
                    expense={expense} 
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-6">
          <ExpenseChart expenses={expenses} />
        </div>
      </div>

      {/* Manual Expense Modal */}
      <ManualExpenseModal
        isOpen={isManualModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={async () => setExpenses(await getExpenses(userId))} // Pass success callback
        expense={editingExpense}
        isEditing={!!editingExpense}
        userId={userId}
      />
    </div>
  );
};