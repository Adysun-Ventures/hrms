'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { Salary } from '@/types';
import { formatDateToDayMonYearWithTime } from '@/utils/documentUtils';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployeeSelfSalariesByEmployee, useSalary } from '@/hooks/useSalaries';
import { getAdminNameById, getEmployeeNameById, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { FaRupeeSign, FaSyncAlt } from "react-icons/fa";
import { useAuth } from '@/context/AuthContext';


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
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
          actionButtons={
            isEmployeeView
              ? [
                  {
                    label: 'Edit Salary',
                    icon: <FiEdit />,
                    variant: 'orange' as const,
                    href: `/salaries/${id}/edit?from=employee`,
                  },
                ]
              : adminSalary
                ? [
                    {
                      label: 'Edit Salary',
                      icon: <FiEdit />,
                      variant: 'orange' as const,
                      href: `/salaries/${id}/edit?employeeId=${salary?.employeeId}`,
                    },
                  ]
                : []
          }
        />

        <div className="px-6 pb-2">
          {/* Essential Salary Information Only */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-lg font-medium text-gray-900">{employeeName}</p>
                <p className="text-sm text-gray-500">Employee</p>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">{getMonthName(salary?.month || 1)} {salary?.year}</p>
                <p className="text-sm text-gray-500">Period</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">{salary?.leavesCount?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Leaves Count</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.leavesDeductAmt?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Leaves Deduct Amount</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.basicSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Basic Salary</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.fixedPay?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Fixed Pay</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.variablePay?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Variable Pay</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.ptDeduct?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">PT Deduct</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.totalDeduction?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Total Deduction</p>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.inhandSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Inhand Salary</p>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">₹{salary?.totalSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Total Salary</p>
              </div>
            </div>
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