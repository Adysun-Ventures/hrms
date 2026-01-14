'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiUsers, FiBriefcase, FiRefreshCw, FiMail } from 'react-icons/fi';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useDashboardStatsOptimized } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { currentAdmin, currentUserData } = useAuth();
  const router = useRouter();
  
  // Use Tanstack Query for dashboard stats
  const {
    employeeCount,
    employmentCount,
    attendanceCount,
    isLoading,
    isError,
    error,
    refetch
  } = useDashboardStatsOptimized();

  useEffect(() => {
    // Check if user is authenticated
    if (!currentUserData) {
      router.push('/login');
      return;
    }
    
    // If user is employee, redirect to employee dashboard
    if (currentUserData.userType === 'employee') {
      router.push('/employee-dashboard');
      return;
    }
    
    // If user is not admin, redirect to login
    if (currentUserData.userType !== 'admin' || !currentAdmin) {
      router.push('/login');
      return;
    }
  }, [currentAdmin, currentUserData, router]);

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      refetch();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast.error('Failed to refresh dashboard');
    }
  };

  // Handle error state
  useEffect(() => {
    if (isError && error) {
      console.error('Dashboard data error:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [isError, error]);

  // If not admin, don't render dashboard
  if (!currentAdmin || currentUserData?.userType !== 'admin') {
    return null;
  }

  const cards = [
    {
      title: 'Employees',
      count: employeeCount,
      icon: <FiUsers className="w-8 h-8 text-blue-500" />,
      link: '/employees',
      color: 'bg-blue-50'
    },
    {
      title: 'Enquiry',
      count: attendanceCount,
      icon: <FiMail className="w-8 h-8 text-green-500" />,
      link: '/dashboard/enquiries/',
      color: 'bg-green-50'
    },
  ];

  return (
    <DashboardLayout allowedUserTypes={['admin']} showBreadcrumb={false}>
      <Toaster position="top-center" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-slate-700">Welcome back, {currentAdmin.name}.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-2 rounded-md transition-all duration-200 ${
            isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
          }`}
          title="Refresh dashboard data"
          aria-label="Refresh dashboard data"
        >
          <FiRefreshCw 
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`${card.color} p-6 rounded-lg shadow-sm border-2 border-red-200`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-700 font-medium">{card.title}</p>
                  <p className="text-red-600 text-sm mt-1">Error loading data</p>
                </div>
                <div>{card.icon}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              href={card.link}
              key={card.title}
              className={`${card.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-700 font-medium">{card.title}</p>
                  <h3 className="text-3xl font-bold mt-2 text-gray-800">{card.count}</h3>
                </div>
                <div>{card.icon}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/employees/add"
            className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-medium text-gray-800">Add Employee</h3>
            <p className="text-sm text-gray-600 mt-1">Create a new employee record</p>
          </Link>
          
          <Link
            href="/enquiry"
            className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-medium text-gray-800">Enquiry</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage enquiry records</p>
          </Link>
          
          <Link
            href="/dashboard/documents"
            className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-medium text-gray-800">Documents</h3>
            <p className="text-sm text-gray-600 mt-1">Generate and manage documents</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 