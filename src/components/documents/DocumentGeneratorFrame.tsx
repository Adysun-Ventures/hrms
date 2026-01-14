import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';

// Dynamically import v2 document components with no SSR for all documents
const OfferLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/OfferLetter'), { ssr: false });
const AppointmentLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppointmentLetter'), { ssr: false });
const RelievingLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/RelievingLetter'), { ssr: false });
const AppraisalLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppraisalLetter'), { ssr: false });
const SalarySlipGeneratorV2 = dynamic(() => import('@/app/doc_pages/pages/v2/SalarySlipGenerator'), { ssr: false });
const BankStatementV2 = dynamic(() => import('@/app/doc_pages/pages/v2/BankStatement'), { ssr: false });
const ManageBankV2 = dynamic(() => import('@/app/doc_pages/pages/v2/ManageBank'), { ssr: false });

// Legacy v1 components when needed
const IncrementLetterV1 = dynamic(() => import('@/app/doc_pages/pages/IncrementLetter'), { ssr: false });

interface DocumentGeneratorFrameProps {
  documentType: string;
  title: string;
  description: string;
  backPath: string;
  backLabel: string;
  breadcrumbItems?: { label: string; href?: string; isCurrent?: boolean }[];
}

const DocumentGeneratorFrame: React.FC<DocumentGeneratorFrameProps> = ({
  documentType,
  title,
  description,
  backPath,
  backLabel,
  breadcrumbItems = []
}) => {
  // Render the appropriate document component based on type
  const renderDocumentComponent = () => {
    // Map v1 document types to v2 components
    if (documentType.startsWith('v2/')) {
      // V2 documents
      switch (documentType) {
        case 'v2/offer-letter':
          return <OfferLetterV2 />;
        case 'v2/appointment-letter':
          return <AppointmentLetterV2 />;
        case 'v2/relieving-letter':
          return <RelievingLetterV2 />;
        case 'v2/appraisal-letter':
          return <AppraisalLetterV2 />;
        case 'v2/salary-slip':
        case 'v2/payslip': // Backward compatibility
          return <SalarySlipGeneratorV2 />;
        case 'v2/bank-statement':
          return <BankStatementV2 />;
        case 'v2/manage-bank':
          return <ManageBankV2 />;
        default:
          return <div>V2 document type not found</div>;
      }
    } else {
      // Standard documents (v1) - use V2 components instead of v1
      switch (documentType) {
        case 'offer-letter':
          return <OfferLetterV2 />;
        case 'appointment-letter':
          return <AppointmentLetterV2 />;
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

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      {/* <div className="bg-white rounded-lg shadow-sm p-4"> */}
        <div className="document-container w-full">
          {renderDocumentComponent()}
        </div>
      {/* </div> */}
    </DashboardLayout>
  );
};

export default DocumentGeneratorFrame; 