'use client';

import { useState } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiBriefcase, FiDollarSign, FiUpload } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useEmploymentsByEmployee } from '@/hooks/useEmployments';
import { useSalariesByEmployee } from '@/hooks/useSalaries';
import Pagination from '@/components/ui/Pagination';
import BulkUploadModal from '@/components/ui/BulkUploadModal';
import { FaRupeeSign } from "react-icons/fa";


// Component to display employee ID from employment record
const EmployeeIdDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment || !employment.employmentId) {
    return <span className="text-gray-400">-</span>;
  }

  return <span>{employment.employmentId}</span>;
};

// Component to display joining date from employment record
const JoiningDateDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment || !employment.joiningDate) {
    return <span className="text-gray-400">-</span>;
  }

  return <span>{formatDateToDayMonYear(employment.joiningDate)}</span>;
};

// Component to display current package (CTC) from employment record
const CurrentPackageDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment) {
    return <span className="text-gray-400">-</span>;
  }

  // Priority: incrementedCtc > joiningCtc > salary
  const currentPackage = employment.incrementedCtc 
    || employment.joiningCtc 
    || employment.salary;

  if (!currentPackage) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <span>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(currentPackage)}
    </span>
  );
};

// Component to display total salary credits from salary records
const TotalSalaryCreditsDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: salaries = [] } = useSalariesByEmployee(employeeId);

  if (!salaries || salaries.length === 0) {
    return <span className="text-gray-400">-</span>;
  }

  // Sum up all totalSalary values from salary records
  const totalCredits = salaries.reduce((total, salary) => {
    return total + (salary.totalSalary || 0);
  }, 0);

  if (totalCredits === 0) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <span>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(totalCredits)}
    </span>
  );
};

// Component to handle employment navigation
const EmploymentActionButton = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment) {
    return (
      <div className="w-10 h-10 border border-gray-300 rounded-md p-2 flex items-center justify-center bg-gray-100 text-gray-400 cursor-not-allowed">
        <FiBriefcase className="w-5 h-5" />
      </div>
    );
  }
  
  return (
    <ActionButton
      icon={<FiBriefcase className="w-5 h-5" />}
      title="View Employment"
      colorClass="bg-green-100 text-green-600 hover:text-green-900"
      href={`/employments/${employment.id}`}
    />
  );
};

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Use Tanstack Query for employee data
  const {
    data: employees = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useEmployees();

  // Use mutation for delete operation
  const deleteEmployeeMutation = useDeleteEmployee();

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing employees:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleBulkUploadSuccess = async () => {
    // Refresh the employees list after successful bulk upload
    await refetch();
    setShowBulkUploadModal(false);
  };

  // Handle error state
  if (isError && error) {
    console.error('Employee data error:', error);
    toast.error('Failed to load employee data');
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      toast.loading('Deleting employee...', { id: 'delete-employee' });
      await deleteEmployeeMutation.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success('Employee deleted successfully', { id: 'delete-employee' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee', { id: 'delete-employee' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const filteredEmployees = employees
    .filter(employee => {
      const matchesSearch = 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm);
      
      const matchesStatusFilter = 
        filterValue === 'all' || 
        (filterValue === 'active' && employee.status === 'active') ||
        (filterValue === 'inactive' && employee.status === 'inactive');
      
      const matchesEmploymentStatusFilter =
        employmentStatusFilter === 'all' ||
        (employmentStatusFilter === 'working' && employee.employmentStatus === 'working') ||
        (employmentStatusFilter === 'resigned' && employee.employmentStatus === 'resigned');
      
      return matchesSearch && matchesStatusFilter && matchesEmploymentStatusFilter;
    })
    .sort((a, b) => {
      // Sort by createdAt (newest first), fallback to updatedAt, then joinDate
      const dateA = a.createdAt || a.updatedAt || a.joinDate || '';
      const dateB = b.createdAt || b.updatedAt || b.joinDate || '';
      
      // Compare dates in descending order (newest first)
      return dateB.localeCompare(dateA);
    });

  const total = filteredEmployees.length;
  const active = filteredEmployees.filter(e => e.status === 'active').length;
  const inactive = filteredEmployees.filter(e => e.status === 'inactive').length;

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (isLoading) {
    return (
      <DashboardLayout>
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
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Employees"
          total={total}
          active={active}
          inactive={inactive}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          searchAriaLabel="Search employees"
          onRefresh={handleRefresh}
          isRefreshing={false} // Tanstack Query handles refreshing state
          showFilter={true}
          filterValue={filterValue}
          onFilterChange={setFilterValue}
          filterOptions={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          showSecondFilter={true}
          secondFilterValue={employmentStatusFilter}
          onSecondFilterChange={setEmploymentStatusFilter}
          secondFilterOptions={[
            { value: 'all', label: 'All Employee Status' },
            { value: 'working', label: 'Working' },
            { value: 'resigned', label: 'Resigned' }
          ]}
          secondFilterLabel="Employment Status"
          backButton={{ href: '/dashboard' }}
          actionButtons={[
            {
              label: 'Bulk Upload',
              icon: <FiUpload />,
              variant: 'primary' as const,
              onClick: () => setShowBulkUploadModal(true)
            },
            {
              label: 'Create',
              href: '/employees/add',
              icon: <FiPlus />,
              variant: 'success' as const,
            }
          ]}
          headerClassName="px-6 pt-6 mb-0"
        />

        {isError ? (
          <div className="p-8 text-center text-red-500">
            <p>Failed to load employees. Please try refreshing the page.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm && filterValue === 'all' && employmentStatusFilter === 'all' && 'No employees match your search'}
            {searchTerm && filterValue === 'active' && employmentStatusFilter === 'all' && 'No active employees match your search'}
            {searchTerm && filterValue === 'inactive' && employmentStatusFilter === 'all' && 'No inactive employees match your search'}
            {searchTerm && employmentStatusFilter === 'working' && 'No working employees match your search'}
            {searchTerm && employmentStatusFilter === 'resigned' && 'No resigned employees match your search'}
            {!searchTerm && filterValue === 'active' && employmentStatusFilter === 'all' && 'No active employees found'}
            {!searchTerm && filterValue === 'inactive' && employmentStatusFilter === 'all' && 'No inactive employees found'}
            {!searchTerm && employmentStatusFilter === 'working' && 'No working employees found'}
            {!searchTerm && employmentStatusFilter === 'resigned' && 'No resigned employees found'}
            {!searchTerm && filterValue === 'all' && employmentStatusFilter === 'all' && 'No employees found. Add your first employee!'}
            {!searchTerm && filterValue !== 'all' && employmentStatusFilter !== 'all' && 'No employees match the selected filters'}
          </div>
        ) : (
          <div className="overflow-x-auto relative max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm after:absolute after:h-px after:w-full after:bottom-0 after:left-0 after:bg-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Emp ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                    Date of Joining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                    Curr. Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                    Total Sal. Cr.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Employee Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    Employment Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <EmployeeIdDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <JoiningDateDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <CurrentPackageDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <TotalSalaryCreditsDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-center'>{employee.status && (
                              <span
                                className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  employee.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                              </span>
                            )}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (employee.employeeType || 'internal') === 'internal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {(employee.employeeType || 'internal').charAt(0).toUpperCase() + (employee.employeeType || 'internal').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {employee.employmentStatus ? (
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.employmentStatus === 'working'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(() => {
                            const status = employee.employmentStatus;
                            return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
                          })()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deleteConfirm === employee.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => confirmDelete(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <ActionButton
                            icon={<FiEye className="w-5 h-5" />}
                            title="View Employee Details"
                            colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                            href={`/employees/${employee.id}`}
                          />
                          <EmploymentActionButton employeeId={employee.id} />
                          <ActionButton
                            icon={<FaRupeeSign className="w-5 h-5" />}
                            title="View Salaries"
                            colorClass="bg-purple-100 text-purple-600 hover:text-purple-900"
                            href={`/salaries?employeeId=${employee.id}`}
                          />
                          <ActionButton
                            icon={<FiEdit className="w-5 h-5" />}
                            title="Edit"
                            colorClass="bg-amber-100 text-amber-600 hover:text-amber-900"
                            href={`/employees/${employee.id}/edit`}
                          />
                          <ActionButton
                            icon={<FiTrash2 className="w-5 h-5" />}
                            title="Delete"
                            colorClass="bg-red-100 text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(employee.id)}
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

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </DashboardLayout>
  );
} 