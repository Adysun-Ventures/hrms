'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiUser, FiBriefcase, FiCalendar, FiDollarSign, FiMapPin, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { Employment, Employee, ProfessionalReference } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployment, useDeleteEmployment } from '@/hooks/useEmployments';
import { useEmployee, useEmployeeSelf } from '@/hooks/useEmployees';
import { useEmployeeSelfSalariesByEmployee, useSalariesByEmployee } from '@/hooks/useSalaries';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { useAuth } from '@/context/AuthContext';
import { downloadElementAsMultiPagePdf } from '@/utils/employmentViewPdfDownload';

function professionalReferenceCell(
  refs: ProfessionalReference[] | undefined,
  index: number,
  field: keyof ProfessionalReference
): string {
  const raw = refs?.[index]?.[field];
  if (raw === undefined || raw === null) return '\u00a0';
  const s = String(raw).trim();
  return s || '\u00a0';
}

export default function EmploymentViewPage({ params }: { params: Promise<{ id: string }> }) {

  const router = useRouter();
  const { currentUserData } = useAuth();
  const { id } = use(params);
  const [employmentFullPagePdfLoading, setEmploymentFullPagePdfLoading] = useState(false);
  const employmentFullPagePdfRef = useRef<HTMLDivElement | null>(null);

  const isEmployeeUser = currentUserData?.userType === 'employee';
  const Layout: any = isEmployeeUser ? EmployeeLayout : DashboardLayout;

  // Use Tanstack Query for employment data
  const {
    data: employment,
    isLoading,
    isError,
    error
  } = useEmployment(id);

  // Employee data (admin vs employee-safe)
  const {
    data: adminEmployee,
    isLoading: adminEmployeeLoading,
    isError: adminEmployeeIsError,
    error: adminEmployeeError,
  } = useEmployee(currentUserData?.userType === 'admin' ? (employment?.employeeId || '') : '');
  const {
    data: selfEmployee,
    isLoading: selfEmployeeLoading,
    isError: selfEmployeeIsError,
    error: selfEmployeeError,
  } = useEmployeeSelf(currentUserData?.userType === 'employee' ? (employment?.employeeId || '') : '');

  const employee = currentUserData?.userType === 'admin' ? adminEmployee : selfEmployee;
  const employeeLoading =
    currentUserData?.userType === 'admin' ? adminEmployeeLoading : selfEmployeeLoading;
  const employeeIsError =
    currentUserData?.userType === 'admin' ? adminEmployeeIsError : selfEmployeeIsError;
  const employeeError =
    currentUserData?.userType === 'admin' ? adminEmployeeError : selfEmployeeError;

  // If an employee tries to open someone else's employment, block it
  useEffect(() => {
    if (
      currentUserData?.userType === 'employee' &&
      employment &&
      employment.employeeId !== currentUserData.id
    ) {
      toast.error('You can only view your own employment.');
      router.push('/employee-dashboard');
    }
  }, [currentUserData, employment, router]);

  // Fetch salaries for this employee (admin vs employee-safe)
  const { data: adminEmployeeSalaries = [] } = useSalariesByEmployee(
    currentUserData?.userType === 'admin' ? (employment?.employeeId || '') : ''
  );
  const { data: selfEmployeeSalaries = [] } = useEmployeeSelfSalariesByEmployee(
    currentUserData?.userType === 'employee' ? (employment?.employeeId || '') : ''
  );
  const employeeSalaries =
    currentUserData?.userType === 'admin' ? adminEmployeeSalaries : selfEmployeeSalaries;
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

    console.log(employment)

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

  // Handle error toasts (must not run during render)
  useEffect(() => {
    if (isError && error) {
      console.error('Employment data error:', error);
      toast.error('Failed to load employment data');
    }
  }, [isError, error]);

  useEffect(() => {
    if (employeeIsError) {
      console.error('Employee data error:', employeeError);
      toast.error('Failed to load employee data');
    }
  }, [employeeIsError, employeeError]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout
        breadcrumbItems={
          isEmployeeUser
            ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
            : [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employments', href: '/employments' }, { label: 'Loading...', isCurrent: true }]
        }
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
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout
        breadcrumbItems={
          isEmployeeUser
            ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
            : [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employments', href: '/employments' }, { label: 'Error', isCurrent: true }]
        }
      >
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load employment data. Please try refreshing the page.</p>
        </div>
        <div className="mt-4">
          <Link
            href={isEmployeeUser ? '/employee-dashboard' : '/employments'}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back
          </Link>
        </div>
      </Layout>
    );
  }

  if (!employment) {
    return (
      <Layout
        breadcrumbItems={
          isEmployeeUser
            ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
            : [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employments', href: '/employments' }, { label: 'Not Found', isCurrent: true }]
        }
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Employment not found</p>
        </div>
        <div className="mt-4">
          <Link
            href={isEmployeeUser ? '/employee-dashboard' : '/employments'}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumbItems={
        isEmployeeUser
          ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
          : employee && employment
            ? [
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Employees', href: '/employees' },
              { label: employee.name, href: `/employees/${employment.employeeId}` },
              { label: 'Employment', isCurrent: true }
            ]
            : [
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
            href: isEmployeeUser
              ? "/employee-dashboard"
              : (employment?.employeeId ? `/employees/${employment.employeeId}` : "/employments"),
            label: 'Back'
          }}
          actionButtons={[
            {
              label: 'Edit Employment',
              icon: <FiEdit />,
              variant: 'orange' as const,
              href: `/employments/${id}/edit`
            },
            {
              label: 'Download PDF',
              icon: <FiDownload />,
              variant: 'info' as const,
              disabled: employmentFullPagePdfLoading,
              onClick: () => {
                void (async () => {
                  const el = employmentFullPagePdfRef.current;
                  if (!el || !employment) return;
                  setEmploymentFullPagePdfLoading(true);
                  try {
                    const safe = (employee?.name || 'employment').replace(/\s+/g, '_');
                    await downloadElementAsMultiPagePdf(el, `Employment_Details_${safe}.pdf`);
                    toast.success('PDF downloaded');
                  } catch (e) {
                    console.error(e);
                    const msg = e instanceof Error ? e.message : 'Failed to download PDF';
                    toast.error(msg);
                  } finally {
                    setEmploymentFullPagePdfLoading(false);
                  }
                })();
              }
            },
            ...(!isEmployeeUser && hasSalaries ? [{
              label: 'View Salaries',
              icon: <FaRupeeSign />,
              variant: 'purple' as const,
              href: `/salaries?employeeId=${employment?.employeeId}&from=employment`
            }
            ] : []),
          ]}
        />

        <div className="px-6 pb-6">
          <div ref={employmentFullPagePdfRef} className="employment-view-pdf-capture space-y-0">
          <div className="mb-8 -mt-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Professional Reference</h2>
            </div>
            <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[26%]"
                    >
                      &nbsp;
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-center font-semibold align-middle"
                    >
                      Reference No 1
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-center font-semibold align-middle"
                    >
                      Reference No 2
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-center font-semibold align-middle"
                    >
                      Reference No 3
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th
                      scope="row"
                      className="border border-gray-800 px-3 py-3 text-left font-medium align-top bg-gray-50/80 whitespace-nowrap"
                    >
                      Name / Designation
                    </th>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 0, 'nameDesignation')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 1, 'nameDesignation')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 2, 'nameDesignation')}
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="border border-gray-800 px-3 py-3 text-left font-medium align-top bg-gray-50/80"
                    >
                      Email id and Mob. No.
                    </th>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 0, 'emailAndMobile')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 1, 'emailAndMobile')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 2, 'emailAndMobile')}
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="border border-gray-800 px-3 py-3 text-left font-medium align-top bg-gray-50/80"
                    >
                      Nature of Association
                    </th>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 0, 'natureOfAssociation')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 1, 'natureOfAssociation')}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {professionalReferenceCell(employment.professionalReferences, 2, 'natureOfAssociation')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 mb-6" />

          {/* Employment Information Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiBriefcase className="mr-2" /> Employment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-lg font-medium text-gray-900">{employment.employmentId || '-'}</p>
                <p className="text-sm text-gray-500">Employment ID</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningDate
                    ? formatDateToDayMonYear(employment.joiningDate)
                    : employment.startDate
                      ? formatDateToDayMonYear(employment.startDate)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Joining Date</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningCtc
                    ? formatCurrency(employment.joiningCtc)
                    : employment.salary
                      ? formatCurrency(employment.salary)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Joining CTC</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {employment.inHandCtc ? formatCurrency(employment.inHandCtc) : '-'}
                </p>
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
          <div className="border-t border-gray-200 my-2" />

          {/* Job Details - MOVED TO TOP */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Job Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-lg font-medium text-gray-900">{employment.jobTitle || '-'}</p>
                <p className="text-sm text-gray-500">Designation</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{employment.department || '-'}</p>
                <p className="text-sm text-gray-500">Department</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{employment.location || '-'}</p>
                <p className="text-sm text-gray-500">Location</p>
              </div>

              

              <div>
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

              <div>
                <p className="text-lg font-medium text-gray-900">{employment.workSchedule || '-'}</p>
                <p className="text-sm text-gray-500">Work Mode</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {(employment as any).whereWereYouEmploid ||
                    (employment as any).whereWereYouEmployed ||
                    (employment as any).whereWereYouEmployd ||
                    '-'}
                </p>
                <p className="text-sm text-gray-500">Where Were You Employed?</p>
              </div>

              <div>
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
          <div className="border-t border-gray-200 my-2" />

          {employment.isResignation && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FiBriefcase className="mr-2" /> Resignation Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {employment.resignationDate
                        ? formatDateToDayMonYear(employment.resignationDate)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Resignation Date</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {employment.lastSalaryDate
                        ? formatDateToDayMonYear(employment.lastSalaryDate)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Last Salary Date</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {employment.lastDrawnSalary
                        ? formatCurrency(employment.lastDrawnSalary)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Last Drawn Salary</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {employment.lastWorkingDate
                        ? formatDateToDayMonYear(employment.lastWorkingDate)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Last Working Date</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 my-2" />
            </>
          )}



          {/* Career Progression/Increment Details (CTP) */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiTrendingUp className="mr-2" />Increment Details
            </h2>

            {(() => {
              const increments =
                employment.increments && employment.increments.length > 0
                  ? employment.increments
                  : (employment.incrementDate ||
                     employment.newSalary ||
                     employment.incrementedCtc ||
                     employment.incrementedInHandCtc)
                  ? [
                      {
                        incrementDate: employment.incrementDate,
                        newSalary: employment.newSalary,
                        incrementedCtc: employment.incrementedCtc,
                        incrementedInHandCtc: employment.incrementedInHandCtc,
                      },
                    ]
                  : [];

              if (increments.length === 0) {
                return (
                  <div>
                    <p className="text-sm text-gray-500">No increment records available.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {increments.map((inc, index) => (
                    <div key={inc.id || index}>
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        Increment {index + 1}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Increment Date</p>
                          <p className="text-base font-medium text-gray-900">
                            {inc.incrementDate ? formatDateToDayMonYear(inc.incrementDate) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Incremented Salary</p>
                          <p className="text-base font-medium text-gray-900">
                            {inc.newSalary ? formatCurrency(inc.newSalary) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Incremented CTC</p>
                          <p className="text-base font-medium text-gray-900">
                            {inc.incrementedCtc ? formatCurrency(inc.incrementedCtc) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Incremented In-hand CTC</p>
                          <p className="text-base font-medium text-gray-900">
                            {inc.incrementedInHandCtc ? formatCurrency(inc.incrementedInHandCtc) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="border-t border-gray-200 my-2" />
         {/* Bank Details Section - SAME STYLE AS OTHER CARDS */}
<div className="mb-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Account Details
            </h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    {/* Bank Name */}
    <div>
      <p className="text-lg font-medium text-gray-900">
        {employment.bankName || '-'}
      </p>
      <p className="text-sm text-gray-500">Bank Name</p>
    </div>

    {/* Account Number */}
    <div>
      <p className="text-lg font-medium text-gray-900">
        {employment.accountNo || '-'}
      </p>
      <p className="text-sm text-gray-500">Account Number</p>
    </div>

    {/* IFSC */}
    <div>
      <p className="text-lg font-medium text-gray-900">
        {employment.ifscCode || '-'}
      </p>
      <p className="text-sm text-gray-500">IFSC Code</p>
    </div>

    {/* PAN */}
    <div>
      <p className="text-lg font-medium text-gray-900">
        {employment.panNumber || '-'}
      </p>
      <p className="text-sm text-gray-500">PAN Number</p>
    </div>

  </div>
</div>
<div className="border-t border-gray-200 my-2" />

          {/* Joining Salary Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Joining Salary Information
            </h2>

            {(() => {
              const joiningAnnual = Number(employment.joiningCtc || 0);
              const joiningMonthly = joiningAnnual > 0 ? Math.round(joiningAnnual / 12) : 0;
              const joiningBasic = joiningMonthly > 0 ? Math.round(joiningMonthly * 0.4) : 0;
              const joiningDA = joiningBasic > 0 ? Math.round(joiningBasic * 0.1) : 0;
              const joiningHRA = joiningBasic > 0 ? Math.round(joiningBasic * 0.5) : 0;
              const joiningPF = joiningBasic > 0 ? Math.round(joiningBasic * 0.12) : 0;
              const joiningMedicalAllowance = joiningMonthly > 0 ? 1250 : 0;
              const joiningTransportAllowance = joiningMonthly > 0 ? 1600 : 0;
              const joiningCalculated =
                joiningBasic + joiningHRA + joiningDA + joiningMedicalAllowance + joiningTransportAllowance;
              const joiningSpecial = joiningMonthly > 0 ? Math.max(0, joiningMonthly - joiningCalculated) : 0;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningAnnual > 0 ? formatCurrency(joiningAnnual) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining Salary per annum</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningMonthly > 0 ? formatCurrency(joiningMonthly) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining Salary per month</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningBasic > 0 ? formatCurrency(joiningBasic) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining Basic</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningDA > 0 ? formatCurrency(joiningDA) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining DA (Dearness Allowance)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningHRA > 0 ? formatCurrency(joiningHRA) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining HRA (House Rent Allowance)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningPF > 0 ? formatCurrency(joiningPF) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining PF (Provident Fund)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{joiningSpecial > 0 ? formatCurrency(joiningSpecial) : '-'}</p>
                    <p className="text-sm text-gray-500">Joining Special Allowance</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="border-t border-gray-200 my-2" />

          {/* Current Salary Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Current Salary Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(() => {
                const annualSalary = Number(employment.salary || 0);
                const monthlySalary = Number(employment.salaryPerMonth || 0);
                const basic = Number(employment.basic || 0);
                const da = Number(employment.da || 0);
                const hra = Number(employment.hra || 0);
                const pf = Number(employment.pf || 0);
                const additionalAllowance = Number(employment.additionalAllowance || 0);
                const specialAllowance = Number(employment.specialAllowance || 0);
                return (
                  <>

              <div>
                <p className="text-lg font-medium text-gray-900">{annualSalary > 0 ? formatCurrency(annualSalary) : '-'}</p>
                <p className="text-sm text-gray-500">Current Salary per annum</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {monthlySalary > 0
                    ? formatCurrency(monthlySalary)
                    : annualSalary > 0
                      ? formatCurrency(annualSalary / 12)
                      : '-'}
                </p>
                <p className="text-sm text-gray-500">Current Salary per month</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{basic > 0 ? formatCurrency(basic) : '-'}</p>
                <p className="text-sm text-gray-500">Current Basic</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{da > 0 ? formatCurrency(da) : '-'}</p>
                <p className="text-sm text-gray-500">Current DA (Dearness Allowance)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{hra > 0 ? formatCurrency(hra) : '-'}</p>
                <p className="text-sm text-gray-500">Current HRA (House Rent Allowance)</p>
              </div>

              {pf > 0 && (
                <div>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(pf)}</p>
                  <p className="text-sm text-gray-500">PF (Provident Fund)</p>
                </div>
              )}

              {/* <div className="bg-white rounded-lg shadow p-5">
                <p className="text-lg font-medium text-gray-900">{employment.medicalAllowance ? formatCurrency(employment.medicalAllowance) : '-'}</p>
                <p className="text-sm text-gray-500">Medical Allowance</p>
              </div> */}

              

              

              {additionalAllowance > 0 && (
                <div>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(additionalAllowance)}</p>
                  <p className="text-sm text-gray-500">Additional Allowance</p>
                </div>
              )}

              {specialAllowance > 0 && (
                <div>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(specialAllowance)}</p>
                  <p className="text-sm text-gray-500">Current Special Allowance</p>
                </div>
              )}
                  </>
                );
              })()}

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
      </div>
    </Layout>
  );
} 