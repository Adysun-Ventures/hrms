'use client';

import React from 'react';
import Link from 'next/link';
import { FiFileText, FiBriefcase, FiFile, FiClipboard, FiHome } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Define document types for the dashboard
const documents = [
  { 
    title: 'Offer Letter (v2)',
    description: 'Generate selectable text offer letters',
    path: '/dashboard/documents/v2/offer-letter', 
    icon: <FiFileText size={24} /> 
  },
  { 
    title: 'Appointment Letter (v2)',
    description: 'Generate selectable text appointment letters',
    path: '/dashboard/documents/v2/appointment-letter', 
    icon: <FiFileText size={24} /> 
  },
  { 
    title: 'Salary Slip Generator (v2)',
    description: 'Generate selectable text salary slips',
    path: '/dashboard/documents/v2/salary-slip', 
    icon: <FiFile size={24} /> 
  },
  { 
    title: 'Relieving Letter (v2)',
    description: 'Generate selectable text relieving letters',
    path: '/dashboard/documents/v2/relieving-letter', 
    icon: <FiFileText size={24} /> 
  },
  { 
    title: 'Appraisal Letter (v2)',
    description: 'Generate selectable text appraisal letters',
    path: '/dashboard/documents/v2/appraisal-letter', 
    icon: <FiClipboard size={24} /> 
  },
  { 
    title: 'Bank Statement',
    description: 'Generate bank statements',
    path: '/dashboard/documents/v2/bank-statement', 
    icon: <FiFile size={24} /> 
  },
  { 
    title: 'Manage Bank',
    description: 'Manage bank details for statements',
    path: '/dashboard/documents/v2/manage-bank', 
    icon: <FiBriefcase size={24} /> 
  },
  { 
    title: 'Manage Company',
    description: 'View and update company information',
    path: '/dashboard/documents/company-card', 
    icon: <FiHome size={24} /> 
  },
];

export default function DocumentsV2Page() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Document Generator (v2)</h1>
            <p className="text-slate-800">Generate documents with selectable text</p>
          </div>
          <Link href="/dashboard/documents" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition">
            Standard Version
          </Link>
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