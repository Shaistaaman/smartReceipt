import React, { useState } from 'react';
import { Receipt, CheckCircle, TrendingUp, FileText, Shield, Zap, ArrowRight } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { User as AuthUser } from '../types/auth';

interface LandingPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthSuccess }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Manage loading state for AuthModal

  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    onAuthSuccess(user);
    setIsAuthModalOpen(false);
  };

  const features = [
    {
      icon: Receipt,
      title: 'AI-Powered Receipt Scanning',
      description: 'Simply snap a photo and let our AI extract all the details automatically.',
    },
    {
      icon: FileText,
      title: 'Tax-Ready Organization',
      description: 'Keep all receipts organized and easily accessible for tax filing season.',
    },
    {
      icon: TrendingUp,
      title: 'Monthly Expense Tracking',
      description: 'Monitor your spending patterns and stay within budget effortlessly.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely in your personal space.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process receipts in seconds, not minutes. Save time for what matters.',
    },
    {
      icon: CheckCircle,
      title: 'Never Lose a Receipt',
      description: 'Digital backup ensures your receipts are always safe and searchable.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Receipts</h1>
            </div>
            <button
              onClick={handleOpenAuthModal}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center space-x-2"
            >
              <span>Login to Your Expense Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Ready to Put Off Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">
                    Receipt Burden
                  </span>
                  ?
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Stop drowning in messy receipts! Smart Receipts keeps all your expenses organized in one place, 
                  making tax filing and monthly budgeting effortless.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg text-gray-700">All receipts in one secure place</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg text-gray-700">Easy to find when filing taxes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg text-gray-700">Track monthly expenditure automatically</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg text-gray-700">AI-powered categorization</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleOpenAuthModal}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Start Organizing Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-purple-200 hover:bg-purple-50 transition-colors">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 overflow-hidden">
                {/* Person with messy receipts */}
                <div className="text-center space-y-6">
                  <div className="text-6xl">🤯</div>
                  <p className="text-lg font-medium text-purple-800">Before Smart Receipts</p>
                  
                  {/* Scattered receipts */}
                  <div className="relative h-40">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute bg-white rounded-lg shadow-md p-2 text-xs transform rotate-12 opacity-80"
                        style={{
                          left: `${Math.random() * 80}%`,
                          top: `${Math.random() * 80}%`,
                          transform: `rotate(${Math.random() * 60 - 30}deg)`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      >
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow pointing down */}
                <div className="text-center my-6">
                  <div className="inline-block bg-white rounded-full p-3 shadow-lg">
                    <ArrowRight className="w-6 h-6 text-purple-600 transform rotate-90" />
                  </div>
                </div>

                {/* Organized receipts */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="text-4xl">😌</div>
                    <p className="text-lg font-medium text-green-800">After Smart Receipts</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-green-50 rounded-lg p-2 text-center">
                          <Receipt className="w-4 h-4 text-green-600 mx-auto mb-1" />
                          <div className="text-xs text-green-700">Organized</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Smart Receipts?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your expense management from chaos to clarity with our intelligent features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Expenses?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of users who have simplified their expense tracking with Smart Receipts
          </p>
          <button
            onClick={handleOpenAuthModal}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Smart Receipts</h3>
            </div>
            <p className="text-gray-400">
              © 2025 Smart Receipts. All rights reserved. Simplifying expense tracking, one receipt at a time.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        onAuthSuccess={handleAuthSuccess}
        isLoading={isLoading}
      />
    </div>
  );
};