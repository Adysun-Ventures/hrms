'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiLogOut, FiEdit, FiKey } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';

export default function ProfilePage() {
  const { currentUserData, currentAdmin, currentEmployee, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUserData) {
      router.push('/login');
    }
  }, [currentUserData, router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
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
  const user = isAdmin ? currentAdmin : currentEmployee;

  // Helper functions to safely access user properties
  const getUserStatus = () => {
    if (isAdmin && currentAdmin) {
      return currentAdmin.active ? 'Active' : 'Inactive';
    } else if (!isAdmin && currentEmployee) {
      return currentEmployee.status === 'active' ? 'Active' : 'Inactive';
    }
    return 'Unknown';
  };

  const isUserActive = () => {
    if (isAdmin && currentAdmin) {
      return currentAdmin.active;
    } else if (!isAdmin && currentEmployee) {
      return currentEmployee.status === 'active';
    }
    return false;
  };

  const getUserPhone = () => {
    if (isAdmin && currentAdmin) {
      return currentAdmin.mobile;
    } else if (!isAdmin && currentEmployee) {
      return currentEmployee.phone;
    }
    return 'Not provided';
  };

  const getUserCreatedAt = () => {
    const createdAt = isAdmin ? currentAdmin?.createdAt : currentEmployee?.createdAt;
    if (!createdAt) return 'Unknown';
    
    try {
      if (createdAt.toDate) {
        return formatDateToDayMonYear(createdAt.toDate());
      } else {
        return formatDateToDayMonYear(createdAt);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="My Profile"
          total={1}
          active={1}
          inactive={0}
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={false}
          showFilter={false}
          backButton={{ href: '/dashboard', label: 'Back' }}
          actionButtons={[
            {
              label: 'Edit Profile',
              icon: <FiEdit />,
              variant: 'primary' as const,
              href: '/profile/edit'
            },
            {
              label: isLoggingOut ? 'Logging Out...' : 'Logout',
              icon: <FiLogOut />,
              variant: 'danger' as const,
              onClick: handleLogout,
              disabled: isLoggingOut
            }
          ]}
          headerClassName="px-6 pt-6 pb-6"
        />

        <div className="px-6 pb-6">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600">
                  {isAdmin ? 'Admin' : 'Employee'}
                </p>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      isUserActive()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getUserStatus()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Full Name */}
            {/* <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-semibold text-lg">{user?.name}</p>
                <FiUser className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Full Name</p>
            </div> */}

            {/* Email Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-semibold text-lg">{user?.email || 'Not provided'}</p>
                <FiMail className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Email Address</p>
            </div>

            {/* Phone Number */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-semibold text-lg">{getUserPhone()}</p>
                <FiPhone className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Phone Number</p>
            </div>

            {/* Account Created */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-semibold text-lg">
                  {getUserCreatedAt()}
                </p>
                <FiCalendar className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Account Created</p>
            </div>


            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    isUserActive()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {getUserStatus()}
                </span>
                <FiShield className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Account Status</p>
            </div>
          </div>

          {/* Session Information */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Session Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-900 font-semibold text-lg">
                  {new Date().toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">Login Time</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-900 font-semibold text-lg">
                  Active
                </p>
                <p className="text-sm text-gray-500 mt-2">Session Duration</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-900 font-semibold text-lg">
                  Just now
                </p>
                <p className="text-sm text-gray-500 mt-2">Last Activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 