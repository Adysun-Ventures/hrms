'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUser, FiMenu, FiX, FiHome, FiFileText, FiBriefcase, FiInfo } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeSelfEmployment } from '@/hooks/useEmployees';

const EmployeeSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUserData } = useAuth();
  
  // Fetch employment data to check if employee has employment
  const { data: employmentData = [], isLoading: employmentLoading } = useEmployeeSelfEmployment(
    currentUserData?.id || ''
  );
  
  // Check if employee has employment
  const hasEmployment = !employmentLoading && employmentData.length > 0;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Function to determine if a menu item is active
  const isActive = (path: string) => {
    if (!pathname) return false;

    // Normalize to avoid trailing-slash mismatches like `/employee/company-information/`
    const normalize = (p: string) => p.replace(/\/+$/, '');
    const normalizedPathname = normalize(pathname);
    const normalizedItemPath = normalize(path);

    const getLastSegment = (p: string) => {
      const segs = p.split('/').filter(Boolean);
      return segs.length ? segs[segs.length - 1] : '';
    };
    const pathnameLast = getLastSegment(normalizedPathname);
    const itemLast = getLastSegment(normalizedItemPath);
    
    if (path === '/employee-dashboard') {
      // Only consider dashboard active if we're exactly on the dashboard path
      return normalizedPathname === '/employee-dashboard';
    }

    // "My Employment" lives under `/employments/:id` and `/employments/:id/edit`
    // but the sidebar route is `/employee/employment`. Match both.
    if (normalizedItemPath === '/employee/employment' || itemLast === 'employment') {
      return (
        normalizedPathname === '/employee/employment' ||
        normalizedPathname.startsWith('/employee/employment') ||
        normalizedPathname.startsWith('/employments/')
      );
    }
    
    // For other paths, use the original logic
    return (
      normalizedPathname === normalizedItemPath ||
      normalizedPathname.startsWith(normalizedItemPath + '/') ||
      // Fallback: match by last segment (more resilient to unexpected prefixes)
      (itemLast && pathnameLast === itemLast)
    );
  };

  const menuItems = [
    {
      path: '/employee-dashboard',
      name: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />
    },
    {
      path: '/employee/profile',
      name: 'My Profile',
      icon: <FiUser className="w-5 h-5" />
    },
    {
      path: '/employee/employment',
      name: 'My Employment',
      icon: <FiBriefcase className="w-5 h-5" />
    },
    {
      path: '/employee/my-salary',
      name: 'My Salaries',
      icon: <FiFileText className="w-5 h-5" />
    },
    // {
    //   path: '/employee/leaves',
    //   name: 'Leaves',
    //   icon: <FiCalendar className="w-5 h-5" />
    // },
    {
      path: '/employee/documents',
      name: 'My Document',
      icon: <FiFileText className="w-5 h-5" />,
      disabled: true,
    },
    {
      path: '/employee/company-information',
      name: 'Company Information',
      icon: <FiInfo className="w-5 h-5" />
    },
  ];

  return (
    <>
      {/* Mobile menu button - moved to header area */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-black hover:text-gray-700 transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-md bg-white/30 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Close button - positioned outside sidebar on the right */}
        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden fixed top-4 left-66 p-1 rounded-full bg-slate-500 text-white hover:bg-slate-600 transition-colors z-50"
          >
            <FiX size={18} />
          </button>
        )}
        <div className="p-5 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Employee</h2>
          <nav className="flex-grow">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  {item.disabled ? (
                    <div
                      aria-disabled="true"
                      className="flex items-center gap-3 p-3 rounded-md text-gray-400 cursor-not-allowed opacity-70"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  ) : (
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

        </div>
      </div>
    </>
  );
};

export default EmployeeSidebar; 