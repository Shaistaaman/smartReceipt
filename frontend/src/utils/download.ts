import { invokeLambda } from './lambda';

export const downloadReceiptImage = async (expense: any) => {
  if (expense.receiptFile) {
    const url = URL.createObjectURL(expense.receiptFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${expense.vendor}-${expense.date}.${expense.receiptFile.name.split('.').pop()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else if (expense.receiptUrl) {
    try {
      const response = await invokeLambda('GetPresignedUrlLambda', { s3_key: expense.receiptUrl });
      const presignedUrl = response.presigned_url;

      const link = document.createElement('a');
      link.href = presignedUrl;
      link.download = `receipt-${expense.vendor}-${expense.date}.jpg`; // You might want to get the actual file extension
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error getting presigned URL or downloading image:", error);
      alert("Could not download receipt image.");
    }
  }
};

export const generateReportImage = async (reportElement: HTMLElement): Promise<Blob> => {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(reportElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  });
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
};

export const shareReportViaEmail = async (reportElement: HTMLElement, reportData: any) => {
  try {
    const imageBlob = await generateReportImage(reportElement);
    const imageUrl = URL.createObjectURL(imageBlob);
    
    const subject = `Weekly Expense Report - ${new Date().toLocaleDateString()}`;
    const body = `Hi there!

Here's my weekly expense report:

Total Spent: $${reportData.totalSpent.toFixed(2)}
Budget: $${reportData.budgetLimit.toFixed(2)}
Savings: $${(reportData.budgetLimit - reportData.totalSpent).toFixed(2)} (${reportData.percentUnderBudget}% under budget!)

Top Categories:
${reportData.topCategories.map((cat: any) => `• ${cat.category}: $${cat.amount.toFixed(2)}`).join('\n')}

Best regards,
Smart Receipts App`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
  } catch (error) {
    console.error('Error sharing report:', error);
    alert('Error generating report image. Please try again.');
  }
};