import React, { useState } from 'react';
import { Receipt, BarChart3, Settings, LogOut, User, Calendar } from 'lucide-react';
import { User as UserType } from '../types/auth';
import { TaxCalendar } from './TaxCalendar';

interface HeaderProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onScreenChange, user, onLogout }) => {
  const [showTaxCalendar, setShowTaxCalendar] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Receipts</h1>
            </div>

            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onScreenChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentScreen === item.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Tax Calendar Button */}
              <button
                onClick={() => setShowTaxCalendar(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Tax Calendar</span>
              </button>
            </nav>

            <div className="flex items-center space-x-2">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
              <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tax Calendar Modal */}
      {user && (
        <TaxCalendar
          isOpen={showTaxCalendar}
          onClose={() => setShowTaxCalendar(false)}
          userId={user.id}
        />
      )}
    </>
  );
};