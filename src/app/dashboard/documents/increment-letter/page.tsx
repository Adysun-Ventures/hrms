'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function IncrementLetterPage() {
  return (
    <DocumentGeneratorFrame
      documentType="increment-letter"
      title="Increment Letter Generator"
      description="Generate and customize increment letters for salary revisions"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'Increment Letter', isCurrent: true }
      ]}
    />
  );
} 