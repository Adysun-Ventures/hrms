import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function LwdConfirmationMailV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/lwd-confirmation-mail"
      title="LWD Confirmation Mail"
      description="Generate last working day confirmation mail"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'LWD Confirmation Mail', isCurrent: true }
      ]}
    />
  );
}
