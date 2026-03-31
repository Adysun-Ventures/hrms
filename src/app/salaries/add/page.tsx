'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiCheckCircle, FiX } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import toast, { Toaster } from 'react-hot-toast';
import { useCreateSalary } from '@/hooks/useSalaries';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getEmployeeNameById, getEmploymentsByEmployee, checkExistingSalary, updateEmployment } from '@/utils/firebaseUtils';
import { calculateMonthlySalary, type MonthlySalaryResult } from '@/utils/monthlySalaryCalculationUtils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isPfEnabled, setIsPfEnabled] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employmentId, setEmploymentId] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams?.get('employeeId');
  const from = searchParams?.get('from');
  
  const createSalaryMutation = useCreateSalary();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SalaryFormData>({
    mode: 'onChange', // Enable real-time validation and updates
    defaultValues: {
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
      ptDeduct: 200, // Default PT deduction
      leavesDeductAmt: 0,
      otherDeduction: 0,
    }
  });

  // Watch input values for real-time calculation
  const ctc = watch('ctc') || 0;
  const fixedPay = watch('fixedPay') || 0;
  const year = Number(watch('year')) || new Date().getFullYear();
  const month = Number(watch('month')) || new Date().getMonth() + 1;
  const leavesCount = watch('leavesCount') || 0;
  const ptDeduct = watch('ptDeduct') || 200;
  const otherDeduction = watch('otherDeduction') || 0;
  const variablePay = watch('variablePay') || 0;
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
          ptDeduct: 200,
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
      ptDeduct: 200,
      leavesDeductAmt: 0,
      totalDeduction: 0,
      netSalary: 0,
    };
  }, [ctc, fixedPay, year, month, leavesCount]);

  // Use calculated values directly for display
  const leavesDeductAmt = calculations.leavesDeductAmt;
  const pfDeduct = isPfEnabled ? (calculations.pfDeduct || 0) : 0;
  const grossSalary = calculations.grossSalary;
  const totalDeduction = pfDeduct + (ptDeduct || 200) + leavesDeductAmt + otherDeduction;
  const netSalary = grossSalary - totalDeduction;

  // Update form values in real-time when calculations change
  useEffect(() => {
    setValue('workDays', calculations.workDays, { shouldValidate: false, shouldDirty: false });
    setValue('basic', calculations.basic, { shouldValidate: false, shouldDirty: false });
    setValue('hra', calculations.hra, { shouldValidate: false, shouldDirty: false });
    setValue('conveyanceAllowance', calculations.conveyanceAllowance, { shouldValidate: false, shouldDirty: false });
    setValue('otherAllowance', calculations.otherAllowance, { shouldValidate: false, shouldDirty: false });
    setValue('leavesDeductAmt', calculations.leavesDeductAmt, { shouldValidate: false, shouldDirty: false });
    
    // Set PT deduction to default if not already set
    if (!ptDeduct || ptDeduct === 0) {
      setValue('ptDeduct', calculations.ptDeduct, { shouldValidate: false, shouldDirty: false });
    }
  }, [calculations, setValue, ptDeduct]);

  useEffect(()=>{
    //Fixed pay results
    const autoFixed = Number(ctc || 0) - Number(variablePay || 0);

    setValue(
      'fixedPay',
      autoFixed >= 0 ? autoFixed : 0,
      { shouldValidate: false, shouldDirty: true }
    );
  }, [ctc, variablePay, setValue]);

  // Fetch employee name and employment ID when employeeId is available
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (employeeId) {
        try {
          // Fetch employee name
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);

          // Fetch latest employment
          const employments = await getEmploymentsByEmployee(employeeId);
          if (employments && employments.length > 0) {
            // Get the latest employment
            const latestEmployment = employments[0];
            setEmploymentId(latestEmployment.id);
            setValue('employmentId', latestEmployment.id); // Pre-fill employment ID

            // Determine CTC with priority: incrementedCtc > joiningCtc > salary
            const ctcValue = latestEmployment.incrementedCtc 
              || latestEmployment.joiningCtc 
              || latestEmployment.salary 
              || 0;

            // Determine Fixed Pay from inHandCtc
            const fixedPayValue = latestEmployment.inHandCtc || 0;

            // Pre-fill CTC only if value exists and is greater than 0
            if (ctcValue > 0) {
              setValue('ctc', ctcValue, { shouldValidate: false, shouldDirty: false });
              toast.success('CTC pre-filled from employment record', { duration: 3000 });
            }

            // Pre-fill Fixed Pay only if value exists and is greater than 0
            if (fixedPayValue > 0) {
              setValue('fixedPay', fixedPayValue, { shouldValidate: false, shouldDirty: false });
              toast.success('Fixed Pay pre-filled from employment record', { duration: 3000 });
            }
          } else {
            // If no employment found, show error
            toast.error('No employment record found for this employee. Please create an employment record first.');
            router.push('/employments/add?employeeId=' + employeeId);
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeData();
  }, [employeeId, setValue, router]);

  useEffect(() => {
  const autoFixed = Number(ctc || 0) - Number(variablePay || 0);

  setValue(
    'fixedPay',
    autoFixed >= 0 ? autoFixed : 0,
    { shouldValidate: false, shouldDirty: true }
  );
}, [ctc, variablePay, setValue]);


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
      const finalGrossSalary = calculations.grossSalary;
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
        basicSalary: calculations.basic,
        inhandSalary: finalNetSalary,
        totalSalary: finalGrossSalary,
        workDays: calculations.workDays,
        leavesCount: data.leavesCount,
        ctc: data.ctc,
        fixedPay: data.fixedPay,
        basic: calculations.basic,
        hra: calculations.hra,
        conveyanceAllowance: calculations.conveyanceAllowance,
        otherAllowance: calculations.otherAllowance,
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
      if (employeeId) {
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
      breadcrumbItems={
        employeeId
          ? [
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Employees', href: '/employees' },
              {
                label: employeeName || 'Loading...',
                href: `/employees/${employeeId}`,
              },
              {
                label: 'Employment',
                href: `/employments?employeeId=${employeeId}`,
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
            href: employeeId
              ? from === 'employment'
                ? `/salaries?employeeId=${employeeId}&from=employment`
                : `/salaries?employeeId=${employeeId}`
              : '/salaries',
          }}
          actionButtons={[
            {
              label: 'Save',
              icon: <FiCheckCircle />,
              variant: 'success',
              onClick: handleSubmit(onSubmit),
              disabled: isLoading
            }
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          {/* Period Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            {/* Working Days - Auto-calculated */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days 
              </label>
              <input
                type="number"
                {...register('workDays', { 
                  required: 'Work days is required',
                  min: { value: 0, message: 'Work days cannot be negative' },
                  valueAsNumber: true
                })}
                value={calculations.workDays}
                disabled
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                placeholder="Auto-calculated"
              />
              <span className="text-xs text-gray-500">(Auto-calculated: {calculations.monthDays} days - {leavesCount} leaves)</span>
              {errors.workDays && (
                <p className="mt-1 text-sm text-red-600">{errors.workDays.message}</p>
              )}
            </div>

            {/* Leaves Count */}
            <div>
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
          <div className="mb-6 ">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* CTC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500 mr-1">*</span>CTC (Cost to Company)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ctc', { 
                    required: 'CTC is required',
                    min: { value: 0, message: 'CTC cannot be negative' },
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.ctc && (
                  <p className="mt-1 text-sm text-red-600">{errors.ctc.message}</p>
                )}
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
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                
                {errors.variablePay && (
                  <p className="mt-1 text-sm text-red-600">{errors.variablePay.message}</p>
                )}
              </div>
              
              {/* Fixed Pay - Auto-calculated based on CTC and Fixed Pay */}

              <div className=''>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <span className="text-red-500 mr-1">*</span>Fixed Pay
  </label>

  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
    {Number(fixedPay || 0).toFixed(2)}

  </div>

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
                  type="number"
                  value={Number((Number(fixedPay || 0) / 12).toFixed(2))}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
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
                  type="number"
                  step="0.01"
                  {...register('basic', { 
                    required: 'Basic salary is required',
                    min: { value: 0, message: 'Basic salary cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={calculations.basic}
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
                  type="number"
                  step="0.01"
                  {...register('hra', { 
                    required: 'HRA is required',
                    min: { value: 0, message: 'HRA cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={calculations.hra}
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
                  type="number"
                  step="0.01"
                  {...register('conveyanceAllowance', { 
                    required: 'Conveyance allowance is required',
                    min: { value: 0, message: 'Conveyance allowance cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={calculations.conveyanceAllowance}
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
                    valueAsNumber: true
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
              {/* PF (DEDUCT) - Auto-calculated */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PF (DEDUCT) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pfDeduct}
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
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.ptDeduct && (
                  <p className="mt-1 text-sm text-red-600">{errors.ptDeduct.message}</p>
                )}
              </div>

              {/* Leaves Deduct Amt - Auto-calculated */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leaves Deduct Amt <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('leavesDeductAmt', { 
                    required: 'Leaves deduction amount is required',
                    min: { value: 0, message: 'Leaves deduction amount cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={calculations.leavesDeductAmt}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  placeholder="0.00"
                />
                {errors.leavesDeductAmt && (
                  <p className="mt-1 text-sm text-red-600">{errors.leavesDeductAmt.message}</p>
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
              href={employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries'}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 