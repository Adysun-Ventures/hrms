'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function ResignationMailV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/resignation-mail"
      title="Resignation Mail"
      description="Generate Resignation Mail document"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
}

