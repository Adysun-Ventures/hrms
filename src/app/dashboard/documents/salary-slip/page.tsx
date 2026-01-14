'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function SalarySlipPage() {
  return (
    <DocumentGeneratorFrame
      documentType="salary-slip"
      title="Salary Slip Generator"
      description="Generate and customize salary slips for employees"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
    />
  );
}




