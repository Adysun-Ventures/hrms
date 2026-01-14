'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiDownload, FiPrinter, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { useEmployeeLeaves } from '@/hooks/useLeaves';

interface MonthlyLeaveData {
  month: string;
  year: number;
  totalDays: number;
  approvedDays: number;
  pendingDays: number;
  rejectedDays: number;
  leaveTypes: {
    casual: number;
    sick: number;
    annual: number;
    personal: number;
  };
}

interface LeaveRecord {
  id: string;
  month: string;
  year: number;
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  totalDays: number;
  wasEdited?: boolean;
}

export default function LeaveReportPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [monthlyData, setMonthlyData] = useState<MonthlyLeaveData[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  
  const router = useRouter();
  const { currentUserData } = useAuth();

  // Use TanStack Query hook for dynamic data
  const {
    data: rawLeaveRecords = [],
    isLoading,
    isError,
    error,
    refetch
  } = useEmployeeLeaves(currentUserData?.id || '');

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!currentUserData || currentUserData.userType !== 'employee') {
      router.push('/login');
      return;
    }
  }, [currentUserData, router]);

  // Transform raw leave data to the format needed for this component
  useEffect(() => {
    if (rawLeaveRecords && rawLeaveRecords.length > 0) {
      // Transform leave records
      const transformedRecords: LeaveRecord[] = rawLeaveRecords.map(record => ({
        id: record.id,
        month: new Date(record.startDate).toLocaleDateString('en-US', { month: 'long' }),
        year: new Date(record.startDate).getFullYear(),
        type: record.type,
        startDate: record.startDate,
        endDate: record.endDate,
        reason: record.reason,
        status: record.status,
        totalDays: record.totalDays,
        wasEdited: record.wasEdited
      }));

      setLeaveRecords(transformedRecords);

      // Generate monthly summary data
      const monthlySummary = generateMonthlySummary(transformedRecords);
      setMonthlyData(monthlySummary);
    } else {
      setLeaveRecords([]);
      setMonthlyData([]);
    }
  }, [rawLeaveRecords]);

  // Generate monthly summary from leave records
  const generateMonthlySummary = (records: LeaveRecord[]): MonthlyLeaveData[] => {
    const monthlyMap = new Map<string, MonthlyLeaveData>();

    records.forEach(record => {
      const key = `${record.month}-${record.year}`;
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: record.month,
          year: record.year,
          totalDays: 0,
          approvedDays: 0,
          pendingDays: 0,
          rejectedDays: 0,
          leaveTypes: { casual: 0, sick: 0, annual: 0, personal: 0 }
        });
      }

      const monthData = monthlyMap.get(key)!;
      monthData.totalDays += record.totalDays;

      switch (record.status) {
        case 'approved':
          monthData.approvedDays += record.totalDays;
          break;
        case 'pending':
          monthData.pendingDays += record.totalDays;
          break;
        case 'rejected':
          monthData.rejectedDays += record.totalDays;
          break;
      }

      // Count leave types
      if (record.type in monthData.leaveTypes) {
        monthData.leaveTypes[record.type as keyof typeof monthData.leaveTypes]++;
      }
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const aMonthIndex = monthOrder.indexOf(a.month);
      const bMonthIndex = monthOrder.indexOf(b.month);
      
      if (a.year !== b.year) return b.year - a.year;
      return bMonthIndex - aMonthIndex;
    });
  };

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      console.error('Leave data error:', error);
      toast.error('Failed to load leave data');
    }
  }, [isError, error]);

  // Filter records based on selections
  const filteredRecords = leaveRecords.filter(record => {
    const monthMatch = selectedMonth === 'all' || record.month === selectedMonth;
    const statusMatch = selectedStatus === 'all' || record.status === selectedStatus;
    const typeMatch = selectedType === 'all' || record.type === selectedType;
    return monthMatch && statusMatch && typeMatch;
  });

  // Pagination calculations
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleBack = () => {
    router.push('/employee/leaves');
  };

  const handleExportPDF = () => {
    toast.success('PDF export started...');
    // PDF export logic would go here
  };

  const handlePrint = () => {
    window.print();
  };

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

  // Export data to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Month', 'Year', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'],
      ...filteredRecords.map(record => [
        record.month,
        record.year,
        record.type,
        record.startDate,
        record.endDate,
        record.totalDays,
        record.status,
        record.reason
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV export completed');
  };

  // Show loading state
  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TableHeader
            title="Leave Reports"
            total={0}
            active={0}
            inactive={0}
            searchValue=""
            onSearchChange={() => {}}
            searchPlaceholder="Search reports"
            searchAriaLabel="Search reports"
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
            showSearch={false}
            showStats={false}
            backButton={{ href: '/employee/leaves' }}
            headerClassName="px-6 pt-6 mb-0"
          />
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading leave data...</span>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // Show error state
  if (isError) {
    return (
      <EmployeeLayout>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TableHeader
            title="Leave Reports"
            total={0}
            active={0}
            inactive={0}
            searchValue=""
            onSearchChange={() => {}}
            searchPlaceholder="Search reports"
            searchAriaLabel="Search reports"
            onRefresh={handleRefresh}
            isRefreshing={false}
            showSearch={false}
            showStats={false}
            backButton={{ href: '/employee/leaves' }}
            headerClassName="px-6 pt-6 mb-0"
          />
          <div className="p-6">
            <div className="text-center py-12">
              <FiCalendar className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-500 mb-4">Failed to load leave data. Please try again.</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

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

  const totalStats = monthlyData.reduce((acc, month) => ({
    totalDays: acc.totalDays + month.totalDays,
    approvedDays: acc.approvedDays + month.approvedDays,
    pendingDays: acc.pendingDays + month.pendingDays,
    rejectedDays: acc.rejectedDays + month.rejectedDays
  }), { totalDays: 0, approvedDays: 0, pendingDays: 0, rejectedDays: 0 });

  return (
    <EmployeeLayout>
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Leave Reports"
          total={filteredRecords.length}
          active={filteredRecords.filter(record => record.status === 'approved').length}
          inactive={filteredRecords.filter(record => record.status === 'rejected').length}
          searchValue=""
          onSearchChange={() => {}}
          searchPlaceholder="Search reports"
          searchAriaLabel="Search reports"
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          showSearch={false}
          showStats={false}
          backButton={{ href: '/employee/leaves' }}
          headerClassName="px-6 pt-6 mb-0"
        />

        <div className="p-6 pb-0">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leave Days</p>
                  <p className="text-2xl font-bold text-blue-600">{totalStats.totalDays}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Days</p>
                  <p className="text-2xl font-bold text-green-600">{totalStats.approvedDays}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Days</p>
                  <p className="text-2xl font-bold text-yellow-600">{totalStats.pendingDays}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected Days</p>
                  <p className="text-2xl font-bold text-red-600">{totalStats.rejectedDays}</p>
                </div>
                <FiCalendar className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Monthly Summary Cards */}
          {monthlyData.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthlyData.map((month) => (
                  <div key={`${month.month}-${month.year}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">{month.month} {month.year}</h4>
                      <span className="text-sm text-gray-500">{month.totalDays} days</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Approved:</span>
                        <span className="text-green-600 font-medium">{month.approvedDays}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending:</span>
                        <span className="text-yellow-600 font-medium">{month.pendingDays}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rejected:</span>
                        <span className="text-red-600 font-medium">{month.rejectedDays}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Casual:</span>
                          <span className="font-medium">{month.leaveTypes.casual}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Sick:</span>
                          <span className="font-medium">{month.leaveTypes.sick}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Annual:</span>
                          <span className="font-medium">{month.leaveTypes.annual}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Personal:</span>
                          <span className="font-medium">{month.leaveTypes.personal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No monthly summary available. Start by requesting some leaves!</p>
            </div>
          )}
        </div>

{/* Filters */}
<div className="bg-gray-50 p-4 rounded-lg">
  <div className="flex flex-wrap gap-4 items-center justify-end">
    
    <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
    >
      <option value="all">All Months</option>
      {monthlyData.map((month) => (
        <option key={`${month.month}-${month.year}`} value={month.month}>
          {month.month} {month.year}
        </option>
      ))}
    </select>

    <select
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
    >
      <option value="all">All Status</option>
      <option value="approved">Approved</option>
      <option value="pending">Pending</option>
      <option value="rejected">Rejected</option>
    </select>

    <select
      value={selectedType}
      onChange={(e) => setSelectedType(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
    >
      <option value="all">All Types</option>
      <option value="casual">Casual</option>
      <option value="sick">Sick</option>
      <option value="annual">Annual</option>
      <option value="personal">Personal</option>
    </select>
  </div>
</div>

{/* Detailed Leave Records Table */}
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Month
        </th>
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
          Reason
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {paginatedRecords.map((record) => (
        <tr key={record.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {record.month} {record.year}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={getLeaveTypeBadge(record.type)}>
              {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatDateToDayMonYear(record.startDate)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <div className="flex items-center gap-2">
              <span>{formatDateToDayMonYear(record.endDate)}</span>
              {record.wasEdited && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Edited
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {record.totalDays} day{record.totalDays > 1 ? 's' : ''}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={getStatusBadge(record.status)}>
              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
            {record.reason}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{filteredRecords.length === 0 && (
  <div className="text-center py-8">
    <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">No leave records found for the selected filters.</p>
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
    </EmployeeLayout>
  );
}