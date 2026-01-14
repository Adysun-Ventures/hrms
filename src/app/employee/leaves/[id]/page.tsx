'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiCheck, FiX, FiClock } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { getEmployeeLeaveById } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import TableHeader from '@/components/ui/TableHeader';
import { useCancelLeaveRequest } from '@/hooks/useLeaves';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface LeaveRecord {
  id: string;
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  totalDays: number;
  wasEdited?: boolean;
}

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function LeaveDetailPage({ params }: PageParams) {
  const router = useRouter();
  const { currentUserData } = useAuth();
  const { id } = use(params);
  const cancelLeaveMutation = useCancelLeaveRequest();
  
  const [leaveData, setLeaveData] = useState<LeaveRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch leave data
  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        if (!currentUserData?.id) {
          toast.error('Please log in to view leave details');
          router.push('/login');
          return;
        }

        const data = await getEmployeeLeaveById(currentUserData.id, id);
        
        if (!data) {
          toast.error('Leave request not found');
          router.push('/employee/leaves');
          return;
        }

        setLeaveData(data);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        toast.error('Failed to load leave data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, [id, currentUserData, router]);

  if (isLoading) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Leaves', href: '/employee/leaves' },
          { label: 'Loading...', isCurrent: true }
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading leave details...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!leaveData) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Leaves', href: '/employee/leaves' },
          { label: 'Error', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-red-600">Error: Failed to load leave details</p>
        </div>
      </EmployeeLayout>
    );
  }
  
  // Function to open the confirmation modal
  const handleCancelLeave = () => {
    setIsConfirmModalOpen(true);
  };
  
  // Function to handle the actual cancellation
  const confirmCancelLeave = async () => {
    if (!currentUserData?.id || !leaveData) return;
    
    try {
      setIsCancelling(true);
      
      await cancelLeaveMutation.mutateAsync({
        employeeId: currentUserData.id,
        leaveId: leaveData.id
      });
      
      toast.success('Leave request cancelled successfully');
      router.push('/employee/leaves');
    } catch (error: any) {
      console.error('Error cancelling leave request:', error);
      toast.error(error.message || 'Failed to cancel leave request');
    } finally {
      setIsCancelling(false);
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Leaves', href: '/employee/leaves' },
        { label: 'Leave Details', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Leave Details"
          showStats={false}
          showSearch={false}
          searchValue=""
          onSearchChange={() => {}}
          backButton={{ href: '/employee/leaves' }}
          actionButtons={leaveData.status === 'pending' ? [
            {
              label: 'Edit Leave',
              onClick: () => router.push(`/employee/leaves/${leaveData.id}/edit`),
              icon: <FiEdit />,
              variant: 'warning' as const,
            },
            {
              label: 'Cancel Leave',
              onClick: handleCancelLeave,
              icon: <FiTrash2 />,
              variant: 'danger' as const,
              disabled: isCancelling,
            }
          ] : []}
          headerClassName="px-6 py-6"
        />

        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {leaveData.type.charAt(0).toUpperCase() + leaveData.type.slice(1)}
                  {/* {leaveData.wasEdited && (
                    <span className="ml-2 text-xs text-purple-600">(Modified)</span>
                  )} */}
                </p>
                <p className="text-sm text-gray-600">Leave Type</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {formatDateToDayMonYear(leaveData.startDate)}
                </p>
                <p className="text-sm text-gray-600">Leave Start Date</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {formatDateToDayMonYear(leaveData.endDate)}
                </p>
                <p className="text-sm text-gray-600">Leave End Date</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {leaveData.totalDays} day{leaveData.totalDays > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600">Total Days</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {leaveData.status === 'approved' && (
                    <FiCheck className="w-5 h-5 text-green-600" />
                  )}
                  {leaveData.status === 'rejected' && (
                    <FiX className="w-5 h-5 text-red-600" />
                  )}
                  {leaveData.status === 'pending' && (
                    <FiClock className="w-5 h-5 text-yellow-600" />
                  )}
                  <p className="text-lg font-medium text-gray-900">
                    {leaveData.status.charAt(0).toUpperCase() + leaveData.status.slice(1)}
                  </p>
                </div>
                <p className="text-sm text-gray-600">Status</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {formatDateToDayMonYear(leaveData.appliedDate)}
                </p>
                <p className="text-sm text-gray-600">Applied Date</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-lg font-medium text-gray-900">
                  {leaveData.reason || 'No reason provided'}
                </p>
                <p className="text-sm text-gray-600">Reason</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the confirmation modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmText="Yes, Cancel Leave"
        cancelText="No, Keep It"
        onConfirm={confirmCancelLeave}
        onCancel={() => setIsConfirmModalOpen(false)}
        variant="danger"
      />
    </EmployeeLayout>
  );
} 