'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeNameById } from '@/utils/firebaseUtils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
  employeeId?: string; // For dynamic employee name resolution
}

interface SimpleBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({ 
  items, 
  className = '',
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />
}) => {
  // Get unique employee IDs that need resolution
  const employeeIds = items
    .filter(item => item.employeeId)
    .map(item => item.employeeId!)
    .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

  // Fetch employee names with React Query caching
  const employeeNames = useQuery({
    queryKey: ['employee-names', employeeIds],
    queryFn: async () => {
      const names: Record<string, string> = {};
      await Promise.all(
        employeeIds.map(async (id) => {
          try {
            const name = await getEmployeeNameById(id);
            names[id] = name;
          } catch (error) {
            console.error('Error fetching employee name:', error);
            names[id] = 'Unknown Employee';
          }
        })
      );
      return names;
    },
    enabled: employeeIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Resolve items with employee names
  const resolvedItems = items.map(item => {
    if (item.employeeId && employeeNames.data) {
      return {
        ...item,
        label: employeeNames.data[item.employeeId as keyof typeof employeeNames.data] || 'Loading...'
      };
    }
    return item;
  });

  if (!resolvedItems || resolvedItems.length === 0) return null;

  // Truncate long text on mobile
  const truncateText = (text: string) => {
    if (typeof text !== 'string') return text;
    
    // On mobile, show first word + "..."
    // On desktop, show full text
    return (
      <>
        <span className="hidden sm:inline">{text}</span>
        <span className="sm:hidden">
          {text.split(' ')[0]}
          {text.split(' ').length > 1 && '...'}
        </span>
      </>
    );
  };

  return (
    <nav aria-label="breadcrumb" className={`text-sm text-gray-600 ${className}`}>
      <ol className="flex items-center space-x-2 overflow-hidden">
        {resolvedItems.map((item, index) => (
          <React.Fragment key={index}>
            <li className="flex items-center">
              {item.isCurrent ? (
                <span className="text-gray-900 font-medium">
                  {truncateText(item.label)}
                </span>
              ) : item.href ? (
                <Link 
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {truncateText(item.label)}
                </Link>
              ) : (
                <span className="text-gray-600">
                  {truncateText(item.label)}
                </span>
              )}
            </li>
            {index < resolvedItems.length - 1 && (
              <li className="flex items-center">
                {separator}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default SimpleBreadcrumb; 