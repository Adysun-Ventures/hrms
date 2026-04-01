import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeSalarySlipPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/salary-slip"
      title="Salary Slip"
      description="Generate and download your salary slip"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Salary Slip', isCurrent: true },
      ]}
    />
  );
}

