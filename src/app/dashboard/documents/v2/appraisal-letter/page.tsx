'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function AppraisalLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/appraisal-letter"
      title="Appraisal Letter Generator (v2)"
      description="Generate and customize appraisal letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 