'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeSelfSalariesByEmployee } from '@/hooks/useSalaries';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { ActionButton } from '@/components/ui/ActionButton';
import { FiDownload, FiEye } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { saveAs } from 'file-saver';
import { Salary } from '@/types';

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  heading: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 10 },
});

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

export default function EmployeeMySalaryPage() {
  const router = useRouter();
  const { currentUserData } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
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

    const matchesMonth = monthFilter === 'all' || String(salary.month) === String(monthFilter);
    const matchesYear = yearFilter === 'all' || String(salary.year) === String(yearFilter);

    return matchesSearch && matchesMonth && matchesYear;
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
          .map((s) => s.year)
          .filter((y): y is number => typeof y === 'number' && !Number.isNaN(y)),
      ),
    ).sort((a, b) => b - a);

    return [{ label: 'All Years', value: 'all' }, ...years.map((y) => ({ label: String(y), value: String(y) }))];
  };

  const getMonthOptions = () => {
    const months = Array.from(
      new Set(
        salaries
          .map((s) => s.month)
          .filter((m): m is number => typeof m === 'number' && !Number.isNaN(m)),
      ),
    ).sort((a, b) => a - b);

    return [{ label: 'All Months', value: 'all' }, ...months.map((m) => ({ label: getMonthName(m), value: String(m) }))];
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

      const f: any = {
        ...salary,
        ...employeeData,
        ...employmentData,
      };

      const employeeName =
        (f as any).employeeNameText ||
        (f as any).employeeName ||
        (employeeData as any)?.name ||
        (employmentData as any)?.employeeName ||
        'Unknown Employee';

      const earningsData = [
        { label: 'Basic', amount: (f as any).basic || 0 },
        { label: 'HRA', amount: (f as any).hra || 0 },
        { label: 'Conveyance Allowance', amount: (f as any).conveyanceAllowance || 0 },
        { label: 'Other Allowance', amount: (f as any).otherAllowance || 0 },
      ];

      const deductionsData = [
        { label: 'PT', amount: (f as any).ptDeduct || 0 },
        { label: 'Leave Deduction', amount: (f as any).leavesDeductAmt || 0 },
        { label: 'Other Deduction', amount: (f as any).otherDeductions || 0 },
      ];

      const safeName = employeeName.replace(/\s+/g, '_');
      const monthName = getMonthName((f as any).month);

      const blob = await pdf(
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <GlobalPDFHeader />
            <View style={pdfStyles.section}>
              <Text style={pdfStyles.heading}>Salary Details</Text>
              <Text>
                {employeeName} - {monthName} {(f as any).year}
              </Text>
            </View>
            <GlobalPDFFooter />
          </Page>
        </Document>,
      ).toBlob();

      saveAs(blob, `${safeName}_Salary_${monthName}_${(f as any).year}.pdf`);
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
          total={filteredSalaries.length}
          backButton={{ href: '/employee-dashboard', label: 'Back' }}
          searchPlaceholder="Search by month/year"
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showStats={false}
          showSearch={true}
          filterValue={monthFilter}
          onFilterChange={setMonthFilter}
          filterOptions={getMonthOptions()}
          showFilter={true}
          secondFilterValue={yearFilter}
          onSecondFilterChange={setYearFilter}
          secondFilterOptions={getYearOptions()}
          showSecondFilter={true}
        />

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leaves Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Salary (A)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Deductions (B)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSalaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
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
                {searchTerm || monthFilter !== 'all' || yearFilter !== 'all'
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

