'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CommonDocumentGenerator from '@/components/document/CommonDocumentGenerator';

export default function DocumentsPage() {
  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', isCurrent: true }
      ]}
    >
      <CommonDocumentGenerator role="admin" />
    </DashboardLayout>
  );
} 