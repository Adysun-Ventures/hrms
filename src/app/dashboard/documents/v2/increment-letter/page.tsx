'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function IncrementLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/increment-letter"
      title="Increment Letter Generator (v2)"
      description="Generate and customize increment letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'Increment Letter', isCurrent: true }
      ]}
    />
  );
}
