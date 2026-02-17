'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiUser, FiBriefcase, FiCalendar, FiDollarSign, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Employment, Employee } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployment, useDeleteEmployment } from '@/hooks/useEmployments';
import { useEmployee } from '@/hooks/useEmployees';
import { useSalaries } from '@/hooks/useSalaries';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

export default function EmploymentViewPage({ params }: { params: Promise<{ id: string }> }) {

  const router = useRouter();
  const { id } = use(params);

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

  // Fetch salaries for this employee to check if button should be shown
  const { data: allSalaries = [] } = useSalaries();
  const employeeSalaries = allSalaries.filter(salary => salary.employeeId === employment?.employeeId);
  const hasSalaries = employeeSalaries.length > 0;

  // Calculate real attendance statistics
  const calculateAttendanceStats = () => {
    if (!employment?.attendance || employment.attendance.length === 0) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDayDays: 0,
        attendanceRate: 0,
        totalHours: 0,
        averageHours: 0
      };
    }

    const attendance = employment.attendance;
    const totalDays = attendance.length;
    const presentDays = attendance.filter((record: any) => record.status === 'present').length;
    const absentDays = attendance.filter((record: any) => record.status === 'absent').length;
    const lateDays = attendance.filter((record: any) => record.status === 'late').length;
    const halfDayDays = attendance.filter((record: any) => record.status === 'half-day').length;

    const totalHours = attendance.reduce((sum: number, record: any) => sum + (record.totalHours || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDayDays,
      attendanceRate,
      totalHours,
      averageHours
    };
  };

  const attendanceStats = calculateAttendanceStats();

  // Calculate current month attendance
  const calculateCurrentMonthStats = () => {
    if (!employment?.attendance || employment.attendance.length === 0) {
      return {
        currentMonthDays: 0,
        currentMonthPresent: 0,
        currentMonthRate: 0
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthAttendance = employment.attendance.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const currentMonthDays = currentMonthAttendance.length;
    const currentMonthPresent = currentMonthAttendance.filter((record: any) =>
      record.status === 'present' || record.status === 'late'
    ).length;
    const currentMonthRate = currentMonthDays > 0 ? Math.round((currentMonthPresent / currentMonthDays) * 100) : 0;

    return {
      currentMonthDays,
      currentMonthPresent,
      currentMonthRate
    };
  };

  const currentMonthStats = calculateCurrentMonthStats();

  // Calculate real leave statistics
  const calculateLeaveStats = () => {
    if (!employment?.leaves || employment.leaves.length === 0) {
      return {
        totalLeaves: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0,
        usedLeaves: 0,
        remainingLeaves: employment?.totalLeaves || 0
      };
    }

    const leaves = employment.leaves;
    const totalLeaves = leaves.length;
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'pending').length;
    const approvedLeaves = leaves.filter((leave: any) => leave.status === 'approved').length;
    const rejectedLeaves = leaves.filter((leave: any) => leave.status === 'rejected').length;

    const usedLeaves = leaves
      .filter((leave: any) => leave.status === 'approved')
      .reduce((sum: number, leave: any) => sum + (leave.totalDays || 0), 0);

    const allocatedLeaves = employment?.totalLeaves || 0;
    const remainingLeaves = Math.max(0, allocatedLeaves - usedLeaves);

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      usedLeaves,
      remainingLeaves
    };
  };

  const leaveStats = calculateLeaveStats();

  // Handle error states
  if (isError && error) {
    console.error('Employment data error:', error);
    toast.error('Failed to load employment data');
  }

  if (employeeError) {
    console.error('Employee data error:', employeeError);
    toast.error('Failed to load employee data');
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
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
          { label: employment.jobTitle || 'Employment Details', isCurrent: true }
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
          title="Employment Details"
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
          backButton={{
            href: employment?.employeeId ? `/employees/${employment.employeeId}` : "/employments",
            label: 'Back'
          }}
          actionButtons={[
            ...(hasSalaries ? [{
              label: 'View Salaries',
              icon: <FaRupeeSign />,
              variant: 'orange' as const,
              href: `/salaries?employeeId=${employment?.employeeId}`
            }] : []),
            {
              label: 'Edit',
              icon: <FiEdit />,
              variant: 'orange' as const,
              href: `/employments/${id}/edit`
            }
          ]}
        />

        {employee && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Employee Information Card */}
              <Link
                href={`/employees/${employment.employeeId}`}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer block"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiUser className="mr-2" /> Employee Information
                  </h2>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {employee.imageUrl ? (
                      <img
                        src={employee.imageUrl}
                        alt={employee.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center hidden sm:flex">
                        <span className="text-xl font-medium text-gray-600">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <p className="text-sm text-gray-600">{employee.phone}</p>
                    <p className="text-sm text-gray-600">{employment.jobTitle || employee.position}</p>
                    <p className="text-sm text-gray-600">{employment.department || employee.department}</p>
                  </div>
                </div>
              </Link>

            </div>

           
          </div>
        )}

        <div className="px-6 pb-6">
          {/* Job Details - MOVED TO TOP */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Job Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.jobTitle || '-'}</p>
                <p className="text-sm text-gray-500">Job Title</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.department || '-'}</p>
                <p className="text-sm text-gray-500">Department</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.location || '-'}</p>
                <p className="text-sm text-gray-500">Location</p>
              </div>

              

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {employment.employmentType ? (
                    employment.employmentType.includes('-') ?
                      employment.employmentType.split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') :
                      employment.employmentType.charAt(0).toUpperCase() + employment.employmentType.slice(1)
                  ) : employment.contractType ? (
                    employment.contractType.includes('-') ?
                      employment.contractType.split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') :
                      employment.contractType.charAt(0).toUpperCase() + employment.contractType.slice(1)
                  ) : '-'}
                </p>
                <p className="text-sm text-gray-500">Employment Type</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.workSchedule || '-'}</p>
                <p className="text-sm text-gray-500">Work Mode</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningDate
                    ? formatDateToDayMonYear(employment.joiningDate)
                    : employment.startDate
                      ? formatDateToDayMonYear(employment.startDate)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Start Date</p>
              </div>

              
            </div>

            
          </div>

          {/* Employment Information Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBriefcase className="mr-2" /> Employment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.employmentId || '-'}</p>
                <p className="text-sm text-gray-500">Employment ID</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningDate
                    ? formatDateToDayMonYear(employment.joiningDate)
                    : employment.startDate
                      ? formatDateToDayMonYear(employment.startDate)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Joining Date</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningCtc
                    ? formatCurrency(employment.joiningCtc)
                    : employment.salary
                      ? formatCurrency(employment.salary)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Joining CTC</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.inHandCtc ? formatCurrency(employment.inHandCtc) : '-'}</p>
                <p className="text-sm text-gray-500">In-hand CTC</p>
              </div>

              {/* <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.relievingCtc ? formatCurrency(employment.relievingCtc) : '-'}</p>
                <p className="text-sm text-gray-500">Relieving CTC</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.isResignation ? 'Yes' : 'No'}</p>
                <p className="text-sm text-gray-500">Resignation</p>
              </div> */}

              
            </div>
          </div>

          {/* Career Progression/Increment Details (CTP) */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiTrendingUp className="mr-2" />Increment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.incrementDate ? formatDateToDayMonYear(employment.incrementDate) : '-'}
                </p>
                <p className="text-sm text-gray-500">Increment Date</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.newSalary ? formatCurrency(employment.newSalary) : '-'}
                </p>
                <p className="text-sm text-gray-500">Incremented Salary</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.incrementedCtc ? formatCurrency(employment.incrementedCtc) : '-'}
                </p>
                <p className="text-sm text-gray-500">Incremented CTC</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.incrementedInHandCtc ? formatCurrency(employment.incrementedInHandCtc) : '-'}
                </p>
                <p className="text-sm text-gray-500">Incremented In-hand CTC</p>
              </div>
            </div>
          </div>

         {/* Bank Details Section - SAME STYLE AS OTHER CARDS */}
<div className="mb-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Account Details
            </h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    {/* Bank Name */}
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-lg font-medium text-gray-900">
        {employment.bankName || '-'}
      </p>
      <p className="text-sm text-gray-500">Bank Name</p>
    </div>

    {/* Account Number */}
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-lg font-medium text-gray-900">
        {employment.accountNo || '-'}
      </p>
      <p className="text-sm text-gray-500">Account Number</p>
    </div>

    {/* IFSC */}
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-lg font-medium text-gray-900">
        {employment.ifscCode || '-'}
      </p>
      <p className="text-sm text-gray-500">IFSC Code</p>
    </div>

    {/* PAN */}
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-lg font-medium text-gray-900">
        {employment.panNumber || '-'}
      </p>
      <p className="text-sm text-gray-500">PAN Number</p>
    </div>

  </div>
</div>


          {/* Salary Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.salary ? formatCurrency(employment.salary) : '-'}</p>
                <p className="text-sm text-gray-500">Salary per annum</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">
                  {employment.salaryPerMonth
                    ? formatCurrency(employment.salaryPerMonth)
                    : employment.salary
                      ? formatCurrency(employment.salary / 12)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Salary per month</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.basic ? formatCurrency(employment.basic) : '-'}</p>
                <p className="text-sm text-gray-500">Basic</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.da ? formatCurrency(employment.da) : '-'}</p>
                <p className="text-sm text-gray-500">DA (Dearness Allowance)</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.hra ? formatCurrency(employment.hra) : '-'}</p>
                <p className="text-sm text-gray-500">HRA (House Rent Allowance)</p>
              </div>

              {(employment.pf && employment.pf > 0) && (
                <div className="bg-white rounded-lg shadow p-5">
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(employment.pf)}</p>
                  <p className="text-sm text-gray-500">PF (Provident Fund)</p>
                </div>
              )}

              {/* <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.medicalAllowance ? formatCurrency(employment.medicalAllowance) : '-'}</p>
                <p className="text-sm text-gray-500">Medical Allowance</p>
              </div> */}

              

              

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.totalLeaves || '-'} {employment.totalLeaves ? 'days/year' : ''}</p>
                <p className="text-sm text-gray-500">Total Leaves</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.salaryCreditDate || '-'}</p>
                <p className="text-sm text-gray-500">Salary Credit Date</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.payableDays || '-'}</p>
                <p className="text-sm text-gray-500">Payable Days</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900 capitalize">{employment.paymentMode || '-'}</p>
                <p className="text-sm text-gray-500">Payment Mode</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.additionalAllowance ? formatCurrency(employment.additionalAllowance) : '-'}</p>
                <p className="text-sm text-gray-500">Additional Allowance</p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.specialAllowance ? formatCurrency(employment.specialAllowance) : '-'}</p>
                <p className="text-sm text-gray-500">Special Allowance</p>
              </div>

              {/* <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {employment.paymentFrequency ? (
                    employment.paymentFrequency.includes('-') ?
                      employment.paymentFrequency.split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') :
                      employment.paymentFrequency.charAt(0).toUpperCase() + employment.paymentFrequency.slice(1)
                  ) : '-'}
                </p>
                <p className="text-sm text-gray-500">Payment Frequency</p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 