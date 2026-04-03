'use client';

import { useEffect, useState, use } from 'react';
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
import EmploymentDetailsPDF from '@/components/pdf/EmploymentDetailsPDF';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

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

function parseNameAndDesignation(raw?: string): { name: string; designation: string } {
  const s = (raw ?? '').toString().trim();
  if (!s) return { name: '\u00a0', designation: '\u00a0' };

  // Prefer newline-separated values: "Name\nDesignation"
  const lines = s.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const nameLine = lines.find((l) => /\bName\b\s*[-:|]/i.test(l));
    const designationLine = lines.find((l) => /\bDesignation\b\s*[-:|]/i.test(l));

    // If labels exist (saved from Edit Employment), extract only those lines.
    if (nameLine || designationLine) {
      const extractedName = (nameLine || lines[0] || '').replace(/\bName\b\s*[-:|]\s*/i, '').trim();
      const extractedDesignation = (designationLine || lines[1] || '')
        .replace(/\bDesignation\b\s*[-:|]\s*/i, '')
        .trim();

      return {
        name: extractedName || '\u00a0',
        designation: extractedDesignation || '\u00a0',
      };
    }

    // Fallback for unlabeled newline format: "Name\nDesignation"
    return {
      name: lines[0] || '\u00a0',
      designation: lines.slice(1).join(' ') || '\u00a0',
    };
  }

  const normalized = s.replace(/\u2013|\u2014/g, '-');

  // If the string contains explicit labels, extract them.
  // Examples:
  // "Name - viraj kadam\nDesignation - Project Manager"
  // "Name - viraj kadam, Designation-Project Manager"
  const nameLabeled =
    normalized.match(/\\bName\\b\\s*[-:|]\\s*(.+)/i)?.[1]?.trim() || '';
  const designationLabeled =
    normalized.match(/\\bDesignation\\b\\s*[-:|]\\s*(.+)/i)?.[1]?.trim() || '';
  if (nameLabeled || designationLabeled) {
    return {
      name: nameLabeled || '\u00a0',
      designation: designationLabeled || '\u00a0',
    };
  }

  // Try common separators in a single-line format:
  // "Name - Designation", "Name | Designation", "Name / Designation"
  // Use ASCII-only separators and allow optional spaces around them.
  const dashMatch = normalized.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return { name: dashMatch[1].trim(), designation: dashMatch[2].trim() || '\u00a0' };
  }

  const pipeMatch = normalized.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) {
    return { name: pipeMatch[1].trim(), designation: pipeMatch[2].trim() || '\u00a0' };
  }

  const slashMatch = normalized.match(/^(.+?)\s*\/\s*(.+)$/);
  if (slashMatch) {
    return { name: slashMatch[1].trim(), designation: slashMatch[2].trim() || '\u00a0' };
  }

  return { name: s || '\u00a0', designation: '\u00a0' };
}

function parseEmailAndMobile(raw?: string): { email: string; mobile: string } {
  const s = (raw ?? '').toString().trim();
  if (!s) return { email: '\u00a0', mobile: '\u00a0' };

  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailLine = lines.find((l) => /^Email\b/i.test(l)) || '';
  const mobileLine = lines.find((l) => /^Mobile\b/i.test(l)) || '';

  const emailExtracted = emailLine
    ? emailLine.replace(/^Email\b\s*[-:|]\s*/i, '').trim()
    : '';

  const mobileExtracted = mobileLine
    ? mobileLine.replace(/^Mobile\b\s*(?:no\s*)?[-:|]\s*/i, '').trim()
    : '';

  const emailFallbackAnywhere =
    s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i)?.[0] || '';

  const email = (emailExtracted || emailFallbackAnywhere).trim();

  // Normalize mobile to digits-only and take last 10 digits
  const mobileDigits = mobileExtracted.replace(/\\D/g, '');
  const mobile = mobileDigits
    ? mobileDigits.length >= 10
      ? mobileDigits.slice(-10)
      : mobileDigits
    : '';

  return { email: email || '\u00a0', mobile: mobile || '\u00a0' };
}

/** From `nameDesignation` block, e.g. line "Employee Id - ADV09". */
function parseProfessionalReferenceEmployeeId(raw?: string): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '\u00a0';
  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = line.match(/\bEmployee\s*Id\b\s*[-:|]\s*(.+)$/i);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v) return v;
    }
  }
  const anyAdv = s.match(/\b(ADV\d+)\b/i);
  return anyAdv?.[1] ?? '\u00a0';
}

/** From `emailAndMobile` block, e.g. line "Place - Pune". */
function parseProfessionalReferencePlace(raw?: string): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '\u00a0';
  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^Place\b\s*[-:|]\s*(.+)$/i);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v) return v;
    }
  }
  return '\u00a0';
}

function whereEmployedRaw(employment: any): string {
  const raw =
    employment?.whereWereYouEmploid ||
    employment?.whereWereYouEmployed ||
    employment?.whereWereYouEmployd ||
    '';
  const s = String(raw).trim();
  if (!s) return '-';

  // Persisted values are sometimes stored without the "(Pune)/(Mumbai)" part because
  // the Edit dropdown uses a shorter value and a longer label. Make display match label.
  const key = s.toLowerCase();
  if (key === 'registred corporate office' || key === 'registered corporate office') {
    return 'Registred Corporate Office(Pune)';
  }
  if (key === 'branch office') {
    return 'Branch Office(Mumbai)';
  }

  return s;
}

export default function EmploymentViewPage({ params }: { params: Promise<{ id: string }> }) {

  const router = useRouter();
  const { currentUserData } = useAuth();
  const { id } = use(params);
  const [employmentFullPagePdfLoading, setEmploymentFullPagePdfLoading] = useState(false);

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

  const hasIncrementDetails = (() => {
    const arr = employment?.increments;
    if (Array.isArray(arr) && arr.length > 0) return true;

    const incrementDate = String(employment?.incrementDate ?? '').trim();
    const newSalary = employment?.newSalary != null ? Number(employment.newSalary) : 0;
    const incrementedCtc =
      employment?.incrementedCtc != null ? Number(employment.incrementedCtc) : 0;
    const incrementedInHandCtc =
      employment?.incrementedInHandCtc != null ? Number(employment.incrementedInHandCtc) : 0;

    return (
      Boolean(incrementDate) ||
      newSalary > 0 ||
      incrementedCtc > 0 ||
      incrementedInHandCtc > 0
    );
  })();

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
                  if (!employment) return;
                  setEmploymentFullPagePdfLoading(true);
                  try {
                    const safe = (employee?.name || 'employment').replace(/\s+/g, '_');
                    const blob = await pdf(
                      <EmploymentDetailsPDF employment={employment} employee={employee} />
                    ).toBlob();
                    saveAs(blob, `Employment_Details_${safe}.pdf`);
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
            ...(!isEmployeeUser && hasSalaries
              ? [
                  {
                    label: 'View Salaries',
                    icon: <FaRupeeSign />,
                    variant: 'purple' as const,
                    href: `/salaries?employeeId=${employment?.employeeId}&from=employment`,
                  },
                ]
              : []),
            ...(isEmployeeUser
              ? [
                  {
                    label: 'My Salaries',
                    icon: <FaRupeeSign />,
                    variant: 'purple' as const,
                    href: '/employee/my-salary',
                  },
                ]
              : []),
          ]}
        />

        <div className="px-6 pb-6">
          <div className="employment-view-pdf-capture space-y-0">
          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Where Were You Employed & Address
              </h2>
            </div>

            <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
              <table className="w-full min-w-[360px] border-collapse text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[40%]"
                    >
                      Where Were You Employed
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {whereEmployedRaw(employment as any) || '\u00a0'}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {(() => {
                        const raw =
                          (employment as any).whereWereYouEmploid ||
                          (employment as any).whereWereYouEmployed ||
                          (employment as any).whereWereYouEmployd ||
                          '';
                        const key = String(raw).toLowerCase();

                        const isPune =
                          key.includes('pune') ||
                          key.includes('registred corporate office') ||
                          key.includes('registered corporate office') ||
                          key.includes('head office');
                        const isMumbai =
                          key.includes('mumbai') ||
                          key.includes('branch office') ||
                          key.includes('thane');

                        if (isPune) {
                          return (
                            <>
                              Adysun Ventures Pvt. Ltd.
                              Workplex, S no 47, Near Bhapkar Petrol Pump, Pune, Maharashtra - 411009
                              Pune Office (Head Office)
                            </>
                          );
                        }

                        if (isMumbai) {
                          return (
                            <>
                              Adysun Ventures Pvt. Ltd.
                              A2, 704, Kanchanpushp Society Kavesar, Thane West, Thane, Maharashtra - 400607
                              Mumbai Office
                            </>
                          );
                        }

                        return '\u00a0';
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Employment Period / Department / Employee Id / Designation */}
          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Employment Details
              </h2>
            </div>

            <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[25%]"
                    >
                      Period Of Employment
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[25%]"
                    >
                      Employee Id
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[30%]"
                    >
                      Designation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {(() => {
                        const joiningText = employment.joiningDate
                          ? formatDateToDayMonYear(employment.joiningDate)
                          : employment.startDate
                            ? formatDateToDayMonYear(employment.startDate)
                            : '-';

                        const isResigned = Boolean(employment.isResignation) || (employment as any).employmentStatus === 'resigned';

                        const resignText = isResigned
                          ? (employment.resignationDate
                              ? formatDateToDayMonYear(employment.resignationDate)
                              : employment.lastWorkingDate
                                ? formatDateToDayMonYear(employment.lastWorkingDate)
                                : '-')
                          : 'Present';

                        return `${joiningText} to ${resignText}`;
                      })()}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {employment.department || '\u00a0'}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {employment.employmentId || '\u00a0'}
                    </td>
                    <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                      {employment.jobTitle ||
                        employment.designation ||
                        '\u00a0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Joining / Current Salary Summary */}
          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Salary Summary
              </h2>
            </div>

            {(() => {
              // PF is stored independently for Joining vs Current salary:
              // - `employerPF` => Joining PF
              // - `pf` => Current PF
              // Backward compatible fallback: if `employerPF` is missing, reuse `pf`.
              const joiningPfAmount = Number((employment as any).employerPF ?? employment.pf ?? 0);
              const currentPfAmount = Number(employment.pf ?? 0);

              const joiningIsPf = joiningPfAmount > 0 ? 'Yes' : 'No';
              const currentIsPf = currentPfAmount > 0 ? 'Yes' : 'No';

              const joiningCtc = Number(employment.joiningCtc ?? 0) || 0;
              const joiningVariablePay = Number(employment.joiningVariablePay ?? 0) || 0;
              const joiningFixedPay = Number(employment.joiningFixedPay ?? 0) || 0;
              const joiningMonthlyFixed = joiningFixedPay / 12;
              const joiningBasic = joiningMonthlyFixed * 0.5;
              const joiningHra = joiningBasic * 0.4;
              const joiningConveyance = 2000;
              const joiningOtherAllowance = Number((employment as any).joiningOtherAllowance ?? 0) || 0;
              const joiningGrossSalary =
                joiningBasic + joiningHra + joiningConveyance + joiningOtherAllowance;

              const currentCtc = Number(employment.salary ?? 0) || 0;
              const currentVariablePay = Number(employment.currentVariablePay ?? 0) || 0;
              const currentFixedPay = Number(employment.currentFixedPay ?? 0) || 0;
              const currentMonthlyFixed = currentFixedPay / 12;
              const currentBasic = currentMonthlyFixed * 0.5;
              const currentHra = currentBasic * 0.4;
              const currentConveyance = 2000;
              const currentOtherAllowance = Number((employment as any).currentOtherAllowance ?? 0) || 0;
              const currentGrossSalary =
                currentBasic + currentHra + currentConveyance + currentOtherAllowance;

              const currencyOrDash = (v: number) => (v > 0 ? formatCurrency(v) : '-');

              return (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
                    <table className="w-full min-w-[720px] border-collapse text-sm text-gray-900">
                      <thead>
                        <tr className="bg-gray-100">
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Joining CTC
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Joining Variable
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Fixed
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Gross Salary
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Is PF
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(joiningCtc)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(joiningVariablePay)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(joiningFixedPay)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(joiningGrossSalary)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {joiningIsPf}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
                    <table className="w-full min-w-[720px] border-collapse text-sm text-gray-900">
                      <thead>
                        <tr className="bg-gray-100">
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Current CTC
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Variable
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Fixed
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Gross Salary
                          </th>
                          <th scope="col" className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[20%]">
                            Is PF
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(currentCtc)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(currentVariablePay)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(currentFixedPay)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currencyOrDash(currentGrossSalary)}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {currentIsPf}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Professional Reference</h2>
            </div>
            <div className="overflow-x-auto rounded-sm border border-gray-800 bg-white">
              <table className="w-full min-w-[1040px] border-collapse text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle w-[18%]"
                    >
                      &nbsp;
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle whitespace-nowrap"
                    >
                      Employee ID
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Mobile no
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Designation
                    </th>
                    <th
                      scope="col"
                      className="border border-gray-800 px-3 py-2.5 text-left font-semibold align-middle"
                    >
                      Place
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const proRefs = employment.professionalReferences || [];
                    // Backward compatible:
                    // - Older records: [teamLead, colleague1, colleague2(colleague3), colleague3(colleague4), reportingManager]
                    // - Newer records: [teamLead, colleague1, colleague2(colleague3), reportingManager]
                    const reportingManagerIndex = proRefs.length >= 5 ? 4 : 3;
                    const rows = [
                      { idx: 0, role: 'Team Leader' },
                      { idx: 1, role: 'Colleague 1' },
                      { idx: 2, role: 'Colleague 2' },
                      { idx: reportingManagerIndex, role: 'Reporting Manager' },
                    ];

                    return rows.map(({ idx, role }) => {
                      const ref = employment.professionalReferences?.[idx];
                      const nd = parseNameAndDesignation(ref?.nameDesignation);
                      const em = parseEmailAndMobile(ref?.emailAndMobile);
                      const refEmployeeId = parseProfessionalReferenceEmployeeId(ref?.nameDesignation);
                      const refPlace = parseProfessionalReferencePlace(ref?.emailAndMobile);

                      return (
                        <tr key={idx}>
                          <th
                            scope="row"
                            className="border border-gray-800 px-3 py-3 text-left font-medium align-top bg-gray-50/80 whitespace-nowrap"
                          >
                            {role}
                          </th>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {nd.name}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {refEmployeeId}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {em.email}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {em.mobile}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {nd.designation}
                          </td>
                          <td className="border border-gray-800 px-3 py-3 align-top whitespace-pre-wrap">
                            {refPlace}
                          </td>
                        </tr>
                      );
                    });
                  })()}
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

              {(() => {
                const employmentType = (employment.employmentType ?? '').trim();
                const contractType = (employment.contractType ?? '').trim();

                const hasEmploymentType = employmentType !== '' && employmentType !== '-';
                const hasContractType = contractType !== '' && contractType !== '-';

                if (!hasEmploymentType && !hasContractType) return null;

                const rawValue = hasEmploymentType ? employmentType : contractType;

                const formattedValue = rawValue.includes('-')
                  ? rawValue
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                  : rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

                return (
                  <div>
                    <p className="text-lg font-medium text-gray-900 capitalize">{formattedValue}</p>
                  </div>
                );
              })()}

              <div>
                <p className="text-lg font-medium text-gray-900">{employment.workSchedule || '-'}</p>
                <p className="text-sm text-gray-500">Work Mode</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900 whitespace-normal break-words">
                  {whereEmployedRaw(employment as any)}
                </p>
                <p className="text-sm text-gray-500">Where Were You Employed?</p>
              </div>

              {/* <div>
                <p className="text-lg font-medium text-gray-900">
                  {employment.joiningDate
                    ? formatDateToDayMonYear(employment.joiningDate)
                    : employment.startDate
                      ? formatDateToDayMonYear(employment.startDate)
                      : '-'}
                </p>
  
              </div> */}

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
                      {employment.lastDrawnSalary
                        ? formatCurrency(employment.lastDrawnSalary)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Last Drawn In Hand</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {employment.lastSalaryAmount
                        ? formatCurrency(employment.lastSalaryAmount)
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Last Drawn CTC</p>
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



          {hasIncrementDetails ? (
            <>
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
            </>
          ) : null}
          <div className="border-t border-gray-200 my-2" />
          {/* Joining Salary Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Joining Salary Information
            </h2>

            {(() => {
              const joiningCtc = Number(employment.joiningCtc ?? 0) || 0;
              const joiningVariablePay = Number(employment.joiningVariablePay ?? 0) || 0;
              const joiningFixedPay = Number(employment.joiningFixedPay ?? 0) || 0;

              const joiningMonthlyFixed = joiningFixedPay / 12;
              const joiningBasic = joiningMonthlyFixed * 0.5;
              const joiningHra = joiningBasic * 0.4;
              const joiningConveyance = 2000;
              const joiningOtherAllowance = Number((employment as any).joiningOtherAllowance ?? 0) || 0;
              const joiningGrossSalary =
                joiningBasic + joiningHra + joiningConveyance + joiningOtherAllowance;

              const displayCurrency = (v: number) => (Number.isFinite(v) ? formatCurrency(v) : '-');

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningCtc)}</p>
                    <p className="text-sm text-gray-500">Joining CTC (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningVariablePay)}</p>
                    <p className="text-sm text-gray-500">Joining Variable (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningFixedPay)}</p>
                    <p className="text-sm text-gray-500">Joining Fixed (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningMonthlyFixed)}</p>
                    <p className="text-sm text-gray-500">Monthly Fixed (₹)</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningBasic)}</p>
                    <p className="text-sm text-gray-500">Basic (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningHra)}</p>
                    <p className="text-sm text-gray-500">HRA (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningConveyance)}</p>
                    <p className="text-sm text-gray-500">Conveyance Allowance (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningOtherAllowance)}</p>
                    <p className="text-sm text-gray-500">Other Allowance (₹)</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{displayCurrency(joiningGrossSalary)}</p>
                    <p className="text-sm text-gray-500">Gross Salary (₹)</p>
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
                const currentCtc = Number(employment.salary ?? 0) || 0;
                const currentVariablePay = Number(employment.currentVariablePay ?? 0) || 0;
                const currentFixedPay = Number(employment.currentFixedPay ?? 0) || 0;

                const currentMonthlyFixed = currentFixedPay / 12;
                const currentBasic = currentMonthlyFixed * 0.5;
                const currentHra = currentBasic * 0.4;
                const currentConveyance = 2000;
                const currentOtherAllowance = Number((employment as any).currentOtherAllowance ?? 0) || 0;
                const currentGrossSalary =
                  currentBasic + currentHra + currentConveyance + currentOtherAllowance;

                const displayCurrency = (v: number) => (Number.isFinite(v) ? formatCurrency(v) : '-');
                return (
                  <>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentCtc)}</p>
                <p className="text-sm text-gray-500">Current CTC (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentVariablePay)}</p>
                <p className="text-sm text-gray-500">Variable (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentFixedPay)}</p>
                <p className="text-sm text-gray-500">Fixed (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentMonthlyFixed)}</p>
                <p className="text-sm text-gray-500">Monthly Fixed (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentBasic)}</p>
                <p className="text-sm text-gray-500">Basic (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentHra)}</p>
                <p className="text-sm text-gray-500">HRA (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentConveyance)}</p>
                <p className="text-sm text-gray-500">Conveyance Allowance (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentOtherAllowance)}</p>
                <p className="text-sm text-gray-500">Other Allowance (₹)</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{displayCurrency(currentGrossSalary)}</p>
                <p className="text-sm text-gray-500">Gross Salary (₹)</p>
              </div>
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
          <div className="border-t border-gray-200 my-2" />

          {/* Bank Details Section - SAME STYLE AS OTHER CARDS */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Account Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Bank Name */}
              <div>
                <p className="text-lg font-medium text-gray-900">{employment.bankName || '-'}</p>
                <p className="text-sm text-gray-500">Bank Name</p>
              </div>

              {/* Account Number */}
              <div>
                <p className="text-lg font-medium text-gray-900">{employment.accountNo || '-'}</p>
                <p className="text-sm text-gray-500">Account Number</p>
              </div>

              {/* IFSC */}
              <div>
                <p className="text-lg font-medium text-gray-900">{employment.ifscCode || '-'}</p>
                <p className="text-sm text-gray-500">IFSC Code</p>
              </div>

            </div>
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 