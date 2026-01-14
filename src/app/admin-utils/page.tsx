'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { addPasswordToEmployees } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminUtilsPage() {
  const { currentUserData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  if (!currentUserData || currentUserData.userType !== 'admin') {
    router.push('/login');
    return null;
  }

  const handleAddPasswords = async () => {
    try {
      setIsLoading(true);
      toast.loading('Adding passwords to employees...', { id: 'migration' });
      
      const updatedCount = await addPasswordToEmployees();
      
      toast.success(`Successfully updated ${updatedCount} employees with default passwords (last 5 digits of mobile + @#$$)`, { id: 'migration' });
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Failed to add passwords to employees', { id: 'migration' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Utilities</h1>
          
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Password Migration</h2>
              <p className="text-gray-600 mb-4">
                This utility will add a default password (last 5 digits of mobile + @#$$) to all employees who don't have a password field.
                This is required for the new employee login system.
              </p>
              <button
                onClick={handleAddPasswords}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Add Default Passwords to Employees'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Instructions</h2>
              <div className="text-gray-600 space-y-2">
                <p>• Run the password migration to enable employee login</p>
                <p>• Default password for all employees will be: <strong>last 5 digits of mobile + @#$$</strong></p>
                <p>• Example: If mobile is 8308377308, password will be 37308@#$$</p>
                <p>• Employees should change their password after first login</p>
                <p>• Only employees with status "active" can login</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 