'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function SalarySlipV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/salary-slip"
      title="Salary Slip Generator (v2)"
      description="Generate and customize salary slips with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'Salary Slip Generator', isCurrent: true }
      ]}
    />
  );
}




