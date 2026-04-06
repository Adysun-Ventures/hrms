'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function FnfCertificateV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/fnf-certificate"
      title="FNF Certificate Generator (v2)"
      description="Generate and customize full and final settlement certificates"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: 'FNF Certificate', isCurrent: true },
      ]}
    />
  );
}

