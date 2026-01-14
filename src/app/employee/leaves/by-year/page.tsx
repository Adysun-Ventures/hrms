'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiEye, FiCheck, FiX, FiClock } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployeeLeaves } from '@/hooks/useLeaves';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';

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

interface YearlyLeaveData {
  year: number;
  totalLeaves: number;
  approvedLeaves: number;
  pendingLeaves: number;
  rejectedLeaves: number;
  totalDays: number;
  leaves: LeaveRecord[];
}

export default function LeavesByYearPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyData, setYearlyData] = useState<YearlyLeaveData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

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

  // Process leave data by year
  useEffect(() => {
    if (leaveRecords.length > 0) {
      const yearMap = new Map<number, LeaveRecord[]>();
      
      leaveRecords.forEach(record => {
        const year = new Date(record.startDate).getFullYear();
        if (!yearMap.has(year)) {
          yearMap.set(year, []);
        }
        yearMap.get(year)!.push(record);
      });

      const years = Array.from(yearMap.keys()).sort((a, b) => b - a);
      setAvailableYears(years);

      const yearlyDataArray: YearlyLeaveData[] = years.map(year => {
        const yearLeaves = yearMap.get(year)!;
        return {
          year,
          totalLeaves: yearLeaves.length,
          approvedLeaves: yearLeaves.filter(l => l.status === 'approved').length,
          pendingLeaves: yearLeaves.filter(l => l.status === 'pending').length,
          rejectedLeaves: yearLeaves.filter(l => l.status === 'rejected').length,
          totalDays: yearLeaves.reduce((sum, l) => sum + l.totalDays, 0),
          leaves: yearLeaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        };
      });

      setYearlyData(yearlyDataArray);
      
      // Set default selected year to the most recent year with data
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    }
  }, [leaveRecords, selectedYear]);

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      console.error('Leave data error:', error);
      toast.error('Failed to load leave data');
    }
  }, [isError, error]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Leave data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing leave data:', error);
      toast.error('Failed to refresh leave data');
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

  const currentYearData = yearlyData.find(data => data.year === selectedYear);

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
          title="Leaves by Year"
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
          showStats={true}
          backButton={{ href: '/employee/leaves' }}
          actionButtons={[]}
          headerClassName="px-6 pt-6 mb-0"
          dropdown={
            <div className="flex items-center space-x-2 ml-auto">
              <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <div className="p-6">
          {/* Year Summary */}
          {currentYearData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved Leaves</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentYearData.approvedLeaves}
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
                      {currentYearData.pendingLeaves}
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
                      {currentYearData.rejectedLeaves}
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
                      {currentYearData.totalDays}
                    </p>
                  </div>
                  <FiCalendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Leave Records Table for Selected Year */}
          {currentYearData && currentYearData.leaves.length > 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentYearData.leaves.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className={getLeaveTypeBadge(record.type)}>
                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          </span>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={record.reason}>
                          {record.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          <ActionButton
                            icon={<FiEye className="w-5 h-5" />}
                            title="View"
                            colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                            href={`/employee/leaves/${record.id}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentYearData ? `No leave records found for ${selectedYear}.` : 'No leave data available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
