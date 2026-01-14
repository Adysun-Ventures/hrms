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
    />
  );
} 