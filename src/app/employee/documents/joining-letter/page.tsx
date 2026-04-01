import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeJoiningLetterPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/joining-letter"
      title="Joining Letter"
      description="Generate and download your joining letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Joining Letter', isCurrent: true },
      ]}
    />
  );
}

