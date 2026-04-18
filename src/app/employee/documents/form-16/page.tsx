'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeForm16Page() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/form-16"
      title="Form 16"
      description="Generate and download Form 16"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Form 16', isCurrent: true },
      ]}
    />
  );
}
