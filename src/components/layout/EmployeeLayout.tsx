import { ReactNode } from 'react';
import EmployeeSidebar from './EmployeeSidebar';
import Header from './Header';
import SimpleBreadcrumb from '../ui/SimpleBreadcrumb';
import EmployeeFooter from './EmployeeFooter';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface EmployeeLayoutProps {
  children: ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showBreadcrumb?: boolean;
}

const EmployeeLayout = ({ 
  children, 
  breadcrumbItems = [],
  showBreadcrumb = true 
}: EmployeeLayoutProps) => {
  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <EmployeeSidebar />
      <Header />
      <div className="pt-16 lg:pl-[var(--sidebar-w)] flex-1 flex flex-col min-h-0">
        <main className="flex-1">
          <div className="p-3 md:p-4">
            {showBreadcrumb && breadcrumbItems.length > 0 && (
              <SimpleBreadcrumb items={breadcrumbItems} className="mb-3" />
            )}
            {children}
          </div>
        </main>
        <EmployeeFooter />
      </div>
    </div>
  );
};

export default EmployeeLayout; 