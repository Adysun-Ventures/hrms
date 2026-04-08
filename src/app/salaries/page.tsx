'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiEye, FiDollarSign, FiDownload } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Salary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import SearchBar from '@/components/ui/SearchBar';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { useSalaries, useDeleteSalary, useSalariesByEmployee } from '@/hooks/useSalaries';
import { getEmployeeNameById, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import SimpleBreadcrumb from '@/components/ui/SimpleBreadcrumb';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FaRupeeSign, FaSyncAlt } from "react-icons/fa";
import { pdf } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/app/doc_pages/pages/v2/SalarySlipGenerator';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { saveAs } from "file-saver";





// Component to handle employee name display with proper Firebase integration
const EmployeeNameDisplay = ({ employeeId }: { employeeId: string }) => {
  const [employeeName, setEmployeeName] = useState<string>('Loading...');

  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (employeeId) {
        try {
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);
        } catch (error) {
          console.error('Error fetching employee name:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeName();
  }, [employeeId]);

  return <span>{employeeName}</span>;
};


export default function SalariesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [resolvedEmploymentId, setResolvedEmploymentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const employeeId = searchParams?.get('employeeId') || null;
  const from = searchParams?.get('from') || null;

  // Resolve latest employment id for breadcrumb (avoid Employment list page)
  useEffect(() => {
    if (!employeeId) {
      setResolvedEmploymentId(null);
      return;
    }

    (async () => {
      try {
        const employments = await getEmploymentsByEmployee(employeeId);
        const latest = employments?.[0];
        setResolvedEmploymentId(latest?.id || null);
      } catch (e) {
        console.error('Failed to resolve employmentId for salary breadcrumb:', e);
        setResolvedEmploymentId(null);
      }
    })();
  }, [employeeId]);

  // Use appropriate query based on whether we have an employeeId
  const {
    data: employeeSalaries = [],
    isLoading: isEmployeeSalariesLoading,
    isError: isEmployeeSalariesError,
    error: employeeSalariesError,
    refetch: refetchEmployeeSalaries
  } = useSalariesByEmployee(employeeId || '');

  const {
    data: allSalaries = [],
    isLoading: isAllSalariesLoading,
    isError: isAllSalariesError,
    error: allSalariesError,
    refetch: refetchAllSalaries
  } = useSalaries();

  // Use the appropriate data based on context
  const salaries = employeeId ? employeeSalaries : allSalaries;
  const isLoading = employeeId ? isEmployeeSalariesLoading : isAllSalariesLoading;
  const isError = employeeId ? isEmployeeSalariesError : isAllSalariesError;
  const error = employeeId ? employeeSalariesError : allSalariesError;

  // Debug logging
  console.log('🔍 Debug - Employee ID:', employeeId);
  console.log('🔍 Debug - All Salaries Count:', allSalaries.length);
  console.log('🔍 Debug - Employee Salaries Count:', employeeSalaries.length);
  console.log('🔍 Debug - Final Salaries Count:', salaries.length);
  console.log('🔍 Debug - Is Loading:', isLoading);
  console.log('🔍 Debug - Is Error:', isError);

  // Fetch employee name when employeeId is available
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (employeeId) {
        try {
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);
        } catch (error) {
          console.error('Error fetching employee name:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeName();
  }, [employeeId]);

  // Use mutation for delete operation
  const deleteSalaryMutation = useDeleteSalary();

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      console.log('🔄 Manual refresh triggered...');
      
      // Force invalidate all salary queries
      await queryClient.invalidateQueries({ queryKey: ['salaries'] });
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'list'] });
      
      if (employeeId) {
        await queryClient.invalidateQueries({ queryKey: ['salaries', 'byEmployee', employeeId] });
        await refetchEmployeeSalaries();
      } else {
        await refetchAllSalaries();
      }
      
      console.log('✅ Manual refresh completed');
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing salaries:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Handle error state
  if (isError && error) {
    console.error('Salary data error:', error);
    toast.error('Failed to load salary data');
  }
const handleDownload = async (salary: Salary) => {
  try {

    // ===== 1️⃣ Fetch Employee =====
    const empDoc = await getDoc(doc(db, "employees", salary.employeeId));
    const employeeData = empDoc.exists() ? empDoc.data() : {};

    // ===== 2️⃣ Fetch Employment =====
    let employmentData: any = {};

    const empQuery = query(
      collection(db, "employments"),
      where("employeeId", "==", salary.employeeId)
    );

    const empSnap = await getDocs(empQuery);

    if (!empSnap.empty) {
      const rows = empSnap.docs.map(d => d.data());

      rows.sort(
        (a, b) =>
          new Date(b.startDate).getTime() -
          new Date(a.startDate).getTime()
      );

      employmentData = rows[0]; // ✅ latest employment
    }

    // ===== 3️⃣ FINAL MERGED OBJECT =====
    // Ensure salary fields take precedence over employment/employee data.
    const f: any = {
      ...employeeData,
      ...employmentData,
      ...salary,
    };

    console.log(employeeData,employmentData )

    // ===== 4️⃣ SAFE NAME RESOLVER =====
    const employeeName =
      f.employeeNameText ||
      f.employeeName ||
      employeeData?.name ||
      employmentData?.employeeName ||
      "Unknown Employee";

    const firstName = String(employeeName || 'Employee')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z0-9_-]/g, '') || 'Employee';
    const monthName = getMonthName(f.month);
    const monthShort = monthName.slice(0, 3);

    const payYear = Number(f.year) || new Date().getFullYear();
    const payMonth1 = Number(f.month) || 1;
    const monthIndex0 = Math.max(0, Math.min(11, payMonth1 - 1));
    const leavesCount = Number(f.leavesCount ?? 0) || 0;
    const payableDays = Math.max(0, (new Date(payYear, payMonth1, 0).getDate()) - leavesCount);
    // Employee Code in slip should be Employment ID (human-readable), never raw employee doc id.
    const employeeCode = String(
      employmentData?.employmentId ||
      f.employmentId ||
      ''
    ).trim();

    const pf = Number(f.pf ?? 0) || 0;
    const pt = Number(f.ptDeduct ?? 200) || 0;
    const otherDeduction = Number(f.otherDeduction ?? f.otherDeductions ?? 0) || 0;

    const earningsData = [
      { label: 'Basic', amount: Number(f.basic ?? 0) || 0 },
      { label: 'HRA', amount: Number(f.hra ?? 0) || 0 },
      { label: 'Conveyance Allowance', amount: Number(f.conveyanceAllowance ?? 0) || 0 },
      { label: 'Other Allowance', amount: Number(f.otherAllowance ?? 0) || 0 },
    ];
    const deductionsData = [
      { label: 'PT', amount: pt },
      { label: 'PF (Employee)', amount: pf },
      { label: 'Other Deductions', amount: otherDeduction },
      { label: 'Leave Deduction', amount: Number(f.leavesDeductAmt ?? 0) || 0 },
    ].filter((d) => d.label !== 'PF (Employee)' || pf > 0);

    const slipFormData: any = {
      companyName: f.companyName || 'Adysun Ventures Pvt. Ltd.',
      employeeName: [(employeeName || '').trim()].filter(Boolean),
      employeeNameText: employeeName,
      employeeId: employeeCode,
      designation: f.jobTitle || f.designation || '',
      department: f.department || '',
      payDate: `${payYear}-${String(payMonth1).padStart(2, '0')}-01`,
      location: f.location || '',
      payableDays: String(f.payableDays ?? payableDays),
      leaves: String(leavesCount),
      month: String(monthIndex0),
      year: String(payYear),
      panNumber:
        String(f.panCard || f.panNumber || f.pan || '')
          .trim() || '',
      bankName: f.bankName || '',
      accountNo: f.accountNo || '',
      ifscCode: f.ifscCode || '',
      basicSalary: Number(f.basic ?? 0) || 0,
      da: Number(f.hra ?? 0) || 0,
      conveyanceAllowance: Number(f.conveyanceAllowance ?? 0) || 0,
      otherAllowance: Number(f.otherAllowance ?? 0) || 0,
      medicalAllowance: 0,
      cca: 0,
      professionalTax: pt,
      otherDeductions: otherDeduction,
      leavesDeduction: Number(f.leavesDeductAmt ?? 0) || 0,
      pfEmployee: pf,
      enablePF: pf > 0,
      companyLogo: f.companyLogo || '/assets/adysunventures_logo.png',
    };

    const blob = await pdf(<SalarySlipPDF formData={slipFormData} />).toBlob();
    saveAs(blob, `${firstName}_Salary_Slip_${monthShort}_${f.year}.pdf`);

    toast.success("PDF Downloaded");

  } catch (error) {
    console.error(error);
    toast.error("PDF download failed");
  }
};



  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      toast.loading('Deleting salary...', { id: 'delete-salary' });
      await deleteSalaryMutation.mutateAsync(id);
      setDeleteConfirm(null);
      
      // Invalidate and refetch data after successful deletion
      if (employeeId) {
        // Invalidate employee-specific salaries cache
        queryClient.invalidateQueries({ queryKey: ['salaries', 'employee', employeeId] });
        await refetchEmployeeSalaries();
      } else {
        // Invalidate all salaries cache
        queryClient.invalidateQueries({ queryKey: ['salaries'] });
        await refetchAllSalaries();
      }
      
      toast.success('Salary deleted successfully', { id: 'delete-salary' });
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast.error('Failed to delete salary', { id: 'delete-salary' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const toIntOrNull = (value: unknown): number | null => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const filteredSalaries = salaries
    .filter((salary) => {
      const matchesSearch =
        salary.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salary.employmentId?.toLowerCase().includes(searchTerm.toLowerCase());

      const salaryYear = toIntOrNull(salary.year);
      const selectedYear = toIntOrNull(yearFilter);

      const matchesYear =
        yearFilter === 'all' || (salaryYear !== null && selectedYear !== null && salaryYear === selectedYear);

      const matchesEmployeeId = employeeId ? salary.employeeId === employeeId : true;

      return matchesSearch && matchesYear && matchesEmployeeId;
    })
    .sort((a, b) => {
      const yearA = Number((a as any).year) || 0;
      const yearB = Number((b as any).year) || 0;
      if (yearB !== yearA) return yearB - yearA;

      const monthA = Number((a as any).month) || 0;
      const monthB = Number((b as any).month) || 0;
      return monthB - monthA;
    });

  // Pagination logic
  const totalItems = filteredSalaries.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSalaries = filteredSalaries.slice(startIndex, endIndex);
  const totalInHandAmount = filteredSalaries.reduce((sum, salary) => {
    const inHand = Number((salary as any).netSalary ?? (salary as any).inhandSalary ?? 0) || 0;
    return sum + inHand;
  }, 0);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter, employeeId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: 'all', label: 'Years' }];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        ...(employeeId
          ? [
              { label: employeeName || 'Loading...', href: `/employees/${employeeId}` },
              { label: 'Employment', href: resolvedEmploymentId ? `/employments/${resolvedEmploymentId}` : `/employees/${employeeId}` },
              { label: 'Salary', href: `/salaries?employeeId=${employeeId}&from=employment`, isCurrent: true },
            ]
          : [
              { label: 'Salary', href: '/salaries', isCurrent: true },
            ])
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Salary"
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
          total={filteredSalaries.length}
          totalLabel="Total Sal"
          stackTotalStat={true}
          extraStatLabel="Total Sal. (Rs. In-Hand)"
          extraStatValue={totalInHandAmount}
          stackExtraStat={true}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          showStats={true}
          showSearch={true}
          showFilter={false}
          showSecondFilter={true}
          secondFilterValue={yearFilter}
          onSecondFilterChange={setYearFilter}
          secondFilterOptions={getYearOptions()}
          showSecondFilterIcon={false}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          actionButtons={[
            { 
              label: 'Add Salary', 
              icon: <FiPlus />, 
              variant: 'success' as const, 
              href: employeeId
                ? `/salaries/add?employeeId=${employeeId}${from === 'employment' ? '&from=employment' : ''}`
                : '/salaries/add'
            }
          ]}
          backButton={{
            onClick: () => {
              if (employeeId) {
                // If we’re viewing salaries from an employment context and have a resolved employment,
                // go back to that specific Employment Details page. Otherwise go back to the employee.
                if (from === 'employment' && resolvedEmploymentId) {
                  router.push(`/employments/${resolvedEmploymentId}`);
                } else {
                  router.push(`/employees/${employeeId}`);
                }
              } else {
                router.push('/employees');
              }
            },
          }}
          headerClassName="px-6 pt-6 pb-6"
        />

        <div className="overflow-x-auto px-6 mt-4">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leaves
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross (A)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions (B)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In-Hand (C)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSalaries.map((salary, idx) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                    {getMonthName(salary.month)} {salary.year}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                    {(salary as any).workDays ?? (salary as any).workingDays ?? (salary as any).totalWorkingDays ?? (salary as any).monthDays ?? '-'}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                    {(salary as any).leavesCount ?? (salary as any).totalLeaves ?? '-'}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    ₹{((salary as any).grossSalary ?? salary.totalSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    ₹{((salary as any).totalDeduction ?? (salary as any).totalDeductions ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    ₹{((salary as any).netSalary ?? salary.inhandSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-center">
                    {deleteConfirm === salary.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => confirmDelete(salary.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteSalaryMutation.isPending}
                        >
                          {deleteSalaryMutation.isPending ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={deleteSalaryMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <ActionButton
                          icon={<FiDownload className="w-5 h-5" />}
                          title="Download Salary Details"
                          colorClass="bg-green-100 text-green-600 hover:text-green-900"
                          href={null as any}
                          onClick={()=> handleDownload(salary)}
                        />
                        <ActionButton
                          icon={<FiEye className="w-5 h-5" />}
                          title="View Salary Details"
                          colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                          href={`/salaries/${salary.id}${employeeId ? `?employeeId=${employeeId}` : ''}`}
                        />
                        <ActionButton
                          icon={<FiEdit className="w-5 h-5" />}
                          title="Edit Salary"
                          colorClass="bg-orange-100 text-orange-600 hover:text-orange-900"
                          href={`/salaries/${salary.id}/edit${employeeId ? `?employeeId=${employeeId}` : ''}`}
                        />
                        <ActionButton
                          icon={<FiTrash2 className="w-5 h-5" />}
                          title="Delete Salary"
                          colorClass="bg-red-100 text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(salary.id)}
                          as="button"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSalaries.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <FaRupeeSign className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {employeeId ? 'No salary records found' : 'No salaries found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || yearFilter !== 'all'
                  ? 'Try adjusting your search, month, or year filter.'
                  : 'Get started by adding a salary record.'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 