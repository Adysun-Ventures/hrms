'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiPlus, FiClock, FiCheck, FiX, FiEdit, FiEye, FiFile, FiBarChart, FiTrash2 } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployeeLeaves, useCancelLeaveRequest } from '@/hooks/useLeaves';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';




export default function EmployeeLeavesPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();
  const cancelLeaveMutation = useCancelLeaveRequest();
  const [cancellingLeaveId, setCancellingLeaveId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState<string | null>(null);

  // Use TanStack Query hooks
  const {
    data: leaveRecords = [],
    isLoading,
    isError,
    error,
    refetch
  } = useEmployeeLeaves(currentUserData?.id || '');



  useEffect(() => {
    // Check if user is authenticated and is employee
    if (!currentUserData || currentUserData.userType !== 'employee') {
      router.push('/login');
      return;
    }
  }, [currentUserData, router]);

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      console.error('Leave data error:', error);
      toast.error('Failed to load leave data');
    }
  }, [isError, error]);

  const handleRequestLeave = () => {
    router.push('/employee/leaves/request');
  };
  
  const handleLeavesReport= () => {
    router.push('/employee/leaves/report')
  }

  const handleLeavesByYear = () => {
    router.push('/employee/leaves/by-year')
  }

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Leave data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing leave data:', error);
      toast.error('Failed to refresh leave data');
    }
  };
  
  // Update the handleCancelLeave function to open the modal
  const handleCancelLeave = (leaveId: string) => {
    setLeaveToCancel(leaveId);
    setIsConfirmModalOpen(true);
  };
  
  // Add a new function to handle the actual cancellation
  const confirmCancelLeave = async () => {
    if (!currentUserData?.id || !leaveToCancel) return;
    
    try {
      setCancellingLeaveId(leaveToCancel);
      
      await cancelLeaveMutation.mutateAsync({
        employeeId: currentUserData.id,
        leaveId: leaveToCancel
      });
      
      toast.success('Leave request cancelled successfully');
      // No need to navigate, the list will be updated automatically due to query invalidation
    } catch (error: any) {
      console.error('Error cancelling leave request:', error);
      toast.error(error.message || 'Failed to cancel leave request');
    } finally {
      setCancellingLeaveId(null);
      setIsConfirmModalOpen(false);
      setLeaveToCancel(null);
    }
  };




  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (type) {
      case 'casual':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'sick':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'annual':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'personal':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'maternity':
        return `${baseClasses} bg-pink-100 text-pink-800`;
      case 'paternity':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
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

  return (
    <EmployeeLayout>
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="My Leaves"
          total={leaveRecords.length}
          active={leaveRecords.filter(record => record.status === 'approved').length}
          inactive={leaveRecords.filter(record => record.status === 'rejected').length}
          searchValue=""
          onSearchChange={() => {}}
          searchPlaceholder="Search leaves"
          searchAriaLabel="Search leaves"
          onRefresh={handleRefresh}
          isRefreshing={false}
          showSearch={false}
          showStats={false}
          backButton={{ href: '/employee-dashboard' }}
          actionButtons={[
            {
              label: 'Leaves by Year',
              onClick: handleLeavesByYear,
              icon: <FiBarChart />,
              variant: 'secondary' as const,
            },
            {
              label: 'Leave Reports',
              onClick: handleLeavesReport,
              icon: <FiFile />,
              variant: 'info' as const,
            },
            {
              label: 'Request Leave',
              onClick: handleRequestLeave,
              icon: <FiPlus />,
              variant: 'success' as const,
            },
          ]}
          headerClassName="px-6 pt-6 mb-0"
        />

        <div className="p-6">
          {/* Leave Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Leaves</p>
                  <p className="text-2xl font-bold text-green-600">
                    {leaveRecords.filter(record => record.status === 'approved').length}
                  </p>
              </div>
                <FiCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {leaveRecords.filter(record => record.status === 'pending').length}
                  </p>
              </div>
                <FiClock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected Leaves</p>
                  <p className="text-2xl font-bold text-red-600">
                    {leaveRecords.filter(record => record.status === 'rejected').length}
                  </p>
                </div>
                <FiX className="w-8 h-8 text-red-500" />
              </div>
                  </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {leaveRecords.reduce((total, record) => total + record.totalDays, 0)}
                  </p>
                </div>
                <FiCalendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="">
          

          {/* Leave Records Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4 whitespace-nowrap">
                       {/* Option 1: Status Badge Integration */}
                       <div className="flex items-center space-x-2">
                         {/* {getLeaveTypeIcon(record.type)} */}
                         <div className="flex items-center gap-1">
                           <span className={getLeaveTypeBadge(record.type)}>
                             {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                           </span>
                         </div>
                       </div>
                       
                       {/* Option 2: Subtle Visual Indicator (commented out) */}
                       {/*
                       <div className="flex items-center space-x-2">
                         {getLeaveTypeIcon(record.type)}
                         <span className={getLeaveTypeBadge(record.type)}>
                           {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                         </span>
                         {record.wasEdited && (
                           <FiEdit2 className="w-3 h-3 text-purple-600" title="This leave has been modified" />
                         )}
                       </div>
                       */}
                       
                       {/* Option 3: Enhanced Badge System (commented out) */}
                       {/*
                       <div className="flex flex-col space-y-1">
                         <div className="flex items-center space-x-2">
                           {getLeaveTypeIcon(record.type)}
                           <span className={getLeaveTypeBadge(record.type)}>
                             {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                           </span>
                         </div>
                         {record.wasEdited && (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 w-fit">
                             <FiEdit2 className="w-3 h-3 mr-1" />
                             Modified
                           </span>
                         )}
                       </div>
                       */}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToDayMonYear(record.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToDayMonYear(record.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalDays} day{record.totalDays > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToDayMonYear(record.appliedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-3">
                        <ActionButton
                          icon={<FiEye className="w-5 h-5" />}
                          title="View"
                          colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                          href={`/employee/leaves/${record.id}`}
                        />
                        {record.status === 'pending' && (
                          <>
                            <ActionButton
                              icon={<FiEdit className="w-5 h-5" />}
                              title="Edit"
                              colorClass="bg-amber-100 text-amber-600 hover:text-amber-900"
                              href={`/employee/leaves/${record.id}/edit`}
                            />
                            <ActionButton
                              icon={<FiTrash2 className="w-5 h-5" />}
                              title="Cancel"
                              colorClass="bg-red-100 text-red-600 hover:text-red-900"
                              onClick={() => handleCancelLeave(record.id)}
                              disabled={cancellingLeaveId === record.id}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leaveRecords.length === 0 && (
            <div className="text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave records found.</p>
            </div>
          )}
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
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setLeaveToCancel(null);
        }}
        variant="danger"
      />
    </EmployeeLayout>
  );
} 