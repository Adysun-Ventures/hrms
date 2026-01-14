'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiEdit, FiTrash2, FiArrowLeft, FiBriefcase, FiDollarSign, FiBook } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Employee } from '@/types';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { useEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { useEmploymentsByEmployee } from '@/hooks/useEmployments';
import { getAdminNameById } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { useQueryClient } from '@tanstack/react-query';
import { FaRupeeSign } from "react-icons/fa";


type PageParams = {
  params: Promise<{ id: string }>;
};

export default function EmployeeViewPage({ params }: PageParams) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [createdByAdmin, setCreatedByAdmin] = useState<string>('');
  const [updatedByAdmin, setUpdatedByAdmin] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { id } = use(params);
  
  // Add safety check for id
  if (!id) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Error', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-red-600">Error: Employee ID not found</p>
        </div>
      </DashboardLayout>
    );
  }

  // Use Tanstack Query for employee data
  const {
    data: employee,
    isLoading,
    isError,
    error
  } = useEmployee(id);

  // Use Tanstack Query for employments data
  const {
    data: employments = [],
    isLoading: employmentsLoading,
    isError: employmentsError,
    refetch: refetchEmployments
  } = useEmploymentsByEmployee(id);

  // Ensure employments is always an array
  const safeEmployments = Array.isArray(employments) ? employments : [];

  // Debug logging for deployed environment
  console.log('🔍 Employee ID:', id);
  console.log('🔍 Employee data:', employee);
  console.log('🔍 Employments data:', employments);
  console.log('🔍 Safe employments:', safeEmployments);
  console.log('🔍 Employments loading:', employmentsLoading);
  console.log('🔍 Employments error:', employmentsError);

  // Use mutation for delete operation
  const deleteEmployeeMutation = useDeleteEmployee();

  // Handle error states
  if (isError && error) {
    console.error('Employee data error:', error);
    toast.error('Failed to load employee data');
  }

  if (employmentsError) {
    console.error('Employments data error:', employmentsError);
    toast.error('Failed to load employment data');
  }

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!id) {
      toast.error('Employee ID not found');
      return;
    }
    
    try {
      toast.loading('Deleting employee...', { id: 'delete-employee' });
      await deleteEmployeeMutation.mutateAsync(id);
      toast.success('Employee deleted successfully', { id: 'delete-employee' });
      router.push('/employees');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee';
      toast.error(errorMessage, { id: 'delete-employee' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  // Check for employment creation success and invalidate cache
  useEffect(() => {
    const employmentCreated = searchParams?.get('employmentCreated');
    if (employmentCreated === 'true') {
      // Invalidate employments cache for this employee
      queryClient.invalidateQueries({ queryKey: ['employments', 'employee', id] });
      // Also refetch to get fresh data
      refetchEmployments();
      toast.success('Employment created successfully!');
    }
  }, [searchParams, queryClient, id, refetchEmployments]);

  // Fetch admin names for audit trail
  useEffect(() => {
    const fetchAdminNames = async () => {
      if (employee) {
        try {
          // Fetch created by admin name
          if (employee.createdBy) {
            const createdByAdminName = await getAdminNameById(employee.createdBy);
            setCreatedByAdmin(createdByAdminName);
          }
          
          // Fetch updated by admin name
          if (employee.updatedBy) {
            const updatedByAdminName = await getAdminNameById(employee.updatedBy);
            setUpdatedByAdmin(updatedByAdminName);
          }
        } catch (error) {
          console.error('Error fetching admin names:', error);
        }
      }
    };

    fetchAdminNames();
  }, [employee]);

  if (isLoading || employmentsLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Loading...', isCurrent: true }
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
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-10 w-20 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-10 w-20 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-10 w-20 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-20 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Not Found', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-red-600">Employee not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        { label: employee.name, isCurrent: true }
      ]}
    >
      <Toaster />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete employee "{employee.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteEmployeeMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title={`Employee Details`}
          total={1}
          active={employee.status === 'active' ? 1 : 0}
          inactive={employee.status === 'inactive' ? 1 : 0}
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={false}
          backButton={{ href: '/employees', label: 'Back' }}
          actionButtons={[
            ...(safeEmployments && safeEmployments.length > 0 && safeEmployments[0] ? [
              { 
                label: 'Employment', 
                icon: <FiBriefcase />, 
                variant: 'primary' as const, 
                href: `/employments/${safeEmployments[0].id}` 
              },
              { 
                label: 'Salary', 
                icon: <FaRupeeSign />, 
                variant: 'purple' as const, 
                href: `/salaries?employeeId=${id}` 
              },
            ] : [
              { 
                label: 'Employment', 
                icon: <FiBriefcase />, 
                variant: 'primary' as const, 
                href: `/employments/add?employeeId=${id}` 
              },
              { 
                label: 'Salary', 
                icon: <FaRupeeSign />, 
                variant: 'purple' as const, 
                href: `/salaries/add?employeeId=${id}` 
              }
            ]),
            { label: 'Edit', icon: <FiEdit />, variant: 'orange' as const, href: `/employees/${id}/edit` },
            { 
              label: 'Delete', 
              icon: <FiTrash2 />, 
              variant: 'danger' as const, 
              onClick: handleDeleteClick,
              disabled: deleteEmployeeMutation.isPending
            }
          ]}
        />

        <div className="px-6 pb-6">
          {/* Personal Details Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiUser className="mr-2" /> Personal Details
            </h2>
        
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Basic Information Card */}
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.name || '-'}</p>
                <p className="text-sm text-gray-500">Full Name</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.employeeId || '-'}</p>
                <p className="text-sm text-gray-500">Employee ID</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">
                  {employee.dateOfBirth ? formatDateToDayMonYear(employee.dateOfBirth) : '-'}
                </p>
                <p className="text-sm text-gray-500">Date of Birth</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">
                  {employee.joinDate ? formatDateToDayMonYear(employee.joinDate) : '-'}
                </p>
                <p className="text-sm text-gray-500">Join Date</p>
              </div>

              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.homeTown || '-'}</p>
                <p className="text-sm text-gray-500">Home Town</p>
              </div>

              <div className="bg-white rounded-lg shadow p-3">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    employee.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {employee.status}
                </span>
                <p className="text-sm text-gray-500 mt-2">Status</p>
              </div>
              
              
              
              <div className="bg-white rounded-lg shadow p-3">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    (employee.employeeType || 'internal') === 'internal'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {(employee.employeeType || 'internal') === 'internal' ? 'Internal' : 'External'}
                </span>
                <p className="text-sm text-gray-500 mt-2">Employee Type</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                {employee.employmentStatus ? (
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.employmentStatus === 'working'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee.employmentStatus.charAt(0).toUpperCase() + employee.employmentStatus.slice(1)}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
                <p className="text-sm text-gray-500 mt-2">Employment Status</p>
              </div>
              
              {employee.employmentStatus === 'resigned' && employee.resignedDate && (
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                    {formatDateToDayMonYear(employee.resignedDate)}
                  </p>
                  <p className="text-sm text-gray-500">Resigned Date</p>
                </div>
              )}
              
              {employee.employmentStatus === 'resigned' && employee.lastWorkingDay && (
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                    {formatDateToDayMonYear(employee.lastWorkingDay)}
                  </p>
                  <p className="text-sm text-gray-500">Last Working Day</p>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.email || '-'}</p>
                <p className="text-sm text-gray-500">Email</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.phone || '-'}</p>
                <p className="text-sm text-gray-500">Phone</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.position || '-'}</p>
                <p className="text-sm text-gray-500">Position</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.department || '-'}</p>
                <p className="text-sm text-gray-500">Department</p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.currentAddress || '-'}</p>
                <p className="text-sm text-gray-500">Current Address</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employee.permanentAddress || '-'}</p>
                <p className="text-sm text-gray-500">Permanent Address</p>
              </div>
            </div>
          </div>

          {/* Educational Details Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBook className="mr-2" /> Educational Details
            </h2>
            
            {/* Graduation */}
            <h3 className="text-md font-medium text-gray-700 mt-6 mb-4">Graduation</h3>
            {employee.graduation ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.degree || '-'}</p>
                  <p className="text-sm text-gray-500">Degree</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.branch || '-'}</p>
                  <p className="text-sm text-gray-500">Branch</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                    {employee.graduation.month ? `${employee.graduation.month} ` : ''}
                    {employee.graduation.passingYear || '-'}
                  </p>
                  <p className="text-sm text-gray-500">Passing Year</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.collegeName || '-'}</p>
                  <p className="text-sm text-gray-500">College Name</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.universityName || '-'}</p>
                  <p className="text-sm text-gray-500">University</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.marks || '-'}</p>
                  <p className="text-sm text-gray-500">Marks</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.graduation.grade || '-'}</p>
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-3 mb-4">
                <p className="text-gray-500 italic">No graduation details available</p>
              </div>
            )}
            
            {/* Secondary Education (12th/Diploma) */}
            <h3 className="text-md font-medium text-gray-700 mt-6 mb-4">12th Standard / Diploma</h3>
            {employee.secondaryEducation && employee.secondaryEducation.length > 0 ? (
              <div className="space-y-4">
                {employee.secondaryEducation.map((entry, index) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    {/* Type Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        entry.type === '12th' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {entry.type === '12th' ? '12th Standard' : 'Diploma'}
                      </span>
                      {index > 0 && (
                        <span className="text-sm text-gray-500">Entry {index + 1}</span>
                      )}
                    </div>
                    
                    {/* Display Fields */}
                    {entry.type === '12th' && entry.twelthData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {entry.twelthData.branch && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.twelthData.branch}</p>
                  <p className="text-sm text-gray-500">Branch</p>
                </div>
                        )}
                        {(entry.twelthData.month || entry.twelthData.passingYear) && (
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                              {entry.twelthData.month ? `${entry.twelthData.month} ` : ''}
                              {entry.twelthData.passingYear || '-'}
                  </p>
                  <p className="text-sm text-gray-500">Passing Year</p>
                </div>
                        )}
                        {entry.twelthData.schoolName && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.twelthData.schoolName}</p>
                  <p className="text-sm text-gray-500">School</p>
                </div>
                        )}
                        {entry.twelthData.board && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.twelthData.board}</p>
                  <p className="text-sm text-gray-500">Board</p>
                </div>
                        )}
                        {entry.twelthData.marks && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.twelthData.marks}</p>
                  <p className="text-sm text-gray-500">Marks</p>
                </div>
                        )}
                        {entry.twelthData.grade && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.twelthData.grade}</p>
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
                        )}
              </div>
            )}
            
                    {entry.type === 'diploma' && entry.diplomaData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {entry.diplomaData.name && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.name}</p>
                            <p className="text-sm text-gray-500">Diploma Name</p>
                </div>
                        )}
                        {entry.diplomaData.branch && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.branch}</p>
                  <p className="text-sm text-gray-500">Branch</p>
                </div>
                        )}
                        {(entry.diplomaData.month || entry.diplomaData.passingYear) && (
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                              {entry.diplomaData.month ? `${entry.diplomaData.month} ` : ''}
                              {entry.diplomaData.passingYear || '-'}
                  </p>
                  <p className="text-sm text-gray-500">Passing Year</p>
                </div>
                        )}
                        {entry.diplomaData.collegeName && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.collegeName}</p>
                  <p className="text-sm text-gray-500">College Name</p>
                </div>
                        )}
                        {entry.diplomaData.institute && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.institute}</p>
                  <p className="text-sm text-gray-500">Institute</p>
                </div>
                        )}
                        {entry.diplomaData.marks && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.marks}</p>
                  <p className="text-sm text-gray-500">Marks</p>
                </div>
                        )}
                        {entry.diplomaData.grade && (
                <div className="bg-white rounded-lg shadow p-3">
                            <p className="text-lg font-medium text-gray-900">{entry.diplomaData.grade}</p>
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-3 mb-4">
                <p className="text-gray-500 italic">No 12th standard or diploma details available</p>
              </div>
            )}
            
            {/* 10th Standard */}
            <h3 className="text-md font-medium text-gray-700 mt-6 mb-4">10th Standard</h3>
            {employee.tenthStandard ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.tenthStandard.schoolName || employee.tenthStandard.school || '-'}</p>
                  <p className="text-sm text-gray-500">School</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">
                    {employee.tenthStandard.month ? `${employee.tenthStandard.month} ` : ''}
                    {employee.tenthStandard.passingYear || '-'}
                  </p>
                  <p className="text-sm text-gray-500">Passing Year</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.tenthStandard.board || '-'}</p>
                  <p className="text-sm text-gray-500">Board</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.tenthStandard.marks || '-'}</p>
                  <p className="text-sm text-gray-500">Marks</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-3">
                  <p className="text-lg font-medium text-gray-900">{employee.tenthStandard.grade || '-'}</p>
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-3 mb-4">
                <p className="text-gray-500 italic">No 10th standard details available</p>
              </div>
            )}
          </div>

          {/* Audit Trail Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBook className="mr-2" /> Audit Trail
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{createdByAdmin || 'Unknown'}</p>
                <p className="text-sm text-gray-500">Created By</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">
                  {employee.createdAt ? formatDateToDayMonYear(employee.createdAt) : '-'}
                </p>
                <p className="text-sm text-gray-500">Created At</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{updatedByAdmin || 'Unknown'}</p>
                <p className="text-sm text-gray-500">Updated By</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">
                  {employee.updatedAt ? formatDateToDayMonYear(employee.updatedAt) : '-'}
                </p>
                <p className="text-sm text-gray-500">Updated At</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 