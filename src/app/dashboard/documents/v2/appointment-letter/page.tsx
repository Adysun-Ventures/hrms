'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function AppointmentLetterV2Page() {
  return (
    <DocumentGeneratorFrame
      documentType="v2/appointment-letter"
      title="Appointment Letter Generator (v2)"
      description="Generate and customize appointment letters with selectable text"
      backPath="/dashboard/documents/v2"
      backLabel="Back to Documents"
    />
  );
} 