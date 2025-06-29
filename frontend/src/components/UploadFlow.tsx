import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Edit, Save } from 'lucide-react';
import { Expense } from '../types/expense';
import { categories } from '../utils/mockData';
import { invokeLambda } from '../utils/lambda';

interface UploadFlowProps {
  extractedData: Partial<Expense>;
  onSave: (expense: Expense, file?: File) => void; // Keep for now, but actual save will be via lambda
  onBack: () => void;
  uploadedFile?: File;
  userId: string; // Add userId prop
  s3Key: string; // Add s3Key prop
}

export const UploadFlow: React.FC<UploadFlowProps> = ({ extractedData, onSave, onBack, uploadedFile, userId, s3Key }) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    vendor: extractedData.vendor || 'Not Applicable',
    amount: extractedData.amount || 'Not Applicable',
    category: extractedData.category || 'Not Applicable',
    description: extractedData.description || 'Not Applicable',
    date: extractedData.date || 'Not Applicable',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Update form data when extractedData changes
    setFormData({
      vendor: extractedData.vendor || 'Not Applicable',
      amount: extractedData.amount || 'Not Applicable',
      category: extractedData.category || 'Not Applicable',
      description: extractedData.description || 'Not Applicable',
      date: extractedData.date || 'Not Applicable',
    });
  }, [extractedData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const expenseToSave = {
        userId: userId,
        vendor: formData.vendor,
        amount: parseFloat(formData.amount as string) || 0, // Ensure amount is a number
        category: formData.category,
        description: formData.description,
        date: formData.date,
        s3_key: s3Key, // Pass the S3 key to save with the expense
      };

      await invokeLambda('SaveExpenseLambda', expenseToSave);
      onSave(formData as Expense, uploadedFile); // Call parent's onSave to update UI state
    } catch (error) {
      console.error("Error saving expense:", error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Review Extracted Data</h1>
      </div>

      {/* Success Animation */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Receipt Processed Successfully!</h3>
        <p className="text-green-600">Our AI has extracted the following information. Please review and edit if needed.</p>
      </div>

      {/* Extracted Data Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            <Edit className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {formData.vendor}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={typeof formData.amount === 'number' ? formData.amount : ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {typeof formData.amount === 'number' ? `$${formData.amount.toFixed(2)}` : formData.amount}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            {isEditing ? (
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {formData.category}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {formData.description}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            {isEditing ? (
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {formData.date !== 'Not Applicable' ? new Date(formData.date!).toLocaleDateString() : 'Not Applicable'}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Expense</span>
              </>
            )}
          </button>
          <button
            onClick={onBack}
            disabled={isSaving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};