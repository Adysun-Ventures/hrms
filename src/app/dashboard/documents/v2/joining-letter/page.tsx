'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function JoiningLetterV2() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/joining-letter"
      title="Joining Letter Generator (v2)"
      description="Generate and customize Joining letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 