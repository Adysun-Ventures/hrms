'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { getEmployment, updateEmployment, getEmployees, checkEmploymentIdUnique, updateEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { Employment, Employee } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { useAuth } from '@/context/AuthContext';


interface EmploymentFormData extends Omit<Employment, 'id' | 'benefits' | 'relievingCtc'> {
  benefits: string | string[];
  relievingCtc?: string; // Form input is string, will be converted to number|null
  whereWereYouEmploid?: string;
  teamLead?: {
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
  colleague1?: {
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
  colleague3?: {
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
}

export default function EditEmploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [includePF, setIncludePF] = useState(true); // Default: With PF
  const [originalEmployment, setOriginalEmployment] = useState<Employment | null>(null);
  const generatedEmploymentIdsRef = useRef<Set<string>>(new Set());
  useForm({
  defaultValues: {
    isResignation: false
  }
});


  const router = useRouter();
  const { currentUserData } = useAuth();
  const { id } = use(params);
  const [employmentOwnerId, setEmploymentOwnerId] = useState<string | null>(null);
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const Layout: any = isEmployeeUser ? EmployeeLayout : DashboardLayout;

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, control } = useForm<EmploymentFormData>({
    defaultValues: {
      workSchedule: 'Office',
      whereWereYouEmploid: 'Registred Corporate Office',
    } as Partial<EmploymentFormData>,
  });
  const breadcrumbEmployeeId = watch('employeeId') || originalEmployment?.employeeId || '';
  const generateRandomEmploymentId = async () => {
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      // Generate: ADV + (1..100)
      const randomNumber = Math.floor(Math.random() * 100) + 1; // inclusive 1..100
      const candidate = `ADV${randomNumber}`;

      if (generatedEmploymentIdsRef.current.has(candidate)) continue;

      const { isUnique } = await checkEmploymentIdUnique(candidate, id);
      if (!isUnique) continue;

      generatedEmploymentIdsRef.current.add(candidate);
      setValue('employmentId', candidate as any, { shouldValidate: true, shouldDirty: true });
      toast.success('Random Employment ID generated');
      return;
    }

    toast.error('Could not generate unique Employment ID. Try again.');
  };
  const breadcrumbEmployeeName =
    employees.find((e) => e.id === breadcrumbEmployeeId)?.name || '';

  // Dynamic increments field array
  const {
    fields: incrementFields,
    append: appendIncrement,
    remove: removeIncrement,
  } = useFieldArray({
    control,
    name: 'increments',
  });

  // Watch salary and resignation state for calculations / UI
  const salary = watch('salary');
  const joiningCtcValue = watch('joiningCtc');
  const isResignation = watch('isResignation');
  const whereWereYouEmploidValue = watch('whereWereYouEmploid');
  const derivedLocation =
    whereWereYouEmploidValue === 'Registred Corporate Office'
      ? 'Pune'
      : whereWereYouEmploidValue === 'Branch Office'
        ? 'Mumbai'
        : '';
  const locationValue = watch('location');

  useEffect(() => {
    // Make `location` dependent on the selected employment office.
    if (!derivedLocation) return;
    setValue('location', derivedLocation, { shouldValidate: true, shouldDirty: true });
  }, [derivedLocation, setValue]);

  const joiningAnnualSalary = Number(joiningCtcValue || 0);
  const joiningMonthlySalary = joiningAnnualSalary > 0 ? Math.round(joiningAnnualSalary / 12) : 0;
  const joiningBasic = joiningMonthlySalary > 0 ? Math.round(joiningMonthlySalary * 0.4) : 0;
  const joiningDA = joiningBasic > 0 ? Math.round(joiningBasic * 0.1) : 0;
  const joiningHRA = joiningBasic > 0 ? Math.round(joiningBasic * 0.5) : 0;
  const joiningPF = includePF && joiningBasic > 0 ? Math.round(joiningBasic * 0.12) : 0;
  const joiningMedicalAllowance = joiningMonthlySalary > 0 ? 1250 : 0;
  const joiningTransportAllowance = joiningMonthlySalary > 0 ? 1600 : 0;
  const joiningCalculatedComponents =
    joiningBasic + joiningHRA + joiningDA + joiningMedicalAllowance + joiningTransportAllowance;
  const joiningSpecialAllowance =
    joiningMonthlySalary > 0 ? Math.max(0, joiningMonthlySalary - joiningCalculatedComponents) : 0;

  // After loading original employment, capture owner for employee access check
  useEffect(() => {
    if (originalEmployment?.employeeId) {
      setEmploymentOwnerId(originalEmployment.employeeId);
    }
  }, [originalEmployment]);

  // Block employees from editing other employees' employment
  useEffect(() => {
    if (
      currentUserData?.userType === 'employee' &&
      employmentOwnerId &&
      employmentOwnerId !== currentUserData.id
    ) {
      toast.error('You can only edit your own employment.');
      router.push('/employee-dashboard');
    }
  }, [currentUserData, employmentOwnerId, router]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch employees for the dropdown (admin only)
        if (!isEmployeeUser) {
          const employeesData = await getEmployees();
          setEmployees(employeesData);
        }

        // Fetch employment data
        const employmentData = await getEmployment(id);
        setOriginalEmployment(employmentData);

        // Reset form with employment data (excluding audit fields)
        const {
          id: _id,
          createdAt: _createdAt,
          createdBy: _createdBy,
          updatedAt: _updatedAt,
          updatedBy: _updatedBy,
          relievingCtc,
          ...rest
        } = employmentData;

        // Suppress unused variable warnings for destructured audit fields
        void _id; void _createdAt; void _createdBy; void _updatedAt; void _updatedBy;

        const increments =
          employmentData.increments && employmentData.increments.length > 0
            ? employmentData.increments
            : (employmentData.incrementDate ||
               employmentData.newSalary ||
               employmentData.incrementedCtc ||
               employmentData.incrementedInHandCtc)
            ? [
                {
                  incrementDate: employmentData.incrementDate || '',
                  newSalary: employmentData.newSalary,
                  incrementedCtc: employmentData.incrementedCtc,
                  incrementedInHandCtc: employmentData.incrementedInHandCtc,
                },
              ]
            : [];

        const normalizedWorkSchedule =
          rest.workSchedule === 'Office' || rest.workSchedule === 'Remote' || rest.workSchedule === 'Hybrid'
            ? rest.workSchedule
            : 'Office';

        reset({
          ...rest,
          workSchedule: normalizedWorkSchedule,
          whereWereYouEmploid: (rest as any).whereWereYouEmploid || 'Registred Corporate Office',
          relievingCtc: relievingCtc ? relievingCtc.toString() : '',
          benefits: employmentData.benefits?.join(', ') || '',
          increments,
        });

        // Initialize includePF based on existing PF value
        if (employmentData.pf && employmentData.pf > 0) {
          setIncludePF(true);
        } else {
          setIncludePF(false);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset, isEmployeeUser]);

  const onSubmit = async (data: EmploymentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      toast.loading('Updating employment...', { id: 'updateEmployment' });

      // Check if employment ID is unique (admin only)
      if (!isEmployeeUser) {
        const normalizedEmploymentId = data.employmentId?.trim().toUpperCase();
        const normalizedOriginalEmploymentId = originalEmployment?.employmentId?.trim().toUpperCase();

        if (normalizedEmploymentId && normalizedEmploymentId !== normalizedOriginalEmploymentId) {
          const { isUnique, existingEmployment } = await checkEmploymentIdUnique(normalizedEmploymentId, id);
          if (!isUnique) {
            const conflictEmploymentId = existingEmployment?.id;
            const conflictEmployeeId = existingEmployment?.employeeId;
            const conflictEndDate = existingEmployment?.endDate;
            const conflictIsResignation = existingEmployment?.isResignation;
            const conflictIsResigned = existingEmployment?.is_resigned;
            const conflictEmploymentStatus = existingEmployment?.employmentStatus;

            throw new Error(
              `Employment ID is already used` +
                `${conflictEmployeeId ? ` (employeeId: ${conflictEmployeeId})` : ''}` +
                `${conflictEmploymentId ? ` (employment record: ${conflictEmploymentId})` : ''}` +
                `${conflictEndDate ? ` (endDate: ${String(conflictEndDate)})` : ''}` +
                `${conflictIsResignation !== null && conflictIsResignation !== undefined ? ` (isResignation: ${String(conflictIsResignation)})` : ''}` +
                `${conflictIsResigned !== null && conflictIsResigned !== undefined ? ` (is_resigned: ${String(conflictIsResigned)})` : ''}` +
                `${conflictEmploymentStatus ? ` (employmentStatus: ${String(conflictEmploymentStatus)})` : ''}`
            );
          }
        }
      }

      // Convert benefits string to array
      const benefitsArray = typeof data.benefits === 'string'
        ? data.benefits.split(',').map(b => b.trim()).filter(b => b !== '')
        : data.benefits;

      // Convert string numbers to actual numbers
      const formattedData: any = {
        ...data,
        employmentId: data.employmentId?.trim().toUpperCase(),
        salary: Number(data.salary),
        joiningCtc: Number(data.joiningCtc),
        inHandCtc: Number(data.inHandCtc),
        relievingCtc: Number(data.relievingCtc),
        salaryPerMonth: Number(data.salaryPerMonth),
        basic: Number(data.basic),
        da: Number(data.da),
        hra: Number(data.hra),
        pf: Number(data.pf),
        medicalAllowance: Number(data.medicalAllowance),
        transport: Number(data.transport),
        gratuity: Number(data.gratuity),
        totalLeaves: data.totalLeaves !== undefined && data.totalLeaves !== null && data.totalLeaves !== ('' as any)
          ? Number(data.totalLeaves)
          : undefined,
        payableDays: data.payableDays !== undefined && data.payableDays !== null && data.payableDays !== ('' as any)
          ? Number(data.payableDays)
          : undefined,
        additionalAllowance: Number(data.additionalAllowance),
        specialAllowance: Number(data.specialAllowance),
        benefits: benefitsArray,
        panNumber: data.panNumber ? data.panNumber.trim() : undefined,

      };

      // Only include optional fields if they have values (not empty strings or undefined)
      if (data.endDate && data.endDate.trim()) {
        formattedData.endDate = data.endDate;
      }
      // employmentId already normalized above
      if (data.joiningDate && data.joiningDate.trim()) {
        formattedData.joiningDate = data.joiningDate;
      }
      if (data.salaryCreditDate && data.salaryCreditDate.trim()) {
        formattedData.salaryCreditDate = data.salaryCreditDate;
      }
      if (data.paymentMode && data.paymentMode.trim()) {
        formattedData.paymentMode = data.paymentMode;
      }
      if (data.jobTitle && data.jobTitle.trim()) {
        formattedData.jobTitle = data.jobTitle;
      }
      if (data.department && data.department.trim()) {
        formattedData.department = data.department;
      }
      if (data.location && data.location.trim()) {
        formattedData.location = data.location;
      }
      if (data.reportingManager && data.reportingManager.trim()) {
        formattedData.reportingManager = data.reportingManager;
      }
      if (data.employmentType && data.employmentType.trim()) {
        formattedData.employmentType = data.employmentType;
      }
      if (data.workSchedule && data.workSchedule.trim()) {
        formattedData.workSchedule = data.workSchedule;
      }
      if (data.whereWereYouEmploid && data.whereWereYouEmploid.trim()) {
        formattedData.whereWereYouEmploid = data.whereWereYouEmploid;
      }

      if (data.reasonForLeaving && data.reasonForLeaving.trim()) {
        formattedData.reasonForLeaving = data.reasonForLeaving.trim();
      }

      // Handle increments array and keep latest values in scalar fields for backward compatibility
      if (data.increments && data.increments.length > 0) {
        formattedData.increments = data.increments.map((inc) => ({
          ...inc,
          newSalary: inc.newSalary != null ? Number(inc.newSalary) : undefined,
          incrementedCtc: inc.incrementedCtc != null ? Number(inc.incrementedCtc) : undefined,
          incrementedInHandCtc:
            inc.incrementedInHandCtc != null ? Number(inc.incrementedInHandCtc) : undefined,
        }));

        const latest = data.increments[data.increments.length - 1];
        if (latest.incrementDate) {
          formattedData.incrementDate = latest.incrementDate;
        }
        if (latest.newSalary != null) {
          formattedData.newSalary = Number(latest.newSalary);
        }
        if (latest.incrementedCtc != null) {
          formattedData.incrementedCtc = Number(latest.incrementedCtc);
        }
        if (latest.incrementedInHandCtc != null) {
          formattedData.incrementedInHandCtc = Number(latest.incrementedInHandCtc);
        }
      }

      if (isEmployeeUser) {
        await updateEmployeeSelfEmployment(currentUserData!.id, id, formattedData);
      } else {
        await updateEmployment(id, formattedData);
      }
      toast.success('Employment updated successfully!', { id: 'updateEmployment' });
      router.push(`/employments/${id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employment';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'updateEmployment' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout
        breadcrumbItems={
          isEmployeeUser
            ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
            : [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees', href: '/employees' }, { label: 'Loading...', isCurrent: true }]
        }
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Skeleton for TableHeader */}
          <div className="space-y-6">
            {/* Title and Action Buttons Skeleton */}
            <div className="flex justify-between items-center px-6 py-6">
              <div className="flex items-center">
                <div className="bg-gray-200 h-10 w-20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, fieldIndex) => (
                      <div key={fieldIndex} className="space-y-2">
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="bg-gray-200 h-10 w-full rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumbItems={
        isEmployeeUser
          ? [
            { label: 'Dashboard', href: '/employee-dashboard' },
            { label: 'Employment', href: `/employments/${id}` },
            { label: 'Edit Employment', isCurrent: true },
          ]
          : [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Employees', href: '/employees' },
            ...(breadcrumbEmployeeId
              ? [
                {
                  label: breadcrumbEmployeeName || 'Employee',
                  href: `/employees/${breadcrumbEmployeeId}`,
                },
                { label: 'Employment', href: `/employments/${id}` },
              ]
              : [{ label: 'Employments', href: '/employments' }]),
            { label: 'Edit Employment', isCurrent: true },
          ]
      }
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Edit Employment"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => { }}
          searchPlaceholder=""
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          backButton={{
            href: `/employments/${id}`,
            label: 'Back'
          }}
          actionButtons={[
            {
              label: 'Save',
              icon: <FiSave />,
              variant: 'success',
              onClick: () => handleSubmit(onSubmit)()
            }
          ]}
        />

        {error && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pb-6">
            <input
              type="hidden"
              {...register('employeeId', { required: 'Employee is required' })}
              value={watch('employeeId') || originalEmployment?.employeeId || ''}
            />

            {/* Employment Information */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">Employment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment ID
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      {...register('employmentId', {
                        required: 'Employment ID is required',
                        pattern: {
                          value: /^ADV\d+$/i,
                          message: 'Employment ID must be in the format ADV<number>',
                        },
                        validate: (value) => {
                          const num = Number(String(value).replace(/^ADV/i, ''));
                          if (!Number.isFinite(num)) return 'Employment ID number is invalid';
                          if (num < 1 || num > 100) return 'Employment ID number must be between 1 and 100';
                          return true;
                        },
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="E.g., ADV10"
                    />
                    <button
                      type="button"
                      onClick={generateRandomEmploymentId}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition whitespace-nowrap"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Random
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    {...register('joiningDate')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining CTC
                  </label>
                  <input
                    type="number"
                    {...register('joiningCtc', {
                      min: { value: 0, message: 'Joining CTC must be positive' },
                      valueAsNumber: true
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Joining CTC amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In-hand CTC
                  </label>
                  <input
                    type="number"
                    {...register('inHandCtc', {
                      min: { value: 0, message: 'In-hand CTC must be positive' },
                      valueAsNumber: true
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="In-hand CTC"
                  />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    {...register('jobTitle')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="E.g., Software Developer"
                  />
                </div>

                <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Department
  </label>

  <select
    {...register('department')}
    
    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
  >
    <option value="">Select Department</option>
    <option value="Engineering">Engineering</option>
    <option value="Human Resources">Human Resources</option>
    <option value="Finance">Finance</option>
    <option value="Sales">Sales</option>
    <option value="Marketing">Marketing</option>
    <option value="Operations">Operations</option>
    <option value="Customer Support">Customer Support</option>
    <option value="IT">IT</option>
    <option value="Admin">Admin</option>
    <option value="Legal">Legal</option>
  </select>
</div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    {...register('location')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select location</option>
                    {derivedLocation ? <option value={derivedLocation}>{derivedLocation}</option> : null}
                    {locationValue && locationValue !== derivedLocation ? (
                      <option value={locationValue}>{locationValue}</option>
                    ) : null}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <input
                    type="text"
                    {...register('employmentType')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="E.g., Permanent, Contract"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" >
                    Work Mode
                  </label>
                  <select
                    {...register('workSchedule')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Where Were You Employed?
                  </label>
                  <select
                    {...register('whereWereYouEmploid')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Registred Corporate Office">Registred Corporate Office</option>
                    <option value="Branch Office">Branch Office</option>
                  </select>
                </div>

                
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">Resignation Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is Resigned?
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('isResignation', !isResignation)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                        ${isResignation ? 'bg-green-500' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                          ${isResignation ? 'translate-x-5' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {isResignation ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {isResignation && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resignation Date
                      </label>
                      <input
                        type="date"
                        {...register('resignationDate')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Working Date
                      </label>
                      <input
                        type="date"
                        {...register('lastWorkingDate')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Drawn Salary
                      </label>
                      <input
                        type="number"
                        {...register('lastDrawnSalary', {
                          min: { value: 0, message: 'Salary must be positive' }
                        })}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter last drawn salary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Salary Date
                      </label>
                      <input
                        type="date"
                        {...register('lastSalaryDate')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Exit
                      </label>
                      <input
                        type="text"
                        {...register('reasonForLeaving')}
                        placeholder="Enter reason for exit"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Career Progression/Increment Details (CTP) */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 border-l-4 border-purple-500 pl-2">
                  Increment Details
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    appendIncrement({
                      incrementDate: '',
                      newSalary: undefined,
                      incrementedCtc: undefined,
                      incrementedInHandCtc: undefined,
                      previousDesignation: '',
                      newDesignation: '',
                    })
                  }
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                >
                  Add Increment
                </button>
              </div>

              {incrementFields.length === 0 && (
                <p className="text-sm text-gray-500 mb-2">
                  No increments added yet. Click &quot;Add Increment&quot; to add the first increment.
                </p>
              )}

              <div className="space-y-4">
                {incrementFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Increment {index + 1}
                      </h3>
                      {incrementFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIncrement(index)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Increment Date
                        </label>
                        <input
                          type="date"
                          {...register(`increments.${index}.incrementDate` as const)}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Incremented Salary (₹)
                        </label>
                        <input
                          type="number"
                          {...register(`increments.${index}.newSalary` as const, {
                            min: { value: 0, message: 'Amount must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Incremented salary amount"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Incremented CTC (₹)
                        </label>
                        <input
                          type="number"
                          {...register(`increments.${index}.incrementedCtc` as const, {
                            min: { value: 0, message: 'Amount must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Incremented CTC amount"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Incremented In-hand CTC (₹)
                        </label>
                        <input
                          type="number"
                          {...register(`increments.${index}.incrementedInHandCtc` as const, {
                            min: { value: 0, message: 'Amount must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Incremented in-hand CTC"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous Designation
                        </label>
                        <input
                          type="text"
                          {...register(`increments.${index}.previousDesignation` as const)}
                          placeholder="E.g., Software Developer"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Designation
                        </label>
                        <input
                          type="text"
                          {...register(`increments.${index}.newDesignation` as const)}
                          placeholder="E.g., Senior Software Developer"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Joining Salary Information */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-cyan-500 pl-2">
                  Joining Salary Information
                </h2>

                {/* Sliding Toggle Switch - With/Without PF */}
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
                    Joining Salary per annum (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningAnnualSalary || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Salary per month (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningMonthlySalary || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Basic (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningBasic || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining DA (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningDA || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining HRA (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningHRA || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {includePF && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining PF (₹)
                    </label>
                    <input
                      type="number"
                      value={joiningPF || ''}
                      readOnly
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Additional Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={0}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Special Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={joiningSpecialAllowance || ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-green-500 pl-2">
                    Current Salary Information
                  </h2>
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
                    <span className="text-red-500 mr-1">*</span> Current Salary per annum (₹)
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
                    <span className="text-red-500 mr-1">*</span> Current Salary per month (₹)
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
                    <span className="text-red-500 mr-1">*</span> Current Basic (₹)
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
                    Current DA (₹)
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
                    Current HRA (₹)
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
                      Current PF (₹)
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
                    Current Additional Allowance (₹)
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
                    Current Special Allowance (₹)
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
            <div className="bg-white p-4 rounded-lg mb-6">
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
                  {/* <p className="mt-1 text-xs text-gray-500">
                    Format: BANK0BRANCH (e.g., HDFC0000001, SBIN0001234).
                    <a
                      href="https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=2009"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Find IFSC Code
                    </a>
                  </p> */}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Pan Card No.
                  </label>
                  <input
                    type="text"
                    placeholder="Enter PAN number"
                    {...register('panNumber', {
                      required: 'PAN number is required',
                      pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Invalid PAN format. Must be 10 characters: 5 letters + 4 digits + 1 letter'
                      }
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.accountHolderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message}</p>
                  )}
                </div>
              </div>
            </div>


            {/* Form Buttons */}
            <div className="flex justify-between items-center gap-4 px-6 py-3">
              <Link
                href={`/employments/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
} 