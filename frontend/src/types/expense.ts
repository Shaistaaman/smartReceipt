export interface Expense {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  receiptUrl?: string;
  receiptFile?: File;
  description?: string;
  isRecurring?: boolean;
  userId: string;
}

export interface WeeklyReport {
  totalSpent: number;
  budgetLimit: number;
  percentUnderBudget: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  extractedData?: Partial<Expense>;
  s3Key?: string;
}