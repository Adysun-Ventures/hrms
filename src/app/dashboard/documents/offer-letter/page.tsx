'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function OfferLetterPage() {
  return (
    <DocumentGeneratorFrame
      documentType="offer-letter"
      title="Offer Letter Generator"
      description="Generate and customize offer letters for new employees"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
    />
  );
} 