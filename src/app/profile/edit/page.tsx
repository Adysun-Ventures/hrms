'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import { updateUserProfile, validateProfileData, ProfileUpdateData } from '@/utils/profileUtils';

export default function EditProfilePage() {
  const { currentUserData, currentAdmin, currentEmployee } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: '',
    email: '',
    phone: '',
    mobile: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<ProfileUpdateData | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUserData) {
      router.push('/login');
    }
  }, [currentUserData, router]);

  // Initialize form data
  useEffect(() => {
    if (currentUserData) {
      const isAdmin = currentUserData.userType === 'admin';
      const user = isAdmin ? currentAdmin : currentEmployee;
      
      if (user) {
        const initialFormData: ProfileUpdateData = {
          name: user.name || '',
          email: user.email || '',
          phone: isAdmin ? '' : (user as any).phone || '',
          mobile: isAdmin ? (user as any).mobile || '' : ''
        };
        
        setFormData(initialFormData);
        setInitialData(initialFormData);
      }
    }
  }, [currentUserData, currentAdmin, currentEmployee]);

  // Check for changes
  useEffect(() => {
    if (initialData) {
      const hasFormChanges = 
        formData.name !== initialData.name ||
        formData.email !== initialData.email ||
        formData.phone !== initialData.phone ||
        formData.mobile !== initialData.mobile;
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, initialData]);

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserData) return;

    // Validate form data
    const validation = validateProfileData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const isAdmin = currentUserData.userType === 'admin';
      await updateUserProfile(currentUserData.id, formData, isAdmin ? 'admin' : 'employee');
      
      // Update localStorage
      const storageKey = isAdmin ? 'adminData' : 'employeeData';
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const userData = JSON.parse(storedData);
        const updatedData = {
          ...userData,
          name: formData.name.trim(),
          email: formData.email.trim(),
          ...(isAdmin ? { mobile: formData.mobile?.trim() } : { phone: formData.phone?.trim() })
        };
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
      }
      
      toast.success('Profile updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    router.push('/profile');
  };

  // Show loading if no user data
  if (!currentUserData) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = currentUserData.userType === 'admin';

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile', href: '/profile' },
        { label: 'Edit Profile', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Edit Profile"
          total={1}
          active={1}
          inactive={0}
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={false}
          showFilter={false}
          backButton={{ href: '/profile', label: 'Back' }}
          actionButtons={[
            {
              label: isSubmitting ? 'Saving...' : 'Save Changes',
              icon: <FiSave />,
              variant: 'primary' as const,
              onClick: handleSubmit,
              disabled: !hasChanges || isSubmitting
            },
            {
              label: 'Cancel',
              icon: <FiX />,
              variant: 'secondary' as const,
              onClick: handleCancel,
              disabled: isSubmitting
            }
          ]}
          headerClassName="px-6 pt-6 pb-6"
        />

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                  <p className="text-gray-600">
                    Update your {isAdmin ? 'administrator' : 'employee'} information
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  <FiUser className="inline w-4 h-4 mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  <FiMail className="inline w-4 h-4 mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone/Mobile */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  <FiPhone className="inline w-4 h-4 mr-2" />
                  {isAdmin ? 'Mobile Number' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={isAdmin ? formData.mobile : formData.phone}
                  onChange={(e) => handleInputChange(isAdmin ? 'mobile' : 'phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Enter your ${isAdmin ? 'mobile' : 'phone'} number`}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
