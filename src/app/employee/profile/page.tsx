'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMapPin, FiBriefcase, FiShield, FiEdit, FiArrowRight, FiBook } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { formatDateToDayMonYear, formatDateToDayMonYearWithTime } from '@/utils/documentUtils';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { getAdminNameById, getEmployeeNameById, getEmployeeSelf,getEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { FaRupeeSign, FaSyncAlt } from "react-icons/fa";
import { Employee } from '@/types';



export default function EmployeeProfilePage() {
  const { currentUserData, currentEmployee, logout } = useAuth();
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [createdByName, setCreatedByName] = useState<string>('-');
  const [updatedByName, setUpdatedByName] = useState<string>('-');
  const [employmentData, setEmploymentData] = useState<any>(null);

  // Redirect if not authenticated or not an employee
  useEffect(() => {
    if (!currentUserData || currentUserData.userType !== 'employee') {
      router.push('/login');
    }
  }, [currentUserData, router]);

  // Fetch full employee data including all fields
  useEffect(() => {
    const fetchFullEmployeeData = async () => {
      if (currentUserData && currentEmployee) {
        try {
          // Fetch full employee data including education, identification documents, etc.
          const fullData = await getEmployeeSelf(currentUserData.id);
          setEmployeeData(fullData);
        } catch (error) {
          console.error('Error fetching employee data:', error);
          // Fallback to currentEmployee if fetch fails
          setEmployeeData(currentEmployee);
        }
      }
    };

    fetchFullEmployeeData();
  }, [currentUserData, currentEmployee]);

  
  useEffect(() => {
  const fetchData = async () => {
    if (!currentUserData?.id) return;

    try {
      const [employee, employment] = await Promise.all([
        getEmployeeSelf(currentUserData.id),
        getEmployeeSelfEmployment(currentUserData.id)
      ]);

      setEmployeeData(employee);
      setEmploymentData(employment);

    } catch (err) {
      console.error(err);
    }
  };

  fetchData();
}, [currentUserData?.id]);
console.log('Employee Data:', employmentData);
console.log(employmentData?.[0]?.bankName);


  // Fetch created by and updated by names
  useEffect(() => {
    const fetchAuditNames = async () => {
      const employee = employeeData || currentEmployee;
      if (!employee) return;

      try {
        // Fetch created by name
        if (employee.createdBy) {
          const name = await getAdminNameById(employee.createdBy);
          setCreatedByName(name);
        } else {
          setCreatedByName('-');
        }

        // Fetch updated by name (could be admin or employee)
        if (employee.updatedBy) {
          // Check if it's the same employee (self-update)
          if (employee.updatedBy === employee.id) {
            const name = await getEmployeeNameById(employee.updatedBy);
            setUpdatedByName(name);
          } else {
            // Try admin first, then employee
            const adminName = await getAdminNameById(employee.updatedBy);
            if (adminName !== 'Unknown Admin') {
              setUpdatedByName(adminName);
            } else {
              const empName = await getEmployeeNameById(employee.updatedBy);
              setUpdatedByName(empName);
            }
          }
        } else {
          setUpdatedByName('-');
        }
      } catch (error) {
        console.error('Error fetching audit names:', error);
      }
    };

    fetchAuditNames();
  }, [employeeData, currentEmployee]);





  // Show loading if no user data
  if (!currentUserData || !currentEmployee) {
    return (
      <EmployeeLayout>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  // Use employeeData if available, otherwise fall back to currentEmployee
  const displayEmployee = employeeData || currentEmployee;
  const displayEmployment = employmentData;
  

  const getUserStatus = () => {
    return displayEmployee?.status === 'active' ? 'Active' : 'Inactive';
  };

  const isUserActive = () => {
    return displayEmployee?.status === 'active';
  };

  const formatDate = (date: any): string => {
    if (!date) return '-';

    try {
      if (date.toDate) {
        return formatDateToDayMonYearWithTime(date.toDate());
      } else if (typeof date === 'string') {
        return formatDateToDayMonYearWithTime(new Date(date));
      } else {
        return formatDateToDayMonYearWithTime(date);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const getUserCreatedAt = () => {
    return formatDate(displayEmployee?.createdAt);
  };

  const getUserUpdatedAt = () => {
    return formatDate(displayEmployee?.updatedAt);
  };

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'My Profile', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="My Profile"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => { }}
          searchPlaceholder=""
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          customReloadButton={
            <button
              type="button"
              onClick={() => router.refresh()}
              className="p-1 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FaSyncAlt size={14} />
            </button>
          }
          actionButtons={[
            {
              label: 'Edit Profile',
              icon: <FiEdit />,
              variant: 'orange' as const,
              href: '/employee/profile/edit'
            },
            {
              label: 'My Salaries',
              icon: <FaRupeeSign />,
              variant: 'purple' as const,
              href: '/employee/my-salary'
            },
            // {
            //   label: 'Change Password',
            //   icon: <FiKey />,
            //   variant: 'secondary' as const,
            //   href: '/employee/profile/password'
            // },
            // {
            //   label: 'Logout',
            //   icon: <FiLogOut />,
            //   variant: 'danger' as const,
            //   onClick: handleLogout,
            //   disabled: isLoggingOut
            // }
          ]}
          backButton={{
            href: '/employee-dashboard',
            label: 'Back'
          }}
        />

        <div className="px-6 pb-2">
          {/* Basic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiUser className="mr-2" /> Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{displayEmployee?.name || '-'}</p>
                <p className="text-sm text-gray-500">Name</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">
                  {(displayEmployee as any)?.dateOfBirth 
                    ? formatDateToDayMonYear((displayEmployee as any).dateOfBirth) 
                    : '-'}
                </p>
                <p className="text-sm text-gray-500">Date Of Birth</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.homeTown || '-'}</p>
                <p className="text-sm text-gray-500">Home Town</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-2" />

          {/* Contact Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{displayEmployee?.phone || '-'}</p>
                <p className="text-sm text-gray-500">Mobile No</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{displayEmployee?.email || '-'}</p>
                <p className="text-sm text-gray-500">Email</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.currentAddress || '-'}</p>
                <p className="text-sm text-gray-500">Current Adress</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.permanentAddress || '-'}</p>
                <p className="text-sm text-gray-500">Permanent Adress</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-2" />

          {/* Identification Documents */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiShield className="mr-2" /> Identification Decument
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.aadharCard || '-'}</p>
                <p className="text-sm text-gray-500">Aadhar Card</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.drivingLicense || '-'}</p>
                <p className="text-sm text-gray-500">Driving License</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">
                  {(displayEmployee as any)?.panCard || (displayEmployee as any)?.panNumber || '-'}
                </p>
                <p className="text-sm text-gray-500">Pan Card</p>
              </div>

              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.voterID || '-'}</p>
                <p className="text-sm text-gray-500">Voter ID</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-2" />

          {/* Educational Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBook className="mr-2" /> Educational Details
            </h2>

            {/* Higher Education */}
            {(displayEmployee as any)?.graduation && (
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Higher Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.degree || '-'}</p>
                    <p className="text-sm text-gray-500">Degree</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.branch || '-'}</p>
                    <p className="text-sm text-gray-500">Branch</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">
                      {(displayEmployee as any)?.graduation?.month || '-'}
                      {(displayEmployee as any)?.graduation?.passingYear ? ` ${(displayEmployee as any).graduation.passingYear}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">Month & Year</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.collegeName || '-'}</p>
                    <p className="text-sm text-gray-500">College Name</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.universityName || '-'}</p>
                    <p className="text-sm text-gray-500">University Name</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.marks || '-'}</p>
                    <p className="text-sm text-gray-500">Marks</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.graduation?.grade || '-'}</p>
                    <p className="text-sm text-gray-500">Grade</p>
                  </div>
                </div>
              </div>
            )}

            {/* 12th Standard or Diploma */}
            {(displayEmployee as any)?.secondaryEducation && Array.isArray((displayEmployee as any).secondaryEducation) && (displayEmployee as any).secondaryEducation.length > 0 && (
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">12th Standard / Diploma</h3>
                {(displayEmployee as any).secondaryEducation.map((entry: any, index: number) => (
                  <div key={entry.id || index} className="mb-4">
                    {entry.type === '12th' && entry.twelthData && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.twelthData.branch || '-'}</p>
                          <p className="text-sm text-gray-500">Branch</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">
                            {entry.twelthData.month || '-'}
                            {entry.twelthData.passingYear ? ` ${entry.twelthData.passingYear}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">Month & Year</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.twelthData.schoolName || '-'}</p>
                          <p className="text-sm text-gray-500">School Name</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.twelthData.board || '-'}</p>
                          <p className="text-sm text-gray-500">Board</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.twelthData.marks || '-'}</p>
                          <p className="text-sm text-gray-500">Marks</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.twelthData.grade || '-'}</p>
                          <p className="text-sm text-gray-500">Grade</p>
                        </div>
                      </div>
                    )}
                    {entry.type === 'diploma' && entry.diplomaData && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.name || '-'}</p>
                          <p className="text-sm text-gray-500">Diploma Name</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.branch || '-'}</p>
                          <p className="text-sm text-gray-500">Branch</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">
                            {entry.diplomaData.month || '-'}
                            {entry.diplomaData.passingYear ? ` ${entry.diplomaData.passingYear}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">Month & Year</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.collegeName || '-'}</p>
                          <p className="text-sm text-gray-500">College Name</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.institute || '-'}</p>
                          <p className="text-sm text-gray-500">Institute</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.marks || '-'}</p>
                          <p className="text-sm text-gray-500">Marks</p>
                        </div>
                        <div className="p-3">
                          <p className="text-lg font-medium text-gray-900">{entry.diplomaData.grade || '-'}</p>
                          <p className="text-sm text-gray-500">Grade</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 10th Standard */}
            {(displayEmployee as any)?.tenthStandard && (
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">10th Standard</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">
                      {(displayEmployee as any)?.tenthStandard?.month || '-'}
                      {(displayEmployee as any)?.tenthStandard?.passingYear ? ` ${(displayEmployee as any).tenthStandard.passingYear}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">Month & Year</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.tenthStandard?.schoolName || '-'}</p>
                    <p className="text-sm text-gray-500">School Name</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.tenthStandard?.board || '-'}</p>
                    <p className="text-sm text-gray-500">Board</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.tenthStandard?.marks || '-'}</p>
                    <p className="text-sm text-gray-500">Marks</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.tenthStandard?.grade || '-'}</p>
                    <p className="text-sm text-gray-500">Grade</p>
                  </div>
                  <div className="p-3">
                    <p className="text-lg font-medium text-gray-900">{(displayEmployee as any)?.tenthStandard?.medium || '-'}</p>
                    <p className="text-sm text-gray-500">Medium</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-2" />

          <div className="mt-6 pt-3 border-t border-gray-200 flex items-center justify-between gap-4">
            <p className="text-sm font-normal text-gray-700">
              Created By {createdByName || 'Admin'} On {getUserCreatedAt()}
            </p>
            <p className="text-sm font-normal text-gray-700 text-right">
              Updated By {updatedByName || 'Unknown'} On {getUserUpdatedAt()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions removed as requested */}


    </EmployeeLayout>
  );
} 