'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function BankStatementV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/bank-statement"
      title="Bank Statement Generator"
      description="Generate and customize bank statements with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 