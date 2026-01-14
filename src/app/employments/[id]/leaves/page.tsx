"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiMapPin,
  FiCheck,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Employment, Employee, LeaveRecord } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import TableHeader from "@/components/ui/TableHeader";
import { useEmployment } from "@/hooks/useEmployments";
import { useEmployee } from "@/hooks/useEmployees";
import { formatDateToDayMonYear } from "@/utils/documentUtils";
import { updateLeaveRequest } from "@/utils/firebaseUtils";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export default function LeavesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use Tanstack Query for employment data
  const { data: employment, isLoading, isError, error } = useEmployment(id);

  // Use Tanstack Query for employee data
  const {
    data: employee,
    isLoading: employeeLoading,
    isError: employeeError,
  } = useEmployee(employment?.employeeId || "");

  // Handle error states
  if (isError && error) {
    console.error("Employment data error:", error);
    toast.error("Failed to load employment data");
  }

  if (employeeError) {
    console.error("Employee data error:", employeeError);
    toast.error("Failed to load employee data");
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Calculate real leave statistics
  const calculateLeaveStats = () => {
    if (!employment?.leaves || employment.leaves.length === 0) {
      return {
        totalLeaves: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0,
        usedLeaves: 0,
        remainingLeaves: employment?.totalLeaves || 0
      };
    }

    const leaves = employment.leaves;
    const totalLeaves = leaves.length;
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'pending').length;
    const approvedLeaves = leaves.filter((leave: any) => leave.status === 'approved').length;
    const rejectedLeaves = leaves.filter((leave: any) => leave.status === 'rejected').length;
    
    const usedLeaves = leaves
      .filter((leave: any) => leave.status === 'approved')
      .reduce((sum: number, leave: any) => sum + (leave.totalDays || 0), 0);
    
    const allocatedLeaves = employment?.totalLeaves || 0;
    const remainingLeaves = Math.max(0, allocatedLeaves - usedLeaves);

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      usedLeaves,
      remainingLeaves
    };
  };

  const leaveStats = calculateLeaveStats();

  // Handle leave approval/rejection
  const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject', comments?: string) => {
    try {
      toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} leave request...`, { id: 'leave-action' });
      
      await updateLeaveRequest(
        id, // employmentId
        leaveId,
        action === 'approve' ? 'approved' : 'rejected',
        'admin', // approvedBy (you can get actual admin ID from context)
        comments
      );
      
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, { id: 'leave-action' });
      
      // Silently refresh the data without page reload
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.detail(id) });
    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error);
      toast.error(`Failed to ${action} leave request`, { id: 'leave-action' });
    }
  };

  // Handle delete leave request
  const handleDeleteLeave = (leaveId: string) => {
    setLeaveToDelete(leaveId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;

    try {
      setIsDeleting(true);
      toast.loading('Deleting leave request...', { id: 'delete-leave' });

      // Get employment document
      const employmentRef = doc(db, 'employments', id);
      const employmentDoc = await getDoc(employmentRef);

      if (!employmentDoc.exists()) {
        throw new Error('Employment record not found.');
      }

      const employmentData = employmentDoc.data();
      const existingLeaves = employmentData.leaves || [];

      // Remove the leave from the array
      const updatedLeaves = existingLeaves.filter((leave: any) => leave.id !== leaveToDelete);

      // Update the employment document
      await updateDoc(employmentRef, {
        leaves: updatedLeaves,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Leave request deleted successfully', { id: 'delete-leave' });
      setIsDeleteModalOpen(false);
      setLeaveToDelete(null);
      
      // Silently refresh the data without page reload
      queryClient.invalidateQueries({ queryKey: queryKeys.employments.detail(id) });
    } catch (error: any) {
      console.error('Error deleting leave request:', error);
      toast.error(error.message || 'Failed to delete leave request', { id: 'delete-leave' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Annual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'casual':
        return 'Casual Leave';
      case 'maternity':
        return 'Maternity Leave';
      case 'paternity':
        return 'Paternity Leave';
      case 'other':
        return 'Other Leave';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employments", href: "/employments" },
          { label: "Loading...", isCurrent: true },
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Skeleton for TableHeader */}
          <div className="space-y-6">
            {/* Title and Action Buttons Skeleton */}
            <div className="flex justify-between items-center px-6 py-6">
              <div className="flex items-center">
                <div className="bg-gray-200 h-10 w-20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="bg-white p-4 rounded shadow"
                      >
                        <div className="bg-gray-200 h-4 w-20 rounded mb-2"></div>
                        <div className="bg-gray-200 h-6 w-full rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employments", href: "/employments" },
          { label: "Error", isCurrent: true },
        ]}
      >
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load employment data. Please try refreshing the page.</p>
        </div>
        <div className="mt-4">
          <Link
            href="/employments"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to Employments
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!employment) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employments", href: "/employments" },
          { label: "Not Found", isCurrent: true },
        ]}
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Employment not found</p>
        </div>
        <div className="mt-4">
          <Link
            href="/employments"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to Employments
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={
        employee && employment
          ? [
              { label: "Dashboard", href: "/dashboard" },
              { label: "Employees", href: "/employees" },
              {
                label: employee.name,
                href: `/employees/${employment.employeeId}`,
              },
              {
                label: employment.jobTitle || "Employment Details",
                href: `/employments/${id}`,
              },
              { label: "Leaves", isCurrent: true },
            ]
          : [
              { label: "Dashboard", href: "/dashboard" },
              { label: "Employments", href: "/employments" },
              { label: "Loading...", isCurrent: true },
            ]
      }
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Leave Management"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => {}}
          searchPlaceholder=""
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          backButton={{
            href: `/employments/${id}`,
            label: "Back",
          }}
          actionButtons={[
            {
              label: 'Add Leave',
              icon: <FiCalendar className="w-4 h-4" />,
              variant: 'primary' as const,
              href: `/dashboard/leaves/add?employeeId=${employment?.employeeId}&returnUrl=/employments/${id}/leaves`
            }
          ]}
        />

        {employee && (
          <div className="px-6 pb-6">
            {/* Employee Summary */}
            <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {employee.imageUrl ? (
                    <img
                      src={employee.imageUrl}
                      alt={employee.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-600">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {employee.email} • {employee.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {employment.jobTitle || employee.position} •{" "}
                    {employment.department || employee.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Leave Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{leaveStats.remainingLeaves}</p>
                <p className="text-sm text-gray-500">Annual Leave Balance</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{leaveStats.usedLeaves}</p>
                <p className="text-sm text-gray-500">Used Leaves</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{leaveStats.pendingLeaves}</p>
                <p className="text-sm text-gray-500">Pending Requests</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{leaveStats.totalLeaves}</p>
                <p className="text-sm text-gray-500">Total Requests</p>
              </div>
            </div>

            {/* Detailed Leave Summary */}
            {employment?.leaves && employment.leaves.length > 0 && (
              <div className="mt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FiCalendar className="mr-2" /> Leave Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-blue-600">{leaveStats.totalLeaves}</p>
                    <p className="text-sm text-gray-500">Total Requests</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-yellow-600">{leaveStats.pendingLeaves}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-green-600">{leaveStats.approvedLeaves}</p>
                    <p className="text-sm text-gray-500">Approved</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-red-600">{leaveStats.rejectedLeaves}</p>
                    <p className="text-sm text-gray-500">Rejected</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-purple-600">{leaveStats.usedLeaves}</p>
                    <p className="text-sm text-gray-500">Days Used</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-indigo-600">{leaveStats.remainingLeaves}</p>
                    <p className="text-sm text-gray-500">Days Remaining</p>
                  </div>
                </div>
              </div>
            )}
            {/* Recent Leave Requests */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Leave Requests
                </h2>
              </div>
              
              {!employment?.leaves || employment.leaves.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No leave requests found for this employee.</p>
                  <p className="text-sm text-gray-400 mt-2">Leave requests will appear here once the employee submits them.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leave Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employment.leaves
                        .sort((a: any, b: any) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
                        .map((leave: any) => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getLeaveTypeLabel(leave.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateToDayMonYear(leave.startDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateToDayMonYear(leave.endDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.totalDays}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(leave.status)}>
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              {leave.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleLeaveAction(leave.id, 'approve')}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    <FiCheck className="w-3 h-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleLeaveAction(leave.id, 'reject')}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <FiX className="w-3 h-3 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                              {leave.status !== 'pending' && (
                                <span className="text-xs text-gray-500 mr-2">
                                  {leave.approvedAt ? `Processed on ${formatDateToDayMonYear(leave.approvedAt)}` : '-'}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                title="Delete leave request"
                              >
                                <FiTrash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Yes, Delete"}
        cancelText="Cancel"
        onConfirm={confirmDeleteLeave}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setLeaveToDelete(null);
        }}
        variant="danger"
        disabled={isDeleting}
      />
    </DashboardLayout>
  );
}
