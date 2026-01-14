'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUsers, FiMenu, FiX, FiFile, FiHome } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { FiMail } from 'react-icons/fi';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { currentAdmin } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Fetch new enquiries count from last 24 hours using TanStack Query
  const { data: newEnquiriesCount = 0 } = useQuery({
    queryKey: queryKeys.enquiries.newCount(),
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const q = query(
        collection(db, 'enquiries'),
        where('createdAt', '>=', Timestamp.fromDate(twentyFourHoursAgo))
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    },
    enabled: !!currentAdmin,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Function to determine if a menu item is active
  const isActive = (path: string) => {
    if (!pathname) return false;
    
    if (path === '/dashboard') {
      // Only consider dashboard active if we're exactly on the dashboard path
      return pathname === '/dashboard';
    }
    
    if (path === '/dashboard/documents') {
      // For documents, consider any document-related path to be active
      return pathname.includes('/documents') || pathname.includes('/doc_pages');
    }
    
    if (path === '/dashboard/attendance') {
      // For attendance, consider attendance-related paths to be active
      return pathname.includes('/attendance');
    }
    
    if (path === '/employees') {
      // For employees, consider employee-related paths and salary-related paths to be active
      return pathname === '/employees' || 
             pathname.startsWith('/employees/') || 
             pathname.startsWith('/salaries') ||
             pathname.startsWith('/employments');
    }
    
    // For other paths, use the original logic
    return pathname === path || pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />
    },
    {
      path: '/employees',
      name: 'Employees',
      icon: <FiUsers className="w-5 h-5" />
    },
  ];

  // Add Enquiries link for admins only
  if (currentAdmin) {
    menuItems.push({
      path: '/dashboard/enquiries',
      name: 'Enquiries',
      icon: <FiMail className="w-5 h-5" />
    });
    
    // Add Documents below Enquiries
    menuItems.push({
      path: '/dashboard/documents',
      name: 'Documents',
      icon: <FiFile className="w-5 h-5" />
    });
  }

  // Remove Profile - now handled in header dropdown
  // menuItems.push({
  //   path: '/profile',
  //   name: 'My Profile',
  //   icon: <FiUser className="w-5 h-5" />
  // });

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
          <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
          <nav className="flex-grow">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 p-3 rounded-md transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    
                    {/* Show red badge for new enquiries */}
                    {item.path === '/dashboard/enquiries' && newEnquiriesCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                        {newEnquiriesCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Add separator after Enquiries for admin users */}
                  {currentAdmin && item.path === '/dashboard/enquiries' && (
                    <div className="my-2 border-t border-gray-600"></div>
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

export default Sidebar; 