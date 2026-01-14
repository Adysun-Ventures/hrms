'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { PDFViewer, PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { enhancePDFMetadata, downloadEnhancedPDF } from '@/components/documents/pdfSecurityUtils';
import BankStatement from './BankStatement';

/**
 * EnhancedBankStatement - A simple wrapper that uses the original BankStatement
 * but adds our security enhancements for the download
 */
const EnhancedBankStatement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const pdfViewerRef = useRef(null);
  
  // Process the PDF with security enhancements
  const handleSecureDownload = async () => {
    setIsProcessing(true);
    try {
      // Find the PDFViewer and its document
      const pdfViewer = pdfViewerRef.current?.querySelector('iframe');
      if (!pdfViewer) {
        throw new Error('PDF viewer not found');
      }
      
      // Get PDF blob from the viewer (this is a simplification - 
      // in practice, we'd need access to the React-PDF document)
      // In a real implementation, we'd need to modify the app structure
      // to get access to the pdfDocument and related data
      const pdfBlob = await new Promise((resolve) => {
        pdfViewer.contentWindow.print = () => {
          resolve(pdfViewer.contentWindow.document);
        };
        pdfViewer.contentWindow.print();
      });
      
      // This is where we'd normally extract the PDF
      // For demonstration purposes, we'll create a placeholder
      alert('In a real implementation, this would download the secured PDF with proper metadata');
      
      // Ideally, we'd do something like:
      // const pdfBytes = await pdfBlob.arrayBuffer();
      // const bankData = { bankName: 'AU Small Finance Bank' };
      // const statementData = { accountNumber: 'XXXX1234', ... };
      // const enhancedPdfBytes = await enhancePDFMetadata(pdfBytes, bankData, statementData);
      // downloadEnhancedPDF(enhancedPdfBytes, 'secure-bank-statement.pdf');
      
    } catch (error) {
      console.error('Error processing secure download:', error);
      alert('Could not create secured PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="relative">
      {/* Original BankStatement component */}
      <div ref={pdfViewerRef}>
        <BankStatement />
      </div>
      
      {/* Overlay for our secure download button */}
      <div className="fixed bottom-10 right-10 z-50">
        <button
          onClick={handleSecureDownload}
          disabled={isProcessing}
          className="bg-green-600 text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
        >
          <FiDownload className="w-5 h-5" />
          {isProcessing ? "Processing..." : "Download Secure Version"}
        </button>
        <div className="bg-white text-xs p-2 mt-2 rounded shadow-sm text-gray-600">
          Enhanced with proper metadata
        </div>
      </div>
    </div>
  );
};

/**
 * A page that explains the security enhancements and provides
 * a link to the enhanced bank statement
 */
const EnhancedBankStatementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-12 mt-4 md:mt-6">
          <div className="ml-2 md:ml-4">
            <Link
              href="/dashboard/documents"
              className="back-link flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="text-sm md:text-base">Back to Documents</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Enhanced Bank Statement Generator
          </h2>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              About This Version
            </h3>
            <p className="text-gray-600 mb-4">
              This version of the Bank Statement Generator produces PDFs with enhanced metadata and security features to ensure they appear authentic when subjected to forensic analysis.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Security Enhancements:</h4>
              <ul className="list-disc pl-5 text-blue-700 space-y-1">
                <li>Proper PDF producer metadata (no more "Microsoft Print to PDF")</li>
                <li>Bank-specific creator and title information</li>
                <li>Document ID and verification metadata</li>
                <li>Detailed statement information in metadata</li>
                <li>Same visual appearance as the standard version</li>
              </ul>
            </div>
          </div>
          
          <Link 
            href="/enhanced-bank-statement-generator"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Launch Enhanced Generator
          </Link>
        </div>
      </div>
    </div>
  );
};

export { EnhancedBankStatement, EnhancedBankStatementPage };
export default EnhancedBankStatementPage; 