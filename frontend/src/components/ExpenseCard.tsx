import React, { useState } from 'react';
import { Edit, Trash2, Calendar, Tag, DollarSign, Download, FileImage } from 'lucide-react';
import { Expense } from '../types/expense';
import { downloadReceiptImage } from '../utils/download';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 50;

  const renderDescription = (description: string | undefined) => {
    if (!description || description === 'Not Applicable') {
      return 'No description';
    }
    if (description.length > MAX_DESCRIPTION_LENGTH && !isExpanded) {
      return (
        <>
          {description.substring(0, MAX_DESCRIPTION_LENGTH)}...
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className="text-purple-600 hover:underline ml-1"
          >
            See More
          </button>
        </>
      );
    }
    return description;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Groceries': 'bg-green-100 text-green-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Utilities': 'bg-indigo-100 text-indigo-800',
      'Travel': 'bg-teal-100 text-teal-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadReceipt = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadReceiptImage(expense);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {expense.vendor === 'Not Applicable' ? 'Not Applicable' : expense.vendor}
                </h3>
                <p className="text-xs text-gray-500">
                  {renderDescription(expense.description)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ${Number(expense.amount || 0).toFixed(2)}
            </p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
              {expense.category}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 animate-slideDown">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(expense.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Tag className="w-4 h-4" />
              <span>{expense.category}</span>
              {expense.isRecurring && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Recurring
                </span>
              )}
            </div>

            {expense.description && expense.description !== 'Not Applicable' && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Description: </span>{expense.description}
              </div>
            )}

            {(expense.receiptUrl || expense.receiptFile) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileImage className="w-4 h-4" />
                <span>Receipt available</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              {expense.receiptUrl && (
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Download Receipt</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(expense);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(expense.id);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 group-hover:animate-pulse transition-all" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};