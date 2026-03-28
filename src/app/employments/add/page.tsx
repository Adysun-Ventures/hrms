'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import {
  addEmployment,
  getEmployees,
  getAdminDataForAudit,
  checkEmploymentIdUnique,
  getEmployeeSelf,
} from '@/utils/firebaseUtils';
import {
  PROFESSIONAL_REFERENCE_DIRECTORY,
  PROFESSIONAL_REFERENCE_NAME_OPTIONS,
  buildProfessionalReferencesArray,
} from '@/utils/professionalReferenceEmployment';
import { Employment, Employee } from '@/types';
import { FiSave, FiPlus, FiRefreshCw } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { useAuth } from '@/context/AuthContext';
import {
  EMPLOYMENT_DESIGNATION_BY_DEPARTMENT,
  EMPLOYMENT_ID_NUMBER_MAX,
  EMPLOYMENT_ID_NUMBER_MIN,
  randomEmploymentIdSuffix,
} from '@/constants/employmentJobOptions';

interface EmploymentFormData extends Omit<Employment, 'id' | 'relievingCtc'> {
  // Add all the fields we need
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
  reportingManagerRef?: {
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };

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
  workSchedule: string;
  whereWereYouEmploid?: string;

  //Bank details
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
  panNumber?: string;
}

export default function AddEmploymentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [preSelectedEmployee, setPreSelectedEmployee] = useState<Employee | null>(null);
  const [includePF, setIncludePF] = useState(true); // Default: With PF
  const generatedEmploymentIdsRef = useRef<Set<string>>(new Set());

  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdFromUrl = searchParams ? searchParams.get('employeeId') : null;

  const { currentUserData } = useAuth();
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const isAdminUser = currentUserData?.userType === 'admin';
  // If userType is still unknown, default to EmployeeLayout to avoid triggering admin-only calls.
  const Layout: any = isAdminUser ? DashboardLayout : EmployeeLayout;

  /** Employees must not use admin routes (/employees/..., /dashboard, /employments list) for back / cancel. */
  const addEmploymentBackHref =
    isEmployeeUser
      ? '/employee-dashboard'
      : preSelectedEmployee
        ? `/employees/${preSelectedEmployee.id}`
        : '/employments';

  const addEmploymentBreadcrumbItems = isEmployeeUser
    ? [
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Add Employment', isCurrent: true },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        ...(preSelectedEmployee
          ? [
              { label: preSelectedEmployee.name, href: `/employees/${preSelectedEmployee.id}` },
              { label: 'Add Employment', isCurrent: true },
            ]
          : [
              { label: 'Employments', href: '/employments' },
              { label: 'Add Employment', isCurrent: true },
            ]),
      ];

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EmploymentFormData>({
    defaultValues: {
      employmentId: 'ADV',
      isResignation: false,
      whereWereYouEmploid: 'Registred Corporate Office(Pune)',
      location: 'Pune',
      teamLead: { name: '', employeeId: '', mobileNo: '', email: '', designation: '', location: '' },
      colleague1: { name: '', employeeId: '', mobileNo: '', email: '', designation: '', location: '' },
      colleague3: { name: '', employeeId: '', mobileNo: '', email: '', designation: '', location: '' },
      reportingManagerRef: { name: '', employeeId: '', mobileNo: '', email: '', designation: '', location: '' },
    }
  });

  const whereWereYouEmploidValue = watch('whereWereYouEmploid');
  const selectedDepartment = watch('department');
  const designationOptionsByDepartment = EMPLOYMENT_DESIGNATION_BY_DEPARTMENT;
  const derivedLocation =
    whereWereYouEmploidValue === 'Registred Corporate Office(Pune)' ||
    whereWereYouEmploidValue === 'Registred Corporate Office'
      ? 'Pune'
      : whereWereYouEmploidValue === 'Branch Office(Mumbai)' ||
          whereWereYouEmploidValue === 'Branch Office'
        ? 'Mumbai'
        : '';

  useEffect(() => {
    // Make `location` dependent on the selected employment office.
    if (!derivedLocation) return;
    setValue('location', derivedLocation, { shouldValidate: true, shouldDirty: true });
  }, [derivedLocation, setValue]);

  // ---------------- Professional Reference (same behavior as Edit Employment) ----------------
  type ProfessionalRefKey = 'teamLead' | 'colleague1' | 'colleague3' | 'reportingManagerRef';

  const professionalRefTeamLeadName = watch('teamLead.name') || '';
  const professionalRefColleague1Name = watch('colleague1.name') || '';
  const professionalRefColleague3Name = watch('colleague3.name') || '';
  const professionalRefReportingManagerName = watch('reportingManagerRef.name') || '';
  const showProfessionalReferenceExtraFields = false;

  const clearProfessionalReferenceFields = (refKey: ProfessionalRefKey) => {
    setValue(`${refKey}.name` as any, '', { shouldDirty: true });
    setValue(`${refKey}.employeeId` as any, '', { shouldDirty: true });
    setValue(`${refKey}.mobileNo` as any, '', { shouldDirty: true });
    setValue(`${refKey}.email` as any, '', { shouldDirty: true });
    setValue(`${refKey}.designation` as any, '', { shouldDirty: true });
    setValue(`${refKey}.location` as any, '', { shouldDirty: true });
  };

  const autoFillProfessionalReferenceFromDirectory = (refKey: ProfessionalRefKey, employeeName: string) => {
    const key = (employeeName ?? '').trim();
    if (!key) {
      clearProfessionalReferenceFields(refKey);
      return;
    }
    const person = PROFESSIONAL_REFERENCE_DIRECTORY[key];
    if (!person) {
      clearProfessionalReferenceFields(refKey);
      return;
    }

    setValue(`${refKey}.employeeId` as any, person.employeeId, { shouldDirty: true });
    setValue(`${refKey}.mobileNo` as any, person.mobileNo, { shouldDirty: true });
    setValue(`${refKey}.email` as any, person.email, { shouldDirty: true });
    setValue(`${refKey}.designation` as any, person.designation, { shouldDirty: true });
    setValue(`${refKey}.location` as any, person.location, { shouldDirty: true });
  };

  useEffect(() => {
    if (!professionalRefTeamLeadName) return;
    autoFillProfessionalReferenceFromDirectory('teamLead', professionalRefTeamLeadName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefTeamLeadName]);

  useEffect(() => {
    if (!professionalRefColleague1Name) return;
    autoFillProfessionalReferenceFromDirectory('colleague1', professionalRefColleague1Name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefColleague1Name]);

  useEffect(() => {
    if (!professionalRefColleague3Name) return;
    autoFillProfessionalReferenceFromDirectory('colleague3', professionalRefColleague3Name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefColleague3Name]);

  useEffect(() => {
    if (!professionalRefReportingManagerName) return;
    autoFillProfessionalReferenceFromDirectory('reportingManagerRef', professionalRefReportingManagerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefReportingManagerName]);

  // Watch salary for calculations
  const joiningCtc = watch('joiningCtc'); 

   useEffect(() => {
    if (joiningCtc && joiningCtc > 0) {
      const annual = Number(joiningCtc);
      const gross = Math.round(annual / 12);      // Monthly Gross
      const basic = Math.round(gross * 0.40);     // Basic 40%
      const pf = Math.round(basic * 0.12) *2;        // Employee PF 12%
      const pt = 200;                             // Professional Tax Fixed
      const inHand = (gross - pf - pt)  ;
      setValue('inHandCtc', inHand);
    }
  }, [joiningCtc, setValue]);
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
  const generateRandomEmploymentId = async () => {
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const randomNumber = randomEmploymentIdSuffix();
      const candidate = `ADV${randomNumber}`;

      if (generatedEmploymentIdsRef.current.has(candidate)) continue;

      const { isUnique } = await checkEmploymentIdUnique(candidate);
      if (!isUnique) continue;

      generatedEmploymentIdsRef.current.add(candidate);
      setValue('employmentId', candidate, { shouldValidate: true, shouldDirty: true });
      toast.success('Random Employment ID generated');
      return;
    }

    toast.error('Could not generate unique Employment ID. Try again.');
  };
  useEffect(() => {
    if (employmentId && !employmentId.startsWith('ADV')) {
      // If user tries to remove ADV prefix, restore it
      const suffixDigits = employmentId.replace(/^ADV/i, '').replace(/\D/g, '');
      setValue('employmentId', 'ADV' + suffixDigits, { shouldValidate: true, shouldDirty: true });
    }
  }, [employmentId, setValue]);

  useEffect(() => {
    // Wait for auth to be ready to avoid running admin-only logic on first render.
    if (!currentUserData?.id || !currentUserData?.userType) return;

    const fetchEmployees = async () => {
      try {
        if (currentUserData.userType === 'employee') {
          if (!currentUserData?.id) return;
          // Employee user can only create employment for themselves
          const selfEmployee = await getEmployeeSelf(currentUserData.id);
          setEmployees([selfEmployee]);
          setPreSelectedEmployee(selfEmployee);
          setValue('employeeId', selfEmployee.id, { shouldValidate: true });
        } else {
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
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [employeeIdFromUrl, setValue, currentUserData?.id, currentUserData?.userType]);

  const onSubmit = async (data: EmploymentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      toast.loading('Creating employment record...', { id: 'add-employment' });

      // Check if employment ID is unique
      const normalizedEmploymentId = data.employmentId?.trim().toUpperCase();
      if (normalizedEmploymentId) {
        const { isUnique, existingEmployment } = await checkEmploymentIdUnique(normalizedEmploymentId);
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

      // Audit fields: admin users use admin session, employees use their own id.
      const currentTimestamp = new Date().toISOString();
      const auditId = isEmployeeUser ? currentUserData!.id : getAdminDataForAudit().adminId;

      const {
        teamLead,
        colleague1,
        colleague3,
        reportingManagerRef,
        ...rest
      } = data;

      // Convert string values to numbers and handle undefined values
      const formattedData = {
        ...rest,
        // Store normalized employmentId for consistent uniqueness checks
        employmentId: normalizedEmploymentId,
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
        totalLeaves: data.totalLeaves !== undefined && data.totalLeaves !== null && data.totalLeaves !== ('' as any)
          ? Number(data.totalLeaves)
          : undefined,
        payableDays: data.payableDays !== undefined && data.payableDays !== null && data.payableDays !== ('' as any)
          ? Number(data.payableDays)
          : undefined,
        professionalReferences: buildProfessionalReferencesArray({
          teamLead,
          colleague1,
          colleague3,
          reportingManagerRef,
        }),
        // Add audit fields
        createdAt: currentTimestamp,
        createdBy: auditId,
        updatedAt: currentTimestamp,
        updatedBy: auditId,
      };

      const created = await addEmployment(formattedData);
      toast.success('Employment record created successfully!', { id: 'add-employment' });

      if (isEmployeeUser && created?.id) {
        router.push(`/employments/${created.id}?employmentCreated=true`);
      } else if (preSelectedEmployee) {
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
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout breadcrumbItems={addEmploymentBreadcrumbItems as any}>
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
            href: addEmploymentBackHref,
            label: 'Back',
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
              {isEmployeeUser ? (
                // Employee self-service: keep employee fixed to logged-in employee.
                <input
                  type="hidden"
                  {...register('employeeId', { required: 'Employee is required' })}
                  value={preSelectedEmployee?.id || currentUserData?.id || ''}
                />
              ) : (
                <div className="bg-white p-4 rounded-lg mb-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="text-red-500 mr-1">*</span>Employee
                      </label>
                      <input
                        type="text"
                        value={preSelectedEmployee?.name || ''}
                        readOnly
                        disabled
                        placeholder="Employee is pre-selected"
                        className="w-full p-2 border rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                      <input
                        type="hidden"
                        {...register('employeeId', { required: 'Employee is required' })}
                        value={preSelectedEmployee?.id || ''}
                      />
                      {errors.employeeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Job Details Section - MOVED TO TOP */}
              <div className="bg-white p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">Job Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Department
  </label>

  <select
    {...register('department')}
    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
  >
    <option value="">Select department</option>
    <option value="Engineering">Engineering</option>
    <option value="Development">Development</option>
    <option value="Support">Support</option>
    <option value="Sales">Sales</option>
    <option value="Marketing">Marketing</option>
    <option value="HR">HR</option>
    <option value="Finance">Finance</option>
  </select>
</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Designation
                    </label>
                    <select
                      {...register('jobTitle', {
                        required: 'Designation is required'
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!selectedDepartment}
                    >
                      <option value="">
                        {selectedDepartment ? 'Select designation' : 'Select department first'}
                      </option>
                      {(selectedDepartment ? designationOptionsByDepartment[selectedDepartment] : [])?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.jobTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
                    )}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
  <select
    {...register('location', { required: true })}
    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
  >
    <option value="">{derivedLocation ? 'Select location' : 'Select location'}</option>
    {derivedLocation ? <option value={derivedLocation}>{derivedLocation}</option> : null}
  </select>
                  </div>

                  

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Mode
                    </label>
                    
                    <select
                      {...register('workSchedule')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="Mon-Fri 10 AM to 7 PM">Office</option>
                      <option value="Mon-Fri 10 AM to 7 PM">Remote</option>
                      <option value="Mon-Fri 10 AM to 7 PM">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Where Were You Employed?
                    </label>
                    <select
                      {...register('whereWereYouEmploid')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="Registred Corporate Office(Pune)">Registred Corporate Office(Pune)</option>
                      <option value="Branch Office(Mumbai)">Branch Office(Mumbai)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Reference — same as Edit Employment */}
              <div className="bg-white p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-2">
                  Professional Reference
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Team Leader</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('teamLead.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('teamLead', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Id</label>
                          <input
                            {...register('teamLead.employeeId' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                          <input
                            {...register('teamLead.mobileNo' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            {...register('teamLead.email' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input
                            {...register('teamLead.designation' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                          <input
                            {...register('teamLead.location' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Colleague 1</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('colleague1.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('colleague1', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Id</label>
                          <input
                            {...register('colleague1.employeeId' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                          <input
                            {...register('colleague1.mobileNo' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            {...register('colleague1.email' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input
                            {...register('colleague1.designation' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                          <input
                            {...register('colleague1.location' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Colleague 2</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('colleague3.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('colleague3', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Id</label>
                          <input
                            {...register('colleague3.employeeId' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                          <input
                            {...register('colleague3.mobileNo' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            {...register('colleague3.email' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input
                            {...register('colleague3.designation' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                          <input
                            {...register('colleague3.location' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Reporting Manager</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('reportingManagerRef.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('reportingManagerRef', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Id</label>
                          <input
                            {...register('reportingManagerRef.employeeId' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                          <input
                            {...register('reportingManagerRef.mobileNo' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            {...register('reportingManagerRef.email' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input
                            {...register('reportingManagerRef.designation' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                          <input
                            {...register('reportingManagerRef.location' as const)}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div className="bg-white p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">Employment Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Employment ID
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="E.g., ADV250 (1–999)"
                        {...register('employmentId', {
                          required: 'Employment ID is required',
                          pattern: {
                            value: /^ADV\d+$/i,
                            message: 'Employment ID must be in the format ADV<number>'
                          },
                          validate: (value) => {
                            const num = Number(String(value).replace(/^ADV/i, ''));
                            if (!Number.isFinite(num)) return 'Employment ID number is invalid';
                            if (num < EMPLOYMENT_ID_NUMBER_MIN || num > EMPLOYMENT_ID_NUMBER_MAX)
                              return `Employment ID number must be between ${EMPLOYMENT_ID_NUMBER_MIN} and ${EMPLOYMENT_ID_NUMBER_MAX}`;
                            return true;
                          }
                        })}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
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

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relieving CTC (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Relieving CTC (if applicable)"
                      {...register('relievingCtc')}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div> */}

                  {/* <div>
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
                  </div> */}
                </div>
              </div>

              {/* Career Progression/Increment Details (CTP) */}
              <div className="bg-white p-4 rounded-lg mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4 border-l-4 border-purple-500 pl-2">
                 Increment Details
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
              <div className="bg-white p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-2 border-l-4 border-green-500 pl-2">
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
                      <span className="text-red-500 mr-1">*</span> Pan Details.
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pan number"
                      {...register('panNumber', {
                        required: 'Pan number is required',
                        pattern: {
                          value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                          message: 'Please enter a valid pan number'
                        }
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {errors.panNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>
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

                  
                </div>
              </div>


              <div className="flex justify-between items-center gap-4 px-6 py-3">
                <button
                  type="button"
                  onClick={() => router.push(addEmploymentBackHref)}
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
    </Layout>
  );
} 