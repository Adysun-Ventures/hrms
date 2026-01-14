'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import { Salary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { useSalary, useUpdateSalary } from '@/hooks/useSalaries';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getEmployeeNameById, getEmploymentsByEmployee, checkExistingSalary } from '@/utils/firebaseUtils';
import { calculateMonthlySalary, type MonthlySalaryResult } from '@/utils/monthlySalaryCalculationUtils';
import { use } from 'react';

// Simplify the SalaryFormData type
type SalaryFormData = {
  employeeId: string;
  employmentId: string;
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
};

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function EditSalaryPage({ params }: PageParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employmentId, setEmploymentId] = useState<string>('');
  const [hasPeriodChanges, setHasPeriodChanges] = useState(false);

  const router = useRouter();
  const { id } = use(params);

  const { data: salary, isLoading: isSalaryLoading } = useSalary(id);
  const updateSalaryMutation = useUpdateSalary();
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SalaryFormData>({
    mode: 'onChange', // Enable real-time validation and updates
  });

  // Watch input values for real-time calculation
  const ctc = watch('ctc') || 0;
  const fixedPay = watch('fixedPay') || 0;
  const year = Number(watch('year')) || new Date().getFullYear();
  const month = Number(watch('month')) || new Date().getMonth() + 1;
  const leavesCount = watch('leavesCount') || 0;
  const ptDeduct = watch('ptDeduct') || 200;

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
  const grossSalary = calculations.grossSalary;
  const totalDeduction = (ptDeduct || 200) + leavesDeductAmt;
  const netSalary = calculations.netSalary;

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
          const employments = await getEmploymentsByEmployee(employeeId);
          if (employments && employments.length > 0) {
            const latestEmployment = employments[0];
            setEmploymentId(latestEmployment.id);
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // Form reset logic - load existing salary data
  useEffect(() => {
    if (salary) {
      if (salary.employeeId) {
        setEmployeeId(salary.employeeId);
      }
      
      // Extract values from existing salary record
      const salaryData = salary as any;
      
      reset({
        employeeId: salary.employeeId || employeeId || '',
        employmentId: salary.employmentId || '',
        month: salary.month || 1,
        year: salary.year || new Date().getFullYear(),
        ctc: salaryData.ctc || 0,
        fixedPay: salaryData.fixedPay || 0,
        workDays: salaryData.workDays || 0,
        leavesCount: salaryData.leavesCount ?? salaryData.totalLeaves ?? 0,
        basic: salaryData.basic || salary.basicSalary || 0,
        hra: salaryData.hra || 0,
        conveyanceAllowance: salaryData.conveyanceAllowance || 0,
        otherAllowance: salaryData.otherAllowance || 0,
        ptDeduct: salaryData.ptDeduct || 200,
        leavesDeductAmt: salaryData.leavesDeductAmt || 0
      });
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
      const finalGrossSalary = calculations.grossSalary;
      const finalTotalDeduction = calculations.totalDeduction;
      const finalNetSalary = calculations.netSalary;
      
      await updateSalaryMutation.mutateAsync({
        id: id,
        data: {
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
          grossSalary: finalGrossSalary,
          totalDeduction: finalTotalDeduction,
          variablePay: calculations.variablePay,
          perMonth: calculations.perMonth,
          perDay: calculations.perDay,
          monthDays: calculations.monthDays
        } as any
      });
      
      toast.success('Salary updated successfully!', { id: 'update-salary' });
      // Navigate back to employee's salary list if we came from there
      router.push(employeeId ? `/salaries?employeeId=${employeeId}` : `/salaries/${id}`);
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

  if (isSalaryLoading) {
    return (
      <DashboardLayout breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Salaries', href: '/salaries' },
        { label: 'Loading...', isCurrent: true }
      ]}>
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
      </DashboardLayout>
    );
  }

  if (!salary) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
          <p>Salary not found</p>
        </div>
        <div className="mt-4">
          <Link 
            href={employeeId ? `/salaries?employeeId=${employeeId}` : '/salaries'} 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to {employeeId ? `${employeeId}'s Salaries` : 'Salaries'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbItems={[
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Employee', href: '/employees' },
      ...(employeeId ? [
        { label: employeeName || 'Loading...', href: `/employees/${employeeId}` },
        { label: 'Salaries', href: `/salaries?employeeId=${employeeId}` },
        { label: 'Edit Salary', isCurrent: true }
      ] : [
        { label: 'Salaries', href: '/salaries' },
        { label: 'Edit Salary', isCurrent: true }
      ])
    ]}>
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
          backButton={{ 
            href: employeeId 
              ? `/salaries?employeeId=${employeeId}` 
              : `/salaries/${id}`
          }}
          actionButtons={[
            {
              label: 'Save',
              icon: <FiSave />,
              variant: 'success',
              onClick: handleSubmit(onSubmit),
              disabled: isSubmitting
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
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            {/* Work Days - Auto-calculated */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Days <span className="text-xs text-gray-500">(Auto-calculated: {calculations.monthDays} days - {leavesCount} leaves)</span>
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
              {errors.workDays && (
                <p className="mt-1 text-sm text-red-600">{errors.workDays.message}</p>
              )}
            </div>

            {/* Leaves Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500 mr-1">*</span>Leave Count
                <span className="text-xs text-gray-500 ml-2">(Max: {calculations.monthDays} days)</span>
              </label>
              <input
                type="number"
                {...register('leavesCount', { 
                  required: 'Leaves count is required',
                  min: { value: 0, message: 'Leaves count cannot be negative' },
                  max: { 
                    value: calculations.monthDays || 31, 
                    message: `Leave count cannot exceed ${calculations.monthDays || 31} days (days in selected month)` 
                  },
                  valueAsNumber: true,
                  validate: (value) => {
                    const maxDays = calculations.monthDays || 31;
                    if (value > maxDays) {
                      return `Leave count cannot exceed ${maxDays} days in this month`;
                    }
                    return true;
                  }
                })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  const rawValue = input.value;
                  
                  // Allow empty input while typing
                  if (rawValue === '' || rawValue === '-') {
                    return;
                  }
                  
                  const value = parseFloat(rawValue);
                  const maxDays = calculations.monthDays || 31;
                  
                  // Clamp value in real-time as user types - prevents exceeding max
                  if (!isNaN(value) && value > maxDays) {
                    input.value = maxDays.toString();
                    setValue('leavesCount', maxDays, { shouldValidate: true });
                    toast.error(`Leave count cannot exceed ${maxDays} days in this month`, { duration: 2000 });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter leaves count"
                max={calculations.monthDays || 31}
              />
              {errors.leavesCount && (
                <p className="mt-1 text-sm text-red-600">{errors.leavesCount.message}</p>
              )}
            </div>
          </div>

          {/* Salary Input Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    valueAsNumber: true
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.fixedPay && (
                  <p className="mt-1 text-sm text-red-600">{errors.fixedPay.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Calculated Values Display */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Calculated Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <label className="block text-xs text-gray-500 mb-1">Month Days</label>
                <span className="text-lg font-semibold text-gray-700">{calculations.monthDays}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <label className="block text-xs text-gray-500 mb-1">Per Month</label>
                <span className="text-lg font-semibold text-gray-700">₹{calculations.perMonth.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <label className="block text-xs text-gray-500 mb-1">Per Day</label>
                <span className="text-lg font-semibold text-gray-700">₹{calculations.perDay.toFixed(2)}</span>
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

              {/* Other Allowance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Allowance <span className="text-xs text-gray-500">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('otherAllowance', { 
                    required: 'Other allowance is required',
                    min: { value: 0, message: 'Other allowance cannot be negative' },
                    valueAsNumber: true
                  })}
                  value={calculations.otherAllowance}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
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
                ₹{grossSalary.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Basic + HRA + Conveyance Allowance + Other Allowance = Per Month
            </p>
          </div>

          {/* Deductions Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PT (DEDUCT) */}
              <div>
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
              <div>
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
            </div>
          </div>

          {/* Calculated Total Deduction */}
          <div className="mb-6 p-4 bg-red-50 rounded-md">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Total Deduction (B)
              </label>
              <span className="text-lg font-bold text-red-700">
                ₹{totalDeduction.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PT (DEDUCT) + Leaves Deduct Amt
            </p>
          </div>

          {/* Calculated Net Salary */}
          <div className="mb-6 p-4 bg-green-50 rounded-md">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Net Salary (InHand)
              </label>
              <span className="text-lg font-bold text-green-700">
                ₹{netSalary.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Gross Salary (A) - Total Deduction (B)
            </p>
          </div>

          <div className="mt-8 flex justify-between py-3">
            <Link
              href={employeeId ? `/salaries?employeeId=${employeeId}` : `/salaries/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 