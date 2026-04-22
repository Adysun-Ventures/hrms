'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiDownload, FiEdit } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { Salary } from '@/types';
import { formatDateToDayMonYearWithTime } from '@/utils/documentUtils';
import TableHeader from '@/components/ui/TableHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { useEmployeeSelfSalariesByEmployee, useSalary } from '@/hooks/useSalaries';
import { getAdminNameById, getEmployeeNameById, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { FaRupeeSign, FaSyncAlt } from "react-icons/fa";
import { useAuth } from '@/context/AuthContext';
import { pdf } from '@react-pdf/renderer';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { saveAs } from 'file-saver';
import { SalarySlipPDF } from '@/app/doc_pages/pages/v2/SalarySlipGenerator';


type PageParams = {
  params: Promise<{ id: string }>;
};

export default function SalaryViewPage({ params }: PageParams) {
  const [employeeName, setEmployeeName] = useState<string>('Loading...');
  const [resolvedEmploymentId, setResolvedEmploymentId] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState<string>('');
  const [updatedByName, setUpdatedByName] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams?.get('employeeId');

  const { currentUserData } = useAuth();
  const isEmployeeView = currentUserData?.userType === 'employee';
  
  const { id } = use(params);

  // Admin-safe (requires admin session)
  const {
    data: adminSalary,
    isLoading: isAdminLoading,
    isError: isAdminError,
  } = useSalary(id);

  // Employee-safe (requires employee session)
  const {
    data: selfSalaries,
    isLoading: isSelfLoading,
    isError: isSelfError,
  } = useEmployeeSelfSalariesByEmployee(employeeId || '');

  const selfSalary =
    selfSalaries?.find((s: any) => s.id === id) || null;

  const salary = adminSalary || selfSalary;
  const isLoading = isAdminLoading || isSelfLoading;
  const isError = (isAdminError || isSelfError) && !salary;

  // Fetch employee name from Firebase when salary is loaded
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (salary?.employeeId) {
        try {
          const name = await getEmployeeNameById(salary.employeeId);
          setEmployeeName(name);
        } catch (error) {
          console.error('Error fetching employee name:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };
    fetchEmployeeName();
  }, [salary]);

  useEffect(() => {
    const resolveActorName = async (actorId?: string) => {
      if (!actorId) return 'Unknown';
      const adminName = await getAdminNameById(actorId);
      if (adminName && adminName !== 'Unknown Admin') return adminName;
      const empName = await getEmployeeNameById(actorId);
      if (empName && empName !== 'Unknown Employee') return empName;
      return 'Unknown';
    };

    const fetchAuditNames = async () => {
      if (!salary) return;
      setCreatedByName(await resolveActorName((salary as any).createdBy));
      setUpdatedByName(await resolveActorName((salary as any).updatedBy));
    };

    fetchAuditNames();
  }, [salary]);

  // Breadcrumb fallback: some existing salary documents may not store `employmentId`.
  // If missing, resolve the latest employment for this employee and use its id.
  useEffect(() => {
    const salaryEmploymentId = salary?.employmentId;
    if (salaryEmploymentId) {
      setResolvedEmploymentId(null);
      return;
    }
    const targetEmployeeId = salary?.employeeId || employeeId;
    if (!targetEmployeeId) return;

    (async () => {
      try {
        const employments = await getEmploymentsByEmployee(targetEmployeeId);
        const latest = employments?.[0];
        if (latest?.id) setResolvedEmploymentId(latest.id);
      } catch (e) {
        console.error('Failed to resolve employmentId for breadcrumb fallback:', e);
      }
    })();
  }, [salary?.employmentId, salary?.employeeId, employeeId]);

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || 'Unknown';
  };

  const getMonthShort = (month: number) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                   'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[month - 1] || 'UNK';
  };

  const getDaysInMonth = (month1to12: number, year: number) => {
    const m = Math.min(12, Math.max(1, Number(month1to12) || 1));
    const y = Number(year) || new Date().getFullYear();
    return new Date(y, m, 0).getDate();
  };

  const handleDownload = async (salaryToDownload: Salary) => {
    try {
      const empDoc = await getDoc(doc(db, 'employees', salaryToDownload.employeeId));
      const employeeData = empDoc.exists() ? empDoc.data() : {};

      let employmentData: any = {};
      const empQuery = query(collection(db, 'employments'), where('employeeId', '==', salaryToDownload.employeeId));
      const empSnap = await getDocs(empQuery);

      if (!empSnap.empty) {
        const rows = empSnap.docs.map((d) => d.data());
        rows.sort(
          (a, b) => new Date((b as any).startDate).getTime() - new Date((a as any).startDate).getTime(),
        );
        employmentData = rows[0];
      }

      const f: any = {
        ...employeeData,
        ...employmentData,
        ...salaryToDownload,
      };

      const employeeNameText =
        (f as any).employeeNameText ||
        (f as any).employeeName ||
        (employeeData as any)?.name ||
        (employmentData as any)?.employeeName ||
        'Unknown Employee';

      const firstName =
        String(employeeNameText || 'Employee')
          .trim()
          .split(/\s+/)[0]
          .replace(/[^A-Za-z0-9_-]/g, '') || 'Employee';

      const monthName = getMonthName((f as any).month);
      const monthShort = monthName.slice(0, 3);
      const pf = Number((f as any).pf ?? 0) || 0;
      const pt = Number((f as any).ptDeduct ?? 200) || 0;
      const otherDeduction = Number((f as any).otherDeduction ?? (f as any).otherDeductions ?? 0) || 0;
      const payYear = Number((f as any).year) || new Date().getFullYear();
      const payMonth1 = Number((f as any).month) || 1;
      const monthIndex0 = Math.max(0, Math.min(11, payMonth1 - 1));
      const leavesCount = Number((f as any).leavesCount ?? 0) || 0;
      const payableDays = Math.max(0, getDaysInMonth(payMonth1, payYear) - leavesCount);
      const employeeCode =
        String(
          (employmentData as any)?.employmentId ||
          (f as any).employmentId ||
          ''
        ).trim();

      const slipFormData: any = {
        companyName: (f as any).companyName || 'Adysun Ventures Pvt. Ltd.',
        employeeName: [(employeeNameText || '').trim()].filter(Boolean),
        employeeNameText,
        employeeId: employeeCode,
        designation: (f as any).jobTitle || (f as any).designation || '',
        department: (f as any).department || '',
        payDate: `${payYear}-${String(payMonth1).padStart(2, '0')}-01`,
        location: (f as any).location || '',
        payableDays: String((f as any).payableDays ?? payableDays),
        leaves: String(leavesCount),
        month: String(monthIndex0),
        year: String(payYear),
        panNumber:
          String((f as any).panCard || (f as any).panNumber || (f as any).pan || '')
            .trim() || '',
        bankName: (f as any).bankName || '',
        accountNo: (f as any).accountNo || '',
        ifscCode: (f as any).ifscCode || '',
        basicSalary: Number((f as any).basic ?? 0) || 0,
        da: Number((f as any).hra ?? 0) || 0,
        conveyanceAllowance: Number((f as any).conveyanceAllowance ?? 0) || 0,
        otherAllowance: Number((f as any).otherAllowance ?? 0) || 0,
        medicalAllowance: 0,
        cca: 0,
        professionalTax: pt,
        otherDeductions: otherDeduction,
        leavesDeduction: Number((f as any).leavesDeductAmt ?? 0) || 0,
        pfEmployee: pf,
        enablePF: pf > 0,
        companyLogo: (f as any).companyLogo || '/assets/adysunventures_logo.png',
      };

      const blob = await pdf(<SalarySlipPDF formData={slipFormData} />).toBlob();
      saveAs(blob, `${firstName}_Salary_Slip_${monthShort}_${(f as any).year}.pdf`);
    } catch (error) {
      console.error('Error generating salary PDF:', error);
      toast.error('Failed to download salary slip');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={
          isEmployeeView
            ? [
                { label: 'Dashboard', href: '/employee-dashboard' },
                { label: 'My Salaries', href: '/employee/my-salary' },
                { label: 'Loading...', isCurrent: true },
              ]
            : [
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Employees', href: '/employees' },
                { label: 'Loading...', isCurrent: true },
              ]
        }
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !salary) {
    return (
      <DashboardLayout
        breadcrumbItems={
          isEmployeeView
            ? [
                { label: 'Dashboard', href: '/employee-dashboard' },
                { label: 'My Salaries', href: '/employee/my-salary' },
                { label: 'Error', isCurrent: true },
              ]
            : [
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Employees', href: '/employees' },
                { label: 'Salary', href: '/salaries', isCurrent: true },
              ]
        }
      >
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load salary data. Please try refreshing the page.</p>
        </div>
        <div className="mt-4">
          <Link 
            href={isEmployeeView ? '/employee/my-salary' : (employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries')} 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to {employeeId ? `${employeeName}'s Salaries` : 'Salaries'}
          </Link>
        </div>  
      </DashboardLayout>
    );
  }
  console.log('Salary Data:', salary); // Debug log to check salary data structure
              

  const adminBreadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Employees', href: '/employees' },
    {
      label: employeeName,
      href: salary?.employeeId ? `/employees/${salary.employeeId}` : undefined,
    },
    {
      label: 'Employment',
      href:
        salary?.employmentId || resolvedEmploymentId
          ? `/employments/${salary?.employmentId || resolvedEmploymentId}`
          : '/employments',
    },
    {
      label: 'Salary',
      href: salary?.employeeId
        ? `/salaries?employeeId=${salary.employeeId}&from=employment`
        : '/salaries',
    },
    { label: 'View Salary', isCurrent: true },
  ];

  const employeeBreadcrumbItems = [
    { label: 'Dashboard', href: '/employee-dashboard' },
    { label: 'My Salaries', href: '/employee/my-salary' },
    { label: 'View Salary', isCurrent: true },
  ];

  return (
    <DashboardLayout
      breadcrumbItems={isEmployeeView ? employeeBreadcrumbItems : adminBreadcrumbItems}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Salary Details"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => {}}
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
          backButton={{ 
            href: isEmployeeView
              ? '/employee/my-salary'
              : salary?.employeeId
                ? `/salaries?employeeId=${salary.employeeId}`
                : '/salaries', 
            label: 'Back' 
          }}
          rightSlot={
            <div className="flex items-center justify-end gap-3">
              {isEmployeeView ? (
                <ActionButton
                  icon={<FiEdit className="w-5 h-5" />}
                  title="Edit"
                  colorClass="bg-orange-100 text-orange-600 hover:text-orange-900"
                  href={`/salaries/${id}/edit?from=employee`}
                />
              ) : adminSalary ? (
                <>
                  <ActionButton
                    icon={<FiDownload className="w-5 h-5" />}
                    title="Download Salary Slip"
                    colorClass="bg-green-100 text-green-600 hover:text-green-900"
                    onClick={() => handleDownload(salary as Salary)}
                  />
                  <ActionButton
                    icon={<FiEdit className="w-5 h-5" />}
                    title="Edit"
                    colorClass="bg-orange-100 text-orange-600 hover:text-orange-900"
                    href={`/salaries/${id}/edit?employeeId=${salary?.employeeId}`}
                  />
                </>
              ) : null}
            </div>
          }
          actionButtons={
            []
          }
        />

        <div className="px-6 pb-2">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Information
            </h2>

            {(() => {
              const month = Number((salary as any)?.month || 1);
              const year = Number((salary as any)?.year || new Date().getFullYear());
              const leaveCount = Number((salary as any)?.leavesCount ?? 0) || 0;
              const payableDays =
                Number((salary as any)?.workDays ??
                  (salary as any)?.workingDays ??
                  (salary as any)?.totalWorkingDays ??
                  (salary as any)?.monthDays ??
                  0) || 0;

              const ctc = Number((salary as any)?.ctc ?? 0) || 0;
              const variablePay = Number((salary as any)?.variablePay ?? 0) || 0;
              const fixedPay = Number((salary as any)?.fixedPay ?? 0) || 0;
              const monthlyFixed = fixedPay / 12;
              const monthlySalaryPayable = Number((salary as any)?.perMonth ?? 0) || 0;

              const basic = Number((salary as any)?.basic ?? (salary as any)?.basicSalary ?? 0) || 0;
              const hra = Number((salary as any)?.hra ?? (salary as any)?.da ?? 0) || 0;
              const conveyance = Number((salary as any)?.conveyanceAllowance ?? 0) || 0;
              const otherAllowance = Number((salary as any)?.otherAllowance ?? 0) || 0;
              const grossSalary = Number((salary as any)?.grossSalary ?? (salary as any)?.totalSalary ?? 0) || 0;

              const pfDeduct = Number((salary as any)?.pf ?? 0) || 0;
              const ptDeduct = Number((salary as any)?.ptDeduct ?? 0) || 0;
              const leavesDeductAmt = Number((salary as any)?.leavesDeductAmt ?? 0) || 0;
              const otherDeduction = Number((salary as any)?.otherDeduction ?? 0) || 0;
              const totalDeduction =
                Number((salary as any)?.totalDeduction ?? (pfDeduct + ptDeduct + leavesDeductAmt + otherDeduction)) ||
                0;
              const netSalary =
                Number((salary as any)?.netSalary ?? (salary as any)?.inhandSalary ?? (grossSalary - totalDeduction)) ||
                0;

              const formatAmount = (value: number) => `₹${value.toLocaleString('en-IN')}`;

              return (
                <div className="space-y-6">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{employeeName}</p>
                        <p className="text-sm text-gray-500">Name</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{getMonthName(month)} {year}</p>
                        <p className="text-sm text-gray-500">Month / Year</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{leaveCount.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">Leave Count</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{payableDays.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">Payable Days</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary Inputs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(ctc)}</p>
                        <p className="text-sm text-gray-500">CTC</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(variablePay)}</p>
                        <p className="text-sm text-gray-500">Variable Pay</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(fixedPay)}</p>
                        <p className="text-sm text-gray-500">Fixed Pay</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(monthlyFixed)}</p>
                        <p className="text-sm text-gray-500">Monthly Fixed</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(monthlySalaryPayable)}</p>
                        <p className="text-sm text-gray-500">Monthly Salary Payable</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary Components (Auto-calculated)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(basic)}</p>
                        <p className="text-sm text-gray-500">Basic (Auto-calculated)</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(hra)}</p>
                        <p className="text-sm text-gray-500">HRA (Auto-calculated)</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(conveyance)}</p>
                        <p className="text-sm text-gray-500">Conveyance Allowance (Auto-calculated)</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(otherAllowance)}</p>
                        <p className="text-sm text-gray-500">Other Allowance</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">{formatAmount(grossSalary)}</p>
                    <p className="text-sm text-gray-500">Gross Salary (A)</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(pfDeduct)}</p>
                        <p className="text-sm text-gray-500">PF (DEDUCT)</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(ptDeduct)}</p>
                        <p className="text-sm text-gray-500">PT (DEDUCT)</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(leavesDeductAmt)}</p>
                        <p className="text-sm text-gray-500">Leaves Deduct Amt</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{formatAmount(otherDeduction)}</p>
                        <p className="text-sm text-gray-500">Other Deduction</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">{formatAmount(totalDeduction)}</p>
                    <p className="text-sm text-gray-500">Total Deduction</p>
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">{formatAmount(netSalary)}</p>
                    <p className="text-sm text-gray-500">Net Salary (InHand) (C=A-B)</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-6 pt-3 border-gray-200 flex items-center justify-between gap-4">
            <p className="text-sm font-normal text-gray-700">
              Created By {createdByName || 'Unknown'} On {salary?.createdAt ? formatDateToDayMonYearWithTime(salary.createdAt) : '-'}
            </p>
            <p className="text-sm font-normal text-gray-700 text-right">
              Updated By {updatedByName || 'Unknown'} On {salary?.updatedAt ? formatDateToDayMonYearWithTime(salary.updatedAt) : '-'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 