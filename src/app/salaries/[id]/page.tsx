'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Salary } from '@/types';
import { formatDateToDayMonYearWithTime } from '@/utils/documentUtils';
import TableHeader from '@/components/ui/TableHeader';
import { useSalary, useDeleteSalary } from '@/hooks/useSalaries';
import { getEmployeeNameById } from '@/utils/firebaseUtils';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { FaRupeeSign } from "react-icons/fa";


type PageParams = {
  params: Promise<{ id: string }>;
};

export default function SalaryViewPage({ params }: PageParams) {
  const [employeeName, setEmployeeName] = useState<string>('Loading...');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams?.get('employeeId');
  
  const { id } = use(params);
  const { data: salary, isLoading, isError } = useSalary(id);

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
      <DashboardLayout breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employee', href: '/employees' },
        { label: 'Loading...', isCurrent: true }
      ]}>
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
      <DashboardLayout breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employee', href: '/employees' },
        { label: 'Salaries', href: '/salaries', isCurrent: true }
      ]}>
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load salary data. Please try refreshing the page.</p>
        </div>
        <div className="mt-4">
          <Link 
            href={employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries'} 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to {employeeId ? `${employeeName}'s Salaries` : 'Salaries'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbItems={[
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Salaries', href: '/salaries' },
      { label: employeeName, employeeId: salary?.employeeId, href: `/salaries?employeeId=${salary?.employeeId}` },
      { label: `${getMonthShort(salary?.month || 1)} - ${salary?.year || ''}`, isCurrent: true }
    ]}>
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
          backButton={{ 
            href: salary?.employeeId ? `/salaries?employeeId=${salary.employeeId}` : '/salaries', 
            label: 'Back' 
          }}
          actionButtons={[
            { 
              label: 'Edit', 
              icon: <FiEdit />, 
              variant: 'primary' as const, 
              href: `/salaries/${id}/edit?employeeId=${salary?.employeeId}` 
            }
          ]}
        />

        <div className="px-6 pb-6">
          {/* Essential Salary Information Only */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Salary Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{employeeName}</p>
                <p className="text-sm text-gray-500">Employee</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">{getMonthName(salary?.month || 1)} {salary?.year}</p>
                <p className="text-sm text-gray-500">Period</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">₹{salary?.basicSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Basic Salary</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">₹{salary?.inhandSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Inhand Salary</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <p className="text-lg font-medium text-gray-900">₹{salary?.totalSalary?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Total Salary</p>
              </div>
            </div>
          </div>

          {/* Audit Trail - Keep only essential audit info */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaRupeeSign className="mr-2" /> Audit Trail
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">
                  {salary?.createdAt ? formatDateToDayMonYearWithTime(salary.createdAt) : '-'}
                </p>
                <p className="text-sm text-gray-500">Created At</p>
              </div>
              
              <div className="p-3">
                <p className="text-lg font-medium text-gray-900">
                  {salary?.updatedAt ? formatDateToDayMonYearWithTime(salary.updatedAt) : '-'}
                </p>
                <p className="text-sm text-gray-500">Updated At</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 