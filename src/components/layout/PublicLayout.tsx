'use client';

import { ReactNode } from 'react';
import Header from './Header';
import SimpleBreadcrumb from '../ui/SimpleBreadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface PublicLayoutProps {
  children: ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showBreadcrumb?: boolean;
}

const PublicLayout = ({ 
  children, 
  breadcrumbItems = [],
  showBreadcrumb = false 
}: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="public" />
      <main className="pt-16 min-h-screen">
        <div className="p-4 md:p-6">
          {showBreadcrumb && breadcrumbItems.length > 0 && (
            <SimpleBreadcrumb items={breadcrumbItems} className="mb-4" />
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default PublicLayout;
