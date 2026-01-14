'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiUser, FiCalendar, FiLogOut, FiFileText, FiLogIn, FiCheck, FiClock } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { getEmployeeSelf } from '@/utils/firebaseUtils';
import { Employee, Employment } from '@/types';
import { useAttendanceMarking } from '@/hooks/useAttendanceMarking';
import { getEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { toTitleCase } from '@/utils/stringUtils';

export default function EmployeeDashboardPage() {
  const { currentEmployee, currentUserData, logout } = useAuth();
  const router = useRouter();
  const [fullEmployeeData, setFullEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [employmentData, setEmploymentData] = useState<Employment[]>([]);
  const [employmentLoading, setEmploymentLoading] = useState(true);

  // Attendance logic hook
  const {
    todayAttendance,
    todayAttendanceLoading,
    employmentId,
    handleCheckIn,
    handleCheckOut,
    calculateTodayHours,
    checkInMutation,
    checkOutMutation
  } = useAttendanceMarking();

  // Get the current/active employment (assuming the first one or the one without endDate)
  const currentEmployment = employmentData.find(emp => !emp.endDate) || employmentData[0];

  useEffect(() => {
    // Check if user is authenticated
    if (!currentUserData) {
      router.push('/login');
      return;
    }

    // If user is admin, redirect to admin dashboard
    if (currentUserData.userType === 'admin') {
      router.push('/dashboard');
      return;
    }

    // If user is not employee, redirect to login
    if (currentUserData.userType !== 'employee') {
      router.push('/login');
      return;
    }

    // Fetch complete employee data and employment info
    const fetchEmployeeData = async () => {
      try {
        if (currentUserData.userType === 'employee') {
          // Fetch employee basic info
          const employeeData = await getEmployeeSelf(currentUserData.id);
          setFullEmployeeData(employeeData);

          // Store full employee data in localStorage for other components to use
          localStorage.setItem('fullEmployeeData', JSON.stringify(employeeData));

          // Fetch employment basic info for the current employee
          setEmploymentLoading(true);
          try {
            const employments = await getEmployeeSelfEmployment(currentUserData.id);
            setEmploymentData(employments);
            console.log('✅ Employment data fetched successfully:', employments.length, 'records');
          } catch (employmentError) {
            console.error('Error fetching employment data:', employmentError);
            toast.error('Failed to load employment information');
          } finally {
            setEmploymentLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        toast.error('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [currentUserData, router]);

  // If not employee, don't render dashboard
  if (!currentUserData || currentUserData.userType !== 'employee') {
    return null;
  }

  const employee = currentEmployee || currentUserData;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout successful');
      router.push('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  // Check if employee has employment
  const hasEmployment = !employmentLoading && employmentData.length > 0;

  const cards = [
    // Only show Attendance card if employee has employment
    ...(hasEmployment ? [{
      title: 'Attendance',
      description: 'View your attendance records',
      icon: <FiCalendar className="w-8 h-8 text-purple-500" />,
      link: '/employee/attendance',
      color: 'bg-purple-50'
    }] : []),
    {
      title: 'Leaves',
      description: 'Manage your leave requests',
      icon: <FiCalendar className="w-8 h-8 text-green-500" />,
      link: '/employee/leaves',
      color: 'bg-green-50'
    },
    {
      title: 'Documents',
      description: 'Access your HR documents',
      icon: <FiFileText className="w-8 h-8 text-orange-500" />,
      link: '/employee/documents',
      color: 'bg-orange-50'
    },
    {
      title: 'My Profile',
      description: 'View and update your personal information',
      icon: <FiUser className="w-8 h-8 text-blue-500" />,
      link: '/employee/profile',
      color: 'bg-blue-50'
    },
  ];

  return (
    <EmployeeLayout showBreadcrumb={false}>
      <Toaster position="top-center" />

      {/* Welcome Banner */}
      {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome, {employee?.name}! 👋</h2>
            <p className="text-blue-100 text-lg">
              You&apos;re successfully logged in to your employee portal.  <br />
              Here you can access your profile, attendance, and leave management.
            </p>
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200`}
            onClick={() => {
              router.push(card.link);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </div>
              <div>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Information</h2>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading employee information...</p>
            </div>
          ) : fullEmployeeData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fullEmployeeData.name && (
                <div>
                  <p className="font-medium text-gray-900">{fullEmployeeData.name}</p>
                  <p className="text-sm text-gray-600">Name</p>
                </div>
              )}

              {fullEmployeeData.email && (
                <div>
                  <p className="font-medium text-gray-900 break-words">{fullEmployeeData.email}</p>
                  <p className="text-sm text-gray-600">Email</p>
                </div>
              )}

              {fullEmployeeData.phone && (
                <div>
                  <p className="font-medium text-gray-900">{fullEmployeeData.phone}</p>
                  <p className="text-sm text-gray-600">Phone</p>
                </div>
              )}

              {fullEmployeeData.currentAddress && (
                <div>
                  <p className="font-medium text-gray-900">{fullEmployeeData.currentAddress}</p>
                  <p className="text-sm text-gray-600">Current Address</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-red-500">Failed to load employee information</p>
            </div>
          )}
        </div>

        {/* Employment Basic Info Card */}
        {!employmentLoading && currentEmployment && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Employment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentEmployment.employmentId && (
                <div>
                  <p className="font-medium text-gray-900">{currentEmployment.employmentId}</p>
                  <p className="text-sm text-gray-600">Employment ID</p>
                </div>
              )}

              {(currentEmployment.jobTitle || currentEmployment.designation) && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.jobTitle || currentEmployment.designation)}</p>
                  <p className="text-sm text-gray-600">Job Title</p>
                </div>
              )}

              {currentEmployment.department && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.department)}</p>
                  <p className="text-sm text-gray-600">Department</p>
                </div>
              )}

              {currentEmployment.joiningDate && (
                <div>
                  <p className="font-medium text-gray-900">{new Date(currentEmployment.joiningDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Joining Date</p>
                </div>
              )}

              {currentEmployment.location && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.location)}</p>
                  <p className="text-sm text-gray-600">Location</p>
                </div>
              )}

              {currentEmployment.reportingManager && currentEmployment.reportingManager.trim() !== '' && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.reportingManager)}</p>
                  <p className="text-sm text-gray-600">Reporting Manager</p>
                </div>
              )}

              {currentEmployment.contractType && currentEmployment.contractType.trim() !== '' && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.contractType)}</p>
                  <p className="text-sm text-gray-600">Contract Type</p>
                </div>
              )}

              {currentEmployment.employmentType && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.employmentType)}</p>
                  <p className="text-sm text-gray-600">Employment Type</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Card */}
        {!employmentLoading && currentEmployment && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Attendance</h2>
            {todayAttendanceLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading attendance...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Display */}
                {todayAttendance && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {todayAttendance.checkInTime && (
                      <div>
                        <p className="font-medium text-gray-900">
                          {todayAttendance.checkInTime}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Check In</p>
                      </div>
                    )}

                    {todayAttendance.checkOutTime && (
                      <div>
                        <p className="font-medium text-gray-900">
                          {todayAttendance.checkOutTime}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Check Out</p>
                      </div>
                    )}

                    {(todayAttendance.checkInTime || todayAttendance.checkOutTime) && (
                      <div>
                        <p className="font-medium text-gray-900">
                          {calculateTodayHours().toFixed(2)} hrs
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                      </div>
                    )}

                    {todayAttendance.status && (
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${todayAttendance.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : todayAttendance.status === 'late'
                            ? 'bg-yellow-100 text-yellow-800'
                            : todayAttendance.status === 'half-day'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {todayAttendance.status.toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!todayAttendance?.isCheckedIn ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={checkInMutation.isPending || !employmentId}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <FiLogIn className="w-5 h-5" />
                      {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
                    </button>
                  ) : (
                    <>
                      <div className="flex-1 px-4 py-3 bg-green-100 text-green-800 rounded-md flex items-center justify-center gap-2 font-medium">
                        <FiCheck className="w-5 h-5" />
                        Checked In
                      </div>
                      {!todayAttendance?.checkOutTime ? (
                        <button
                          onClick={handleCheckOut}
                          disabled={checkOutMutation.isPending}
                          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
                        >
                          <FiLogOut className="w-5 h-5" />
                          {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
                        </button>
                      ) : (
                        <div className="flex-1 px-4 py-3 bg-red-100 text-red-800 rounded-md flex items-center justify-center gap-2 font-medium">
                          <FiCheck className="w-5 h-5" />
                          Checked Out
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Real-time hours indicator */}
                {todayAttendance?.isCheckedIn && !todayAttendance?.checkOutTime && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <FiClock className="w-4 h-4" />
                      <span>Working hours: <span className="font-semibold text-gray-900">{calculateTodayHours().toFixed(2)} hrs</span></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
} 