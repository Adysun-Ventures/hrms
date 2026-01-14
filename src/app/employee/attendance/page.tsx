'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiCheck, FiX } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useAttendanceByEmployee, useTodayAttendance, useMarkAttendanceCheckIn, useMarkAttendanceCheckOut } from '@/hooks/useAttendance';
import { useEmployeeLeaves } from '@/hooks/useLeaves';
import { useEmployeeSelfEmployment } from '@/hooks/useEmployees';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { formatDurationHours } from '@/lib/utils';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours: number;
}

// Note: Today attendance response may omit time fields when not checked in

export default function EmployeeAttendancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const router = useRouter();
  const { currentUserData } = useAuth();

  // Check if employee has employment
  const { data: employmentData = [], isLoading: employmentLoading } = useEmployeeSelfEmployment(
    currentUserData?.id || ''
  );

  // Use attendance hooks - MUST be called before any conditional returns
  const {
    data: attendanceRecords = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
    error: attendanceErrorData
  } = useAttendanceByEmployee(currentUserData?.id || '');

  const {
    data: todayAttendance = {
      isCheckedIn: false,
      isCheckedOut: false
    },
    isLoading: todayLoading,
    isError: todayError,
    error: todayErrorData
  } = useTodayAttendance(currentUserData?.id || '');

  // Use leave hooks
  const {
    data: leaveRecords = [],
    isLoading: leaveLoading,
    isError: leaveError,
    error: leaveErrorData
  } = useEmployeeLeaves(currentUserData?.id || '');

  // Attendance mutations
  const checkInMutation = useMarkAttendanceCheckIn();
  const checkOutMutation = useMarkAttendanceCheckOut();

  // Redirect immediately if employee doesn't have employment
  useEffect(() => {
    if (!employmentLoading && currentUserData?.id) {
      if (employmentData.length === 0) {
        router.replace('/employee-dashboard');
      }
    }
  }, [employmentLoading, employmentData, currentUserData, router]);

  // Helper function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (timeString: string | undefined): string => {
    if (!timeString) return '--';
    
    try {
      // If it's already in 12-hour format, return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      // If it's in 24-hour format (HH:MM), convert to 12-hour
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }
      
      return timeString;
    } catch {
      return timeString;
    }
  };

  // Helper function to calculate real-time hours from checkInTimestamp
  const calculateRealtimeHours = (checkInTimestamp: any): number => {
    if (!checkInTimestamp) return 0;
    
    try {
      // Convert Firestore timestamp to Date
      const checkInDate = checkInTimestamp.toDate ? checkInTimestamp.toDate() : new Date(checkInTimestamp);
      
      // Calculate difference in hours
      const diffMs = currentTime.getTime() - checkInDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Round to 2 decimal places
      return Math.round(diffHours * 100) / 100;
    } catch (error) {
      console.error('Error calculating real-time hours:', error);
      return 0;
    }
  };

  // Helper function to calculate hours from check-in to check-out (or end of day if no check-out)
  const calculateHoursFromTimestamps = (checkInTimestamp: any, checkOutTimestamp: any, recordDate: string): number => {
    if (!checkInTimestamp) return 0;
    
    try {
      // Convert Firestore timestamp to Date
      const checkInDate = checkInTimestamp.toDate ? checkInTimestamp.toDate() : new Date(checkInTimestamp);
      
      let endDate: Date;
      
      if (checkOutTimestamp) {
        // If checked out, use check-out timestamp
        endDate = checkOutTimestamp.toDate ? checkOutTimestamp.toDate() : new Date(checkOutTimestamp);
      } else {
        // If not checked out, calculate to end of that day (11:59:59 PM)
        const recordDateObj = new Date(recordDate);
        endDate = new Date(recordDateObj);
        endDate.setHours(23, 59, 59, 999);
        
        // If it's today, use current time instead of end of day
        const today = new Date().toISOString().split('T')[0];
        if (recordDate === today) {
          endDate = currentTime;
        }
      }
      
      // Calculate difference in hours
      const diffMs = endDate.getTime() - checkInDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Round to 2 decimal places
      return Math.max(0, Math.round(diffHours * 100) / 100);
    } catch (error) {
      console.error('Error calculating hours from timestamps:', error);
      return 0;
    }
  };

  useEffect(() => {
    // Check if user is authenticated and is employee
    if (!currentUserData || currentUserData.userType !== 'employee') {
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
    if (todayError && todayErrorData) {
      console.error('Today attendance error:', todayErrorData);
      toast.error('Failed to load today\'s attendance');
    }
  }, [todayError, todayErrorData]);

  useEffect(() => {
    if (leaveError && leaveErrorData) {
      console.error('Leave data error:', leaveErrorData);
      toast.error('Failed to load leave data');
    }
  }, [leaveError, leaveErrorData]);

  // Real-time updates for today's attendance hours
  useEffect(() => {
    // Only run interval when checked in but not checked out
    if (!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut) {
      return;
    }

    // Update immediately on mount/change
    setCurrentTime(new Date());

    // Update every 60 seconds for real-time updates
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [todayAttendance.isCheckedIn, todayAttendance.isCheckedOut]);

  const handleCheckIn = async () => {
    try {
      // Get employment ID for the employee
      const employmentQuery = query(
        collection(db, 'employments'),
        where('employeeId', '==', currentUserData?.id)
      );
      const employmentSnapshot = await getDocs(employmentQuery);
      
      if (employmentSnapshot.empty) {
        throw new Error('No employment record found for this employee.');
      }
      
      const employmentId = employmentSnapshot.docs[0].id;
      
      // Mark attendance check-in
      await checkInMutation.mutateAsync({ 
        employeeId: currentUserData?.id || '', 
        employmentId 
      });
      
      toast.success('Check-in successful!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-in failed. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      // Mark attendance check-out
      await checkOutMutation.mutateAsync(currentUserData?.id || '');
      
      toast.success('Check-out successful!');
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-out failed. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <FiX className="w-4 h-4 text-red-600" />;
      case 'late':
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case 'half-day':
        return <FiClock className="w-4 h-4 text-orange-600" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-600" />;
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
      case 'leave':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLeaveStatusBadge = (record: CombinedRecord) => {
    if (!record.isLeave) return null;
    
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    return (
      <div className="flex flex-col gap-1">
        <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
          Leave Approved
        </span>
        <span className="text-xs text-gray-600 capitalize">
          {record.leaveType}
        </span>
        {record.isMultiDay && record.totalDays && record.totalDays > 1 && (
          <span className="text-xs text-gray-500">
            {record.totalDays} days
          </span>
        )}
      </div>
    );
  };

  const getTotalHoursClass = (hours: number) => {
    if (hours > 9) return 'text-blue-600 font-semibold';
    if (hours > 7) return 'text-green-600 font-semibold';
    if (hours > 5) return 'text-orange-600 font-semibold';
    if (hours < 1) return 'text-red-600 font-semibold';
    return 'text-gray-900';
  };

  // Month navigation removed; helpers deleted to satisfy lints

  // Transform attendance data to match expected format with 12-hour time
  type RawAttendance = {
    id: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    checkInTimestamp?: any;
    checkOutTimestamp?: any;
    status?: AttendanceRecord['status'];
    totalHours?: number;
  };

  // Get today's date string for comparison
  const todayDateString = new Date().toISOString().split('T')[0];

  const transformedAttendanceRecords: AttendanceRecord[] = (attendanceRecords as RawAttendance[]).map((record) => {
    // Check if this is today's record and is checked in but not checked out
    const isToday = record.date === todayDateString;
    const isActiveToday = isToday && 
                          todayAttendance.isCheckedIn && 
                          !todayAttendance.isCheckedOut &&
                          todayAttendance.checkInTimestamp;
    
    // Calculate total hours based on different scenarios
    let totalHours: number;
    
    if (isActiveToday && todayAttendance.checkInTimestamp) {
      // Today's active attendance - use real-time calculation
      totalHours = calculateRealtimeHours(todayAttendance.checkInTimestamp);
    } else if (record.checkOutTimestamp || record.checkOutTime) {
      // Has check-out - use stored totalHours from Firebase (already calculated)
      totalHours = record.totalHours ?? 0;
    } else if (record.checkInTimestamp) {
      // No check-out but has check-in timestamp - calculate from check-in to end of day
      totalHours = calculateHoursFromTimestamps(record.checkInTimestamp, record.checkOutTimestamp, record.date);
    } else if (record.totalHours !== undefined && record.totalHours !== null) {
      // Use stored totalHours if available
      totalHours = record.totalHours;
    } else {
      // No data available - show 0
      totalHours = 0;
    }
    
    return {
      id: record.id,
      date: record.date,
      checkIn: formatTimeTo12Hour(record.checkInTime) || '11:00 AM',
      checkOut: formatTimeTo12Hour(record.checkOutTime) || '08:00 PM',
      status: record.status || 'present',
      totalHours
    };
  });

  // Create combined records with leaves
  interface CombinedRecord {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
    totalHours: number;
    isLeave: boolean;
    leaveType?: string;
    leaveReason?: string;
    isMultiDay?: boolean;
    startDate?: string;
    endDate?: string;
    totalDays?: number;
  }

  // Transform leave records to attendance-like format
  const leaveRecordsForAttendance: CombinedRecord[] = leaveRecords
    .filter(leave => leave.status === 'approved')
    .map(leave => {
      // Create a single consolidated entry for multi-day leaves
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // If it's a single day leave, use that date
      // If it's multi-day, use the start date as the display date
      const displayDate = startDate.toISOString().split('T')[0];
      
      // Create a single record for the entire leave period
      return {
        id: `leave_${leave.id}`,
        date: displayDate,
        checkIn: '--',
        checkOut: '--',
        status: 'leave' as any,
        totalHours: 0,
        isLeave: true,
        leaveType: leave.type,
        leaveReason: leave.reason,
        // Add additional info for multi-day leaves
        isMultiDay: startDate.getTime() !== endDate.getTime(),
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays
      };
    });

  // Combine attendance and leave records with proper deduplication
  const combinedRecords: CombinedRecord[] = [];
  
  // First, add all attendance records
  transformedAttendanceRecords.forEach(record => {
    combinedRecords.push({
      ...record,
      isLeave: false
    });
  });
  
  // Then, add all leave records (they will be sorted by date later)
  leaveRecordsForAttendance.forEach(leaveRecord => {
    combinedRecords.push(leaveRecord);
  });

  // Sort by date (most recent first)
  combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply filters
  let filteredRecords = combinedRecords;
  
  // Filter by date (month/year)
  if (dateFilter) {
    filteredRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.date);
      const filterDate = new Date(dateFilter);
      return recordDate.getMonth() === filterDate.getMonth() && 
             recordDate.getFullYear() === filterDate.getFullYear();
    });
  }
  
  // Filter by status
  if (statusFilter !== 'all') {
    filteredRecords = filteredRecords.filter(record => {
      if (statusFilter === 'leave') {
        return record.isLeave === true;
      } else if (statusFilter === 'present') {
        return !record.isLeave && (record.status === 'present' || record.status === 'late');
      } else if (statusFilter === 'half-day') {
        return !record.isLeave && record.status === 'half-day';
      } else if (statusFilter === 'absent') {
        return !record.isLeave && record.status === 'absent';
      }
      return true;
    });
  }

  // Debug logging to ensure no duplicates
  console.log('🔍 Attendance Records:', transformedAttendanceRecords.length);
  console.log('🔍 Leave Records (approved):', leaveRecords.filter(l => l.status === 'approved').length);
  console.log('🔍 Leave Entries (consolidated):', leaveRecordsForAttendance.length);
  console.log('🔍 Combined Records:', combinedRecords.length);
  console.log('�� Processed Dates:', new Set(combinedRecords.map(r => r.date)).size);
  
  // Verify no duplicate dates in final result
  const finalDates = combinedRecords.map(r => r.date);
  const uniqueFinalDates = new Set(finalDates);
  if (finalDates.length !== uniqueFinalDates.size) {
    console.warn('⚠️ Duplicate dates detected in final result!');
    console.warn('Final dates:', finalDates);
    console.warn('Unique dates:', Array.from(uniqueFinalDates));
  }

  // Additional validation: Check for conflicting records
  const validateDataIntegrity = () => {
    const dateMap = new Map<string, CombinedRecord[]>();
    
    combinedRecords.forEach(record => {
      if (!dateMap.has(record.date)) {
        dateMap.set(record.date, []);
      }
      dateMap.get(record.date)!.push(record);
    });
    
    // Check for dates with multiple records
    dateMap.forEach((records, date) => {
      if (records.length > 1) {
        const hasAttendance = records.some(r => !r.isLeave);
        const hasLeave = records.some(r => r.isLeave);
        
        if (hasAttendance && hasLeave) {
          console.log(`ℹ️ Date ${date} has both attendance and leave records - this is normal`);
        }
        
        if (records.length > 2) {
          console.warn(`⚠️ Date ${date} has ${records.length} records!`);
          console.warn('Records:', records);
        }
      }
    });
  };
  
  validateDataIntegrity();

  const halfDayCount = transformedAttendanceRecords.filter(r => r.status === 'half-day').length;
  const fullDayCount = transformedAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const leaveCount = leaveRecords.filter(leave => leave.status === 'approved').length;

  // Pagination calculations (use filtered records)
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };


  const isLoading = attendanceLoading || todayLoading || leaveLoading || employmentLoading;

  // Handle "no employment" case AFTER all hooks are called
  if (!employmentLoading && currentUserData?.id && employmentData.length === 0) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-64">
          <p>No employment record found. Redirecting...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading attendance data...</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Attendance', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      {/* Attendance Records Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Precompute safe times to satisfy TS when todayAttendance has minimal shape */}
          {(() => {
            type MaybeToday = { isCheckedIn: boolean; isCheckedOut: boolean; checkInTime?: string; checkOutTime?: string };
            const t = todayAttendance as MaybeToday;
            const checkInTimeStr = t.checkInTime || '';
            const checkOutTimeStr = t.checkOutTime || '';

            return (
          <TableHeader
          title="Attendance Records"
          total={filteredRecords.length}
          dropdown={
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-700">Full Day: <span className="font-medium">{fullDayCount}</span></span>
              <span className="text-orange-700">Half Day: <span className="font-medium">{halfDayCount}</span></span>
              <span className="text-blue-700">Leave: <span className="font-medium">{leaveCount}</span></span>
            </div>
          }
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={true}
          backButton={{ href: '/employee-dashboard' }}
          headerClassName="px-6 pt-6 mb-0"
          showAttendanceMarking={true}
          attendanceData={{
            isCheckedIn: todayAttendance.isCheckedIn,
            checkInTime: checkInTimeStr,
            checkOutTime: checkOutTimeStr,
            checkInDate: todayAttendance.isCheckedIn ? new Date().toISOString().split('T')[0] : undefined,
            checkOutDate: todayAttendance.isCheckedOut ? new Date().toISOString().split('T')[0] : undefined,
            employeeName: currentUserData?.name
          }}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          isMarkingAttendance={checkInMutation.isPending || checkOutMutation.isPending}
          actionButtons={[
            {
              label: 'Apply Leave',
              icon: <FiCalendar className="w-4 h-4" />,
              variant: 'info' as const,
              href: '/employee/leaves/request'
            }
          ]}
          actionButtonsBeforeAttendance={true}
          showCustomFilters={true}
          technologyFilterValue={dateFilter}
          onTechnologyFilterChange={(value) => setDateFilter(value)}
          technologyFilterOptions={[
            { value: '', label: 'All Months' },
            ...Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
              return {
                value: date.toISOString().slice(0, 7) + '-01',
                label: monthYear
              };
            }).reverse()
          ]}
          roleFilterValue={statusFilter}
          onRoleFilterChange={(value) => setStatusFilter(value)}
          roleFilterOptions={[
            { value: 'all', label: 'All Status' },
            { value: 'present', label: 'Present' },
            { value: 'half-day', label: 'Half Day' },
            { value: 'absent', label: 'Absent' },
            { value: 'leave', label: 'Leave' }
          ]}
          hasActiveFilters={!!dateFilter || statusFilter !== 'all'}
          onClearFilters={() => {
            setDateFilter('');
            setStatusFilter('all');
          }}
          />
            );
          })()}

        <div className="">

          {/* Attendance Records Table */}
          {combinedRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found for this month.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.isLeave && record.isMultiDay && record.startDate && record.endDate ? (
                          <div className="flex flex-col">
                            <span>{formatDateToDayMonYear(record.startDate)}</span>
                            <span className="text-xs text-gray-500">to {formatDateToDayMonYear(record.endDate)}</span>
                          </div>
                        ) : (
                          formatDateToDayMonYear(record.date)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.isLeave ? '--' : record.checkIn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.isLeave ? '--' : record.checkOut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {record.isLeave ? (
                            getLeaveStatusBadge(record)
                          ) : (
                            <span className={getStatusBadge(record.status)}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTotalHoursClass(record.totalHours)}`}>
                        {record.isLeave ? (
                          <span className="text-blue-600 font-medium">
                            {record.isMultiDay && record.totalDays && record.totalDays > 1 
                              ? `${record.totalDays} Day${record.totalDays > 1 ? 's' : ''} Leave`
                              : 'Leave Day'
                            }
                          </span>
                        ) : (
                          <span>{formatDurationHours(record.totalHours, { showSecondsUnderOneHour: true })}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
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