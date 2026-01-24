'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function ExperienceLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/experience-letter"
      title="Experience Letter Generator (v2)"
      description="Generate and customize Experience letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 