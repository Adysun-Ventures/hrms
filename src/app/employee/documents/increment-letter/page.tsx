'use client';

import React, { useState, useEffect } from 'react';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeDocument } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { FiDownload, FiFileText, FiTrendingUp } from 'react-icons/fi';

interface IncrementLetter {
  id: string;
  employeeId: string;
  documentType: string;
  issueDate: string;
  effectiveDate: string;
  currentSalary: number;
  newSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  reason: string;
  status: 'active' | 'pending' | 'expired';
  documentUrl?: string;
}

export default function EmployeeIncrementLetterPage() {
  const { currentUserData } = useAuth();
  const [incrementLetter, setIncrementLetter] = useState<IncrementLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncrementLetter = async () => {
      if (!currentUserData) return;
      
      try {
        setIsLoading(true);
        const documentData = await getEmployeeDocument(currentUserData.id, 'increment-letter');
        setIncrementLetter(documentData);
      } catch (error) {
        console.error('Error fetching increment letter:', error);
        toast.error('Failed to load increment letter');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncrementLetter();
  }, [currentUserData]);

  const handleDownload = () => {
    if (!incrementLetter) return;
    
    toast.success('Downloading increment letter...');
    
    // Simulate download
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `increment-letter-${currentUserData?.id}.pdf`;
      link.click();
    }, 1000);
  };

  if (isLoading) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Increment Letter', isCurrent: true }
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading increment letter...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!incrementLetter) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Increment Letter', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Increment Letter</h1>
            <p className="text-gray-600 mt-2">View and download your increment letter</p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <FiTrendingUp className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Increment Letter Available</h3>
              <p className="text-gray-500 mb-4">
                Your increment letter is not available at the moment. This could be because:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Your increment is still being processed</li>
                <li>• The document has not been generated yet</li>
                <li>• You are not eligible for increment at this time</li>
              </ul>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Increment Letter', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
          <h1 className="text-2xl font-bold text-gray-800">Increment Letter</h1>
              <p className="text-gray-600 mt-2">View and download your increment letter</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiDownload className="mr-2" />
              Download
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Increment Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Salary</p>
                  <p className="font-medium text-gray-900">
                    {incrementLetter.currentSalary ? `₹${incrementLetter.currentSalary.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Salary</p>
                  <p className="font-medium text-gray-900">
                    {incrementLetter.newSalary ? `₹${incrementLetter.newSalary.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Increment Amount</p>
                  <p className="font-medium text-green-600">
                    {incrementLetter.incrementAmount ? `+₹${incrementLetter.incrementAmount.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Increment Percentage</p>
                  <p className="font-medium text-green-600">
                    {incrementLetter.incrementPercentage ? `+${incrementLetter.incrementPercentage}%` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Effective Date</p>
                  <p className="font-medium text-gray-900">
                    {incrementLetter.effectiveDate ? new Date(incrementLetter.effectiveDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium text-gray-900">
                    {incrementLetter.issueDate ? new Date(incrementLetter.issueDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    incrementLetter.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : incrementLetter.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {incrementLetter.status}
                  </span>
            </div>
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium text-gray-900">{incrementLetter.reason || 'Performance based increment'}</p>
              </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">Congratulations!</h3>
            <p className="text-sm text-green-700">
              This increment letter confirms your salary increase. The new salary will be effective from the specified date.
            </p>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
} 