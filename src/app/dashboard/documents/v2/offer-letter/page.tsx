'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function OfferLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/offer-letter"
      title="Offer Letter Generator (v2)"
      description="Generate and customize offer letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 