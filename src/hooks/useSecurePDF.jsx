import { useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

/**
 * Custom hook for enhancing PDFs with security features
 * 
 * This hook provides functions to enhance PDFs with proper metadata
 * and security features without modifying the original PDF generation code.
 */
export function useSecurePDF() {
  /**
   * Enhance and download a PDF with proper metadata and security
   * @param {Object} pdfDocument - The React-PDF document to enhance
   * @param {string} fileName - The name of the file to download
   * @param {Object} bankData - Bank information for metadata
   * @param {Object} statementData - Statement data for metadata and security
   * @returns {Promise<boolean>} - Success/failure of the operation
   */
  const enhanceAndDownloadPDF = useCallback(async (
    pdfDocument, 
    fileName = 'bank-statement.pdf', 
    bankData,
    statementData
  ) => {
    try {
      // Convert React-PDF document to blob
      const blob = await pdfDocument.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Set proper bank-specific metadata
      pdfDoc.setProducer(`${bankData.bankName} Statement System v1.0`);
      pdfDoc.setCreator(`${bankData.bankName} Financial Services`);
      pdfDoc.setTitle(`${bankData.bankName} Statement - ${statementData.accountNumber}`);
      pdfDoc.setSubject(`Account Statement for ${statementData.statementPeriod}`);
      pdfDoc.setKeywords([
        'bank statement', 
        'financial record', 
        bankData.bankName, 
        'official document'
      ]);
      
      // Generate a document ID and add as metadata
      const docId = generateUniqueDocId(statementData);
      pdfDoc.setCustomMetadata('DocumentID', docId);
      pdfDoc.setCustomMetadata('IssueDate', new Date().toISOString());
      pdfDoc.setCustomMetadata('IssuingBank', bankData.bankName);
      pdfDoc.setCustomMetadata('VerificationURL', 
        `https://${bankData.bankName.toLowerCase().replace(/\s+/g, '')}bank.com/verify?id=${docId}`
      );
      
      // Save the enhanced PDF
      const enhancedPdfBytes = await pdfDoc.save();
      
      // Create download link
      const enhancedBlob = new Blob([enhancedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(enhancedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error enhancing PDF:', error);
      return false;
    }
  }, []);
  
  /**
   * Generate a unique document ID based on statement data
   * @param {Object} data - Statement data to use for ID generation
   * @returns {string} - A unique document ID
   */
  const generateUniqueDocId = (data) => {
    const idSource = `${data.accountNumber}-${data.statementDate}-${data.closingBalance}`;
    let hash = 0;
    for (let i = 0; i < idSource.length; i++) {
      hash = ((hash << 5) - hash) + idSource.charCodeAt(i);
      hash |= 0;
    }
    return `DOC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  };
  
  return { enhanceAndDownloadPDF };
} 