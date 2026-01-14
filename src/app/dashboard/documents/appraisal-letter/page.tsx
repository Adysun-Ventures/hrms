'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function AppraisalLetterPage() {
  return (
    <DocumentGeneratorFrame
      documentType="appraisal-letter"
      title="Appraisal Letter Generator"
      description="Generate and customize appraisal letters for promoted employees"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
    />
  );
} 