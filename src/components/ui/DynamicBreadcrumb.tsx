'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DynamicBreadcrumbItem,
} from './breadcrumb';

interface DynamicBreadcrumbProps {
  show?: boolean;
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
  isId?: boolean;
  isEmployeePage?: boolean;
  isEmploymentPage?: boolean;
  id?: string;
}

const DynamicBreadcrumb: React.FC<DynamicBreadcrumbProps> = ({ 
  show = true, 
  className = '' 
}) => {
  const pathname = usePathname();

  // Don't show breadcrumb on dashboard route
  if (!show || !pathname || pathname === '/dashboard') return null;

  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Always add Dashboard instead of Home
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/',
      isCurrent: segments.length === 0
    });

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      // Check if this segment is an ID (for employee or employment pages)
      const isId = /^[a-zA-Z0-9]{20,}$/.test(segment); // Firebase IDs are typically 20+ characters
      const isEmployeePage = segments.includes('employees') && isId;
      const isEmploymentPage = segments.includes('employments') && isId;
      
      // Convert segment to readable label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrent: isLast,
        isId,
        isEmployeePage,
        isEmploymentPage,
        id: isId ? segment : undefined
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <Breadcrumb className={`text-gray-600 ${className}`}>
      <BreadcrumbList className="text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            {breadcrumb.isEmployeePage && breadcrumb.isId ? (
              <DynamicBreadcrumbItem
                id={breadcrumb.id}
                type="employee"
                fallback={breadcrumb.label}
              />
            ) : breadcrumb.isEmploymentPage && breadcrumb.isId ? (
              <DynamicBreadcrumbItem
                id={breadcrumb.id}
                type="employment"
                fallback={breadcrumb.label}
              />
            ) : (
              <BreadcrumbItem>
                {breadcrumb.isCurrent ? (
                  <BreadcrumbPage className="text-gray-900 font-medium">
                    {breadcrumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={breadcrumb.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {breadcrumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            )}
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className="text-gray-400">
                <span className="text-gray-400">/</span>
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default DynamicBreadcrumb; 