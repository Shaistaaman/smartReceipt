import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { UploadFlow } from './components/UploadFlow';
import { ExpenseDetails } from './components/ExpenseDetails';
import { WeeklyReport } from './components/WeeklyReport';
import { Expense, UploadState } from './types/expense';
import { User, AuthState } from './types/auth';
import { getCurrentUser, signOutUser } from './utils/auth';
import { saveExpenseToStorage } from './utils/storage';
import { invokeLambda } from './utils/lambda'; // Import invokeLambda

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isProcessing: false,
    s3Key: undefined,
  });
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();

  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
    checkAuthSession();
  }, []);

  const handleAuthSuccess = (user: User) => {
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Modified handleUpload to manage processing state and call Lambdas
  const handleUpload = async (file: File, base64data: string) => {
    setUploadedFile(file);
    setUploadState(prev => ({ ...prev, isProcessing: true })); // Start processing

    try {
      // 1. Call UploadImageLambda
      const uploadResponse = await invokeLambda('UploadImageLambda', {
        image_data: base64data,
        file_name: file.name,
      });
      const s3Key = uploadResponse.s3_key;

      // 2. Call BedrockCategorizationLambda
      const bedrockResponse = await invokeLambda('BedrockCategorizationLambda', {
        s3_key: s3Key,
      });
      const extractedData = bedrockResponse.extracted_data;

      setUploadState({
        isUploading: false,
        isProcessing: false,
        extractedData: extractedData,
        s3Key: s3Key,
      });
      setCurrentScreen('upload-flow');
    } catch (error) {
      console.error("Error during upload or Bedrock processing:", error);
      setUploadState(prev => ({ ...prev, isProcessing: false })); // Stop processing on error
      // TODO: Show error message to user
    }
  };

  const handleSaveExpense = (expense: Expense, file?: File) => {
    if (!authState.user) return;

    const expenseWithUser: Expense = {
      ...expense,
      userId: authState.user.id,
      receiptFile: file,
    };

    saveExpenseToStorage(expenseWithUser);
    setUploadState({ isUploading: false, isProcessing: false, s3Key: undefined });
    setUploadedFile(undefined);
    setCurrentScreen('dashboard');
  };

  const handleBackToDashboard = () => {
    setUploadState({ isUploading: false, isProcessing: false, s3Key: undefined });
    setUploadedFile(undefined);
    setCurrentScreen('dashboard');
  };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <>
        <LandingPage onAuthSuccess={handleAuthSuccess} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          isLoading={authState.isLoading}
        />
      </>
    );
  }

  const renderCurrentScreen = () => {
    if (!authState.user) return null;

    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            onUpload={handleUpload}
            isProcessing={uploadState.isProcessing}
            userId={authState.user.id}
          />
        );
      case 'upload-flow':
        return uploadState.extractedData ? (
          <UploadFlow
            extractedData={uploadState.extractedData}
            onSave={handleSaveExpense}
            onBack={handleBackToDashboard}
            uploadedFile={uploadedFile}
            userId={authState.user.id}
            s3Key={uploadState.s3Key || ''}
          />
        ) : null;
      case 'expenses':
        return <ExpenseDetails userId={authState.user.id} />;
      case 'reports':
        return <WeeklyReport userId={authState.user.id} />;
      default:
        return (
          <Dashboard
            onUpload={handleUpload}
            isProcessing={uploadState.isProcessing}
            userId={authState.user.id}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <Header 
        currentScreen={currentScreen} 
        onScreenChange={setCurrentScreen}
        user={authState.user}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentScreen()}
      </main>
    </div>
  );
}

export default App;