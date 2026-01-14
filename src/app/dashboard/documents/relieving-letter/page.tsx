'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function RelievingLetterPage() {
  return (
    <DocumentGeneratorFrame
      documentType="relieving-letter"
      title="Relieving Letter Generator"
      description="Generate and customize relieving letters for exiting employees"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
    />
  );
} 