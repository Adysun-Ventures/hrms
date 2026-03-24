'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FiUser,
  FiCalendar,
  FiLogOut,
  FiFileText,
  FiLogIn,
  FiCheck,
  FiClock,
  FiEye,
  FiEdit2,
  FiBriefcase,
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { getEmployeeSelf } from '@/utils/firebaseUtils';
import { Employee, Employment } from '@/types';
import { useAttendanceMarking } from '@/hooks/useAttendanceMarking';
import { getEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { toTitleCase } from '@/utils/stringUtils';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

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
    {
      title: 'Offer Letter',
      description: 'View your offer letter',
      icon: <FiFileText className="w-8 h-8 text-blue-500" />,
      link: '/employee/documents/offer-letter',
      color: 'bg-blue-50'
    },
    {
      title: 'Joining Letter',
      description: 'View your joining letter',
      icon: <FiFileText className="w-8 h-8 text-green-500" />,
      link: '/employee/documents/joining-letter',
      color: 'bg-green-50'
    },
    {
      title: 'Relieving Letter',
      description: 'View your relieving letter',
      icon: <FiFileText className="w-8 h-8 text-red-500" />,
      link: '/employee/documents/relieving-letter',
      color: 'bg-red-50'
    },
    {
      title: 'Experience Letter',
      description: 'View your experience letter',
      icon: <FiFileText className="w-8 h-8 text-purple-500" />,
      link: '/employee/documents/experience-letter',
      color: 'bg-purple-50'
    },
    {
      title: 'Increment Letter',
      description: 'View your increment letter',
      icon: <FiFileText className="w-8 h-8 text-amber-500" />,
      link: '/employee/documents/increment-letter',
      color: 'bg-amber-50'
    },
    {
      title: 'Salary Slips',
      description: 'View your salary slips',
      icon: <FiFileText className="w-8 h-8 text-teal-500" />,
      link: '/employee/documents/salary-slips',
      color: 'bg-teal-50'
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

      {/* Employee Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="-mx-6 px-6 flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Employee Information</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/employee/profile")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                aria-label="View Profile"
              >
                <FiEye className="w-4 h-4" />
                <span className="hidden sm:inline">View Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/employee/profile/edit");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                aria-label="Edit Profile"
              >
                <FiEdit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading employee information...</p>
            </div>
          ) : fullEmployeeData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {fullEmployeeData.dateOfBirth && (
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateToDayMonYear(fullEmployeeData.dateOfBirth)}
                  </p>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                </div>
              )}

              {(fullEmployeeData as any)?.aadharCard && (
                <div>
                  <p className="font-medium text-gray-900">
                    {(fullEmployeeData as any).aadharCard}
                  </p>
                  <p className="text-sm text-gray-600">Aadhar Card</p>
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
            <div className="-mx-6 px-6 flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Employment Information</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!(currentEmployment as any)?.id}
                  onClick={() => {
                    const employmentId = (currentEmployment as any)?.id;
                    if (!employmentId) return;
                    router.push(`/employments/${employmentId}`);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  aria-label="View Employment"
                >
                  <FiEye className="w-4 h-4" />
                  <span className="hidden sm:inline">View Employment</span>
                </button>
                <button
                  type="button"
                  disabled={!(currentEmployment as any)?.id}
                  onClick={() => {
                    const employmentId = (currentEmployment as any)?.id;
                    if (!employmentId) return;
                    router.push(`/employments/${employmentId}/edit`);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                  aria-label="Edit Employment"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Employment</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* First row (priority) */}
              {(currentEmployment.employmentId || fullEmployeeData?.employeeId) && (
                <div>
                  <p className="font-medium text-gray-900">
                    {String(currentEmployment.employmentId || fullEmployeeData?.employeeId)}
                  </p>
                  <p className="text-sm text-gray-600">Employee ID</p>
                </div>
              )}

              {currentEmployment.joiningDate && (
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateToDayMonYear(currentEmployment.joiningDate)}
                  </p>
                  <p className="text-sm text-gray-600">Joining Date</p>
                </div>
              )}

              {((currentEmployment as any).joiningCtc ??
                (currentEmployment as any).joiningCTC) && (
                <div>
                  <p className="font-medium text-gray-900">
                    ₹
                    {Number(
                      (currentEmployment as any).joiningCtc ??
                        (currentEmployment as any).joiningCTC
                    ).toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-gray-600">Joining CTC</p>
                </div>
              )}

              {currentEmployment.startDate && (
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateToDayMonYear(currentEmployment.startDate)}
                  </p>
                  <p className="text-sm text-gray-600">Start Date</p>
                </div>
              )}

              {currentEmployment.endDate && (
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateToDayMonYear(currentEmployment.endDate)}
                  </p>
                  <p className="text-sm text-gray-600">End Date</p>
                </div>
              )}

              {(currentEmployment.jobTitle || currentEmployment.designation) && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.jobTitle || currentEmployment.designation)}</p>
                  <p className="text-sm text-gray-600">Designation</p>
                </div>
              )}

              {currentEmployment.department && (
                <div>
                  <p className="font-medium text-gray-900">{toTitleCase(currentEmployment.department)}</p>
                  <p className="text-sm text-gray-600">Department</p>
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

        
        
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
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
    </EmployeeLayout>
  );
} 