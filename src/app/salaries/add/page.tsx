'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { FiArrowLeft, FiX, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import toast, { Toaster } from 'react-hot-toast';
import { useCreateSalary, useEmployeeCreateSalary } from '@/hooks/useSalaries';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  getEmployeeNameById,
  getEmploymentsByEmployee,
  getEmploymentsByEmployeeSelf,
  checkExistingSalary,
  updateEmployment,
} from '@/utils/firebaseUtils';
import { useAuth } from '@/context/AuthContext';
import {
  calculateMonthlySalary,
  getProfessionalTaxByMonth,
  type MonthlySalaryResult,
} from '@/utils/monthlySalaryCalculationUtils';
import {
  computeReadOnlyDay,
  getMonthOptions,
  getYearOptions,
  parseIsoDateParts,
  type IsoDateParts,
} from '@/utils/salaryPeriodUtils';

// Simplify the Salary interface to only include essential fields
export interface Salary {
  id: string;
  employeeId: string;
  employmentId: string;
  
  // Essential Salary Information Only
  basicSalary: number;
  inhandSalary: number;
  totalSalary: number;
  
  // Period Information
  month: number;
  year: number;
  
  // Audit fields
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Simplify the SalaryFormData type
type SalaryFormData = {
  employeeId: string;
  employmentId: string;
  day: number;
  month: number;
  year: number;
  ctc: number;
  variablePay: number;
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
};

export default function AddSalaryPage() {
  const { currentUserData } = useAuth();
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const [isLoading, setIsLoading] = useState(false);
  const [isPfEnabled, setIsPfEnabled] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employmentId, setEmploymentId] = useState<string>('');
  const [joiningDateParts, setJoiningDateParts] = useState<IsoDateParts | null>(null);
  const [salaryCalcMode, setSalaryCalcMode] = useState<'ctc' | 'variable' | 'fixed' | 'other'>('variable');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmployeeId = searchParams?.get('employeeId');
  const from = searchParams?.get('from');
  const employeeId = queryEmployeeId || (isEmployeeUser ? currentUserData?.id : null);

  const employmentBreadcrumbHref = employmentId
    ? `/employments/${employmentId}`
    : `/employments?employeeId=${employeeId}`;
  
  const createSalaryMutation = isEmployeeUser ? useEmployeeCreateSalary() : useCreateSalary();
  const queryClient = useQueryClient();
  
  const ptDefaultForMonth = getProfessionalTaxByMonth(new Date().getMonth() + 1);

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SalaryFormData>({
    mode: 'onChange', // Enable real-time validation and updates
    defaultValues: {
      day: new Date().getDate(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      employeeId: employeeId || '',
      ctc: 0,
      fixedPay: 0,
      variablePay: 0,
      workDays: 0,
      leavesCount: 0,
      basic: 0,
      hra: 0,
      conveyanceAllowance: 0,
      otherAllowance: 0,
      ptDeduct: ptDefaultForMonth,
      leavesDeductAmt: 0,
      otherDeduction: 0,
    }
  });

  useEffect(() => {
    if (!employeeId) return;
    setValue('employeeId', employeeId, { shouldValidate: false, shouldDirty: false });
  }, [employeeId, setValue]);

  // Watch input values for real-time calculation
  const ctc = watch('ctc') || 0;
  const fixedPay = watch('fixedPay') || 0;
  const year = Number(watch('year')) || new Date().getFullYear();
  const month = Number(watch('month')) || new Date().getMonth() + 1;
  const day = Number(watch('day')) || 0;
  const leavesCount = watch('leavesCount') || 0;
  const ptDeduct = watch('ptDeduct') || getProfessionalTaxByMonth(month);
  const otherDeduction = watch('otherDeduction') || 0;
  const variablePay = watch('variablePay') || 0;
  const otherAllowance = watch('otherAllowance') || 0;
  const formatINR = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};
  const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
  const roundSalaryFieldOnBlur = (field: keyof SalaryFormData) => () => {
    setValue(field, round2(watch(field) as number) as any, { shouldValidate: true, shouldDirty: true });
  };

  const applyCtcPreset = (lakhs: number) => {
    setValue('ctc', lakhs * 100000, { shouldValidate: true, shouldDirty: true });
    setSalaryCalcMode('ctc');
  };

  const applyVariablePayPreset = (amount: number) => {
    setValue('variablePay', amount, { shouldValidate: true, shouldDirty: true });
    setSalaryCalcMode('variable');
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
  const pfDeduct = isPfEnabled ? (calculations.pfDeduct || 0) : 0;
  const grossSalary =
    Number(payableComponents.basic || 0) +
    Number(payableComponents.hra || 0) +
    Number(payableComponents.conveyanceAllowance || 0) +
    Number(otherAllowance || 0);
  const totalDeduction = pfDeduct + (ptDeduct || 200) + leavesDeductAmt + otherDeduction;
  const netSalary = grossSalary - totalDeduction;

  // Keep dependent fields in sync from whichever salary input user edits.
  useEffect(() => {
    const ctcNum = Number(ctc) || 0;
    const variableNum = Number(variablePay) || 0;
    const fixedNum = Number(fixedPay) || 0;

    const maybeSet = (name: keyof SalaryFormData, next: number, current: number) => {
      if (Math.abs((current || 0) - (next || 0)) > 0.01) {
        setValue(name, Number(next.toFixed(2)) as any, { shouldValidate: false, shouldDirty: true });
      }
    };

    if (salaryCalcMode === 'ctc' || salaryCalcMode === 'variable') {
      const nextFixed = Math.max(0, ctcNum - variableNum);
      maybeSet('fixedPay', nextFixed, fixedNum);
      return;
    }

    if (salaryCalcMode === 'fixed') {
      const nextCtc = fixedNum + variableNum;
      maybeSet('ctc', nextCtc, ctcNum);
      return;
    }

    // Do not reverse-sync CTC/Fixed when user edits Other Allowance.
    // Other Allowance should be user-editable without forcing other inputs.
  }, [ctc, variablePay, fixedPay, otherAllowance, salaryCalcMode, setValue]);

  // Update form values in real-time when calculations change
  useEffect(() => {
    setValue('workDays', adjustedWorkDays, { shouldValidate: false, shouldDirty: false });
    setValue('basic', round2(payableComponents.basic), { shouldValidate: false, shouldDirty: false });
    setValue('hra', round2(payableComponents.hra), { shouldValidate: false, shouldDirty: false });
    setValue('conveyanceAllowance', round2(payableComponents.conveyanceAllowance), { shouldValidate: false, shouldDirty: false });
    if (salaryCalcMode !== 'other') {
      setValue('otherAllowance', round2(payableComponents.otherAllowance), { shouldValidate: false, shouldDirty: false });
    }
    setValue('leavesDeductAmt', round2(calculations.leavesDeductAmt), { shouldValidate: false, shouldDirty: false });
    
    // Keep PT deduction aligned with selected month rule.
    setValue('ptDeduct', round2(calculations.ptDeduct), { shouldValidate: false, shouldDirty: false });
  }, [calculations, adjustedWorkDays, payableComponents, setValue, ptDeduct, salaryCalcMode]);


  // Fetch employee name and employment ID when employeeId is available
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (employeeId) {
        try {
          // Fetch employee name
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);

          // Fetch latest employment
          const employments = isEmployeeUser
            ? await getEmploymentsByEmployeeSelf(employeeId)
            : await getEmploymentsByEmployee(employeeId);
          if (employments && employments.length > 0) {
            // Get the latest employment
            const latestEmployment = employments[0];
            setEmploymentId(latestEmployment.id);
            setValue('employmentId', latestEmployment.id); // Pre-fill employment ID
            setJoiningDateParts(
              parseIsoDateParts(
                (latestEmployment as any).joiningDate ||
                  (latestEmployment as any).startDate ||
                  (latestEmployment as any).createdAt ||
                  null
              )
            );

            // Auto-fill from Employment -> Current Salary Information
            // Fallbacks keep backward compatibility for old records.
            const ctcValue =
              Number(latestEmployment.salary ?? latestEmployment.incrementedCtc ?? latestEmployment.joiningCtc ?? 0) || 0;
            const variablePayValue =
              Number((latestEmployment as any).currentVariablePay ?? (latestEmployment as any).incrementVariablePay ?? 0) || 0;
            const fixedPayFromCurrent =
              Number((latestEmployment as any).currentFixedPay ?? 0) || 0;
            const fixedPayValue =
              fixedPayFromCurrent > 0 ? fixedPayFromCurrent : Math.max(0, ctcValue - variablePayValue);

            // Prefer explicit Current PF toggle, fallback to stored PF amount.
            const pfEnabledValue =
              typeof (latestEmployment as any).currentPfIncluded === 'boolean'
                ? Boolean((latestEmployment as any).currentPfIncluded)
                : Number(latestEmployment.pf ?? 0) > 0;

            setValue('ctc', ctcValue, { shouldValidate: false, shouldDirty: false });
            setValue('variablePay', variablePayValue, { shouldValidate: false, shouldDirty: false });
            setValue('fixedPay', fixedPayValue, { shouldValidate: false, shouldDirty: false });
            setIsPfEnabled(pfEnabledValue);
            toast.success('Salary fields auto-filled from Current Salary Information', { duration: 3000 });
          } else {
            if (isEmployeeUser) {
              toast.error('No employment record found for your profile. Please contact HR/Admin.');
            } else {
              toast.error('No employment record found for this employee. Please create an employment record first.');
              router.push('/employments/add?employeeId=' + employeeId);
            }
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeData();
  }, [employeeId, setValue, router, isEmployeeUser]);

  // --- Period (Year/Month/Day) constraints based on employee joiningDate ---
  const yearOptions = useMemo(() => getYearOptions(joiningDateParts), [joiningDateParts]);
  const monthOptions = useMemo(() => getMonthOptions(year || null, joiningDateParts), [year, joiningDateParts]);
  const readOnlyDay = useMemo(
    () => computeReadOnlyDay(year || null, month || null, joiningDateParts),
    [year, month, joiningDateParts]
  );

  // Ensure selected month is always valid for the selected year (e.g. joining year cannot pick Jan before joining month).
  useEffect(() => {
    if (!month || month < 1 || month > 12) return;
    if (!joiningDateParts) return;
    if (year !== joiningDateParts.year) return;
    if (month < joiningDateParts.month) {
      setValue('month', joiningDateParts.month as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [year, month, joiningDateParts, setValue]);

  // Keep Day read-only and auto-updated.
  useEffect(() => {
    setValue('day', readOnlyDay as any, { shouldValidate: true, shouldDirty: true });
  }, [readOnlyDay, setValue]);

  const onSubmit = async (data: SalaryFormData) => {
    try {
      // Check for existing salary BEFORE showing loading toast
      const exists = await checkExistingSalary(data.employeeId, data.month, data.year);
      if (exists) {
        toast.error(`Salary for ${getMonthName(data.month)} ${data.year} already exists for this employee.`);
        return;
      }

      // Validate required inputs
      if (!data.ctc || !data.fixedPay) {
        toast.error('Please enter CTC and Fixed Pay to calculate salary.');
        return;
      }

      setIsLoading(true);
      toast.loading('Creating salary...', { id: 'create-salary' });
      
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
        (finalPfDeduct || 0) + (data.ptDeduct || calculations.ptDeduct) + calculations.leavesDeductAmt + finalOtherDeduction;
      const finalNetSalary = finalGrossSalary - finalTotalDeduction;

      // Create salary record with all fields
      const salaryId = await createSalaryMutation.mutateAsync({
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
      } as any);

      // Keep Employment PF toggle in sync with Salary PF selection.
      const linkedEmploymentId = employmentId || data.employmentId;
      if (linkedEmploymentId) {
        try {
          await updateEmployment(linkedEmploymentId, { pf: finalPfDeduct });
        } catch (syncError) {
          console.error('Failed to sync PF to employment:', syncError);
        }
      }
      
      toast.success('Salary created successfully!', { id: 'create-salary' });
      
      // Force invalidate and refetch all salary queries
      await queryClient.invalidateQueries({ queryKey: ['salaries'] });
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'list'] });
      
      if (employeeId) {
        await queryClient.invalidateQueries({ queryKey: ['salaries', 'byEmployee', employeeId] });
      }
      
      // Navigate back to the appropriate page
      if (isEmployeeUser) {
        router.push('/employee/my-salary');
      } else if (employeeId) {
        if (from === 'employment') {
          router.push(`/salaries?employeeId=${employeeId}&from=employment`);
        } else {
          router.push(`/salaries?employeeId=${employeeId}`);
        }
      } else {
        router.push('/salaries');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create salary', { id: 'create-salary' });
    } finally {
      setIsLoading(false);
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


  return (
    <DashboardLayout
      allowedUserTypes={['admin', 'employee']}
      breadcrumbItems={
        isEmployeeUser
          ? [
              { label: 'Dashboard', href: '/employee-dashboard' },
              { label: 'My Salaries', href: '/employee/my-salary' },
              { label: 'Add Salary', isCurrent: true },
            ]
          : employeeId
          ? [
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Employees', href: '/employees' },
              {
                label: employeeName || 'Loading...',
                href: `/employees/${employeeId}`,
              },
              {
                label: 'Employment',
                href: employmentBreadcrumbHref,
              },
              {
                label: 'Salaries',
                href: `/salaries?employeeId=${employeeId}`,
              },
              { label: 'Add Salary', isCurrent: true },
            ]
          : [
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Salaries', href: '/salaries' },
              { label: 'Add Salary', isCurrent: true },
            ]
      }
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Add New Salary"
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
            href: isEmployeeUser
              ? '/employee/my-salary'
              : employeeId
              ? from === 'employment'
                ? `/salaries?employeeId=${employeeId}&from=employment`
                : `/salaries?employeeId=${employeeId}`
              : '/salaries',
          }}
          actionButtons={[
            {
              label: isLoading ? 'Saving...' : 'Save',
              icon: <FiCheckCircle className="w-4 h-4" />,
              variant: 'success',
              pill: true,
              onClick: handleSubmit(onSubmit),
              disabled: isLoading
            }
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          {/* Period Information */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            {/* Year */}
            <div >
              <label className="block text-sm font-medium text-gray-700 mb-2">
               <span className="text-red-500 mr-1">*</span> Year 
              </label>
              <Controller
                control={control}
                name="year"
                rules={{ required: 'Year is required' }}
                render={({ field }) => (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const nextYear = Number(e.target.value);
                      field.onChange(nextYear);

                      // Reset month/day based on new year selection.
                      const join = joiningDateParts;
                      const nextMonth = join && nextYear === join.year ? join.month : 1;
                      setValue('month', nextMonth as any, { shouldValidate: true, shouldDirty: true });
                    }}
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500 mr-1">*</span>Month 
              </label>
              <Controller
                control={control}
                name="month"
                rules={{ required: 'Month is required' }}
                render={({ field }) => (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const nextMonth = Number(e.target.value);
                      field.onChange(nextMonth);
                      // Day will be updated by readOnlyDay effect.
                    }}
                  >
                    <option value="">Select Month</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>}
            </div>

            {/* Day (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500 mr-1">*</span>Day
              </label>
              <Controller
                control={control}
                name="day"
                rules={{ required: 'Day is required' }}
                render={({ field }) => (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    value={field.value ?? readOnlyDay}
                    disabled
                    onChange={() => {}}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.day && <p className="mt-1 text-sm text-red-600">{errors.day.message}</p>}
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

            {/* Payable Days - Auto-calculated */}
            <div className=' md:col-span-3'>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payable Days <span className="text-xs text-gray-500">(Auto-calculated)</span>
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
              {/* <span className="text-xs text-gray-500">
                (Auto-calculated: {calculations.monthDays} - ({day || 1} - 1) - {leavesCount} leaves)
              </span> */}
              {errors.workDays && (
                <p className="mt-1 text-sm text-red-600">{errors.workDays.message}</p>
              )}
            </div>

          </div>

          {/* Salary Input Fields */}
          <div className="mb-6 ">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    setValueAs: (v) => round2(Number(v)),
                    onChange: () => setSalaryCalcMode('ctc'),
                  })}
                  onBlur={roundSalaryFieldOnBlur('ctc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.ctc && (
                  <p className="mt-1 text-sm text-red-600">{errors.ctc.message}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {[6, 7, 8, 9, 10].map((lakhs) => (
                    <button
                      key={lakhs}
                      type="button"
                      onClick={() => applyCtcPreset(lakhs)}
                      className="text-xs text-blue-700 hover:underline"
                    >
                      {lakhs} L
                    </button>
                  ))}
                </div>
              </div>
              {/* variable Pay */}

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
                    setValueAs: (v) => round2(Number(v)),
                    onChange: () => setSalaryCalcMode('variable'),
                  })}
                  onBlur={roundSalaryFieldOnBlur('variablePay')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                
                {errors.variablePay && (
                  <p className="mt-1 text-sm text-red-600">{errors.variablePay.message}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {[
                    { label: '50K', value: 50000 },
                    { label: '60K', value: 60000 },
                    { label: '70K', value: 70000 },
                    { label: '80K', value: 80000 },
                    { label: '90K', value: 90000 },
                    { label: '1L', value: 100000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyVariablePayPreset(preset.value)}
                      className="text-xs text-blue-700 hover:underline"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                    setValueAs: (v) => round2(Number(v)),
                    onChange: () => setSalaryCalcMode('fixed'),
                  })}
                  onBlur={roundSalaryFieldOnBlur('fixedPay')}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
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
                  Monthly Salary Payable (₹)<span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  value={Number(monthlySalaryPayable || 0).toFixed(2)}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
                {/* <span className="text-xs text-gray-500">
                  Formula: Monthly Fixed / Total Days in month × Payable Days
                </span> */}
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
                    setValueAs: (v) => round2(Number(v)),
                    onChange: () => setSalaryCalcMode('other'),
                  })}
                  onBlur={roundSalaryFieldOnBlur('otherAllowance')}
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
              {/* PF (DEDUCT) - Auto-calculated */}
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
                    setValueAs: (v) => round2(Number(v))
                  })}
                  onBlur={roundSalaryFieldOnBlur('ptDeduct')}
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
                    setValueAs: (v) => round2(Number(v)),
                  })}
                  onBlur={roundSalaryFieldOnBlur('otherDeduction')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.otherDeduction && (
                  <p className="mt-1 text-sm text-red-600">{errors.otherDeduction.message}</p>
                )}
              </div>
            </div>
          </div>

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
                  Net Salary (InHand) (C=A-B)
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
              href={isEmployeeUser ? '/employee/my-salary' : (employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 