import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import dynamic from '@/lib/dynamic';


// Dynamically import v2 document components with no SSR for all documents
const OfferLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/OfferLetter'), { ssr: false });
const Form16V2 = dynamic(() => import('@/app/doc_pages/pages/v2/Form16'), { ssr: false });
const RelievingLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/RelievingLetter'), { ssr: false });
const AppraisalLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/AppraisalLetter'), { ssr: false });
const SalarySlipGeneratorV2 = dynamic(() => import('@/app/doc_pages/pages/v2/SalarySlipGenerator'), { ssr: false });
const ExperienceLetterV2Page = dynamic(() => import('@/app/doc_pages/pages/v2/ExperienceLetter'), { ssr: false });
const JoiningLetterV2 = dynamic(() => import('@/app/doc_pages/pages/v2/JoiningLetter'), { ssr: false });
const ReResignationV2 = dynamic(() => import('@/app/doc_pages/pages/v2/ReResignation'), { ssr: false });
const FnfCertificateV2 = dynamic(() => import('@/app/doc_pages/pages/v2/FnfCertificate'), { ssr: false });

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
  breadcrumbItems = [],
  role = 'admin',
}) => {
  // Render the appropriate document component based on type
  const renderDocumentComponent = () => {
    switch (documentType) {
      case 'v2/offer-letter':
        return <OfferLetterV2 />;
      case 'v2/form-16':
        return <Form16V2 />;
      case 'v2/relieving-letter':
        return <RelievingLetterV2 />;
      case 'v2/increment-letter':
        return <AppraisalLetterV2 />;
      case 'v2/salary-slip':
        return <SalarySlipGeneratorV2 />;
      case 'v2/experience-letter':
        return <ExperienceLetterV2Page />;
      case 'v2/appointment-letter':
        return <JoiningLetterV2 />;
      case 'v2/resignation-mail':
        return <ReResignationV2 />;
      case 'v2/fnf-certificate':
        return <FnfCertificateV2 />;
      default:
        return <div>Document type not found</div>;
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