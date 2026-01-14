'use client';

import React, { useState, useEffect } from 'react';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeDocument } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';

interface OfferLetter {
  id: string;
  employeeId: string;
  documentType: string;
  issueDate: string;
  position: string;
  department: string;
  salary: number;
  joiningDate: string;
  status: 'active' | 'expired';
  documentUrl?: string;
}

export default function EmployeeOfferLetterPage() {
  const { currentUserData } = useAuth();
  const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOfferLetter = async () => {
      if (!currentUserData) return;
      
      try {
        setIsLoading(true);
        const documentData = await getEmployeeDocument(currentUserData.id, 'offer-letter');
        setOfferLetter(documentData);
      } catch (error) {
        console.error('Error fetching offer letter:', error);
        toast.error('Failed to load offer letter');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferLetter();
  }, [currentUserData]);

  const handleDownload = () => {
    if (!offerLetter) return;
    
    toast.success('Downloading offer letter...');
    
    // Simulate download
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `offer-letter-${currentUserData?.id}.pdf`;
      link.click();
    }, 1000);
  };

  if (isLoading) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Offer Letter', isCurrent: true }
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading offer letter...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!offerLetter) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Offer Letter', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Offer Letter</h1>
            <p className="text-gray-600 mt-2">View and download your offer letter</p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <FiFileText className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Offer Letter Available</h3>
              <p className="text-gray-500 mb-4">
                Your offer letter is not available at the moment. This could be because:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Your offer letter is still being processed</li>
                <li>• The document has not been uploaded yet</li>
                <li>• Your profile information needs to be updated</li>
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
        { label: 'Offer Letter', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Offer Letter</h1>
              <p className="text-gray-600 mt-2">View and download your offer letter</p>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Offer Letter Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{offerLetter.position || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{offerLetter.department || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="font-medium text-gray-900">
                    {offerLetter.salary ? `₹${offerLetter.salary.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Joining Date</p>
                  <p className="font-medium text-gray-900">
                    {offerLetter.joiningDate ? new Date(offerLetter.joiningDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium text-gray-900">
                    {offerLetter.issueDate ? new Date(offerLetter.issueDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    offerLetter.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {offerLetter.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Document Information</h3>
            <p className="text-sm text-blue-700">
              This is your official offer letter. Please keep this document safe and refer to it for your employment terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
} 