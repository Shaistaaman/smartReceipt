import { Expense } from '../types/expense';

export const exportTaxData = async (expenses: Expense[], year: number, userId: string) => {
  // Filter expenses for the specified year
  const yearlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return !isNaN(expenseDate.getTime()) && expenseDate.getFullYear() === year;
  });

  if (yearlyExpenses.length === 0) {
    alert(`No expenses found for ${year}`);
    return;
  }

  try {
    // Create CSV content
    const csvContent = generateCSV(yearlyExpenses);
    
    // Create CSV blob
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Download CSV file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(csvBlob);
    link.download = `tax-data-${year}-${userId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    // Show success message
    alert(`Tax data for ${year} exported successfully!`);
    
  } catch (error) {
    console.error('Error exporting tax data:', error);
    alert('Error exporting tax data. Please try again.');
  }
};

const generateCSV = (expenses: Expense[]): string => {
  const headers = [
    'Date',
    'Vendor',
    'Amount',
    'Category',
    'Description',
    'Receipt Available',
    'Recurring'
  ];
  
  const rows = expenses.map(expense => [
    expense.date,
    `"${expense.vendor === 'Not Applicable' ? '' : expense.vendor}"`,
    Number(expense.amount || 0).toFixed(2),
    `"${expense.category === 'Not Applicable' ? '' : expense.category}"`,
    `"${expense.description === 'Not Applicable' ? '' : expense.description || ''}"`,
    expense.receiptUrl ? 'Yes' : 'No',
    expense.isRecurring ? 'Yes' : 'No'
  ]);
  
  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + (Number(expense.amount) || 0);
    return acc;
  }, {} as Record<string, number>);
  
  const totalAmount = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  
  // Build CSV content
  let csvContent = headers.join(',') + '\n';
  csvContent += rows.map(row => row.join(',')).join('\n');
  
  // Add summary section
  csvContent += '\n\n--- SUMMARY ---\n';
  csvContent += `Total Expenses,${totalAmount.toFixed(2)}\n`;
  csvContent += `Total Receipts,${expenses.length}\n\n`;
  
  csvContent += '--- BY CATEGORY ---\n';
  csvContent += 'Category,Amount,Count\n';
  
  Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, amount]) => {
      const count = expenses.filter(e => e.category === category).length;
      csvContent += `"${category === 'Not Applicable' ? 'Uncategorized' : category}",${amount.toFixed(2)},${count}\n`;
    });
  
  return csvContent;
};