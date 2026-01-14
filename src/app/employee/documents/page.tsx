'use client';

import React from 'react';
import Link from 'next/link';
import { FiFileText, FiDownload } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';

// Define document types for employee dashboard
const documents = [
  { 
    title: 'Offer Letter', 
    description: 'View and download your offer letter',
    path: '/employee/documents/offer-letter', 
    icon: <FiFileText size={24} /> 
  },
  // { 
  //   title: 'Increment Letter', 
  //   description: 'View and download your increment letter',
  //   path: '/employee/documents/increment-letter', 
  //   icon: <FiFileText size={24} /> 
  // },
  { 
    title: 'Salary Slips', 
    description: 'View and download monthly salary slips',
    path: '/employee/documents/salary-slips', 
    icon: <FiDownload size={24} /> 
  },
];

export default function EmployeeDocumentsPage() {
  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', isCurrent: true }
      ]}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Documents</h1>
          <p className="text-slate-800">Access and download your HR documents</p>
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
    </EmployeeLayout>
  );
} 