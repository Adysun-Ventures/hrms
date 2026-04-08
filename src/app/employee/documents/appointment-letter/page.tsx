import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function EmployeeJoiningLetterPage() {
  return (
    <DocumentGeneratorFrame
      role="employee"
      documentType="v2/appointment-letter"
      title="Appointment Letter"
      description="Generate and download your appointment letter"
      backPath="/employee/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Appointment Letter', isCurrent: true },
      ]}
    />
  );
}

