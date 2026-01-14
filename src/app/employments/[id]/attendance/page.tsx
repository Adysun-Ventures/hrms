'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { useEmployment } from '@/hooks/useEmployments';
import { useEmployee } from '@/hooks/useEmployees';
import { useAttendanceByEmployee } from '@/hooks/useAttendance';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { formatDurationHours } from '@/lib/utils';

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Use Tanstack Query for employment data
  const {
    data: employment,
    isLoading,
    isError,
    error
  } = useEmployment(id);

  // Use Tanstack Query for employee data
  const {
    data: employee,
    isLoading: employeeLoading,
    isError: employeeError
  } = useEmployee(employment?.employeeId || '');

  // Use Tanstack Query for attendance data
  const {
    data: attendanceRecords = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
    error: attendanceErrorData
  } = useAttendanceByEmployee(employment?.employeeId || '');

  // Handle error states
  if (isError && error) {
    console.error('Employment data error:', error);
    toast.error('Failed to load employment data');
  }

  if (employeeError) {
    console.error('Employee data error:', employeeError);
    toast.error('Failed to load employee data');
  }

  if (attendanceError && attendanceErrorData) {
    console.error('Attendance data error:', attendanceErrorData);
    // Don't show error toast for attendance, just log it
    // This allows the page to render even if attendance data fails
  }

  // Calculate attendance statistics
  const calculateAttendanceStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        attendanceRate: 0
      };
    }

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((record: any) => record.status === 'present').length;
    const absentDays = attendanceRecords.filter((record: any) => record.status === 'absent').length;
    const lateDays = attendanceRecords.filter((record: any) => record.status === 'late').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate
    };
  };

  const attendanceStats = calculateAttendanceStats();

  // Pagination calculations
  const totalItems = attendanceRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = attendanceRecords.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'present':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'absent':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'late':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'half-day':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading || employeeLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employments', href: '/employments' },
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
                      <div key={fieldIndex} className="bg-white p-4 rounded shadow">
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
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employments', href: '/employments' },
          { label: 'Error', isCurrent: true }
        ]}
      >
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load employment data. Please try refreshing the page.</p>
        </div>
        <div className="mt-4">
          <Link href="/employments" className="text-blue-600 hover:underline flex items-center gap-1">
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
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employments', href: '/employments' },
          { label: 'Not Found', isCurrent: true }
        ]}
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Employment not found</p>
        </div>
        <div className="mt-4">
          <Link href="/employments" className="text-blue-600 hover:underline flex items-center gap-1">
            <FiArrowLeft size={16} /> Back to Employments
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={
        employee && employment ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: employee.name, href: `/employees/${employment.employeeId}` },
          { label: employment.jobTitle || 'Employment Details', href: `/employments/${id}` },
          { label: 'Attendance', isCurrent: true }
        ] : [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employments', href: '/employments' },
          { label: 'Loading...', isCurrent: true }
        ]
      }
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Attendance Details"
          total={attendanceStats.totalDays}
          active={attendanceStats.presentDays}
          inactive={attendanceStats.absentDays}
          searchValue=""
          onSearchChange={() => {}}
          searchPlaceholder=""
          showStats={true}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          backButton={{
            href: `/employments/${id}`,
            label: 'Back'
          }}
        />

        {employee && (
          <div className="px-6 pb-6 mt-6">
            {/* Employee Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.email} • {employee.phone}</p>
                  <p className="text-sm text-gray-600">{employment.jobTitle || employee.position} • {employment.department || employee.department}</p>
                </div>
              </div>
            </div>
             {/* Attendance Overview */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{attendanceStats.attendanceRate}%</p>
                <p className="text-sm text-gray-500">Attendance Rate</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{attendanceStats.presentDays}/{attendanceStats.totalDays}</p>
                <p className="text-sm text-gray-500">Present Days</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{attendanceStats.absentDays}</p>
                <p className="text-sm text-gray-500">Absent Days</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{attendanceStats.lateDays}</p>
                <p className="text-sm text-gray-500">Late Days</p>
              </div>
            </div>
            </div>

           

            {/* Recent Attendance Records */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Recent Attendance Records</h2>
              </div>

              
              {attendanceLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex space-x-4">
                        <div className="bg-gray-200 h-4 w-24 rounded"></div>
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="bg-gray-200 h-4 w-16 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found for this employee.</p>
                  <p className="text-sm text-gray-400 mt-2">Attendance records will appear here once the employee starts marking their attendance.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRecords.map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateToDayMonYear(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(record.status)}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkInTime || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkOutTime || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.totalHours ? formatDurationHours(record.totalHours, { showSecondsUnderOneHour: true }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {attendanceRecords.length > 0 && (
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 