'use client';

import React from 'react';
import Link from 'next/link';
import { FiFileText, FiBriefcase, FiFile, FiClipboard } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Define document types for the dashboard (v2 versions only)
const documents = [
  {
    title: 'Offer Letter',
    description: 'Generate offer letters for new employees',
    path: '/dashboard/documents/v2/offer-letter',
    icon: <FiFileText size={24} />
  },
  {
    title: 'Appointment Letter',
    description: 'Generate appointment letters for confirmed employees',
    path: '/dashboard/documents/v2/appointment-letter',
    icon: <FiFileText size={24} />
  },
  {
    title: 'Salary Slip Generator',
    description: 'Generate monthly salary slips for employees',
    path: '/dashboard/documents/v2/salary-slip',
    icon: <FiFile size={24} />
  },
  {
    title: 'Relieving Letter',
    description: 'Generate relieving letters for leaving employees',
    path: '/dashboard/documents/v2/relieving-letter',
    icon: <FiFileText size={24} />
  },
  {
    title: 'Appraisal Letter',
    description: 'Generate appraisal letters for promoted employees',
    path: '/dashboard/documents/v2/appraisal-letter',
    icon: <FiClipboard size={24} />
  },
  {
    title: 'Manage Company',
    description: 'View and update company information details',
    path: '/dashboard/documents/company-card',
    icon: <FiBriefcase size={24} />
  },
];

export default function DocumentsPage() {
  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documents', isCurrent: true }
      ]}
    >
      <div className="p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Document Generator</h1>
          <p className="text-slate-800">Generate HR documents with customizable templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, index) => (
            <Link
              key={index}
              href={doc.path}
              className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-3">
                  {doc.icon}
                </div>
                <h2 className="text-lg font-semibold text-slate-800">{doc.title}</h2>
              </div>
              <p className="text-slate-800 text-sm">{doc.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 