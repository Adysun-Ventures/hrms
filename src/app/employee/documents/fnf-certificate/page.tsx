import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeFnfCertificatePage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/fnf-certificate"
      title="FNF Certificate"
      description="Generate and download your full and final settlement certificate"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'FNF Certificate', isCurrent: true },
      ]}
    />
  );
}

