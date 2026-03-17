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
    <div className="min-h-screen bg-transparent flex flex-col">
      <EmployeeSidebar />
      <Header variant="protected" />
      <div className="pt-16 lg:pl-64 flex-1 flex flex-col min-h-0">
        <main className="flex-1">
          <div className="p-4 md:p-6">
            {showBreadcrumb && breadcrumbItems.length > 0 && (
              <SimpleBreadcrumb items={breadcrumbItems} className="mb-4" />
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