'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import EmployeeSidebar from './EmployeeSidebar';
import Header from './Header';
import SimpleBreadcrumb from '../ui/SimpleBreadcrumb';
import AuthGuard from '../auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
  employeeId?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showBreadcrumb?: boolean;
  allowedUserTypes?: ('admin' | 'employee')[];
}

const DashboardLayout = ({ 
  children, 
  breadcrumbItems = [],
  showBreadcrumb = true,
  allowedUserTypes = ['admin', 'employee']
}: DashboardLayoutProps) => {
  const { currentUserData } = useAuth();
  const isEmployee = currentUserData?.userType === 'employee';

  return (
    <AuthGuard allowedUserTypes={allowedUserTypes}>
      <div className="min-h-screen bg-gray-50">
        {isEmployee ? <EmployeeSidebar /> : <Sidebar />}
        <Header variant="protected" />
        <main className="pt-16 lg:pl-64 min-h-screen">
          <div className="p-4 md:p-6">
            {showBreadcrumb && breadcrumbItems.length > 0 && (
              <SimpleBreadcrumb items={breadcrumbItems} className="mb-4" />
            )}
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout; 