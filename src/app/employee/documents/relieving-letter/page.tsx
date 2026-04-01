import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeRelievingLetterPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/relieving-letter"
      title="Relieving Letter"
      description="Generate and download your relieving letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Relieving Letter', isCurrent: true },
      ]}
    />
  );
}

