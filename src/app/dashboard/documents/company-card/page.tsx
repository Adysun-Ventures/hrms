'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';

// Dynamically import the ManageCompany component with no SSR
const ManageCompany = dynamic(() => import('@/app/doc_pages/pages/ManageCompany'), { ssr: false });

export default function CompanyCardPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ManageCompany />
      </div>
    </DashboardLayout>
  );
} 