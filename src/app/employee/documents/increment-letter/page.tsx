import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeIncrementLetterPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/increment-letter"
      title="Increment Letter"
      description="Generate and download your increment letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Increment Letter', isCurrent: true },
      ]}
    />
  );
}

