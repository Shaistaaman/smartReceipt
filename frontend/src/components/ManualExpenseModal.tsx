import React, { useState, useEffect } from 'react'
import { X, Save, DollarSign } from 'lucide-react'
import { Expense } from '../types/expense'
import { saveExpense, updateExpense } from '../utils/dataService'
import { categories } from '../utils/mockData'

interface ManualExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSuccess: () => void // New prop for success callback
  expense?: Expense
  isEditing?: boolean
  userId: string // Add userId prop
}

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  expense,
  isEditing = false,
  userId, // Destructure userId here
}) => {
  const [formData, setFormData] = useState({
    vendor: expense?.vendor === 'Not Applicable' ? '' : expense?.vendor || '',
    amount:
      typeof expense?.amount === 'number'
        ? expense.amount
        : expense?.amount === 'Not Applicable'
        ? 0
        : 0,
    category:
      expense?.category === 'Not Applicable'
        ? categories[0]
        : expense?.category || categories[0],
    description:
      expense?.description === 'Not Applicable'
        ? ''
        : expense?.description || '',
    date:
      expense?.date === 'Not Applicable'
        ? new Date().toISOString().split('T')[0]
        : expense?.date || new Date().toISOString().split('T')[0],
    isRecurring: expense?.isRecurring || false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Update form data when expense prop changes (e.g., when editing a different expense)
    setFormData({
      vendor: expense?.vendor === 'Not Applicable' ? '' : expense?.vendor || '',
      amount:
        typeof expense?.amount === 'number'
          ? expense.amount
          : expense?.amount === 'Not Applicable'
          ? 0
          : 0,
      category:
        expense?.category === 'Not Applicable'
          ? categories[0]
          : expense?.category || categories[0],
      description:
        expense?.description === 'Not Applicable'
          ? ''
          : expense?.description || '',
      date:
        expense?.date === 'Not Applicable'
          ? new Date().toISOString().split('T')[0]
          : expense?.date || new Date().toISOString().split('T')[0],
      isRecurring: expense?.isRecurring || false
    })
  }, [expense])

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor name is required'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const expenseData = {
      vendor: formData.vendor.trim(),
      amount: formData.amount,
      category: formData.category,
      description: formData.description.trim(),
      date: formData.date,
      isRecurring: formData.isRecurring,
      userId // Pass userId
    }

    try {
      if (isEditing && expense) {
        await updateExpense({ ...expense, ...expenseData })
      } else {
        await saveExpense(expenseData)
      }
      onSaveSuccess() // Call success callback
      onClose()
    } catch (error) {
      console.error('Error saving/updating expense:', error)
      // TODO: Show error message to user
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-2xl font-bold text-gray-900'>
            {isEditing ? 'Edit Expense' : 'Add Manual Expense'}
          </h2>
          <button
            onClick={handleClose}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Vendor Name *
            </label>
            <input
              type='text'
              value={formData.vendor}
              onChange={e =>
                setFormData({ ...formData, vendor: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                errors.vendor ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., Starbucks, Amazon, Shell'
            />
            {errors.vendor && (
              <p className='text-red-500 text-sm mt-1'>{errors.vendor}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Amount *
            </label>
            <div className='relative'>
              <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='number'
                step='0.01'
                min='0'
                value={formData.amount || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0
                  })
                }
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='0.00'
              />
            </div>
            {errors.amount && (
              <p className='text-red-500 text-sm mt-1'>{errors.amount}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Category
            </label>
            <select
              value={formData.category}
              onChange={e =>
                setFormData({ ...formData, category: e.target.value })
              }
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors'
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date *
            </label>
            <input
              type='date'
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className='text-red-500 text-sm mt-1'>{errors.date}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors'
              placeholder='Optional notes about this expense...'
            />
          </div>

          <div className='flex items-center'>
            <input
              type='checkbox'
              id='isRecurring'
              checked={formData.isRecurring}
              onChange={e =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
            />
            <label htmlFor='isRecurring' className='ml-2 text-sm text-gray-700'>
              This is a recurring expense
            </label>
          </div>

          <div className='flex space-x-4 pt-4'>
            <button
              type='submit'
              className='flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2'
            >
              <Save className='w-4 h-4' />
              <span>{isEditing ? 'Update Expense' : 'Save Expense'}</span>
            </button>
            <button
              type='button'
              onClick={handleClose}
              className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
