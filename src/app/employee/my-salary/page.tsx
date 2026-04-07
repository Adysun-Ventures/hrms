'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeSelfSalariesByEmployee } from '@/hooks/useSalaries';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { ActionButton } from '@/components/ui/ActionButton';
import { FiDownload, FiEdit, FiEye, FiPlus } from 'react-icons/fi';
import { FaRupeeSign, FaSyncAlt } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { pdf } from '@react-pdf/renderer';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { saveAs } from 'file-saver';
import { Salary } from '@/types';
import { SalarySlipPDF } from '@/app/doc_pages/pages/v2/SalarySlipGenerator';

const getMonthName = (month: number | string) => {
  const monthIndex = Number(month);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  if (!Number.isFinite(monthIndex) || monthIndex < 1 || monthIndex > 12) return 'Unknown';
  return months[monthIndex - 1] || 'Unknown';
};

const getDaysInMonth = (month1to12: number, year: number) => {
  const m = Math.min(12, Math.max(1, Number(month1to12) || 1));
  const y = Number(year) || new Date().getFullYear();
  return new Date(y, m, 0).getDate();
};

const toIntOrNull = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function EmployeeMySalaryPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (!currentUserData) {
      router.push('/login');
      return;
    }
    if (currentUserData.userType !== 'employee') {
      router.push('/dashboard');
    }
  }, [currentUserData, router]);

  const employeeId = currentUserData?.id || '';

  const {
    data: salaries = [],
    isLoading,
    isError,
  } = useEmployeeSelfSalariesByEmployee(employeeId);

  const filteredSalaries = salaries.filter((salary) => {
    const matchesSearch =
      !searchTerm ||
      `${getMonthName(salary.month)} ${salary.year}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const salaryYear = toIntOrNull(salary.year);
    const selectedYear = toIntOrNull(yearFilter);

    const matchesYear = yearFilter === 'all' || (salaryYear !== null && selectedYear !== null && salaryYear === selectedYear);

    return matchesSearch && matchesYear;
  });

  const totalItems = filteredSalaries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSalaries = filteredSalaries.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getYearOptions = () => {
    const years = Array.from(
      new Set(
        salaries
          .map((s) => toIntOrNull(s.year))
          .filter((y): y is number => y !== null),
      ),
    ).sort((a, b) => b - a);

    return [{ label: 'All Years', value: 'all' }, ...years.map((y) => ({ label: String(y), value: String(y) }))];
  };

  const handleDownload = async (salary: Salary) => {
    try {
      const empDoc = await getDoc(doc(db, 'employees', salary.employeeId));
      const employeeData = empDoc.exists() ? empDoc.data() : {};

      let employmentData: any = {};
      const empQuery = query(collection(db, 'employments'), where('employeeId', '==', salary.employeeId));
      const empSnap = await getDocs(empQuery);

      if (!empSnap.empty) {
        const rows = empSnap.docs.map((d) => d.data());
        rows.sort(
          (a, b) => new Date((b as any).startDate).getTime() - new Date((a as any).startDate).getTime(),
        );
        employmentData = rows[0];
      }

      // Ensure salary fields take precedence over employment/employee data.
      const f: any = {
        ...employeeData,
        ...employmentData,
        ...salary,
      };

      const employeeName =
        (f as any).employeeNameText ||
        (f as any).employeeName ||
        (employeeData as any)?.name ||
        (employmentData as any)?.employeeName ||
        'Unknown Employee';

      const firstName =
        String(employeeName || 'Employee')
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
      // Employee Code in slip should be Employment ID (human-readable), never raw employee doc id.
      const employeeCode =
        String(
          (employmentData as any)?.employmentId ||
          (f as any).employmentId ||
          ''
        ).trim();

      const slipFormData: any = {
        companyName: (f as any).companyName || 'Adysun Ventures Pvt. Ltd.',
        employeeName: [(employeeName || '').trim()].filter(Boolean),
        employeeNameText: employeeName,
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
        // Use Add Salary page fields (basic/hra/...) for document accuracy
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
    }
  };

  if (!currentUserData || currentUserData.userType !== 'employee') {
    return null;
  }

  return (
    <EmployeeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'My Salaries', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="My Salary"
          customReloadButton={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FaSyncAlt size={14} />
            </button>
          }
          total={filteredSalaries.length}
          backButton={{ href: '/employee-dashboard', label: 'Back' }}
          actionButtons={[
            {
              label: 'Add Salary',
              icon: <FiPlus className="w-4 h-4" />,
              variant: 'success',
              onClick: () => router.push('/salaries/add?from=employee'),
            },
          ]}
          searchPlaceholder="Search by month/year"
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showStats={true}
          showSearch={true}
          showFilter={false}
          secondFilterValue={yearFilter}
          onSecondFilterChange={setYearFilter}
          secondFilterOptions={getYearOptions()}
          showSecondFilter={true}
        />

        <div className="overflow-x-auto px-6 mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leaves
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross (A)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions (B)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In-Hand (C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSalaries.map((salary, idx) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthName(salary.month)} {salary.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(salary as any).workDays ??
                      (salary as any).workingDays ??
                      (salary as any).totalWorkingDays ??
                      (salary as any).monthDays ??
                      '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(salary as any).leavesCount ?? (salary as any).totalLeaves ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((salary as any).grossSalary ?? salary.totalSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{(
                      (salary as any).totalDeduction ??
                      (salary as any).totalDeductions ??
                      0
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((salary as any).netSalary ?? salary.inhandSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <ActionButton
                        icon={<FiDownload className="w-5 h-5" />}
                        title="Download Salary Details"
                        colorClass="bg-green-100 text-green-600 hover:text-green-900"
                        href={null as any}
                        onClick={() => handleDownload(salary)}
                      />
                      <ActionButton
                        icon={<FiEye className="w-5 h-5" />}
                        title="View Salary Details"
                        colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                        href={`/salaries/${salary.id}?employeeId=${employeeId}`}
                      />
                      <ActionButton
                        icon={<FiEdit className="w-5 h-5" />}
                        title="Edit Salary"
                        colorClass="bg-yellow-100 text-yellow-700 hover:text-yellow-900"
                        href={`/salaries/${salary.id}/edit?from=employee`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSalaries.length === 0 && !isLoading && !isError && (
            <div className="text-center py-8">
              <FaRupeeSign className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No salary records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || yearFilter !== 'all'
                  ? 'Try adjusting your search, month, or year filter.'
                  : 'No salary slips have been generated yet.'}
              </p>
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
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

