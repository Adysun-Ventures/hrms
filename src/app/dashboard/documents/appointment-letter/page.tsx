'use client';

import React from 'react';
import DocumentGeneratorFrame from '@/components/documents/DocumentGeneratorFrame';

export default function AppointmentLetterPage() {
  return (
    <DocumentGeneratorFrame
      documentType="appointment-letter"
      title="Appointment Letter Generator"
      description="Generate and customize appointment letters for confirmed employees"
      backPath="/dashboard/documents"
      backLabel="Back to Documents"
    />
  );
} 