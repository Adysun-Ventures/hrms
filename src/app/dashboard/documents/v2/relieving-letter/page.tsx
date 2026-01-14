'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function RelievingLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/relieving-letter"
      title="Relieving Letter Generator (v2)"
      description="Generate and customize relieving letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 