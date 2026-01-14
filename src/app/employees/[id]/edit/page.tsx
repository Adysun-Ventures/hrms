'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FiSave, FiEye, FiEyeOff, FiPlus, FiX } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getEmployee, updateEmployee, checkUserByPhone, validatePANFormat, checkPANExistsAnywhere } from '@/utils/firebaseUtils';
import { Employee } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { formatDateToDayMonYear } from '@/utils/documentUtils';


type PageParams = {
  params: Promise<{ id: string }>;
};

export default function EditEmployeePage({ params }: PageParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [educationEntries, setEducationEntries] = useState<Array<{
    id: string;
    type: '12th' | 'diploma';
  }>>([
    { id: crypto.randomUUID(), type: '12th' }
  ]);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  const router = useRouter();
  const { id } = use(params);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<Omit<Employee, 'id'> & { confirmPassword?: string }>();
  const currentAddressValue = watch('currentAddress');
  const employmentStatus = watch('employmentStatus');

  // Helper functions for managing education entries
  // Check if we can add more entries
  const canAddEntry = () => {
    if (educationEntries.length >= 2) return false; // Max 2 entries
    
    const has12th = educationEntries.some(e => e.type === '12th');
    const hasDiploma = educationEntries.some(e => e.type === 'diploma');
    
    return !(has12th && hasDiploma); // Can add only if both not present
  };

  // Get the type that should be added next
  const getNextEntryType = (): '12th' | 'diploma' => {
    const has12th = educationEntries.some(e => e.type === '12th');
    return has12th ? 'diploma' : '12th';
  };

  // Prevent toggling if it creates duplicate
  const canToggleType = (id: string, newType: '12th' | 'diploma'): boolean => {
    // Check if another entry already has this type
    return !educationEntries.some(e => e.id !== id && e.type === newType);
  };

  const addEducationEntry = () => {
    if (!canAddEntry()) {
      toast.error('Maximum 2 entries allowed (one 12th and one Diploma)');
      return;
    }
    
    setEducationEntries([
      ...educationEntries,
      { id: crypto.randomUUID(), type: getNextEntryType() }
    ]);
  };

  const removeEducationEntry = (id: string) => {
    if (educationEntries.length > 1) {
      setEducationEntries(educationEntries.filter(entry => entry.id !== id));
    }
  };

  const toggleEducationType = (id: string) => {
    const entry = educationEntries.find(e => e.id === id);
    if (!entry) return;
    
    const newType = entry.type === '12th' ? 'diploma' : '12th';
    
    if (!canToggleType(id, newType)) {
      toast.error(`You already have a ${newType === '12th' ? '12th Standard' : 'Diploma'} entry. Please remove it first.`);
      return;
    }
    
    setEducationEntries(educationEntries.map(entry => 
      entry.id === id 
        ? { ...entry, type: newType }
        : entry
    ));
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const employeeData = await getEmployee(id);
        // Initialize education entries from employee data
        if (employeeData.secondaryEducation && employeeData.secondaryEducation.length > 0) {
          setEducationEntries(
            employeeData.secondaryEducation.map(entry => ({
              id: entry.id || crypto.randomUUID(),
              type: entry.type,
            }))
          );
          
          // Set form values
          reset({
            ...employeeData,
            secondaryEducation: employeeData.secondaryEducation,
          });
        } else {
          // Default to one entry if none exists
          setEducationEntries([{ id: crypto.randomUUID(), type: '12th' }]);
          
          // Reset form with all employee data except id and audit fields
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, createdAt: _createdAt, createdBy: _createdBy, updatedAt: _updatedAt, updatedBy: _updatedBy, ...rest } = employeeData;
          reset(rest);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employee data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, reset]);

  useEffect(() => {
    if (sameAsCurrentAddress) {
      setValue('permanentAddress', currentAddressValue || '');
    }
  }, [sameAsCurrentAddress, currentAddressValue, setValue]);

  // Auto-fill resignedDate and update status when employmentStatus changes
  useEffect(() => {
    if (employmentStatus === 'resigned') {
      const currentDate = new Date().toISOString().split('T')[0];
      setValue('resignedDate', currentDate);
      setValue('status', 'inactive');
    } else if (employmentStatus === 'working') {
      setValue('status', 'active');
    }
  }, [employmentStatus, setValue]);

  const onSubmit = async (data: Omit<Employee, 'id'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      toast.loading('Updating employee...', { id: 'updateEmployee' });

      // Check if phone number is already registered with another user
      const formattedPhoneNumber = `+91${data.phone}`;
      const existingUser = await checkUserByPhone(formattedPhoneNumber);
      
      if (existingUser && existingUser.id !== id) {
        const userType = existingUser.userType === 'admin' ? 'admin' : 'employee';
        throw new Error(`Phone number is already registered with an ${userType}`);
      }

      // Validate PAN card if provided
      if (data.panCard && data.panCard.trim()) {
        if (!validatePANFormat(data.panCard)) {
          throw new Error('Please enter a valid PAN number (e.g., ABCDE1234F)');
        }

        // Check if PAN already exists with another user
        const panExists = await checkPANExistsAnywhere(data.panCard.toUpperCase());
        if (panExists) {
          // Get the current employee's PAN to see if it's the same
          const currentEmployee = await getEmployee(id);
          if (currentEmployee.panCard !== data.panCard.toUpperCase()) {
            throw new Error('This PAN number is already registered with another user. Please use a different PAN or contact support.');
          }
        }
      }

      // Transform education data to new structure
      const secondaryEducation = educationEntries.map((entry, index) => ({
        id: entry.id,
        type: entry.type,
        twelthData: entry.type === '12th' 
          ? data.secondaryEducation?.[index]?.twelthData 
          : undefined,
        diplomaData: entry.type === 'diploma' 
          ? data.secondaryEducation?.[index]?.diplomaData 
          : undefined,
      })).filter(entry => 
        // Only include entries with actual data
        (entry.twelthData && Object.values(entry.twelthData).some(v => v)) ||
        (entry.diplomaData && Object.values(entry.diplomaData).some(v => v))
      );

      // Set is_resigned and status based on employmentStatus
      const isResigned = data.employmentStatus === 'resigned';
      // When employee is resigned, automatically set status to inactive
      // When employee is working, set status to active
      const employeeStatus: 'active' | 'inactive' = isResigned ? 'inactive' : 'active';
      
      // Normalize PAN to uppercase and include new education structure
      const updatedData = {
        ...data,
        secondaryEducation,
        // Remove old fields from submission
        twelthStandard: undefined,
        diploma: undefined,
        panCard: data.panCard ? data.panCard.toUpperCase() : undefined,
        is_resigned: isResigned,
        status: employeeStatus,
      };
      
      await updateEmployee(id, updatedData);
      toast.success('Employee updated successfully!', { id: 'updateEmployee' });
      router.push(`/employees/${id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'updateEmployee' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading employee data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toaster />



      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <TableHeader
          title="Edit Employee"
          total={0}
          showStats={false}
          showSearch={false}
          searchValue=""
          onSearchChange={() => { }}
          headerClassName="px-6 py-6"
          backButton={{
            onClick: () => router.back(),
            label: 'Back'
          }}
          actionButtons={[
            {
              label: isSubmitting ? 'Saving...' : 'Save',
              icon: <FiSave />,
              variant: 'success',
              onClick: handleSubmit(onSubmit),
              disabled: isSubmitting
            }
          ]}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Personal Details Section */}
          <div className="bg-gray-100 p-4 mb-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">Personal Details</h2>
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Name
                  </label>
                  <input type="text" placeholder="Enter full name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' }, maxLength: { value: 50, message: 'Name cannot exceed 50 characters' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.name && (<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth', {
                      validate: {
                        notFuture: (value) => {
                          if (!value) return true; // Optional field
                          const selectedDate = new Date(value);
                          // The latest valid date is Dec 31, 2025
                          const maxValidDate = new Date("2025-12-31");
                          // Set maxValidDate's time to the very end of the day for full safety
                          maxValidDate.setHours(23, 59, 59, 999);
                          if (selectedDate > maxValidDate) {
                            return 'Date of Birth cannot be after 2025';
                          }
                          return true;
                        },
                        validDate: (value) => {
                          if (!value) return true; // Optional field
                          const date = new Date(value);
                          return !isNaN(date.getTime()) || 'Please enter a valid date';
                        }
                      }
                    })}
                    max="2025-12-31"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={watch('dateOfBirth') ? formatDateToDayMonYear(watch('dateOfBirth')) : 'Select date of birth'}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter employee ID (e.g., EMP001)"
                    {...register('employeeId' as any, {
                      pattern: {
                        value: /^[A-Z0-9-]{3,15}$/i,
                        message: 'Please enter a valid employee ID (alphanumeric, 3-15 characters)'
                      }
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {(errors as any).employeeId && (
                    <p className="mt-1 text-sm text-red-600">{(errors as any).employeeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Town</label>
                  <input type="text" placeholder="Enter home town" {...register('homeTown', { maxLength: { value: 50, message: 'Home town cannot exceed 50 characters' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.homeTown && (<p className="mt-1 text-sm text-red-600">{errors.homeTown.message}</p>)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Employee Type
                  </label>
                  <select
                    {...register('employeeType', {
                      required: 'Employee type is required'
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>
                  {errors.employeeType && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    {...register('employmentStatus')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="working">Working</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>

                {/* Conditional fields for resigned employees - nested grid with cols-8 */}
                {employmentStatus === 'resigned' && (
                  <div className="md:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resigned Date
                        </label>
                        <input
                          type="date"
                          {...register('resignedDate')}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.resignedDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.resignedDate.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Working Day
                        </label>
                        <input
                          type="date"
                          {...register('lastWorkingDay')}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.lastWorkingDay && (
                          <p className="mt-1 text-sm text-red-600">{errors.lastWorkingDay.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Mobile No.
                  </label>
                  <input type="tel" placeholder="Enter 10-digit mobile number" {...register('phone', { required: 'Phone number is required', pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.phone && (<p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID
                  </label>
                  <input type="email" placeholder="Enter email address" {...register('email', { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.email && (<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input type="text" placeholder="Enter position/designation" {...register('position')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input type="text" placeholder="Enter department" {...register('department')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Address
                  </label>
                  <input type="text" placeholder="Enter current address" {...register('currentAddress')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.currentAddress && (<p className="mt-1 text-sm text-red-600">{errors.currentAddress.message}</p>)}
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                  <div className="flex items-center mb-2">
                    <input
                      id="sameAsCurrentAddress"
                      type="checkbox"
                      checked={sameAsCurrentAddress}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSameAsCurrentAddress(checked);
                        if (checked) {
                          setValue('permanentAddress', currentAddressValue || '');
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsCurrentAddress" className="ml-2 text-sm text-gray-700">
                      Same as Current Address
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter permanent address"
                    {...register('permanentAddress')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-500"
                    readOnly={sameAsCurrentAddress}
                    disabled={sameAsCurrentAddress}
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter password" 
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 4,
                          message: 'Password must be at least 4 characters'
                        }
                      })} 
                      className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Confirm password" 
                      {...register('confirmPassword', {
                        validate: (value) => {
                          const password = watch('password');
                          return value === password || 'Passwords do not match';
                        }
                      })} 
                      className="w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identification Documents */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Identification Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Card
                  </label>
                  <input type="text" placeholder="Enter 12-digit Aadhar number" {...register('aadharCard', { pattern: { value: /^\d{12}$/, message: 'Please enter a valid 12-digit Aadhar number' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.aadharCard && (<p className="mt-1 text-sm text-red-600">{errors.aadharCard.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                  <input type="text" placeholder="Enter driving license number" {...register('drivingLicense')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Card
                  </label>
                  <input type="text" placeholder="Enter PAN number" {...register('panCard', { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter a valid PAN number (e.g., ABCDE1234F)' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.panCard && (<p className="mt-1 text-sm text-red-600">{errors.panCard.message}</p>)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voter ID
                  </label>
                  <input type="text" placeholder="Enter voter ID number" {...register('voterID')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
              </div>
            </div>

          </div>
          {/* Educational Details Section */}
          <div className="bg-gray-100 p-4 mb-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">Educational Details</h2>
            {/* Higher Education */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">Higher Education</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input type="text" placeholder="Enter degree name" {...register('graduation.degree')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input type="text" placeholder="Enter specialization" {...register('graduation.branch')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select {...register('graduation.month')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black">
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Year</label>
                  <input type="text" placeholder="YYYY" {...register('graduation.passingYear', { pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.graduation?.passingYear && (<p className="mt-1 text-sm text-red-600">{errors.graduation.passingYear.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input type="text" placeholder="Enter college name" {...register('graduation.collegeName')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                  <input type="text" placeholder="Enter university name" {...register('graduation.universityName')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="text" placeholder="CGPA or Percentage" {...register('graduation.marks')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <input type="text" placeholder="Enter grade" {...register('graduation.grade')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
              </div>
            </div>

            {/* Dynamic Education Entries */}
            <div className="bg-white p-4 rounded-lg mb-4">
              {educationEntries.map((entry, index) => (
                <div key={entry.id} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
                  {/* Header with Dynamic Title and Conditional Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-700 border-l-2 border-green-500 pl-2">
                      {/* Dynamic Title Based on Entry Index and Type */}
                      {index === 0 
                        ? "12th or Diploma" 
                        : entry.type === '12th' 
                          ? "12th Standard" 
                          : "Diploma"
                      }
                      {index > 0 && ` (Entry ${index + 1})`}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      {/* Toggle - ONLY show for first entry */}
                      {index === 0 && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${entry.type === '12th' ? 'text-blue-600' : 'text-gray-500'}`}>
                            12th
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleEducationType(entry.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              entry.type === 'diploma' ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              entry.type === 'diploma' ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className={`text-sm font-medium ${entry.type === 'diploma' ? 'text-blue-600' : 'text-gray-500'}`}>
                            Diploma
                          </span>
                        </div>
                      )}
                      
                    
                      
                      {/* Add Button - only show if can add more */}
                      {index === educationEntries.length - 1 && canAddEntry() && (
                        <button
                          type="button"
                          onClick={addEducationEntry}
                          className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                          title={`Add ${getNextEntryType() === '12th' ? '12th Standard' : 'Diploma'} entry`}
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Remove Button (hide on first entry) */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeEducationEntry(entry.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          title="Remove this entry"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  {entry.type === '12th' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <input type="text" placeholder="Enter stream" {...register(`secondaryEducation.${index}.twelthData.branch`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select {...register(`secondaryEducation.${index}.twelthData.month`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black">
                          <option value="">Select Month</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passing Year</label>
                        <input type="text" placeholder="YYYY" {...register(`secondaryEducation.${index}.twelthData.passingYear`, { pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                        {errors.secondaryEducation?.[index]?.twelthData?.passingYear && (<p className="mt-1 text-sm text-red-600">{errors.secondaryEducation[index].twelthData.passingYear.message}</p>)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <input type="text" placeholder="Enter school name" {...register(`secondaryEducation.${index}.twelthData.schoolName`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                        <input type="text" placeholder="Enter board name" {...register(`secondaryEducation.${index}.twelthData.board`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                        <input type="text" placeholder="Enter percentage" {...register(`secondaryEducation.${index}.twelthData.marks`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                        <input type="text" placeholder="Enter grade" {...register(`secondaryEducation.${index}.twelthData.grade`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                    </div>
                  )}

                  {entry.type === 'diploma' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diploma Name</label>
                        <input type="text" placeholder="Enter diploma name" {...register(`secondaryEducation.${index}.diplomaData.name`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <input type="text" placeholder="Enter specialization/branch" {...register(`secondaryEducation.${index}.diplomaData.branch`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select {...register(`secondaryEducation.${index}.diplomaData.month`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black">
                          <option value="">Select Month</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passing Year</label>
                        <input type="text" placeholder="YYYY" {...register(`secondaryEducation.${index}.diplomaData.passingYear`, { pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                        {errors.secondaryEducation?.[index]?.diplomaData?.passingYear && (<p className="mt-1 text-sm text-red-600">{errors.secondaryEducation[index].diplomaData.passingYear.message}</p>)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                        <input type="text" placeholder="Enter college/institution name" {...register(`secondaryEducation.${index}.diplomaData.collegeName`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                        <input type="text" placeholder="Enter institute name" {...register(`secondaryEducation.${index}.diplomaData.institute`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                        <input type="text" placeholder="Percentage" {...register(`secondaryEducation.${index}.diplomaData.marks`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                        <input type="text" placeholder="Enter grade" {...register(`secondaryEducation.${index}.diplomaData.grade`)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Visual Feedback Messages */}
              {educationEntries.length >= 2 && (
                <div className="text-sm text-gray-600 italic mt-2">
                  ✓ Maximum entries reached (12th Standard + Diploma)
                </div>
              )}

              {educationEntries.length === 1 && canAddEntry() && (
                <div className="text-sm text-blue-600 italic mt-2">
                  💡 You can add one more entry ({getNextEntryType() === '12th' ? '12th Standard' : 'Diploma'})
                </div>
              )}
            </div>

            {/* 10th Standard */}
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">10th Standard</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select {...register('tenthStandard.month')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black">
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Year</label>
                  <input type="text" placeholder="YYYY" {...register('tenthStandard.passingYear', { pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' } })} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                  {errors.tenthStandard?.passingYear && (<p className="mt-1 text-sm text-red-600">{errors.tenthStandard.passingYear.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input type="text" placeholder="Enter school name" {...register('tenthStandard.schoolName')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                  <input type="text" placeholder="Enter board name" {...register('tenthStandard.board')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="text" placeholder="Enter percentage" {...register('tenthStandard.marks')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <input type="text" placeholder="Enter grade" {...register('tenthStandard.grade')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                  <input type="text" placeholder="Enter medium" {...register('tenthStandard.medium')} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" />
                </div>
              </div>
            </div>
          </div>
        </form>
        
        {/* Form Buttons */}
        <div className="flex justify-between items-center gap-4 px-6 py-3">
          <Link
            href={`/employees/${id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            onClick={handleSubmit(onSubmit)}
          >
            <FiSave />
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <Toaster />
    </DashboardLayout>
  );
} 