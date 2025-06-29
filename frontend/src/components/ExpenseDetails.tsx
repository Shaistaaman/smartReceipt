import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { ManualExpenseModal } from './ManualExpenseModal';
import { Expense } from '../types/expense';
import { categories } from '../utils/mockData';
import { getExpenses, saveExpense, updateExpense, deleteExpense } from '../utils/dataService';

interface ExpenseDetailsProps {
  userId: string;
}

export const ExpenseDetails: React.FC<ExpenseDetailsProps> = ({ userId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  const filteredExpenses = expenses
    .filter(expense => 
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(expense => 
      selectedCategory === 'All' || expense.category === selectedCategory
    )
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
          <p className="text-gray-600">
            {filteredExpenses.length} expenses • Total: ${Number(totalAmount || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            <span className="text-sm">Date</span>
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            {category}
            {category !== 'All' && (
              <span className="ml-1 text-xs">
                ({expenses.filter(e => e.category === category).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredExpenses.map((expense, index) => (
            <div
              key={expense.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
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