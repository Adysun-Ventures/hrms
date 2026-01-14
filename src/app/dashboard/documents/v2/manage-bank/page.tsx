'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function ManageBankV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/manage-bank"
      title="Manage Bank Details"
      description="Manage bank details for bank statements"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 