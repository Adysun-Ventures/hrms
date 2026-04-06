'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import dynamic from 'next/dynamic';


// Dynamically import v2 document components with no SSR for all documents
const OfferLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/OfferLetter'), { ssr: false });
const RelievingLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/RelievingLetter'), { ssr: false });
const AppraisalLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppraisalLetter'), { ssr: false });
const SalarySlipGeneratorV2 = dynamic(() => import('@/app/doc_pages/pages/v2/SalarySlipGenerator'), { ssr: false });
const ExperienceLetterV2Page = dynamic(() => import('@/app/doc_pages/pages/v2/ExperienceLetter'), { ssr: false });
const JoiningLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/JoiningLetter'), { ssr: false });
const FnfCertificateV2 = dynamic(() => import('@/app/doc_pages/pages/v2/FnfCertificate'), { ssr: false });

// Legacy v1 components when needed
const IncrementLetterV1 = dynamic(() => import('@/app/doc_pages/pages/IncrementLetter'), { ssr: false });

interface DocumentGeneratorFrameProps {
  documentType: string;
  title: string;
  description: string;
  backPath: string;
  backLabel: string;
  breadcrumbItems?: { label: string; href?: string; isCurrent?: boolean }[];
  role?: 'admin' | 'employee';
}

const DocumentGeneratorFrame: React.FC<DocumentGeneratorFrameProps> = ({
  documentType,
  title,
  description,
  backPath,
  backLabel,
  breadcrumbItems = [],
  role = 'admin',
}) => {
  // Render the appropriate document component based on type
  const renderDocumentComponent = () => {
    // Map v1 document types to v2 components
    if (documentType.startsWith('v2/')) {
      // V2 documents
      switch (documentType) {
        case 'v2/offer-letter':
          return <OfferLetterV2 />;
        case 'v2/relieving-letter':
          return <RelievingLetterV2 />;
        case 'v2/appraisal-letter':
        case 'v2/increment-letter':
          return <AppraisalLetterV2 />;
        case 'v2/salary-slip':
        case 'v2/payslip': // Backward compatibility
          return <SalarySlipGeneratorV2 />;
        case 'v2/experience-letter':
          return <ExperienceLetterV2Page/>;
        case 'v2/joining-letter':
          return <JoiningLetterV2/>;
        case 'v2/fnf-certificate':
          return <FnfCertificateV2 />;
        default:
          return <div>V2 document type not found</div>;
      }
    } else {
      // Standard documents (v1) - use V2 components instead of v1
      switch (documentType) {
        case 'offer-letter':
          return <OfferLetterV2 />;
        case 'relieving-letter':
          return <RelievingLetterV2 />;
        case 'appraisal-letter':
          return <AppraisalLetterV2 />;
        case 'increment-letter':
          return <IncrementLetterV1 />;
        case 'salary-slip':
        case 'payslip': // Backward compatibility
          return <SalarySlipGeneratorV2 />;
        default:
          return <div>Document type not found</div>;
      }
    }
  };

  const content = (
    <div className="document-container w-full">
      {renderDocumentComponent()}
    </div>
  );

  if (role === 'employee') {
    return <EmployeeLayout breadcrumbItems={breadcrumbItems}>{content}</EmployeeLayout>;
  }

  return <DashboardLayout breadcrumbItems={breadcrumbItems}>{content}</DashboardLayout>;
};

export default DocumentGeneratorFrame; 