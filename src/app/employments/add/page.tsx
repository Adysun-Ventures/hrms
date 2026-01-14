'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { addEmployment, getEmployees, getAdminDataForAudit, checkEmploymentIdUnique } from '@/utils/firebaseUtils';
import { Employment, Employee } from '@/types';
import { FiSave, FiPlus } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

interface EmploymentFormData extends Omit<Employment, 'id' | 'relievingCtc'> {
  // Add all the fields we need
  employmentId: string;
  joiningDate: string;
  incrementDate: string;
  joiningCtc: number;
  inHandCtc: number;
  relievingCtc?: string; // Form input is string, will be converted to number|null
  isResignation: boolean;

  // Salary details
  salaryId: string;
  salaryPerMonth: number;
  basic: number;
  da: number;
  hra: number;
  pf: number;
  medicalAllowance: number;
  transport: number;
  gratuity: number;
  totalLeaves: number;
  salaryCreditDate: string;
  payableDays: number;
  paymentMode: string;
  additionalAllowance: number;
  specialAllowance: number;

  // Job details
  jobTitle: string;
  department: string;
  location: string;
  reportingManager: string;
  employmentType: string;
  workSchedule: string;
}

export default function AddEmploymentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [preSelectedEmployee, setPreSelectedEmployee] = useState<Employee | null>(null);
  const [includePF, setIncludePF] = useState(true); // Default: With PF

  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdFromUrl = searchParams ? searchParams.get('employeeId') : null;

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EmploymentFormData>({
    defaultValues: {
      employmentId: 'ADV',
      isResignation: false,
    }
  });

  // Watch salary for calculations
  const salary = watch('salary');

  // Calculate salary breakdown when annual salary changes
  useEffect(() => {
    if (salary && salary > 0) {
      const annualSalary = Number(salary);

      // Calculate monthly salary
      const monthlySalary = Math.round(annualSalary / 12);
      setValue('salaryPerMonth', monthlySalary);

      // Calculate Basic (40% of monthly salary)
      const basic = Math.round(monthlySalary * 0.40);
      setValue('basic', basic);

      // Calculate HRA (50% of Basic)
      const hra = Math.round(basic * 0.50);
      setValue('hra', hra);

      // Calculate DA (10% of Basic)
      const da = Math.round(basic * 0.10);
      setValue('da', da);

      // Fixed allowances as per Indian standards
      const medicalAllowance = 1250;
      const transport = 1600;
      setValue('medicalAllowance', medicalAllowance);
      setValue('transport', transport);

      // Calculate PF (12% of Basic - employer contribution) - only if includePF is true
      if (includePF) {
        const pf = Math.round(basic * 0.12);
        setValue('pf', pf);
      } else {
        setValue('pf', 0);
      }

      // Calculate Special Allowance (balancing figure)
      const calculatedComponents = includePF
        ? basic + hra + da + medicalAllowance + transport
        : basic + hra + da + medicalAllowance + transport - Math.round(basic * 0.12);
      const specialAllowance = Math.max(0, monthlySalary - calculatedComponents);
      setValue('specialAllowance', specialAllowance);
    }
  }, [salary, setValue, includePF]);

  // Ensure ADV prefix is maintained in employmentId
  const employmentId = watch('employmentId');
  useEffect(() => {
    if (employmentId && !employmentId.startsWith('ADV')) {
      // If user tries to remove ADV prefix, restore it
      const suffix = employmentId.replace(/^ADV/i, '');
      setValue('employmentId', 'ADV' + suffix);
    }
  }, [employmentId, setValue]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);

        // If employeeId is provided in URL, find and pre-select that employee
        if (employeeIdFromUrl) {
          const selectedEmployee = data.find(emp => emp.id === employeeIdFromUrl);
          if (selectedEmployee) {
            setPreSelectedEmployee(selectedEmployee);
            setValue('employeeId', employeeIdFromUrl);
          } else {
            toast.error('Selected employee not found');
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [employeeIdFromUrl, setValue]);

  const onSubmit = async (data: EmploymentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      toast.loading('Creating employment record...', { id: 'add-employment' });

      // Check if employment ID is unique
      if (data.employmentId) {
        const { isUnique, existingEmployment } = await checkEmploymentIdUnique(data.employmentId);
        if (!isUnique) {
          throw new Error('Employment ID is been already used');
        }
      }

      // Get admin data for audit fields
      const { adminId, currentTimestamp } = getAdminDataForAudit();

      // Convert string values to numbers and handle undefined values
      const formattedData = {
        ...data,
        salary: Number(data.salary),
        joiningCtc: Number(data.joiningCtc),
        inHandCtc: Number(data.inHandCtc),
        relievingCtc: data.relievingCtc && data.relievingCtc !== '' ? Number(data.relievingCtc) : null,
        basic: Number(data.basic),
        da: Number(data.da) || 0,
        hra: Number(data.hra) || 0,
        pf: Number(data.pf) || 0,
        medicalAllowance: Number(data.medicalAllowance) || 0,
        transport: Number(data.transport) || 0,
        gratuity: Number(data.gratuity) || 0,
        additionalAllowance: Number(data.additionalAllowance) || 0,
        specialAllowance: Number(data.specialAllowance) || 0,
        totalLeaves: Number(data.totalLeaves),
        payableDays: Number(data.payableDays),
        // Add audit fields
        createdAt: currentTimestamp,
        createdBy: adminId, // Permanent admin document ID
        updatedAt: currentTimestamp,
        updatedBy: adminId,
      };

      await addEmployment(formattedData);
      toast.success('Employment record created successfully!', { id: 'add-employment' });

      // Navigate back to employee details if employee was pre-selected, otherwise to employments list
      if (preSelectedEmployee) {
        router.push(`/employees/${preSelectedEmployee.id}?employmentCreated=true`);
      } else {
        router.push('/employments');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add employment';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'add-employment' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Toaster position="top-center" />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-6">
            <div className="bg-gray-200 h-8 w-48 rounded animate-pulse"></div>
            <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        ...(preSelectedEmployee ? [
          { label: preSelectedEmployee.name, href: `/employees/${preSelectedEmployee.id}` },
          { label: 'Add Employment', isCurrent: true }
        ] : [
          { label: 'Employments', href: '/employments' },
          { label: 'Add Employment', isCurrent: true }
        ])
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Add New Employment"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => { }}
          searchPlaceholder="Search"
          searchAriaLabel="Search employments"
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          backButton={{
            href: preSelectedEmployee ? `/employees/${preSelectedEmployee.id}` : '/employments',
            label: 'Back'
          }}
          actionButtons={[
            {
              label: isSubmitting ? 'Saving...' : 'Add Employment',
              icon: <FiPlus />,
              variant: 'success',
              onClick: handleSubmit(onSubmit),
              disabled: isSubmitting
            }
          ]}
        />


        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {employees.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p>No employees found. Please add employees first.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Hidden employee field - always required */}
              <input
                type="hidden"
                {...register('employeeId', { required: 'Employee is required' })}
                value={preSelectedEmployee?.id || ''}
              />

              {/* Job Details Section - MOVED TO TOP */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">Job Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      {...register('jobTitle', {
                        required: 'Job title is required'
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.jobTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering"
                      {...register('department')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Headquarters"
                      {...register('location')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reporting Manager
                    </label>
                    <input
                      type="text"
                      placeholder="Manager's name"
                      {...register('reportingManager')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Employment Type
                    </label>
                    <select
                      {...register('employmentType', { required: 'Employment type is required' })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                    {errors.employmentType && (
                      <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Shift
                    </label>
                    <select
                      {...register('workSchedule')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="Mon-Fri 10 AM to 7 PM">Mon-Fri 10 AM to 7 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">Employment Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Employment ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ADV001, ADV002"
                      {...register('employmentId', {
                        required: 'Employment ID is required',
                        pattern: {
                          value: /^ADV[A-Z0-9-]*$/i,
                          message: 'Employment ID must start with ADV followed by numbers/letters'
                        }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.employmentId && (
                      <p className="mt-1 text-sm text-red-600">{errors.employmentId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Joining Date
                    </label>
                    <input
                      type="date"
                      {...register('joiningDate', { required: 'Joining date is required' })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={watch('joiningDate') ? formatDateToDayMonYear(watch('joiningDate')) : 'Select joining date'}
                    />
                    {errors.joiningDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.joiningDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Joining CTC (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Annual Joining CTC amount"
                      {...register('joiningCtc', {
                        required: 'Joining CTC is required',
                        min: { value: 0, message: 'Joining CTC must be positive' },
                        valueAsNumber: true
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.joiningCtc && (
                      <p className="mt-1 text-sm text-red-600">{errors.joiningCtc.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> In-hand CTC (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="In-hand CTC amount"
                      {...register('inHandCtc', {
                        required: 'In-hand CTC is required',
                        min: { value: 0, message: 'In-hand CTC must be positive' },
                        valueAsNumber: true
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.inHandCtc && (
                      <p className="mt-1 text-sm text-red-600">{errors.inHandCtc.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relieving CTC (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Relieving CTC (if applicable)"
                      {...register('relievingCtc')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resignation
                    </label>
                    <select
                      {...register('isResignation')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Career Progression/Increment Details (CTP) */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">
                  Career Progression / Increment Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Increment Date
                    </label>
                    <input
                      type="date"
                      {...register('incrementDate')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={watch('incrementDate') ? formatDateToDayMonYear(watch('incrementDate')) : 'Select increment date'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incremented Salary (₹)
                    </label>
                    <input
                      type="number"
                      {...register('newSalary', {
                        min: { value: 0, message: 'Amount must be positive' },
                        valueAsNumber: true
                      })}
                      placeholder="Incremented salary amount"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incremented CTC (₹)
                    </label>
                    <input
                      type="number"
                      {...register('incrementedCtc', {
                        min: { value: 0, message: 'Amount must be positive' },
                        valueAsNumber: true
                      })}
                      placeholder="Incremented CTC amount"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incremented In-hand CTC (₹)
                    </label>
                    <input
                      type="number"
                      {...register('incrementedInHandCtc', {
                        min: { value: 0, message: 'Amount must be positive' },
                        valueAsNumber: true
                      })}
                      placeholder="Incremented in-hand CTC"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-2 border-l-4 border-green-500 pl-2">
                      Salary Information
                    </h2>
                    <p className="text-sm text-gray-600 italic">
                      💡 Enter annual salary - other components will auto-calculate
                    </p>
                  </div>

                  {/* Sliding Toggle Switch - matches 12th/Diploma style */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${!includePF ? 'text-orange-600' : 'text-gray-500'}`}>
                      Without PF
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludePF(!includePF)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${includePF ? 'bg-green-600' : 'bg-orange-500'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includePF ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                    <span className={`text-sm font-medium ${includePF ? 'text-green-600' : 'text-gray-500'}`}>
                      With PF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Salary per annum (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Annual salary amount"
                      {...register('salary', {
                        required: 'Salary is required',
                        min: { value: 0, message: 'Salary must be positive' },
                        valueAsNumber: true
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Salary per month (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Monthly salary amount"
                      {...register('salaryPerMonth', {
                        required: 'Monthly salary is required',
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Annual salary ÷ 12</p>
                    {errors.salaryPerMonth && (
                      <p className="mt-1 text-sm text-red-600">{errors.salaryPerMonth.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Basic (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Basic salary amount"
                      {...register('basic', {
                        required: 'Basic salary is required',
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">40% of monthly salary</p>
                    {errors.basic && (
                      <p className="mt-1 text-sm text-red-600">{errors.basic.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DA (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Dearness Allowance"
                      {...register('da', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">10% of Basic</p>
                    {errors.da && (
                      <p className="mt-1 text-sm text-red-600">{errors.da.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HRA (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="House Rent Allowance"
                      {...register('hra', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">50% of Basic</p>
                    {errors.hra && (
                      <p className="mt-1 text-sm text-red-600">{errors.hra.message}</p>
                    )}
                  </div>

                  {includePF && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PF (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Provident Fund"
                        {...register('pf', {
                          min: { value: 0, message: 'Amount must be positive' }
                        })}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">12% of Basic</p>
                      {errors.pf && (
                        <p className="mt-1 text-sm text-red-600">{errors.pf.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Allowance (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Medical Allowance"
                      {...register('medicalAllowance', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fixed ₹1,250</p>
                    {errors.medicalAllowance && (
                      <p className="mt-1 text-sm text-red-600">{errors.medicalAllowance.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transport (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Transport Allowance"
                      {...register('transport', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fixed ₹1,600</p>
                    {errors.transport && (
                      <p className="mt-1 text-sm text-red-600">{errors.transport.message}</p>
                    )}
                  </div>

                  {includePF && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gratuity (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="Gratuity"
                        {...register('gratuity', {
                          min: { value: 0, message: 'Amount must be positive' }
                        })}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                      {errors.gratuity && (
                        <p className="mt-1 text-sm text-red-600">{errors.gratuity.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Leaves
                    </label>
                    <input
                      type="number"
                      placeholder="Days per year"
                      {...register('totalLeaves', {
                        min: { value: 0, message: 'Value must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.totalLeaves && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalLeaves.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary Credit Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st of every month"
                      {...register('salaryCreditDate')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payable Days
                    </label>
                    <input
                      type="number"
                      placeholder="Days"
                      {...register('payableDays')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      {...register('paymentMode')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Allowance (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Additional Allowance"
                      {...register('additionalAllowance', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Allowance (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Special Allowance"
                      {...register('specialAllowance', {
                        min: { value: 0, message: 'Amount must be positive' }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Balancing amount</p>
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">Salary Account and Bank Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      {...register('bankName', {
                        required: 'Bank name is required'
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Account No.
                    </label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      {...register('accountNo', {
                        required: 'Account number is required',
                        pattern: {
                          value: /^\d{9,18}$/,
                          message: 'Please enter a valid account number'
                        }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.accountNo && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountNo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., HDFC0000001 (11 characters)"
                      maxLength={11}
                      {...register('ifscCode', {
                        required: 'IFSC code is required',
                        pattern: {
                          value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                          message: 'Invalid IFSC format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0000001)'
                        }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black uppercase"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.ifscCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.ifscCode.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Format: BANK0BRANCH (e.g., HDFC0000001, SBIN0001234).
                      <a
                        href="https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=2009"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Find IFSC Code
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      {...register('accountHolderName', {
                        required: 'Account holder name is required'
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.accountHolderName && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message}</p>
                    )}
                  </div>
                </div>
              </div>


              <div className="flex justify-between items-center gap-4 px-6 py-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave />
                  {isSubmitting ? 'Saving...' : 'Add Employment'}
                </button>
              </div>
            </form>
          </div>
        )}</div>
    </DashboardLayout>
  );
} 