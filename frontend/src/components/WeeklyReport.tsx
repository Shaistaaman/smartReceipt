import React, { useState, useRef, useEffect } from 'react';
import { Download, Mail, Calendar, TrendingUp, Target } from 'lucide-react';
import { shareReportViaEmail, generateReportImage } from '../utils/download';
import { getExpenses } from '../utils/dataService';
import { Expense } from '../types/expense';

interface WeeklyReportProps {
  userId: string;
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ userId }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

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

  // Calculate weekly report data
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    // Filter out expenses with invalid dates
    if (isNaN(expenseDate.getTime())) {
      return false;
    }
    return expenseDate >= weekStart && expenseDate <= weekEnd;
  });

  const totalSpent = weeklyExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const budgetLimit = 500; // This could be user-configurable
  const percentUnderBudget = Math.max(0, Math.round(((budgetLimit - totalSpent) / budgetLimit) * 100));

  // Calculate top categories
  const categoryTotals = weeklyExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + (Number(expense.amount) || 0);
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const report = {
    totalSpent,
    budgetLimit,
    percentUnderBudget,
    topCategories,
  };

  const handleShare = async () => {
    if (reportRef.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      await shareReportViaEmail(reportRef.current, report);
    }
  };

  const handleDownloadReport = async () => {
    if (reportRef.current) {
      try {
        const imageBlob = await generateReportImage(reportRef.current);
        const imageUrl = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.error('Error downloading report image:', error);
        alert('Error generating report image for download. Please try again.');
      }
    }
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}, ${now.getFullYear()}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Expense Report</h1>
        <p className="text-gray-600">{formatDateRange()}</p>
      </div>

      {/* Main Report Card */}
      <div 
        ref={reportRef}
        className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-8 relative overflow-hidden"
      >
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="confetti-animation">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Target className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {totalSpent <= budgetLimit ? 'Great job this week!' : 'Over budget this week'}
          </h2>
          <p className="text-lg text-gray-700">
            You spent <span className="font-bold text-purple-700">${Number(totalSpent).toFixed(2)}</span>
          </p>
          {totalSpent <= budgetLimit ? (
            <p className="text-lg text-green-700 font-semibold">
              {percentUnderBudget}% under your budget!
            </p>
          ) : (
            <p className="text-lg text-red-700 font-semibold">
              ${(Number(totalSpent) - Number(budgetLimit)).toFixed(2)} over budget
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Budget Period</p>
            <p className="text-lg font-bold text-gray-900">7 Days</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {totalSpent <= budgetLimit ? 'Savings' : 'Over Budget'}
            </p>
            <p className={`text-lg font-bold ${Number(totalSpent) <= Number(budgetLimit) ? 'text-green-700' : 'text-red-700'}`}>
              ${Math.abs(Number(budgetLimit) - Number(totalSpent)).toFixed(2)}
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Budget Limit</p>
            <p className="text-lg font-bold text-gray-900">${Number(budgetLimit).toFixed(2)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleShare}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
          >
            <Mail className="w-4 h-4" />
            <span>Share Report</span>
          </button>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center justify-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending Breakdown</h3>
        
        {topCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No expenses recorded this week.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-purple-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <span className="font-medium text-gray-900">{category.category === 'Not Applicable' ? 'Uncategorized' : category.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${Number(category.amount || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Expenses</span>
            <span className="text-xl font-bold text-gray-900">${Number(totalSpent).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Money-Saving Tips</h3>
        <div className="space-y-2 text-sm text-blue-800">
          {totalSpent <= budgetLimit ? (
            <>
              <p>• Great job staying under budget! Keep up the good work.</p>
              <p>• Consider setting aside your savings for future goals.</p>
              <p>• Your spending habits are on track for financial success.</p>
            </>
          ) : (
            <>
              <p>• You went over budget this week. Review your largest expenses.</p>
              <p>• Consider meal planning to reduce food and dining costs.</p>
              <p>• Look for subscription services you might not be using.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};