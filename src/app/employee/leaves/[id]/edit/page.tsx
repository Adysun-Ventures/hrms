'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeLeaveById } from '@/utils/firebaseUtils';
import TableHeader from '@/components/ui/TableHeader';
import { useUpdateLeaveRequest } from '@/hooks/useLeaves';

interface LeaveRequestForm {
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
}

interface LeaveRecord {
  id: string;
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  totalDays: number;
  employmentId?: string;
  employeeId?: string;
  wasEdited?: boolean;
}

export default function EditLeavePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { currentUserData } = useAuth();
  const updateLeaveMutation = useUpdateLeaveRequest();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveData, setLeaveData] = useState<LeaveRecord | null>(null);
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

  // Fetch leave data on component mount
  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const resolvedParams = await params;
        const leaveId = resolvedParams.id;
        
        if (!currentUserData?.id) {
          toast.error('Please log in to edit leave');
          router.push('/login');
          return;
        }

        const data = await getEmployeeLeaveById(currentUserData.id, leaveId);
        
        if (!data) {
          toast.error('Leave request not found');
          router.push('/employee/leaves');
          return;
        }

        // Check if leave can be edited (only pending leaves can be edited)
        if (data.status !== 'pending') {
          toast.error('Only pending leave requests can be edited');
          router.push('/employee/leaves');
          return;
        }

        setLeaveData(data);
        setFormData({
          type: data.type || 'casual',
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason || ''
        });
      } catch (error) {
        console.error('Error fetching leave data:', error);
        toast.error('Failed to load leave data');
        router.push('/employee/leaves');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, [params, currentUserData, router]);

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
    
    return diffDays + 1; // Include both start and end dates
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserData || !leaveData) {
      toast.error('Please log in to edit leave');
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
      
      console.log('📝 Updating leave request:', {
        leaveId: leaveData.id,
        employeeId: currentUserData.id,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        totalDays: totalDays
      });
      
      // Update leave request using the custom mutation hook
      await updateLeaveMutation.mutateAsync({
        leaveId: leaveData.id,
        employeeId: currentUserData.id,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
        totalDays: totalDays
      });
      
      console.log('✅ Leave request updated successfully');
      toast.success('Leave request updated successfully!');
      router.push('/employee/leaves');
    } catch (error: unknown) {
      console.error('Error updating leave request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update leave request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/employee/leaves');
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading leave data...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!leaveData) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-64">
          <p>Leave request not found</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Leaves', href: '/employee/leaves' },
        { label: 'Edit Leave', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Edit Leave Request"
          showStats={false}
          showSearch={false}
          searchValue=""
          onSearchChange={() => {}}
          backButton={{ href: '/employee/leaves' }}
          headerClassName="px-6 py-6"
        />

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* All Input Fields in Single Line */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
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
                {leaveData?.wasEdited && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Edited
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Days
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {calculateTotalDays()} day{calculateTotalDays() !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Leave
                </label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={4}
                  placeholder="Please provide a detailed reason for your leave request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
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
                {isSubmitting ? 'Updating...' : 'Update Leave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeLayout>
  );
}
