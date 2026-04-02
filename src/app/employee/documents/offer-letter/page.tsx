import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeOfferLetterPage() {
    return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/offer-letter"
      title="Offer Letter"
      description="Generate and download your offer letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
    breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Offer Letter', isCurrent: true },
      ]}
    />
  );
}

