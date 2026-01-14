'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSave, FiX } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import TableHeader from '@/components/ui/TableHeader';
import { useCreateLeaveRequest } from '@/hooks/useLeaves';
import { useEmployee } from '@/hooks/useEmployees';

interface LeaveRequestForm {
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
}

export default function AddLeavePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentAdmin } = useAuth();
  const createLeaveMutation = useCreateLeaveRequest();
  
  const employeeId = searchParams?.get('employeeId') || '';
  const returnUrl = searchParams?.get('returnUrl') || '/dashboard';
  
  const { data: employee, isLoading: employeeLoading } = useEmployee(employeeId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeaveRequestForm>({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'annual', label: 'Annual Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' }
  ];

  const handleInputChange = (field: keyof LeaveRequestForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (!employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      toast.error('End date cannot be before start date');
      return;
    }

    const totalDays = calculateTotalDays();
    if (totalDays <= 0) {
      toast.error('Please select valid dates');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createLeaveMutation.mutateAsync({
        employeeId: employeeId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
        totalDays: totalDays
      });
      
      toast.success('Leave added successfully!');
      router.push(returnUrl);
    } catch (error: any) {
      console.error('Error adding leave:', error);
      toast.error(error.message || 'Failed to add leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(returnUrl);
  };

  if (!currentAdmin) {
    router.replace('/login');
    return null;
  }

  if (!employeeId) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Add Leave', isCurrent: true }
        ]}
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Employee ID is required. Please select an employee first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Add Leave', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title={`Add Leave${employee ? ` for ${employee.name}` : ''}`}
          showStats={false}
          showSearch={false}
          searchValue=""
          onSearchChange={() => {}}
          backButton={{ href: returnUrl }}
          headerClassName="px-6 py-6"
        />

        <div className="px-6 pb-6">
          {employeeLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="bg-gray-200 h-10 rounded"></div>
              <div className="bg-gray-200 h-10 rounded"></div>
              <div className="bg-gray-200 h-32 rounded"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Info */}
              {employee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    {employee.imageUrl ? (
                      <img
                        src={employee.imageUrl}
                        alt={employee.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-700">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.email} • {employee.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500 mr-1">*</span>Leave Type 
                  </label>
                  <select
                    id="leaveType"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {leaveTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500 mr-1">*</span>Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500 mr-1">*</span>End Date 
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Days
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                    {calculateTotalDays()} day{calculateTotalDays() !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>Reason for Leave 
                </label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={4}
                  placeholder="Please provide a detailed reason for the leave..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  {isSubmitting ? 'Adding Leave...' : 'Add Leave'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
