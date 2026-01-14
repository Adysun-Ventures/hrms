'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiUsers, FiRefreshCw } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useAllAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { formatDurationHours } from '@/lib/utils';
import TableHeader from '@/components/ui/TableHeader';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  totalHours: number;
  isLate: boolean;
  isEarlyCheckOut: boolean;
}

export default function AdminAttendancePage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const router = useRouter();
  const { currentAdmin, currentUserData } = useAuth();

  // Use attendance and employee hooks
  const {
    data: attendanceRecords = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
    error: attendanceErrorData,
    refetch: refetchAttendance
  } = useAllAttendance();

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
    error: employeesErrorData
  } = useEmployees();

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!currentUserData || currentUserData.userType !== 'admin') {
      router.push('/login');
      return;
    }
  }, [currentUserData, router]);

  // Handle errors
  useEffect(() => {
    if (attendanceError && attendanceErrorData) {
      console.error('Attendance data error:', attendanceErrorData);
      toast.error('Failed to load attendance data');
    }
  }, [attendanceError, attendanceErrorData]);

  useEffect(() => {
    if (employeesError && employeesErrorData) {
      console.error('Employees data error:', employeesErrorData);
      toast.error('Failed to load employees data');
    }
  }, [employeesError, employeesErrorData]);

  const handleEmployeeFilterChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
  };

  const handleRefresh = async () => {
    try {
      await refetchAttendance();
      toast.success('Attendance data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing attendance data:', error);
      toast.error('Failed to refresh attendance data');
    }
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

  // Filter attendance records based on selected employee
  const filteredAttendanceRecords = selectedEmployee === 'all' 
    ? attendanceRecords 
    : attendanceRecords.filter((record: any) => record.employeeId === selectedEmployee);

  // Enrich attendance data with employee names
  const enrichedAttendanceRecords: AttendanceRecord[] = filteredAttendanceRecords.map((record: any) => {
    const employee = employees.find(emp => emp.id === record.employeeId);
    return {
      ...record,
      employeeName: employee?.name || 'Unknown Employee'
    };
  });

  const isLoading = attendanceLoading || employeesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading attendance data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Attendance', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Attendance Management"
          total={enrichedAttendanceRecords.length}
          active={enrichedAttendanceRecords.filter(record => record.status === 'present').length}
          inactive={enrichedAttendanceRecords.filter(record => record.status === 'absent').length}
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={true}
          backButton={{ href: '/dashboard' }}
          headerClassName="px-6 pt-6 mb-0"
        />

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => handleEmployeeFilterChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`p-2 rounded-md transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                }`}
                title="Refresh attendance data"
                aria-label="Refresh attendance data"
              >
                <FiRefreshCw 
                  className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
          </div>

          {/* Attendance Records Table */}
          {enrichedAttendanceRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found.</p>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrichedAttendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.employeeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateToDayMonYear(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkInTime || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOutTime || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDurationHours(record.totalHours || 0, { showSecondsUnderOneHour: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 