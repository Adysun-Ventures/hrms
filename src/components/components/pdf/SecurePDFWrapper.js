import React, { useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Download } from 'lucide-react';

/**
 * SecurePDFWrapper - Enhances PDFs with proper metadata and security features
 * 
 * This component wraps around PDF documents and adds security-enhancing
 * features like proper metadata, without modifying the original PDF generation code.
 */
const SecurePDFWrapper = ({ 
  pdfDocument, 
  fileName = 'bank-statement.pdf',
  statementData,
  bankData
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const documentRef = useRef(pdfDocument);

  // Function to enhance PDF with proper metadata and security
  const enhancePDF = async (originalPdfBytes) => {
    try {
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Set proper metadata
      pdfDoc.setProducer(`${bankData.bankName} Statement System v1.0`);
      pdfDoc.setCreator(`${bankData.bankName} Financial Services`);
      pdfDoc.setTitle(`${bankData.bankName} Statement - ${statementData.accountNumber}`);
      pdfDoc.setSubject(`Account Statement for ${statementData.statementPeriod}`);
      pdfDoc.setKeywords(['bank statement', 'financial record', bankData.bankName, 'official document']);
      
      // Generate a document ID and add as metadata
      const docId = generateUniqueDocId(statementData);
      pdfDoc.setCustomMetadata('DocumentID', docId);
      pdfDoc.setCustomMetadata('IssueDate', new Date().toISOString());
      pdfDoc.setCustomMetadata('IssuingBank', bankData.bankName);
      
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      return modifiedPdfBytes;
    } catch (error) {
      console.error('Error enhancing PDF:', error);
      return originalPdfBytes; // Fall back to original if enhancement fails
    }
  };

  // Generate a unique document ID based on statement data
  const generateUniqueDocId = (data) => {
    const idSource = `${data.accountNumber}-${data.statementDate}-${data.closingBalance}`;
    let hash = 0;
    for (let i = 0; i < idSource.length; i++) {
      hash = ((hash << 5) - hash) + idSource.charCodeAt(i);
      hash |= 0;
    }
    return `DOC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  };

  // Handler for secure download
  const handleSecureDownload = async () => {
    setIsProcessing(true);
    try {
      // Get blob from the React-PDF document
      const blob = await pdfDocument.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Enhance the PDF with proper metadata
      const securedPdfBytes = await enhancePDF(arrayBuffer);
      
      // Create a download link for the secured PDF
      const securedBlob = new Blob([securedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(securedBlob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error during secure download:', error);
      alert('Could not create secured PDF. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleSecureDownload}
      disabled={isProcessing}
      className="bg-blue-600 text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-blue-400"
    >
      <Download className="w-5 h-5" />
      {isProcessing ? "Securing document..." : "Download Secure PDF"}
    </button>
  );
};

export default SecurePDFWrapper; 