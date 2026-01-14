import { PDFDocument } from 'pdf-lib';

/**
 * Utility functions for enhancing PDF security and metadata
 */

/**
 * Enhance a PDF with proper metadata for bank statements
 * @param {ArrayBuffer} pdfBytes - The original PDF bytes
 * @param {Object} bankData - Bank information for metadata
 * @param {Object} statementData - Statement data for metadata 
 * @returns {Promise<Uint8Array>} - Enhanced PDF bytes
 */
export const enhancePDFMetadata = async (pdfBytes, bankData, statementData) => {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Set proper metadata
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
    pdfDoc.setCustomMetadata('AccountLastFour', statementData.accountNumber.slice(-4));
    pdfDoc.setCustomMetadata('StatementPeriod', statementData.statementPeriod);
    pdfDoc.setCustomMetadata('BankBranch', statementData.branch || 'Main Branch');
    
    // Add verification URL
    const verificationUrl = generateVerificationUrl(bankData.bankName, docId);
    pdfDoc.setCustomMetadata('VerificationURL', verificationUrl);
    
    // Save the modified PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error enhancing PDF metadata:', error);
    throw error;
  }
};

/**
 * Generate a unique document ID based on statement data
 * @param {Object} data - Statement data to use for ID generation
 * @returns {string} - A unique document ID
 */
export const generateUniqueDocId = (data) => {
  // Create a data string from account number, date, and balance
  const idSource = `${data.accountNumber || ''}-${data.statementDate || ''}-${data.closingBalance || ''}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < idSource.length; i++) {
    hash = ((hash << 5) - hash) + idSource.charCodeAt(i);
    hash |= 0;
  }
  
  // Format as a document ID with bank code prefix
  return `DOC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
};

/**
 * Generate a verification URL for the bank statement
 * @param {string} bankName - Name of the bank
 * @param {string} docId - Unique document ID
 * @returns {string} - Verification URL
 */
export const generateVerificationUrl = (bankName, docId) => {
  // Create a clean bank domain
  const bankDomain = bankName.toLowerCase().replace(/\s+/g, '');
  return `https://${bankDomain}bank.com/verify?id=${docId}`;
};

/**
 * Trigger a download of the enhanced PDF
 * @param {Uint8Array} pdfBytes - Enhanced PDF bytes
 * @param {string} fileName - Name for the downloaded file
 */
export const downloadEnhancedPDF = (pdfBytes, fileName = 'bank-statement.pdf') => {
  // Create a blob from the PDF bytes
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get PDF document information (for debugging)
 * @param {ArrayBuffer} pdfBytes - PDF bytes to analyze
 * @returns {Promise<Object>} - PDF document info
 */
export const getPDFInfo = async (pdfBytes) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: pdfDoc.getKeywords(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
    };
  } catch (error) {
    console.error('Error getting PDF info:', error);
    return null;
  }
}; 

/**
 * Formats a date as '20 Jun 2025'.
 * @param date - The date string or Date object to format.
 * @returns The formatted date string.
 */
export function formatDateToDayMonYear(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date and time as '20 Jun 2025, 3:45 PM' in Indian timezone.
 * @param date - The date string or Date object to format.
 * @returns The formatted date and time string.
 */
export function formatDateToDayMonYearWithTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  
  // Convert to Indian timezone (IST - UTC+5:30)
  const indianTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  
  return indianTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Formats only time as '3:45 PM' in Indian timezone.
 * @param date - The date string or Date object to format.
 * @returns The formatted time string.
 */
export function formatTimeOnly(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  
  // Convert to Indian timezone (IST - UTC+5:30)
  const indianTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  
  return indianTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
} 