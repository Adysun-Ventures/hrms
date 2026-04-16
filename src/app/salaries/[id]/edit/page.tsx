'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiCheckCircle, FiX } from 'react-icons/fi';
import { FaSyncAlt } from 'react-icons/fa';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import TableHeader from '@/components/ui/TableHeader';
import { Salary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { useEmployeeSelfSalary, useEmployeeUpdateSalary, useSalary, useUpdateSalary } from '@/hooks/useSalaries';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getEmployeeNameById, getEmploymentsByEmployee, getEmploymentsByEmployeeSelf, checkExistingSalary, updateEmployment } from '@/utils/firebaseUtils';
import {
  calculateMonthlySalary,
  getProfessionalTaxByMonth,
  type MonthlySalaryResult,
} from '@/utils/monthlySalaryCalculationUtils';
import { use } from 'react';
import { useAuth } from '@/context/AuthContext';

// Simplify the SalaryFormData type
type SalaryFormData = {
  employeeId: string;
  employmentId: string;
  day: number;
  month: number;
  year: number;
  ctc: number;
  fixedPay: number;
  workDays: number;
  leavesCount: number;
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  ptDeduct: number;
  leavesDeductAmt: number;
  otherDeduction: number;
  variablePay: number;
};

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function EditSalaryPage({ params }: PageParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPfEnabled, setIsPfEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employmentId, setEmploymentId] = useState<string>('');
  const [hasPeriodChanges, setHasPeriodChanges] = useState(false);
  const [salaryCalcMode, setSalaryCalcMode] = useState<'ctc' | 'variable' | 'fixed' | 'other'>('variable');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUserData } = useAuth();
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const { id } = use(params);
  const from = searchParams?.get('from');
  const Layout: any = isEmployeeUser ? EmployeeLayout : DashboardLayout;

  const {
    data: adminSalary,
    isLoading: isAdminSalaryLoading,
  } = useSalary(id);
  const {
    data: selfSalary,
    isLoading: isSelfSalaryLoading,
  } = useEmployeeSelfSalary(id);
  const salary = isEmployeeUser ? selfSalary : adminSalary;
  const isSalaryLoading = isEmployeeUser ? isSelfSalaryLoading : isAdminSalaryLoading;

  const updateSalaryMutationAdmin = useUpdateSalary();
  const updateSalaryMutationEmployee = useEmployeeUpdateSalary();
  const updateSalaryMutation = isEmployeeUser ? updateSalaryMutationEmployee : updateSalaryMutationAdmin;
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SalaryFormData>({
    mode: 'onChange', // Enable real-time validation and updates
  });

  // Watch input values for real-time calculation
  const ctc = watch('ctc') || 0;
  const fixedPay = watch('fixedPay') || 0;
  const day = Number(watch('day')) || 0;
  const year = Number(watch('year')) || new Date().getFullYear();
  const month = Number(watch('month')) || new Date().getMonth() + 1;
  const leavesCount = watch('leavesCount') || 0;
  const ptDeduct = watch('ptDeduct') || getProfessionalTaxByMonth(month);
  const variablePay = watch('variablePay') || 0;
  const otherAllowance = watch('otherAllowance') || 0;
  const formatINR = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

  // Real-time calculation using useMemo - calculates on every render when inputs change
  const calculations: MonthlySalaryResult = useMemo(() => {
    // Convert all values to numbers and validate
    const numCtc = Number(ctc) || 0;
    const numFixedPay = Number(fixedPay) || 0;
    const numYear = Number(year) || new Date().getFullYear();
    const numMonth = Number(month) || new Date().getMonth() + 1;
    const numLeavesCount = Number(leavesCount) || 0;
    
    // Validate month (1-12) and year (1900-2100), and ensure leavesCount is non-negative
    if (numMonth >= 1 && numMonth <= 12 && numYear >= 1900 && numYear <= 2100 && numLeavesCount >= 0) {
      try {
        return calculateMonthlySalary({
          ctc: numCtc,
          fixedPay: numFixedPay,
          year: numYear,
          month: numMonth,
          leavesCount: numLeavesCount
        });
      } catch (error) {
        console.error('Calculation error:', error);
        // Return default values on error
        return {
          variablePay: 0,
          monthDays: 0,
          perMonth: 0,
          perDay: 0,
          workDays: 0,
          basic: 0,
          hra: 0,
          conveyanceAllowance: 0,
          otherAllowance: 0,
          grossSalary: 0,
          ptDeduct: getProfessionalTaxByMonth(numMonth),
          leavesDeductAmt: 0,
          totalDeduction: 0,
          netSalary: 0,
        };
      }
    }
    // Return default values if conditions not met
    return {
      variablePay: 0,
      monthDays: 0,
      perMonth: 0,
      perDay: 0,
      workDays: 0,
      basic: 0,
      hra: 0,
      conveyanceAllowance: 0,
      otherAllowance: 0,
      grossSalary: 0,
      ptDeduct: getProfessionalTaxByMonth(numMonth),
      leavesDeductAmt: 0,
      totalDeduction: 0,
      netSalary: 0,
    };
  }, [ctc, fixedPay, year, month, leavesCount]);

  const adjustedWorkDays = useMemo(() => {
    const monthDays = Number(calculations.monthDays) || 0;
    const selectedDay = Number(day) || 1;
    const selectedLeaves = Number(leavesCount) || 0;
    return Math.max(0, monthDays - (selectedDay - 1) - selectedLeaves);
  }, [calculations.monthDays, day, leavesCount]);

  const monthlySalaryPayable = useMemo(() => {
    const monthlyFixed = Number(fixedPay || 0) / 12;
    const monthDays = Number(calculations.monthDays) || 0;
    const payableDays = Number(adjustedWorkDays) || 0;
    if (monthDays <= 0) return 0;
    return (monthlyFixed / monthDays) * payableDays;
  }, [fixedPay, calculations.monthDays, adjustedWorkDays]);
  const payableComponents = useMemo(() => {
    const totalPayable = Number(monthlySalaryPayable) || 0;
    const basic = totalPayable * 0.5;
    const hra = basic * 0.4;
    const conveyanceAllowance = 2000;
    const otherAllowance = totalPayable - (basic + hra + conveyanceAllowance);
    return {
      basic,
      hra,
      conveyanceAllowance,
      otherAllowance,
      grossSalary: basic + hra + conveyanceAllowance + otherAllowance,
    };
  }, [monthlySalaryPayable]);
  // Use calculated values directly for display
  const leavesDeductAmt = calculations.leavesDeductAmt;
  const grossSalary = payableComponents.grossSalary;
  const pfDeduct = isPfEnabled ? (calculations.pfDeduct || 0) : 0;
  const otherDeduction = watch('otherDeduction') || 0;
  const totalDeduction = pfDeduct + (ptDeduct || 200) + leavesDeductAmt + otherDeduction;
  const netSalary = grossSalary - totalDeduction;

  // Keep dependent fields in sync from whichever salary input user edits.
  useEffect(() => {
    const ctcNum = Number(ctc) || 0;
    const variableNum = Number(variablePay) || 0;
    const fixedNum = Number(fixedPay) || 0;
    const otherNum = Number(otherAllowance) || 0;

    const maybeSet = (name: keyof SalaryFormData, next: number, current: number) => {
      if (Math.abs((current || 0) - (next || 0)) > 0.01) {
        setValue(name, Number(next.toFixed(2)) as any, { shouldValidate: false, shouldDirty: true });
      }
    };

    if (salaryCalcMode === 'ctc' || salaryCalcMode === 'variable') {
      const nextFixed = Math.max(0, ctcNum - variableNum);
      const monthlyFixed = nextFixed / 12;
      const basic = monthlyFixed * 0.5;
      const hra = basic * 0.4;
      const conveyance = 2000;
      const nextOther = monthlyFixed - (basic + hra + conveyance);
      maybeSet('fixedPay', nextFixed, fixedNum);
      maybeSet('otherAllowance', nextOther, otherNum);
      return;
    }

    if (salaryCalcMode === 'fixed') {
      const nextCtc = fixedNum + variableNum;
      const monthlyFixed = fixedNum / 12;
      const basic = monthlyFixed * 0.5;
      const hra = basic * 0.4;
      const conveyance = 2000;
      const nextOther = monthlyFixed - (basic + hra + conveyance);
      maybeSet('ctc', nextCtc, ctcNum);
      maybeSet('otherAllowance', nextOther, otherNum);
      return;
    }

    const monthlyFixedFromOther = (otherNum + 2000) / 0.3;
    const nextFixed = monthlyFixedFromOther * 12;
    const nextCtc = nextFixed + variableNum;
    maybeSet('fixedPay', nextFixed, fixedNum);
    maybeSet('ctc', nextCtc, ctcNum);
  }, [ctc, variablePay, fixedPay, otherAllowance, salaryCalcMode, setValue]);

  // Update form values in real-time when calculations change
  useEffect(() => {
    setValue('workDays', adjustedWorkDays, { shouldValidate: false, shouldDirty: false });
    setValue('basic', payableComponents.basic, { shouldValidate: false, shouldDirty: false });
    setValue('hra', payableComponents.hra, { shouldValidate: false, shouldDirty: false });
    setValue('conveyanceAllowance', payableComponents.conveyanceAllowance, { shouldValidate: false, shouldDirty: false });
    setValue('otherAllowance', payableComponents.otherAllowance, { shouldValidate: false, shouldDirty: false });
    setValue('leavesDeductAmt', calculations.leavesDeductAmt, { shouldValidate: false, shouldDirty: false });
    
    // Keep PT deduction aligned with selected month rule.
    setValue('ptDeduct', calculations.ptDeduct, { shouldValidate: false, shouldDirty: false });
  }, [calculations, adjustedWorkDays, payableComponents, setValue, ptDeduct]);

  // Watch for form changes
  const watchedValues = watch();
  
  // Check for changes whenever form values change
  useEffect(() => {
    if (salary) {
      // Only track month/year changes (which could cause duplicates)
      // Allow salary amount changes freely
      const hasPeriodChanges = 
        watchedValues.month !== salary.month ||
        watchedValues.year !== salary.year;
      
      setHasPeriodChanges(hasPeriodChanges);
    }
  }, [watchedValues, salary]);

  // Fetch employee name and employment data when employeeId is available
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (employeeId) {
        try {
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);

          // Fetch latest employment for potential pre-fill
          const employments = isEmployeeUser
            ? await getEmploymentsByEmployeeSelf(employeeId)
            : await getEmploymentsByEmployee(employeeId);
          if (employments && employments.length > 0) {
            const latestEmployment = employments[0];
            setEmploymentId(latestEmployment.id);

            // Edit Salary: Variable Pay comes from the salary document (reset below), not employment.
            setValue('employmentId', latestEmployment.id, { shouldValidate: false, shouldDirty: false });
            setIsPfEnabled(Number((latestEmployment as any).pf ?? (latestEmployment as any).employerPF ?? 0) > 0);
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeData();
  }, [employeeId, isEmployeeUser, setValue]);

  // Form reset logic - load existing salary data
  useEffect(() => {
    if (salary) {
      if (salary.employeeId) {
        setEmployeeId(salary.employeeId);
      }
      
      // Extract values from existing salary record (Variable Pay from DB field, else CTC − Fixed)
      const salaryData = salary as any;
      const ctcDb = Number(salaryData.ctc) || 0;
      const fixedDb = Number(salaryData.fixedPay) || 0;
      const storedVar = salaryData.variablePay;
      const variablePayFromDb =
        storedVar !== undefined && storedVar !== null && String(storedVar).trim() !== ''
          ? Number(storedVar)
          : Math.round((ctcDb - fixedDb) * 100) / 100;

      reset({
        employeeId: salary.employeeId || employeeId || '',
        employmentId: salary.employmentId || '',
        day: new Date().getDate(),
        month: salary.month || 1,
        year: salary.year || new Date().getFullYear(),
        ctc: ctcDb,
        fixedPay: fixedDb,
        variablePay: Number.isFinite(variablePayFromDb) ? variablePayFromDb : 0,
        workDays: salaryData.workDays || 0,
        leavesCount: salaryData.leavesCount ?? salaryData.totalLeaves ?? 0,
        basic: salaryData.basic || salary.basicSalary || 0,
        hra: salaryData.hra || 0,
        conveyanceAllowance: salaryData.conveyanceAllowance || 0,
        otherAllowance: salaryData.otherAllowance || 0,
        ptDeduct: salaryData.ptDeduct || getProfessionalTaxByMonth(Number(salary.month || 1)),
        leavesDeductAmt: salaryData.leavesDeductAmt || 0,
        otherDeduction: salaryData.otherDeduction || 0
      });
      setIsPfEnabled(Number(salaryData.pf || 0) > 0);
    }
  }, [salary, reset, employeeId]);

  // onSubmit function
  const onSubmit = async (data: SalaryFormData) => {
    try {
      // Only validate for duplicates if month/year changed (which could cause duplicates)
      const hasPeriodChanges = 
        data.month !== salary?.month ||
        data.year !== salary?.year;

      if (hasPeriodChanges) {
        const exists = await checkExistingSalary(data.employeeId, data.month, data.year, id);
        if (exists) {
          toast.error(`Salary for ${getMonthName(data.month)} ${data.year} already exists for this employee.`);
          return;
        }
      }

      // Validate required inputs
      if (!data.ctc || !data.fixedPay) {
        toast.error('Please enter CTC and Fixed Pay to calculate salary.');
        return;
      }

      setIsSubmitting(true);
      toast.loading('Updating salary...', { id: 'update-salary' });
      
      // Recalculate using utility function to ensure accuracy
      const calculations = calculateMonthlySalary({
        ctc: data.ctc,
        fixedPay: data.fixedPay,
        year: data.year,
        month: data.month,
        leavesCount: data.leavesCount || 0
      });

      // Use calculated values (form values may be stale)
      const finalGrossSalary = payableComponents.grossSalary;
      const finalWorkDays = Math.max(
        0,
        (Number(calculations.monthDays) || 0) - ((Number(data.day) || 1) - 1) - (Number(data.leavesCount) || 0)
      );
      const finalOtherDeduction = Number(data.otherDeduction || 0) || 0;
      const finalPfDeduct = isPfEnabled ? (calculations.pfDeduct || 0) : 0;
      const finalTotalDeduction =
        (finalPfDeduct || 0) +
        (data.ptDeduct || calculations.ptDeduct) +
        calculations.leavesDeductAmt +
        finalOtherDeduction;
      const finalNetSalary = finalGrossSalary - finalTotalDeduction;
      
      await updateSalaryMutation.mutateAsync({
        id: id,
        data: {
          ...data,
          employeeId: employeeId || data.employeeId,
          employmentId: employmentId || data.employmentId,
          basicSalary: payableComponents.basic,
          inhandSalary: finalNetSalary,
          totalSalary: finalGrossSalary,
          workDays: finalWorkDays,
          leavesCount: data.leavesCount,
          ctc: data.ctc,
          fixedPay: data.fixedPay,
          basic: payableComponents.basic,
          hra: payableComponents.hra,
          conveyanceAllowance: payableComponents.conveyanceAllowance,
          otherAllowance: payableComponents.otherAllowance,
          ptDeduct: data.ptDeduct || calculations.ptDeduct,
          leavesDeductAmt: calculations.leavesDeductAmt,
          pf: finalPfDeduct,
          otherDeduction: finalOtherDeduction,
          grossSalary: finalGrossSalary,
          totalDeduction: finalTotalDeduction,
          variablePay: calculations.variablePay,
          perMonth: calculations.perMonth,
          perDay: calculations.perDay,
          monthDays: calculations.monthDays
        } as any
      });

      // Keep Employment PF toggle in sync with Salary PF selection.
      const linkedEmploymentId = employmentId || data.employmentId;
      if (linkedEmploymentId && !isEmployeeUser) {
        try {
          await updateEmployment(linkedEmploymentId, { pf: finalPfDeduct });
        } catch (syncError) {
          console.error('Failed to sync PF to employment:', syncError);
        }
      }
      
      toast.success('Salary updated successfully!', { id: 'update-salary' });
      // Navigate back to employee's salary list if we came from there
      if (isEmployeeUser || from === 'employee') {
        router.push('/employee/my-salary');
      } else {
        router.push(employeeId ? `/salaries?employeeId=${employeeId}` : `/salaries/${id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update salary', { id: 'update-salary' });
      setIsSubmitting(false);
    }
  };

  // Add helper function
  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || 'Unknown';
  };
  const leaveOptions: number[] = Array.from(
  { length: 16 }, // 0 → 15
  (_, i) => i
);

  if (isSalaryLoading) {
    return (
      <Layout
        allowedUserTypes={isEmployeeUser ? ['employee'] : ['admin']}
        breadcrumbItems={[
        { label: 'Dashboard', href: isEmployeeUser ? '/employee-dashboard' : '/dashboard' },
        { label: isEmployeeUser ? 'My Salary' : 'Salaries', href: isEmployeeUser ? '/employee/my-salary' : '/salaries' },
        { label: 'Loading...', isCurrent: true }
      ]}
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!salary) {
    return (
      <Layout allowedUserTypes={isEmployeeUser ? ['employee'] : ['admin']}>
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
          <p>Salary not found</p>
        </div>
        <div className="mt-4">
          <Link 
            href={isEmployeeUser ? '/employee/my-salary' : (employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries')} 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to {isEmployeeUser ? 'My Salary' : (employeeId ? `${employeeId}'s Salaries` : 'Salaries')}
          </Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbEmployeeId = employeeId || (salary as any).employeeId || '';
  const breadcrumbEmploymentId = employmentId || (salary as any).employmentId || '';

  return (
    <Layout
      allowedUserTypes={isEmployeeUser ? ['employee'] : ['admin']}
      breadcrumbItems={[
        ...(isEmployeeUser
          ? [
              { label: 'Dashboard', href: '/employee-dashboard' },
              { label: 'My Salary', href: '/employee/my-salary' },
            ]
          : [
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Employees', href: '/employees' },
              { label: employeeName || 'Loading...', href: breadcrumbEmployeeId ? `/employees/${breadcrumbEmployeeId}` : undefined },
              {
                label: 'Employment',
                href: breadcrumbEmploymentId ? `/employments/${breadcrumbEmploymentId}` : undefined,
              },
              {
                label: 'Salary',
                href: breadcrumbEmployeeId ? `/salaries?employeeId=${breadcrumbEmployeeId}` : '/salaries',
              },
            ]),
        { label: 'Edit Salary', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Edit Salary"
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
            href: isEmployeeUser
              ? '/employee/my-salary'
              : (employeeId 
                  ? `/salaries?employeeId=${employeeId}` 
                  : `/salaries/${id}`)
          }}
          actionButtons={[
            {
              label: 'Save',
              icon: <FiCheckCircle />,
              variant: 'success',
              onClick: handleSubmit(onSubmit),
              disabled: isSubmitting
            }
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          {/* Period Information */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500 mr-1">*</span>Month
              </label>
              <select
                {...register('month', { required: 'Month is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              {errors.month && (
                <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
              )}
            </div>

            {/* Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500 mr-1">*</span>Day
              </label>
              <select
                {...register('day', { required: 'Day is required', valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.day && (
                <p className="mt-1 text-sm text-red-600">{errors.day.message}</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
               <span className="text-red-500 mr-1">*</span> Year 
              </label>
              <select
  {...register('year', { required: 'Year is required' })}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Select Year</option>

  {Array.from(
    { length: (new Date().getFullYear() + 2) - 2020 + 1 },
    (_, i) => {
      const yr = 2020 + i;
      return (
        <option key={yr} value={yr}>
          {yr}
        </option>
      );
    }
  )}
</select>

              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            {/* Payable Days - Auto-calculated */}
            <div className=' md:col-span-3'>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payable Days 
              </label>
              <input
                type="number"
                {...register('workDays', { 
                  required: 'Work days is required',
                  min: { value: 0, message: 'Work days cannot be negative' },
                  valueAsNumber: true
                })}
                value={adjustedWorkDays}
                disabled
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                placeholder="Auto-calculated"
              />
              {errors.workDays && (
                <p className="mt-1 text-sm text-red-600">{errors.workDays.message}</p>
              )}
              <span className="text-xs text-gray-500">
                (Auto-calculated: {calculations.monthDays} - ({day || 1} - 1) - {leavesCount} leaves)
              </span>
            </div>

            {/* Leaves Count */}
            <div className=' md:col-span-3'>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <span className="text-red-500 mr-1">*</span>Leave Count
    
  </label>

  <select
  {...register('leavesCount', {
    required: 'Leaves count is required',
    valueAsNumber: true
  })}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
>
  
  {leaveOptions.map((val) => (
    <option key={val} value={val}>
      {val}
    </option>
  ))}
</select>
<span className="text-xs text-gray-500 ml-2">
      (Max: {calculations.monthDays} days)
    </span>


  {errors.leavesCount && (
    <p className="mt-1 text-sm text-red-600">
      {errors.leavesCount.message}
    </p>
  )}
</div>
          </div>

          {/* Salary Input Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-0">
              {/* CTC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>CTC
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ctc', { 
                    required: 'CTC is required',
                    min: { value: 0, message: 'CTC cannot be negative' },
                    valueAsNumber: true,
                    onChange: () => setSalaryCalcMode('ctc'),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.ctc && (
                  <p className="mt-1 text-sm text-red-600">{errors.ctc.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>Variable Pay
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('variablePay', { 
                    required: 'Pay is required',
                    min: { value: 0, message: 'Pay cannot be negative' },
                    valueAsNumber: true,
                    onChange: () => setSalaryCalcMode('variable'),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                
                {errors.variablePay && (
                  <p className="mt-1 text-sm text-red-600">{errors.variablePay.message}</p>
                )}
              </div>

              {/* Fixed Pay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>Fixed Pay
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('fixedPay', { 
                    required: 'Fixed Pay is required',
                    min: { value: 0, message: 'Fixed Pay cannot be negative' },
                    valueAsNumber: true,
                    onChange: () => setSalaryCalcMode('fixed'),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.fixedPay && (
                  <p className="mt-1 text-sm text-red-600">{errors.fixedPay.message}</p>
                )}
              </div>

              {/* Monthly Fixed (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Fixed (₹)
                </label>
                <input
                  type="text"
                  value={(Number(fixedPay || 0) / 12).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Monthly Salary Payable (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Salary Payable (₹)
                </label>
                <input
                  type="text"
                  value={Number(monthlySalaryPayable || 0).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
                <span className="text-xs text-gray-500">
                  Formula: Monthly Fixed / Total Days in month × Payable Days
                </span>
              </div>
            </div>
          </div>

          

          {/* Salary Components Section - Auto-calculated */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Components (Auto-calculated)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Basic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basic <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  step="0.01"
                  {...register('basic', { 
                    required: 'Basic salary is required',
                    min: { value: 0, message: 'Basic salary cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={Number(payableComponents.basic || 0).toFixed(2)}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                />
                {errors.basic && (
                  <p className="mt-1 text-sm text-red-600">{errors.basic.message}</p>
                )}
              </div>

              {/* HRA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HRA <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  step="0.01"
                  {...register('hra', { 
                    required: 'HRA is required',
                    min: { value: 0, message: 'HRA cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={Number(payableComponents.hra || 0).toFixed(2)}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                />
                {errors.hra && (
                  <p className="mt-1 text-sm text-red-600">{errors.hra.message}</p>
                )}
              </div>

              {/* Conveyance Allowance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conveyance Allowance <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  step="0.01"
                  {...register('conveyanceAllowance', { 
                    required: 'Conveyance allowance is required',
                    min: { value: 0, message: 'Conveyance allowance cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={Number(payableComponents.conveyanceAllowance || 0).toFixed(2)}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                />
                {errors.conveyanceAllowance && (
                  <p className="mt-1 text-sm text-red-600">{errors.conveyanceAllowance.message}</p>
                )}
              </div>

              {/* Other Allowance (editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Allowance
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('otherAllowance', { 
                    required: 'Other allowance is required',
                    min: { value: 0, message: 'Other allowance cannot be negative' },
                    valueAsNumber: true,
                    onChange: () => setSalaryCalcMode('other'),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.otherAllowance && (
                  <p className="mt-1 text-sm text-red-600">{errors.otherAllowance.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Calculated Gross Salary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Gross Salary (A)
              </label>
              <span className="text-lg font-bold text-blue-700">
                ₹{formatINR(grossSalary)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Basic + HRA + Conveyance Allowance + Other Allowance = Per Month
            </p>
          </div>

          {/* Deductions Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Deductions</h3>
              <button
                type="button"
                onClick={() => setIsPfEnabled((prev) => !prev)}
                className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium border ${
                  isPfEnabled
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                <span className="mr-2">Is PF</span>
                <span
                  className={`h-4 w-8 rounded-full flex items-center ${
                    isPfEnabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`h-3 w-3 bg-white rounded-full transform transition-transform ${
                      isPfEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </span>
                <span className="ml-2 text-[11px]">{isPfEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* PF (DEDUCT) */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PF (DEDUCT) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  step="0.01"
                  value={Number(pfDeduct || 0).toFixed(2)}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>

              {/* PT (DEDUCT) */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>PT (DEDUCT) 
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ptDeduct', { 
                    required: 'PT deduction is required',
                    min: { value: 0, message: 'PT deduction cannot be negative' },
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.ptDeduct && (
                  <p className="mt-1 text-sm text-red-600">{errors.ptDeduct.message}</p>
                )}
              </div>


              {/* Other Deduction */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deduction (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('otherDeduction', {
                    min: { value: 0, message: 'Other deduction cannot be negative' },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.otherDeduction && (
                  <p className="mt-1 text-sm text-red-600">{errors.otherDeduction.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Calculated Total Deduction */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            {/* Calculated Total Deduction */}
            <div className="md:col-span-6 p-4 bg-red-50 rounded-md">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Total Deduction (B)
                </label>
                <span className="text-lg font-bold text-red-700">
                  ₹{totalDeduction.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PF (DEDUCT) + PT (DEDUCT) + Leaves Deduct Amt + Other Deduction
              </p>
            </div>

            {/* Calculated Net Salary */}
            <div className="md:col-span-6 p-4 bg-green-50 rounded-md">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Net Salary (InHand)
                </label>
                <span className="text-lg font-bold text-green-700">
                  ₹{formatINR(netSalary)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gross Salary (A) - Total Deduction (B)
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-between py-3">
            <Link
              href={isEmployeeUser ? '/employee/my-salary' : (employeeId ? `/salaries?employeeId=${employeeId}` : `/salaries/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 