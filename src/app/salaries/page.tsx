'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiEye, FiDownload, FiCpu, FiX, FiCheckCircle } from 'react-icons/fi';
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
import { FaRegSquarePlus } from 'react-icons/fa6';
import { FaHandSparkles } from 'react-icons/fa6';
import { pdf } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/app/doc_pages/pages/v2/SalarySlipGenerator';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { saveAs } from "file-saver";
import { addSalary, checkExistingSalary } from '@/utils/firebaseUtils';
import { calculateMonthlySalary } from '@/utils/monthlySalaryCalculationUtils';
import {
  findMissingMonths,
  getAllMonths,
  groupByYear,
  monthNumberToShortName,
  type YearMonth,
} from '@/utils/missingSalaryUtils';





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
  type IncrementHeaderMeta = {
    index: number;
    incrementDate: string;
    oldCtc: number;
    newCtc: number;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [calendarYearFilter, setCalendarYearFilter] = useState('all');
  const [incrementFilter, setIncrementFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectionEnabled, setSelectionEnabled] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [resolvedEmploymentId, setResolvedEmploymentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isAiCreating, setIsAiCreating] = useState(false);
  const [incrementHeaderMeta, setIncrementHeaderMeta] = useState<IncrementHeaderMeta[]>([]);
  const [isCheckingMissingSalaries, setIsCheckingMissingSalaries] = useState(false);
  const [missingSalaryModalOpen, setMissingSalaryModalOpen] = useState(false);
  const [missingSalariesByYear, setMissingSalariesByYear] = useState<Record<number, number[]>>({});
  const [missingMonthsList, setMissingMonthsList] = useState<YearMonth[]>([]);
  const [missingSummary, setMissingSummary] = useState<{ expected: number; existing: number; missing: number }>({
    expected: 0,
    existing: 0,
    missing: 0,
  });
  const masterCheckboxRef = useRef<HTMLInputElement | null>(null);
  const masterClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredRowIdsRef = useRef<string[]>([]);
  const selectionEnabledRef = useRef(false);
  const selectedRowsRef = useRef<string[]>([]);
  
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

  // Build first increment metadata for header stats.
  useEffect(() => {
    if (!employeeId) {
      setIncrementHeaderMeta([]);
      return;
    }

    (async () => {
      try {
        const employments = await getEmploymentsByEmployee(employeeId);
        const allIncrements: IncrementHeaderMeta[] = [];
        let globalIncrementIndex = 0;

        for (const employment of employments || []) {
          const joiningCtc = Number((employment as any)?.joiningCtc ?? (employment as any)?.salary ?? 0) || 0;
          const increments = Array.isArray((employment as any)?.increments) ? (employment as any).increments : [];
          const timeline = increments
            .filter((inc: any) => inc?.incrementDate)
            .map((inc: any) => ({ ...inc, dateObj: new Date(inc.incrementDate) }))
            .filter((inc: any) => !Number.isNaN(inc.dateObj.getTime()))
            .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());

          let previousCtc = joiningCtc;
          for (const inc of timeline) {
            const newCtc = Number(inc?.incrementedCtc ?? inc?.newSalary ?? previousCtc) || previousCtc;
            globalIncrementIndex += 1;
            allIncrements.push({
              index: globalIncrementIndex,
              incrementDate: inc.incrementDate,
              oldCtc: previousCtc,
              newCtc,
            });
            previousCtc = newCtc;
          }
        }

        setIncrementHeaderMeta(allIncrements);
      } catch (e) {
        console.error('Failed to build increment labels for salary list:', e);
        setIncrementHeaderMeta([]);
      }
    })();
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

  const toIsoDateOnly = (value?: string | null): string | null => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  };

  const getPeriodStart = (employment: any): Date | null => {
    const startRaw = employment?.joiningDate || employment?.startDate;
    const start = toIsoDateOnly(startRaw);
    return start ? new Date(start) : null;
  };

  const getPeriodEnd = (employment: any): Date => {
    const isResigned =
      Boolean(employment?.isResignation) ||
      Boolean(employment?.is_resigned) ||
      String(employment?.employmentStatus || '').toLowerCase() === 'resigned';
    const endRaw = isResigned
      ? (employment?.lastWorkingDate || employment?.resignationDate || employment?.endDate)
      : null;
    const end = toIsoDateOnly(endRaw);
    return end ? new Date(end) : new Date();
  };

  const monthStart = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = (d: Date): Date => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const addMonths = (d: Date, count: number): Date => new Date(d.getFullYear(), d.getMonth() + count, 1);

  const handleCreateWithAi = async () => {
    if (!employeeId) {
      toast.error('Please open salary list for a specific employee first.');
      return;
    }

    try {
      setIsAiCreating(true);
      if (!missingMonthsList.length) {
        // No missing salaries — do not hit API.
        setMissingSalaryModalOpen(true);
        toast.error('No missing salaries to generate.', { id: 'ai-salary-create' });
        return;
      }

      toast.loading('AI salary creation started...', { id: 'ai-salary-create' });

      const employments = await getEmploymentsByEmployee(employeeId);
      if (!employments?.length) {
        toast.error('No employment record found for this employee.', { id: 'ai-salary-create' });
        return;
      }

      const chronologicalEmployments = [...employments].sort((a: any, b: any) => {
        const ad = new Date(a.startDate || a.joiningDate || 0).getTime();
        const bd = new Date(b.startDate || b.joiningDate || 0).getTime();
        return ad - bd;
      });

      let createdCount = 0;
      let failedCount = 0;

      const missingKeySet = new Set(missingMonthsList.map((m) => `${m.year}-${m.month}`));

      for (const employment of chronologicalEmployments as any[]) {
        const periodStart = getPeriodStart(employment);
        if (!periodStart) continue;
        const periodEnd = getPeriodEnd(employment);
        if (periodStart > periodEnd) continue;

        const increments: any[] = Array.isArray(employment?.increments)
          ? employment.increments
          : [];

        const incrementTimeline = increments
          .filter((inc) => inc?.incrementDate)
          .map((inc) => ({
            ...inc,
            incrementDateObj: new Date(inc.incrementDate),
          }))
          .filter((inc) => !Number.isNaN(inc.incrementDateObj.getTime()))
          .sort((a, b) => a.incrementDateObj.getTime() - b.incrementDateObj.getTime());

        const baseCtc = Number(
          employment?.joiningCtc ??
            employment?.salary ??
            employment?.incrementedCtc ??
            0
        ) || 0;
        const baseVariable = Number(
          employment?.joiningVariablePay ??
            employment?.currentVariablePay ??
            0
        ) || 0;
        const baseFixed = Number(employment?.joiningFixedPay ?? 0) || Math.max(0, baseCtc - baseVariable);
        const basePfIncluded = Number(employment?.employerPF ?? employment?.pf ?? 0) > 0;

        const startMonth = monthStart(periodStart);
        const endMonth = monthStart(periodEnd);

        for (
          let current = new Date(startMonth);
          current <= endMonth;
          current = addMonths(current, 1)
        ) {
          const month = current.getMonth() + 1;
          const year = current.getFullYear();
          if (!missingKeySet.has(`${year}-${month}`)) continue;

          const applicableIncrement = incrementTimeline
            .filter((inc) => inc.incrementDateObj <= monthEnd(current))
            .slice(-1)[0];

          const ctc = Number(
            applicableIncrement?.incrementedCtc ??
              applicableIncrement?.newSalary ??
              baseCtc
          ) || 0;
          const variablePay = Number(
            applicableIncrement?.incrementVariablePay ?? baseVariable
          ) || 0;
          const fixedPay = Number(
            applicableIncrement?.incrementFixedPay ?? (ctc - variablePay)
          ) || Math.max(0, ctc - variablePay);
          const pfIncluded =
            typeof applicableIncrement?.incrementPfIncluded === 'boolean'
              ? Boolean(applicableIncrement.incrementPfIncluded)
              : basePfIncluded;

          const calculated = calculateMonthlySalary({
            ctc,
            fixedPay,
            month,
            year,
            leavesCount: 0,
          });

          const pf = pfIncluded ? Number(calculated.pfDeduct || 0) : 0;
          const grossSalary =
            Number(calculated.basic || 0) +
            Number(calculated.hra || 0) +
            Number(calculated.conveyanceAllowance || 0) +
            Number(calculated.otherAllowance || 0);
          const totalDeduction = pf + Number(calculated.ptDeduct || 0) + Number(calculated.leavesDeductAmt || 0);
          const netSalary = grossSalary - totalDeduction;

          try {
            await addSalary({
              employeeId,
              employmentId: employment?.id || '',
              day: 1,
              month,
              year,
              ctc,
              fixedPay,
              variablePay,
              workDays: Number(calculated.monthDays || 0),
              leavesCount: 0,
              basic: Number(calculated.basic || 0),
              hra: Number(calculated.hra || 0),
              conveyanceAllowance: Number(calculated.conveyanceAllowance || 0),
              otherAllowance: Number(calculated.otherAllowance || 0),
              ptDeduct: Number(calculated.ptDeduct || 0),
              leavesDeductAmt: Number(calculated.leavesDeductAmt || 0),
              otherDeduction: 0,
              basicSalary: Number(calculated.basic || 0),
              inhandSalary: Number(netSalary.toFixed(2)),
              totalSalary: Number(grossSalary.toFixed(2)),
              pf: Number(pf.toFixed(2)),
              grossSalary: Number(grossSalary.toFixed(2)),
              totalDeduction: Number(totalDeduction.toFixed(2)),
              netSalary: Number(netSalary.toFixed(2)),
              perMonth: Number(calculated.perMonth || 0),
              perDay: Number(calculated.perDay || 0),
              monthDays: Number(calculated.monthDays || 0),
            } as any);
            createdCount += 1;
          } catch (error) {
            console.error('Failed to auto-create salary:', { month, year, error });
            failedCount += 1;
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['salaries'] });
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'list'] });
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'byEmployee', employeeId] });
      await refetchEmployeeSalaries();

      if (createdCount > 0) {
        toast.success(
          `Created ${createdCount} salaries${failedCount ? `, failed ${failedCount}` : ''}.`,
          { id: 'ai-salary-create' }
        );
        // Re-check missing after generation to keep modal consistent.
        setTimeout(() => {
          handleCheckMissingSalaries();
        }, 0);
      } else {
        toast.error(
          failedCount > 0
            ? `No salary created. Failed ${failedCount}.`
            : `No new salaries created.`,
          { id: 'ai-salary-create' }
        );
      }
    } catch (error: any) {
      console.error('AI create salary failed:', error);
      toast.error(error?.message || 'Failed to create salaries with AI.', { id: 'ai-salary-create' });
    } finally {
      setIsAiCreating(false);
    }
  };

  const toSafeDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleCheckMissingSalaries = async () => {
    if (!employeeId) {
      toast.error('Please open salaries for a specific employee.');
      return;
    }

    try {
      setIsCheckingMissingSalaries(true);
      const employments = await getEmploymentsByEmployee(employeeId);
      if (!employments?.length) {
        setMissingSalariesByYear({});
        setMissingMonthsList([]);
        setMissingSummary({ expected: 0, existing: 0, missing: 0 });
        setMissingSalaryModalOpen(true);
        return;
      }

      const expectedMonths: YearMonth[] = [];
      for (const employment of employments as any[]) {
        const startDate = toSafeDate(employment?.joiningDate || employment?.startDate);
        if (!startDate) continue;

        const endDateRaw = employment?.lastWorkingDate || employment?.endDate || null;
        const endDate = toSafeDate(endDateRaw) || new Date();
        expectedMonths.push(...getAllMonths(startDate, endDate));
      }

      const paidMonths: YearMonth[] = (employeeSalaries || [])
        .map((salary: any) => {
          const year = Number(salary?.year);
          const month = Number(salary?.month);
          if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
          return { year, month } as YearMonth;
        })
        .filter(Boolean) as YearMonth[];

      const missingMonths = findMissingMonths(expectedMonths, paidMonths);
      const grouped = groupByYear(missingMonths);
      setMissingSalariesByYear(grouped);
      setMissingMonthsList(missingMonths);

      // Summary counts (deduped months)
      const expectedDedup = new Set(expectedMonths.map((m) => `${m.year}-${m.month}`));
      const paidDedup = new Set(paidMonths.map((m) => `${m.year}-${m.month}`));
      setMissingSummary({
        expected: expectedDedup.size,
        existing: paidDedup.size,
        missing: missingMonths.length,
      });
      setMissingSalaryModalOpen(true);
    } catch (error) {
      console.error('Failed to check missing salaries:', error);
      toast.error('Failed to check missing salaries');
    } finally {
      setIsCheckingMissingSalaries(false);
    }
  };

  const toIntOrNull = (value: unknown): number | null => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getFinancialYearFromMonthYear = (month: number | null, year: number | null): number | null => {
    if (month === null || year === null) return null;
    return month >= 4 ? year : year - 1;
  };

  const getSalaryMonthDate = (salary: Salary): Date | null => {
    const month = toIntOrNull((salary as any).month);
    const year = toIntOrNull((salary as any).year);
    if (month === null || year === null || month < 1 || month > 12) return null;
    return new Date(year, month - 1, 1);
  };

  const filteredSalaries = salaries
    .filter((salary) => {
      const matchesSearch =
        salary.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salary.employmentId?.toLowerCase().includes(searchTerm.toLowerCase());

      const salaryMonth = toIntOrNull((salary as any).month);
      const salaryYear = toIntOrNull(salary.year);
      const salaryFinancialYear = getFinancialYearFromMonthYear(salaryMonth, salaryYear);
      const selectedFinancialYear = toIntOrNull(yearFilter);
      const selectedCalendarYear = toIntOrNull(calendarYearFilter);

      const matchesYear =
        yearFilter === 'all' ||
        (salaryFinancialYear !== null &&
          selectedFinancialYear !== null &&
          salaryFinancialYear === selectedFinancialYear);

      const matchesCalendarYear =
        calendarYearFilter === 'all' ||
        (salaryYear !== null &&
          selectedCalendarYear !== null &&
          salaryYear === selectedCalendarYear);

      const selectedIncrementNumber = toIntOrNull(incrementFilter);
      const selectedIncrementIndex =
        selectedIncrementNumber === null
          ? -1
          : incrementHeaderMeta.findIndex((inc) => inc.index === selectedIncrementNumber);
      const selectedIncrementMeta = selectedIncrementIndex >= 0 ? incrementHeaderMeta[selectedIncrementIndex] : null;
      const previousIncrementMeta = selectedIncrementIndex > 0 ? incrementHeaderMeta[selectedIncrementIndex - 1] : null;
      const selectedIncrementDate = selectedIncrementMeta ? new Date(selectedIncrementMeta.incrementDate) : null;
      const previousIncrementDate = previousIncrementMeta ? new Date(previousIncrementMeta.incrementDate) : null;
      const salaryMonthDate = getSalaryMonthDate(salary);
      const matchesIncrement =
        incrementFilter === 'all' ||
        (selectedIncrementDate !== null &&
          !Number.isNaN(selectedIncrementDate.getTime()) &&
          salaryMonthDate !== null &&
          salaryMonthDate <= selectedIncrementDate &&
          (previousIncrementDate === null ||
            Number.isNaN(previousIncrementDate.getTime()) ||
            salaryMonthDate > previousIncrementDate));

      const matchesEmployeeId = employeeId ? salary.employeeId === employeeId : true;

      return matchesSearch && matchesYear && matchesCalendarYear && matchesIncrement && matchesEmployeeId;
    })
    .sort((a, b) => {
      const yearA = Number((a as any).year) || 0;
      const yearB = Number((b as any).year) || 0;
      if (yearB !== yearA) return yearB - yearA;

      const monthA = Number((a as any).month) || 0;
      const monthB = Number((b as any).month) || 0;
      return monthB - monthA;
    });

  const filteredRowIds = useMemo(() => filteredSalaries.map((s) => s.id), [filteredSalaries]);
  const filteredRowIdsKey = useMemo(() => filteredRowIds.join('|'), [filteredRowIds]);

  filteredRowIdsRef.current = filteredRowIds;
  selectionEnabledRef.current = selectionEnabled;
  selectedRowsRef.current = selectedRows;

  // Keep selected rows in sync with currently applied filters.
  useEffect(() => {
    if (!selectionEnabled) return;
    const idSet = new Set(filteredRowIds);
    setSelectedRows((prev) => prev.filter((id) => idSet.has(id)));
  }, [filteredRowIdsKey, selectionEnabled]);

  const masterAllSelected =
    selectionEnabled &&
    filteredRowIds.length > 0 &&
    selectedRows.length === filteredRowIds.length;
  const masterIndeterminate =
    selectionEnabled &&
    selectedRows.length > 0 &&
    selectedRows.length < filteredRowIds.length;

  useEffect(() => {
    const el = masterCheckboxRef.current;
    if (el) el.indeterminate = masterIndeterminate;
  }, [masterIndeterminate, masterAllSelected, selectionEnabled]);

  useEffect(() => {
    return () => {
      if (masterClickTimerRef.current) {
        clearTimeout(masterClickTimerRef.current);
        masterClickTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectionEnabled || selectedRows.length > 0) return;

    const handleOutsideCheckboxClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('input[type="checkbox"]')) return;

      resetSelectionState();
    };

    document.addEventListener('mousedown', handleOutsideCheckboxClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideCheckboxClick);
    };
  }, [selectionEnabled, selectedRows.length]);

  const resetSelectionState = () => {
    setSelectedRows([]);
    setSelectionEnabled(false);
    if (masterClickTimerRef.current) {
      clearTimeout(masterClickTimerRef.current);
      masterClickTimerRef.current = null;
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runMasterSingleClick = () => {
    const ids = filteredRowIdsRef.current;
    if (ids.length === 0) return;
    if (!selectionEnabledRef.current) {
      setSelectionEnabled(true);
      setSelectedRows([...ids]);
      return;
    }
    const sel = selectedRowsRef.current;
    const allSelected = ids.length > 0 && sel.length === ids.length && ids.every((id) => sel.includes(id));
    if (allSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...ids]);
    }
  };

  const handleMasterCheckboxClick = () => {
    if (masterClickTimerRef.current) {
      clearTimeout(masterClickTimerRef.current);
      masterClickTimerRef.current = null;
    }
    masterClickTimerRef.current = setTimeout(() => {
      masterClickTimerRef.current = null;
      runMasterSingleClick();
    }, 280);
  };

  const handleMasterCheckboxDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (masterClickTimerRef.current) {
      clearTimeout(masterClickTimerRef.current);
      masterClickTimerRef.current = null;
    }
    resetSelectionState();
  };

  const openBulkDeleteModal = () => {
    if (selectedRows.length === 0) return;
    setBulkDeleteIds(selectedRows);
    setBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      toast.loading('Deleting selected salaries...', { id: 'bulk-delete' });

      for (const id of bulkDeleteIds) {
        // Mutate sequentially to avoid rate/lock issues.
        await deleteSalaryMutation.mutateAsync(id);
      }

      toast.success(`${bulkDeleteIds.length} Salaries Selected`, { id: 'bulk-delete' });
      setBulkDeleteOpen(false);
      setBulkDeleteIds([]);
      resetSelectionState();

      // Ensure list updates immediately after bulk delete.
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'list'] });
      if (employeeId) {
        await queryClient.invalidateQueries({ queryKey: ['salaries', 'byEmployee', employeeId] });
        await refetchEmployeeSalaries();
      } else {
        await refetchAllSalaries();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete selected salaries', { id: 'bulk-delete' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const closeBulkDeleteModal = () => {
    if (isBulkDeleting) return;
    setBulkDeleteOpen(false);
  };

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
  }, [searchTerm, yearFilter, incrementFilter, employeeId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [calendarYearFilter]);

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
    const years = new Set<number>();
    salaries.forEach((salary) => {
      const month = toIntOrNull((salary as any).month);
      const year = toIntOrNull((salary as any).year);
      const fyStart = getFinancialYearFromMonthYear(month, year);
      if (fyStart !== null) years.add(fyStart);
    });

    return [
      { value: 'all', label: 'Fin. Year' },
      ...Array.from(years)
        .sort((a, b) => b - a)
        .map((fyStart) => ({
          value: String(fyStart),
          label: `FY ${fyStart}\u2013${String(fyStart + 1).slice(-2)}`,
        })),
    ];
  };

  const getIncrementOptions = () => {
    return [
      { value: 'all', label: 'Increments' },
      ...incrementHeaderMeta.map((inc) => ({
        value: String(inc.index),
        label: `Increment ${inc.index}`,
      })),
    ];
  };

  const getCalendarYearOptions = () => {
    const years = new Set<number>();
    salaries.forEach((salary) => {
      const year = toIntOrNull((salary as any).year);
      if (year !== null) years.add(year);
    });

    return [
      { value: 'all', label: 'Year' },
      ...Array.from(years)
        .sort((a, b) => b - a)
        .map((year) => ({
          value: String(year),
          label: String(year),
        })),
    ];
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
              className="p-1 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FaSyncAlt size={14} />
            </button>
          }
          total={filteredSalaries.length}
          totalLabel="Total Sal"
          stackTotalStat={true}
          extraStatLabel="Total Sal. (In Hand)"
          extraStatValue={totalInHandAmount}
          extraStatValuePrefix={<FaRupeeSign className="mr-1" />}
          stackExtraStat={true}
          dropdown={
            incrementHeaderMeta.length > 0 ? (
              <span className="pr-2 py-1 inline-flex w-full flex-row flex-wrap items-center justify-center gap-2 text-center">
                {incrementHeaderMeta.map((inc) => (
                  <span
                    key={`${inc.index}-${inc.incrementDate}`}
                    className="rounded-md border border-gray-200 px-2 py-1 inline-flex flex-col items-center leading-tight text-center"
                  >
                    <span className="font-semibold">{`Increment ${inc.index}`}</span>
                    <span>{formatDateToDayMonYear(inc.incrementDate)}</span>
                    <span>{`₹${inc.oldCtc.toLocaleString('en-IN')} -> ₹${inc.newCtc.toLocaleString('en-IN')}`}</span>
                  </span>
                ))}
              </span>
            ) : undefined
          }
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          showStats={true}
          showSearch={true}
          showFilter={incrementHeaderMeta.length > 0}
          showFilterIcon={false}
          filterValue={incrementFilter}
          onFilterChange={setIncrementFilter}
          filterOptions={getIncrementOptions()}
          showSecondFilter={true}
          secondFilterValue={yearFilter}
          onSecondFilterChange={setYearFilter}
          secondFilterOptions={getYearOptions()}
          showSecondFilterIcon={false}
          secondFilterContainerClassName="sm:w-34 text-sm py-1 px-2"
          showThirdFilter={true}
          thirdFilterValue={calendarYearFilter}
          onThirdFilterChange={setCalendarYearFilter}
          thirdFilterOptions={getCalendarYearOptions()}
          showThirdFilterIcon={false}
          searchContainerClassName="sm:w-36"
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          actionButtons={[
            {
              label: isCheckingMissingSalaries ? 'Checking...' : 'Check Missing Salaries',
              variant: 'primary' as const,
              hollow: true,
              onClick: handleCheckMissingSalaries,
              disabled: isCheckingMissingSalaries || !employeeId,
            },
            {
              label: isAiCreating ? 'Creating...' : 'Create with AI',
              icon: <FaHandSparkles className="w-4 h-4" />,
              variant: 'primary' as const,
              pill: true,
              // First check missing salaries; only generate if missing.
              onClick: handleCheckMissingSalaries,
              disabled: isAiCreating || isCheckingMissingSalaries || !employeeId,
            },
            { 
              label: 'Create Salary', 
              icon: <FaRegSquarePlus />, 
              variant: 'success' as const, 
              pill: true,
              href: employeeId
                ? `/salaries/add?employeeId=${employeeId}${from === 'employment' ? '&from=employment' : ''}`
                : '/salaries/add'
            },
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
          headerClassName="px-6 pt-6 pb-2"
        />

        <div className="overflow-x-auto px-6 mt-0">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-2">
                    {/* Reserve space so header width doesn't jump */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {selectedRows.length > 0 && (
                        <button
                          type="button"
                          onClick={openBulkDeleteModal}
                          disabled={isBulkDeleting}
                          aria-label="Delete selected salaries"
                          title="Delete selected salaries"
                          className="border border-gray-300 rounded-md p-1 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={masterCheckboxRef}
                      type="checkbox"
                      aria-label="Select all salaries for bulk actions. Double-click to cancel selection mode."
                      title="Select all (double-click to exit selection mode)"
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      checked={masterAllSelected}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMasterCheckboxClick();
                      }}
                      onDoubleClick={handleMasterCheckboxDoubleClick}
                    />
                    <span>Sr. No</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payable Days
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
                    <div className="flex items-center justify-center gap-2">
                      {selectionEnabled && (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(salary.id)}
                          onChange={() => toggleRowSelection(salary.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                      )}
                      <span>{startIndex + idx + 1}</span>
                    </div>
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
                          title="Download Salary Slip"
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
                {searchTerm || yearFilter !== 'all' || calendarYearFilter !== 'all' || incrementFilter !== 'all'
                  ? 'Try adjusting your search, month, or year filter.'
                  : 'Get started by adding a salary record.'
                }
              </p>
            </div>
          )}
        </div>

        {bulkDeleteOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={closeBulkDeleteModal}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeBulkDeleteModal}
                disabled={isBulkDeleting}
                aria-label="Close delete popup"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX className="w-4 h-4" />
              </button>

              <h2 className="text-base font-semibold text-gray-900">
                {bulkDeleteIds.length} Salaries Selected
              </h2>

              <p className="mt-3 text-sm text-gray-700">
                Are you sure you want to delete the selected records?
              </p>
              <p className="mt-2 text-sm text-gray-700">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex items-end justify-between gap-3">
                <button
                  type="button"
                  onClick={closeBulkDeleteModal}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  {isBulkDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {missingSalaryModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setMissingSalaryModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMissingSalaryModalOpen(false)}
                aria-label="Close missing salaries popup"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center"
              >
                <FiX className="w-4 h-4" />
              </button>

              <h2 className="text-base font-semibold text-gray-900">Missing Salaries</h2>
              <p className="mt-1 text-xs text-gray-500">
                Expected: <span className="font-medium text-gray-700">{missingSummary.expected}</span> • Existing:{' '}
                <span className="font-medium text-gray-700">{missingSummary.existing}</span> • Missing:{' '}
                <span className="font-medium text-gray-700">{missingSummary.missing}</span>
              </p>

              {Object.keys(missingSalariesByYear).length === 0 ? (
                <p className="mt-4 text-sm text-gray-700">No Missing Salaries ✅</p>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-gray-800">
                  {Object.entries(missingSalariesByYear)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([year, months]) => (
                      <p key={year}>
                        <span className="font-medium">{year}</span> {'\u2192'}{' '}
                        {months.map((m) => monthNumberToShortName(m)).join(', ')}
                      </p>
                    ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMissingSalaryModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 inline-flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancle
                </button>
                <button
                  type="button"
                  onClick={handleCreateWithAi}
                  disabled={isAiCreating || !employeeId || missingMonthsList.length === 0}
                  className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiCreating ? 'Generating...' : 'Generate Missing Salaries'}
                </button>
              </div>
            </div>
          </div>
        )}
        
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