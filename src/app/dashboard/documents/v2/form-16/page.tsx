'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function Form16V2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/form-16"
      title="Form 16"
      description="Generate Form 16 document"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'Form 16', isCurrent: true },
      ]}
    />
  );
}
