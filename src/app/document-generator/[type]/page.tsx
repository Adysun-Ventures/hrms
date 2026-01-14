'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import document components to avoid server-side rendering issues
const OfferLetter = dynamic(() => import('@/app/doc_pages/pages/OfferLetter'), { ssr: false });
const AppointmentLetter = dynamic(() => import('@/app/doc_pages/pages/AppointmentLetter'), { ssr: false });
const RelievingLetter = dynamic(() => import('@/app/doc_pages/pages/RelievingLetter'), { ssr: false });
const AppraisalLetter = dynamic(() => import('@/app/doc_pages/pages/AppraisalLetter'), { ssr: false });
const IncrementLetter = dynamic(() => import('@/app/doc_pages/pages/IncrementLetter'), { ssr: false });
const SalarySlipGenerator = dynamic(() => import('@/app/doc_pages/pages/SalarySlipGenerator'), { ssr: false });
const ManageCompany = dynamic(() => import('@/app/doc_pages/pages/ManageCompany'), { ssr: false });
const ManageStudent = dynamic(() => import('@/app/doc_pages/pages/ManageStudent'), { ssr: false });
const Home = dynamic(() => import('@/app/doc_pages/pages/Home'), { ssr: false });

// V2 Document Components
const OfferLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/OfferLetter'), { ssr: false });
const AppointmentLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppointmentLetter'), { ssr: false });
const RelievingLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/RelievingLetter'), { ssr: false });
const AppraisalLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppraisalLetter'), { ssr: false });
const SalarySlipGeneratorV2 = dynamic(() => import('@/app/doc_pages/pages/v2/SalarySlipGenerator'), { ssr: false });
const BankStatementV2 = dynamic(() => import('@/app/doc_pages/pages/v2/BankStatement'), { ssr: false });
const ManageBankV2 = dynamic(() => import('@/app/doc_pages/pages/v2/ManageBank'), { ssr: false });

// Document generator wrapper component
const DocumentGeneratorPage = () => {
  const params = useParams();
  const fullPath = params.type as string;

  // Check if this is a v2 document type
  const isV2 = fullPath.startsWith('v2/');
  const docType = isV2 ? fullPath.replace('v2/', '') : fullPath;

  // Map document type to the appropriate component
  const renderDocumentComponent = () => {
    // V2 documents
    if (isV2) {
      switch (docType) {
        case 'offer-letter':
          return <OfferLetterV2 />;
        case 'appointment-letter':
          return <AppointmentLetterV2 />;
        case 'relieving-letter':
          return <RelievingLetterV2 />;
        case 'appraisal-letter':
          return <AppraisalLetterV2 />;
        case 'salary-slip':
        case 'payslip': // Backward compatibility
          return <SalarySlipGeneratorV2 />;
        case 'bank-statement':
          return <BankStatementV2 />;
        case 'manage-bank':
          return <ManageBankV2 />;
        default:
          return <Home />;
      }
    }

    // Standard documents (v1)
    switch (docType) {
      case 'offer-letter':
        return <OfferLetter />;
      case 'appointment-letter':
        return <AppointmentLetter />;
      case 'relieving-letter':
        return <RelievingLetter />;
      case 'appraisal-letter':
        return <AppraisalLetter />;
      case 'increment-letter':
        return <IncrementLetter />;
      case 'salary-slip':
      case 'payslip': // Backward compatibility
        return <SalarySlipGenerator />;
      case 'manage-company':
        return <ManageCompany />;
      case 'manage-student':
        return <ManageStudent />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <div className="document-generator-container">
      {renderDocumentComponent()}
    </div>
  );
};

export default DocumentGeneratorPage; 