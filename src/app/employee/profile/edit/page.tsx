'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FiUser, FiMapPin, FiSave, FiX, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { updateUserProfile, validateProfileData } from '@/utils/profileUtils';
import { updateEmployeeSelf, getEmployeeSelf, checkUserByPhone, validatePANFormat, checkPANExistsAnywhere } from '@/utils/firebaseUtils';
import { Employee } from '@/types';
import TableHeader from '@/components/ui/TableHeader';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

export default function EditEmployeeProfilePage() {
    const { currentUserData, currentEmployee } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [educationEntries, setEducationEntries] = useState<Array<{
        id: string;
        type: '12th' | 'diploma';
    }>>([
        { id: crypto.randomUUID(), type: '12th' }
    ]);

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<Omit<Employee, 'id'> & { confirmPassword?: string }>();
    const currentAddressValue = watch('currentAddress');

    // Redirect if not authenticated or not an employee
    useEffect(() => {
        if (!currentUserData || currentUserData.userType !== 'employee') {
            router.push('/login');
        }
    }, [currentUserData, router]);

    // Helper functions for managing education entries
    const canAddEntry = () => {
        if (educationEntries.length >= 2) return false; // Max 2 entries
        
        const has12th = educationEntries.some(e => e.type === '12th');
        const hasDiploma = educationEntries.some(e => e.type === 'diploma');
        
        return !(has12th && hasDiploma); // Can add only if both not present
    };

    const getNextEntryType = (): '12th' | 'diploma' => {
        const has12th = educationEntries.some(e => e.type === '12th');
        return has12th ? 'diploma' : '12th';
    };

    const canToggleType = (id: string, newType: '12th' | 'diploma'): boolean => {
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

    // Initialize form data
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (currentUserData && currentEmployee) {
                try {
                    // Fetch full employee data including password
                    const emp = await getEmployeeSelf(currentUserData.id);
            const currentAddr = emp.currentAddress || '';
            const permanentAddr = emp.permanentAddress || '';
            const addressesMatch = currentAddr && currentAddr === permanentAddr;

                    // Initialize education entries from employee data
                    if (emp.secondaryEducation && emp.secondaryEducation.length > 0) {
                        setEducationEntries(
                            emp.secondaryEducation.map((entry: any) => ({
                                id: entry.id || crypto.randomUUID(),
                                type: entry.type,
                            }))
                        );
                        
                        // Set form values
                        reset({
                            ...emp,
                            secondaryEducation: emp.secondaryEducation,
                            password: emp.password || '', // Pre-fill with current password
                            confirmPassword: emp.password || '', // Pre-fill confirm password with current password
                        });
                    } else {
                        // Default to one entry if none exists
                        setEducationEntries([{ id: crypto.randomUUID(), type: '12th' }]);
                        
                        // Reset form with all employee data except id and audit fields
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { id: _id, createdAt: _createdAt, createdBy: _createdBy, updatedAt: _updatedAt, updatedBy: _updatedBy, ...rest } = emp;
                        reset({
                            ...rest,
                            password: emp.password || '', // Pre-fill with current password
                            confirmPassword: emp.password || '', // Pre-fill confirm password with current password
                        });
                    }
            setSameAsCurrentAddress(addressesMatch);
                } catch (error) {
                    console.error('Error fetching employee data:', error);
                    toast.error('Failed to load employee data');
                }
            }
        };

        fetchEmployeeData();
    }, [currentUserData, currentEmployee, reset]);

    useEffect(() => {
        if (sameAsCurrentAddress) {
            setValue('permanentAddress', currentAddressValue || '');
        }
    }, [sameAsCurrentAddress, currentAddressValue, setValue]);

    const handleSameAsCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSameAsCurrentAddress(checked);
        if (checked) {
            setValue('permanentAddress', currentAddressValue || '');
        }
    };

    const onSubmit = async (data: Omit<Employee, 'id'> & { confirmPassword?: string }) => {
        if (!currentUserData || !currentEmployee) return;

        setIsSubmitting(true);
        toast.loading('Updating profile...', { id: 'updateProfile' });

        try {
            // Check if phone number is already registered with another user (if changed)
            const formattedPhoneNumber = `+91${data.phone}`;
            const existingUser = await checkUserByPhone(formattedPhoneNumber);
            
            if (existingUser && existingUser.id !== currentUserData.id) {
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
                    const currentEmployeeData = await getEmployeeSelf(currentUserData.id);
                    if (currentEmployeeData.panCard !== data.panCard.toUpperCase()) {
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

            // Prepare update data for basic profile (name, email, phone)
            const basicProfileData = {
                name: data.name.trim(),
                email: data.email.trim(),
                phone: data.phone.trim()
            };

            // Update basic profile using updateUserProfile
            await updateUserProfile(currentUserData.id, basicProfileData, 'employee');

            // Prepare additional data for updateEmployeeSelf
            const additionalData: any = {
                position: data.position?.trim(),
                department: data.department?.trim(),
                currentAddress: data.currentAddress?.trim(),
                permanentAddress: data.permanentAddress?.trim(),
                dateOfBirth: data.dateOfBirth,
                homeTown: data.homeTown?.trim(),
                aadharCard: data.aadharCard?.trim(),
                drivingLicense: data.drivingLicense?.trim(),
                panCard: data.panCard ? data.panCard.toUpperCase().trim() : undefined,
                voterID: data.voterID?.trim(),
                graduation: data.graduation,
                secondaryEducation,
                tenthStandard: data.tenthStandard,
            };

            // Always include password (it's required and pre-filled with current password)
            // If user changed it, it will be the new password; otherwise it's the same
            if (data.password && data.password.trim()) {
                additionalData.password = data.password.trim();
            }

            // Remove undefined values
            Object.keys(additionalData).forEach(key => {
                if (additionalData[key] === undefined) {
                    delete additionalData[key];
                }
            });

            // Update additional fields using updateEmployeeSelf
            if (Object.keys(additionalData).length > 0) {
                await updateEmployeeSelf(currentUserData.id, additionalData);
            }

            // Fetch updated employee data from Firebase
            const updatedEmployeeData = await getEmployeeSelf(currentUserData.id);

            // Update localStorage with fresh data from Firebase
            const storedData = localStorage.getItem('employeeData');
            if (storedData) {
                const userData = JSON.parse(storedData);
                const mergedData = {
                    ...userData,
                    ...updatedEmployeeData,
                    name: basicProfileData.name,
                    email: basicProfileData.email,
                    phone: basicProfileData.phone
                };
                localStorage.setItem('employeeData', JSON.stringify(mergedData));
            }

            // Update fullEmployeeData in localStorage if it exists
            localStorage.setItem('fullEmployeeData', JSON.stringify(updatedEmployeeData));

            // Dispatch custom event to notify Header and other components of profile update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('profileUpdated'));
            }

            toast.success('Profile updated successfully!', { id: 'updateProfile' });

            // Navigate back to profile page
            router.push('/employee/profile');
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            toast.error(errorMessage, { id: 'updateProfile' });
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/employee/profile');
    };

    // Show loading if no user data
    if (!currentUserData || !currentEmployee) {
        return (
            <EmployeeLayout>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout
            breadcrumbItems={[
                { label: 'Dashboard', href: '/employee-dashboard' },
                { label: 'My Profile', href: '/employee/profile' },
                { label: 'Edit Profile', isCurrent: true }
            ]}
        >
            <Toaster position="top-center" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <TableHeader
                    title="Edit Profile"
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
                        href: '/employee/profile',
                        label: 'Back'
                    }}
                />

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
                                <input
                                    type="text"
                                        placeholder="Enter full name"
                                        {...register('name', {
                                            required: 'Name is required',
                                            minLength: { value: 2, message: 'Name must be at least 2 characters' },
                                            maxLength: { value: 50, message: 'Name cannot exceed 50 characters' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                                {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
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
                                                    if (!value) return true;
                                                    const selectedDate = new Date(value);
                                                    const maxValidDate = new Date("2025-12-31");
                                                    maxValidDate.setHours(23, 59, 59, 999);
                                                    if (selectedDate > maxValidDate) {
                                                        return 'Date of Birth cannot be after 2025';
                                                    }
                                                    return true;
                                                },
                                                validDate: (value) => {
                                                    if (!value) return true;
                                                    const date = new Date(value);
                                                    return !isNaN(date.getTime()) || 'Please enter a valid date';
                                                }
                                            }
                                        })}
                                        max="2025-12-31"
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={watch('dateOfBirth') ? formatDateToDayMonYear(watch('dateOfBirth')!) : 'Select date of birth'}
                                    />
                                    {errors.dateOfBirth && (
                                        <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Town</label>
                                    <input
                                        type="text"
                                        placeholder="Enter home town"
                                        {...register('homeTown', {
                                            maxLength: { value: 50, message: 'Home town cannot exceed 50 characters' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                                    {errors.homeTown && (
                                        <p className="mt-1 text-sm text-red-600">{errors.homeTown.message}</p>
                                )}
                                </div>
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
                                <input
                                    type="tel"
                                        placeholder="Enter 10-digit mobile number"
                                        {...register('phone', {
                                            required: 'Phone number is required',
                                            pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                                {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email ID
                                </label>
                                <input
                                        type="email"
                                        placeholder="Enter email address"
                                        {...register('email', {
                                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                </label>
                                <input
                                    type="text"
                                        placeholder="Enter position/designation"
                                        {...register('position')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                            </div>
                            <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter department"
                                        {...register('department')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Address
                                </label>
                                <textarea
                                        placeholder="Enter current address"
                                        {...register('currentAddress')}
                                    rows={3}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                            </div>
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                                    <div className="flex items-center mb-2">
                                        <input
                                            id="sameAsCurrentAddress"
                                            type="checkbox"
                                            checked={sameAsCurrentAddress}
                                            onChange={handleSameAsCurrentChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="sameAsCurrentAddress" className="ml-2 text-sm text-gray-700">
                                            Same as Current Address
                                        </label>
                                    </div>
                                    <textarea
                                        placeholder="Enter permanent address"
                                        {...register('permanentAddress')}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-500"
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
                                            className="w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
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
                                            className="w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
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
                                    <input
                                        type="text"
                                        placeholder="Enter 12-digit Aadhar number"
                                        {...register('aadharCard', {
                                            pattern: { value: /^\d{12}$/, message: 'Please enter a valid 12-digit Aadhar number' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                    {errors.aadharCard && (
                                        <p className="mt-1 text-sm text-red-600">{errors.aadharCard.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                                    <input
                                        type="text"
                                        placeholder="Enter driving license number"
                                        {...register('drivingLicense')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PAN Card
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter PAN number"
                                        {...register('panCard', {
                                            pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter a valid PAN number (e.g., ABCDE1234F)' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                    {errors.panCard && (
                                        <p className="mt-1 text-sm text-red-600">{errors.panCard.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Voter ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter voter ID number"
                                        {...register('voterID')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
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
                                    <input
                                        type="text"
                                        placeholder="Enter degree name"
                                        {...register('graduation.degree')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <input
                                        type="text"
                                        placeholder="Enter specialization"
                                        {...register('graduation.branch')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                    <select
                                        {...register('graduation.month')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    >
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
                                    <input
                                        type="text"
                                        placeholder="YYYY"
                                        {...register('graduation.passingYear', {
                                            pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                    {errors.graduation?.passingYear && (
                                        <p className="mt-1 text-sm text-red-600">{errors.graduation.passingYear.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter college name"
                                        {...register('graduation.collegeName')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter university name"
                                        {...register('graduation.universityName')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                    <input
                                        type="text"
                                        placeholder="CGPA or Percentage"
                                        {...register('graduation.marks')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <input
                                        type="text"
                                        placeholder="Enter grade"
                                        {...register('graduation.grade')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
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
                                                <input
                                                    type="text"
                                                    placeholder="Enter stream"
                                                    {...register(`secondaryEducation.${index}.twelthData.branch`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                                <select
                                                    {...register(`secondaryEducation.${index}.twelthData.month`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                >
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
                                                <input
                                                    type="text"
                                                    placeholder="YYYY"
                                                    {...register(`secondaryEducation.${index}.twelthData.passingYear`, {
                                                        pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' }
                                                    })}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                                {errors.secondaryEducation?.[index]?.twelthData?.passingYear && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.secondaryEducation[index].twelthData.passingYear.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter school name"
                                                    {...register(`secondaryEducation.${index}.twelthData.schoolName`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter board name"
                                                    {...register(`secondaryEducation.${index}.twelthData.board`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter percentage"
                                                    {...register(`secondaryEducation.${index}.twelthData.marks`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter grade"
                                                    {...register(`secondaryEducation.${index}.twelthData.grade`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {entry.type === 'diploma' && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Diploma Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter diploma name"
                                                    {...register(`secondaryEducation.${index}.diplomaData.name`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter specialization/branch"
                                                    {...register(`secondaryEducation.${index}.diplomaData.branch`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                                <select
                                                    {...register(`secondaryEducation.${index}.diplomaData.month`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                >
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
                                                <input
                                                    type="text"
                                                    placeholder="YYYY"
                                                    {...register(`secondaryEducation.${index}.diplomaData.passingYear`, {
                                                        pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' }
                                                    })}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                                {errors.secondaryEducation?.[index]?.diplomaData?.passingYear && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.secondaryEducation[index].diplomaData.passingYear.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter college/institution name"
                                                    {...register(`secondaryEducation.${index}.diplomaData.collegeName`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter institute name"
                                                    {...register(`secondaryEducation.${index}.diplomaData.institute`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                                <input
                                                    type="text"
                                                    placeholder="Percentage"
                                                    {...register(`secondaryEducation.${index}.diplomaData.marks`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter grade"
                                                    {...register(`secondaryEducation.${index}.diplomaData.grade`)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                                />
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
                                    <select
                                        {...register('tenthStandard.month')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    >
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
                                    <input
                                        type="text"
                                        placeholder="YYYY"
                                        {...register('tenthStandard.passingYear', {
                                            pattern: { value: /^(19|20)\d{2}$/, message: 'Enter a valid 4-digit year' }
                                        })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                    {errors.tenthStandard?.passingYear && (
                                        <p className="mt-1 text-sm text-red-600">{errors.tenthStandard.passingYear.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter school name"
                                        {...register('tenthStandard.schoolName')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                                    <input
                                        type="text"
                                        placeholder="Enter board name"
                                        {...register('tenthStandard.board')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                    <input
                                        type="text"
                                        placeholder="Enter percentage"
                                        {...register('tenthStandard.marks')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <input
                                        type="text"
                                        placeholder="Enter grade"
                                        {...register('tenthStandard.grade')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                                    <input
                                        type="text"
                                        placeholder="Enter medium"
                                        {...register('tenthStandard.medium')}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            <FiX className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            <FiSave className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </EmployeeLayout>
    );
}
