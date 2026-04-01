import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeExperienceLetterPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/experience-letter"
      title="Experience Letter"
      description="Generate and download your experience letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Experience Letter', isCurrent: true },
      ]}
    />
  );
}

