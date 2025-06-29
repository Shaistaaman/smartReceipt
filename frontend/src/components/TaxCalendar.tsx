import React, { useState, useEffect } from 'react';
import { X, Calendar, Download, FileText, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { Expense } from '../types/expense';
import { getExpenses } from '../utils/dataService';
import { exportTaxData } from '../utils/taxExport';

interface TaxCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type ViewType = 'week' | 'month' | 'year';

interface CalendarData {
  date: string;
  receipts: number;
  amount: number;
  expenses: Expense[];
}

export const TaxCalendar: React.FC<TaxCalendarProps> = ({ isOpen, onClose, userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchExpenses = async () => {
        try {
          const userExpenses = await getExpenses(userId);
          setExpenses(userExpenses);
          generateCalendarData(userExpenses);
        } catch (error) {
          console.error("Error fetching expenses for Tax Calendar:", error);
        }
      };
      fetchExpenses();
    }
  }, [isOpen, userId, currentDate, viewType]);

  const generateCalendarData = (expenseList: Expense[]) => {
    const data: CalendarData[] = [];
    
    // Helper to create a UTC date from YYYY-MM-DD string
    const createUTCDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    if (viewType === 'year') {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(Date.UTC(currentDate.getFullYear(), month, 1));
        const monthEnd = new Date(Date.UTC(currentDate.getFullYear(), month + 1, 0));
        
        const monthExpenses = expenseList.filter(expense => {
          const expenseDate = createUTCDate(expense.date);
          return !isNaN(expenseDate.getTime()) && expenseDate.getTime() >= monthStart.getTime() && expenseDate.getTime() <= monthEnd.getTime();
        });

        data.push({
          date: monthStart.toISOString().split('T')[0],
          receipts: monthExpenses.length,
          amount: monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
          expenses: monthExpenses,
        });
      }
    } else if (viewType === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = expenseList.filter(expense => {
          const expenseDate = createUTCDate(expense.date);
          return !isNaN(expenseDate.getTime()) && expenseDate.toISOString().split('T')[0] === dateStr;
        });
        
        data.push({
          date: dateStr,
          receipts: dayExpenses.length,
          amount: dayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
          expenses: dayExpenses,
        });
      }
    } else {
      const startOfWeek = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getUTCDay()));
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(startOfWeek);
        date.setUTCDate(startOfWeek.getUTCDate() + day);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = expenseList.filter(expense => {
          const expenseDate = createUTCDate(expense.date);
          return !isNaN(expenseDate.getTime()) && expenseDate.toISOString().split('T')[0] === dateStr;
        });
        
        data.push({
          date: dateStr,
          receipts: dayExpenses.length,
          amount: dayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
          expenses: dayExpenses,
        });
      }
    }
    
    setCalendarData(data);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewType === 'year') {
      newDate.setUTCFullYear(currentDate.getUTCFullYear() + (direction === 'next' ? 1 : -1));
    } else if (viewType === 'month') {
      newDate.setUTCMonth(currentDate.getUTCMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setUTCDate(currentDate.getUTCDate() + (direction === 'next' ? 7 : -7));
    }
    
    setCurrentDate(newDate);
  };

  const getDateLabel = () => {
    if (viewType === 'year') {
      return currentDate.getUTCFullYear().toString();
    } else if (viewType === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } else {
      const startOfWeek = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - currentDate.getUTCDay()));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`;
    }
  };

  const handleExportTaxData = async () => {
    const year = viewType === 'year' ? currentDate.getFullYear() : new Date().getFullYear();
    await exportTaxData(expenses, year, userId);
  };

  const formatCellDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00Z'); // Ensure UTC interpretation
    if (viewType === 'year') {
      return date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    } else if (viewType === 'month') {
      return date.getUTCDate().toString();
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
    }
  };

  const selectedDateData = selectedDate ? calendarData.find(d => d.date === selectedDate) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tax Calendar</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportTaxData}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Tax Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Calendar View */}
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {getDateLabel()}
                </h3>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {(['week', 'month', 'year'] as ViewType[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewType === view
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-4 overflow-auto">
              <div className={`grid gap-2 ${
                viewType === 'year' ? 'grid-cols-4' : 
                viewType === 'month' ? 'grid-cols-7' : 
                'grid-cols-7'
              }`}>
                {calendarData.map((data, index) => (
                  <div
                    key={data.date}
                    onClick={() => setSelectedDate(data.date)}
                    className={`p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedDate === data.date ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'
                    } ${data.receipts > 0 ? 'border-l-4 border-l-green-500' : ''}`}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {formatCellDate(data.date)}
                    </div>
                    {data.receipts > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Receipt className="w-3 h-3" />
                          <span>{data.receipts} receipt{data.receipts !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-xs font-semibold text-green-600">
                          ${Number(data.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Date Details */}
          {selectedDateData && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {viewType === 'year' 
                  ? new Date(selectedDateData.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : new Date(selectedDateData.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                }
              </h4>

              <div className="space-y-4 mb-6">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total Receipts</div>
                  <div className="text-xl font-bold text-gray-900">{selectedDateData.receipts}</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-xl font-bold text-green-600">${Number(selectedDateData.amount || 0).toFixed(2)}</div>
                </div>
              </div>

              {selectedDateData.expenses.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Expenses</h5>
                  <div className="space-y-2">
                    {selectedDateData.expenses.map((expense) => (
                      <div key={expense.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{expense.vendor === 'Not Applicable' ? 'N/A' : expense.vendor}</div>
                            <div className="text-xs text-gray-500">{expense.category === 'Not Applicable' ? 'N/A' : expense.category}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            ${Number(expense.amount || 0).toFixed(2)}
                          </div>
                        </div>
                        {expense.description && expense.description !== 'Not Applicable' && (
                          <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};