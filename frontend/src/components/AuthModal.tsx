import React, { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import {
  authenticateUser,
  registerUser,
  confirmUserRegistration
} from '../utils/auth'
import { User as AuthUser } from '../types/auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: AuthUser) => void // Callback for successful authentication/registration
  isLoading: boolean
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  isLoading
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [isConfirmMode, setIsConfirmMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmationCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!isConfirmMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
    }

    if (!isLoginMode && !isConfirmMode && !formData.name) {
      newErrors.name = 'Name is required'
    }

    if (isConfirmMode && !formData.confirmationCode) {
      newErrors.confirmationCode = 'Confirmation code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage(null)

    if (!validateForm()) return

    try {
      if (isConfirmMode) {
        const success = await confirmUserRegistration(
          formData.email,
          formData.confirmationCode
        )
        if (success) {
          setSuccessMessage(
            'Email confirmed successfully! You can now sign in.'
          )
          setIsConfirmMode(false)
          setIsLoginMode(true)
          setFormData({ ...formData, confirmationCode: '' })
        } else {
          setErrors({ general: 'Invalid confirmation code. Please try again.' })
        }
      } else if (isLoginMode) {
        const user = await authenticateUser(formData.email, formData.password)
        if (user) {
          onAuthSuccess(user)
          onClose()
        } else {
          setErrors({ general: 'Invalid email or password.' })
        }
      } else {
        const user = await registerUser(
          formData.email,
          formData.password,
          formData.name
        )
        if (user) {
          setSuccessMessage(
            'Registration successful! Please check your email for a confirmation code.'
          )
          setIsConfirmMode(true)
        } else {
          setErrors({ general: 'Registration failed. Please try again.' })
        }
      }
    } catch (error: any) {
      console.error('Authentication/Registration error:', error)
      setErrors({ general: error.message || 'An unexpected error occurred.' })
    }
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', confirmationCode: '' })
    setErrors({})
    setSuccessMessage(null)
  }

  const switchMode = () => {
    setIsLoginMode(!isLoginMode)
    setIsConfirmMode(false)
    resetForm()
  }

  const switchToConfirmMode = () => {
    setIsConfirmMode(true)
    setIsLoginMode(false)
    resetForm()
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-2xl font-bold text-gray-900'>
            {isConfirmMode
              ? 'Confirm Your Email'
              : isLoginMode
              ? 'Welcome Back'
              : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {errors.general && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
              {errors.general}
            </div>
          )}
          {successMessage && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm'>
              {successMessage}
            </div>
          )}

          {!isConfirmMode && !isLoginMode && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Full Name
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='Enter your full name'
                />
              </div>
              {errors.name && (
                <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='email'
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter your email'
                disabled={isConfirmMode} // Disable email input in confirm mode
              />
            </div>
            {errors.email && (
              <p className='text-red-500 text-sm mt-1'>{errors.email}</p>
            )}
          </div>

          {!isConfirmMode && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-red-500 text-sm mt-1'>{errors.password}</p>
              )}
            </div>
          )}

          {isConfirmMode && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Confirmation Code
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  value={formData.confirmationCode}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      confirmationCode: e.target.value
                    })
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.confirmationCode
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder='Enter confirmation code'
                />
              </div>
              {errors.confirmationCode && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.confirmationCode}
                </p>
              )}
            </div>
          )}

          <button
            type='submit'
            disabled={isLoading}
            className='w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <div className='flex items-center justify-center space-x-2'>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                <span>
                  {isConfirmMode
                    ? 'Confirming...'
                    : isLoginMode
                    ? 'Signing In...'
                    : 'Creating Account...'}
                </span>
              </div>
            ) : (
              <span>
                {isConfirmMode
                  ? 'Confirm Account'
                  : isLoginMode
                  ? 'Sign In'
                  : 'Create Account'}
              </span>
            )}
          </button>

          <div className='text-center'>
            <p className='text-gray-600'>
              {isConfirmMode ? (
                <button
                  type='button'
                  onClick={switchMode}
                  className='ml-2 text-purple-600 hover:text-purple-700 font-medium'
                >
                  Back to Sign In
                </button>
              ) : isLoginMode ? (
                "Don't have an account?"
              ) : (
                'Already have an account?'
              )}
              {!isConfirmMode && (
                <button
                  type='button'
                  onClick={switchMode}
                  className='ml-2 text-purple-600 hover:text-purple-700 font-medium'
                >
                  {isLoginMode ? 'Sign Up' : 'Sign In'}
                </button>
              )}
            </p>
            {!isLoginMode && !isConfirmMode && (
              <p className='text-gray-600 mt-2'>
                <button
                  type='button'
                  onClick={switchToConfirmMode}
                  className='text-purple-600 hover:text-purple-700 font-medium'
                >
                  Already have a code?
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Demo credentials - Remove in production */}
        {/* <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm font-medium mb-1">Demo Credentials:</p>
            <p className="text-blue-700 text-sm">Email: demo@smartreceipts.com</p>
            <p className="text-blue-700 text-sm">Password: demo123</p>
          </div>
        </div> */}
      </div>
    </div>
  )
}
