'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiEye, FiDollarSign } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Employment, Employee } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { ActionButton } from '@/components/ui/ActionButton';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import SearchBar from '@/components/ui/SearchBar';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { useEmployments, useDeleteEmployment } from '@/hooks/useEmployments';
import { useEmployees } from '@/hooks/useEmployees';
import { FaRupeeSign } from "react-icons/fa";


export default function EmploymentsPage() {
  const searchParams = useSearchParams();
  const employeeIdFilter = searchParams?.get('employeeId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Use Tanstack Query for employment data
  const {
    data: employments = [],
    isLoading,
    isError,
    error,
    refetch
  } = useEmployments();

  // Use Tanstack Query for employee data (for names)
  const {
    data: employees = []
  } = useEmployees();

  // Use mutation for delete operation
  const deleteEmploymentMutation = useDeleteEmployment();

  // Create employee names map
  const employeeNames = employees.reduce((acc, employee) => {
    acc[employee.id] = employee.name;
    return acc;
  }, {} as Record<string, string>);

  // Get employee name for filtering
  const filteredEmployeeName = employeeIdFilter ? employeeNames[employeeIdFilter] : null;

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing employments:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Handle error state
  if (isError && error) {
    console.error('Employment data error:', error);
    toast.error('Failed to load employment data');
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      toast.loading('Deleting employment...', { id: 'delete-employment' });
      await deleteEmploymentMutation.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success('Employment deleted successfully', { id: 'delete-employment' });
    } catch (error) {
      console.error('Error deleting employment:', error);
      toast.error('Failed to delete employment', { id: 'delete-employment' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const filteredEmployments = employments.filter(employment => {
    const employeeName = employeeNames[employment.employeeId] || 'Unknown Employee';
    const matchesSearch = 
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employment.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employment.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterValue === 'all' || 
      (filterValue === 'active' && employment.contractType === 'full-time') ||
      (filterValue === 'inactive' && employment.contractType === 'part-time');
    
    const matchesEmployeeFilter = !employeeIdFilter || employment.employeeId === employeeIdFilter;
    
    return matchesSearch && matchesFilter && matchesEmployeeFilter;
  });

  // Pagination logic
  const totalItems = filteredEmployments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmployments = filteredEmployments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValue, employeeIdFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const total = filteredEmployments.length;
  const active = filteredEmployments.filter(e => e.contractType === 'full-time').length;
  const inactive = filteredEmployments.filter(e => e.contractType === 'part-time').length;

  if (isLoading) {
      return (
    <DashboardLayout allowedUserTypes={['admin']}>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Skeleton for TableHeader */}
          <div className="space-y-6">
            {/* Title and Action Buttons Skeleton */}
            <div className="flex justify-between items-center px-6 pt-6 mb-6">
              <div className="flex items-center">
                <div className="bg-gray-200 h-10 w-20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Stats and Search Skeleton */}
            <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gray-200 h-10 w-10 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-10 w-64 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex space-x-6">
                  <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-6">
                      <div className="bg-gray-200 h-4 w-32 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-6 w-16 rounded-full animate-pulse"></div>
                      <div className="flex items-center space-x-2 ml-auto">
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={
        employeeIdFilter && filteredEmployeeName ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: filteredEmployeeName, href: `/employees/${employeeIdFilter}` },
          { label: 'Employments', isCurrent: true }
        ] : [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employments', isCurrent: true }
        ]
      }
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title={employeeIdFilter && filteredEmployeeName ? `${filteredEmployeeName}'s Employments` : employeeIdFilter ? "Employee's Employments" : "Employments"}
          total={total}
          active={active}
          inactive={inactive}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          searchAriaLabel="Search employments"
          onRefresh={handleRefresh}
          isRefreshing={false} // Tanstack Query handles refreshing state
          showFilter={true}
          filterValue={filterValue}
          onFilterChange={setFilterValue}
          backButton={{
            href: employeeIdFilter ? '/employees' : '/dashboard',
            label: employeeIdFilter ? 'Back' : 'Back'
          }}
          actionButtons={[
            {
              label: 'Add Employment',
              href: employeeIdFilter ? `/employments/add?employeeId=${employeeIdFilter}` : '/employments/add',
              icon: <FiPlus />,
              variant: 'success'
            }
          ]}
        />

        {isError ? (
          <div className="p-8 text-center text-red-500">
            <p>Failed to load employments. Please try refreshing the page.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredEmployments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {employeeIdFilter && filteredEmployeeName && `${filteredEmployeeName} has no employments yet.`}
            {!employeeIdFilter && searchTerm && filterValue === 'all' && 'No employments match your search'}
            {!employeeIdFilter && searchTerm && filterValue === 'active' && 'No active employments match your search'}
            {!employeeIdFilter && searchTerm && filterValue === 'inactive' && 'No inactive employments match your search'}
            {!employeeIdFilter && !searchTerm && filterValue === 'active' && 'No active employments found'}
            {!employeeIdFilter && !searchTerm && filterValue === 'inactive' && 'No inactive employments found'}
            {!employeeIdFilter && !searchTerm && filterValue === 'all' && 'No employments found. Add your first employment!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployments.map((employment) => (
                  <tr key={employment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {employeeNames[employment.employeeId] || 'Unknown Employee'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employment.jobTitle || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employment.department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employment.startDate ? formatDateToDayMonYear(employment.startDate) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employment.salary ? new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(employment.salary) : '-'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-center'>
                      {employment.contractType && (
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employment.contractType === 'full-time'
                              ? 'bg-green-100 text-green-800'
                              : employment.contractType === 'part-time'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {employment.contractType.charAt(0).toUpperCase() + employment.contractType.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deleteConfirm === employment.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => confirmDelete(employment.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteEmploymentMutation.isPending}
                          >
                            {deleteEmploymentMutation.isPending ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={deleteEmploymentMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <ActionButton
                            icon={<FiEye className="w-5 h-5" />}
                            title="View Employment Details"
                            colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                            href={`/employments/${employment.id}`}
                          />
                          <ActionButton
                            icon={<FaRupeeSign className="w-5 h-5" />}
                            title="View Salary Details"
                            colorClass="bg-green-100 text-green-600 hover:text-green-900"
                            href={`/employments/${employment.id}#salary`}
                          />
                          <ActionButton
                            icon={<FiEdit className="w-5 h-5" />}
                            title="Edit"
                            colorClass="bg-amber-100 text-amber-600 hover:text-amber-900"
                            href={`/employments/${employment.id}/edit`}
                          />
                          <ActionButton
                            icon={<FiTrash2 className="w-5 h-5" />}
                            title="Delete"
                            colorClass="bg-red-100 text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(employment.id)}
                            as="button"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 