import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useSecurePDF } from '../hooks/useSecurePDF';

/**
 * Component that provides a secure download button for bank statements
 * 
 * This component works alongside the existing BankStatement.js without modifying it,
 * and enhances the PDF with proper metadata and security features.
 */
const SecureBankStatementDownloader = ({ 
  pdfDocument, 
  statementData, 
  bankData,
  fileName = 'bank-statement.pdf'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { enhanceAndDownloadPDF } = useSecurePDF();

  const handleSecureDownload = async () => {
    setIsProcessing(true);
    try {
      const success = await enhanceAndDownloadPDF(
        pdfDocument,
        fileName,
        bankData,
        statementData
      );
      
      if (!success) {
        alert('There was a problem securing the PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error during secure download:', error);
      alert('Could not create secured PDF. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleSecureDownload}
        disabled={isProcessing}
        className="bg-blue-600 text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-blue-400"
      >
        <Download className="w-5 h-5" />
        {isProcessing ? "Securing document..." : "Download Secure PDF"}
      </button>
      <p className="text-xs text-gray-600 max-w-md">
        This download includes enhanced security metadata making the document appear as an official bank statement.
      </p>
    </div>
  );
};

export default SecureBankStatementDownloader; 