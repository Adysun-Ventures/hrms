'use client';

import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  variant?: 'public' | 'protected';
}

const Header = ({ variant = 'protected' }: HeaderProps) => {
  const { logout, currentAdmin, currentEmployee } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [localEmployeeData, setLocalEmployeeData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for localStorage changes and custom events to update employee data
  useEffect(() => {
    // Function to update employee data from localStorage
    const updateEmployeeData = () => {
      if (currentEmployee) {
        try {
          const storedData = localStorage.getItem('employeeData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setLocalEmployeeData(parsedData);
          }
        } catch (error) {
          console.error('Error reading employee data from localStorage:', error);
        }
      }
    };

    // Initial load
    updateEmployeeData();

    // Listen for storage events (when localStorage changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'employeeData') {
        updateEmployeeData();
      }
    };

    // Listen for custom event (when profile is updated in same tab)
    const handleProfileUpdate = () => {
      updateEmployeeData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Also poll for changes (in case storage event doesn't fire in same tab)
    const interval = setInterval(updateEmployeeData, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      clearInterval(interval);
    };
  }, [currentEmployee]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleProfileClick = () => {
    if (currentAdmin) {
      router.push('/profile');
    } else if (currentEmployee) {
      router.push('/employee/profile');
    }
    setIsDropdownOpen(false);
  };

  // Get user information
  const getUserInfo = () => {
    if (currentAdmin) {
      return {
        name: currentAdmin.name || 'Admin User',
        type: 'Admin',
        employeeId: null
      };
    } else if (currentEmployee) {
      // Use localEmployeeData if available (most up-to-date), otherwise fall back to currentEmployee
      const employee = localEmployeeData || currentEmployee;
      
      // Try multiple sources to get the employeeId
      let employeeId = null;
      
      try {
        // 1. First check if employeeId exists in localEmployeeData or currentEmployee
        if ((employee as any)?.employeeId) {
          employeeId = (employee as any).employeeId;
        } 
        // 2. Try to get from localStorage
        else {
          const storedEmployeeData = localStorage.getItem('employeeData');
          if (storedEmployeeData) {
            const parsedData = JSON.parse(storedEmployeeData);
            if (parsedData.employeeId) {
              employeeId = parsedData.employeeId;
            }
          }
        }
        
        // 3. If still not found, try to get from fullEmployeeData in localStorage
        if (!employeeId) {
          const fullEmployeeData = localStorage.getItem('fullEmployeeData');
          if (fullEmployeeData) {
            const parsedData = JSON.parse(fullEmployeeData);
            if (parsedData.employeeId) {
              employeeId = parsedData.employeeId;
            }
          }
        }
        
        // 4. As a last resort, check if there's a hardcoded value in the dashboard
        if (!employeeId && window && (window as any).employeeDashboardData) {
          employeeId = (window as any).employeeDashboardData.employeeId;
        }
      } catch (error) {
        console.error('Error retrieving employee ID:', error);
      }
      
      return {
        name: employee.name || currentEmployee.name || 'Employee User',
        type: 'Employee',
        employeeId: employeeId
      };
    }
    return {
      name: 'User',
      type: 'Unknown',
      employeeId: null
    };
  };

  const userInfo = getUserInfo();

  // Determine header styling based on variant
  const getHeaderStyles = () => {
    if (variant === 'public') {
      return isScrolled 
        ? 'bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg' 
        : 'bg-transparent';
    } else {
      // Protected variant
      return 'bg-white border-b border-gray-200 shadow-sm';
    }
  };

  // Determine text styling based on variant
  const getTextStyles = () => {
    if (variant === 'public') {
      return isScrolled ? 'text-white' : 'text-gray-800';
    } else {
      // Protected variant
      return 'text-gray-800';
    }
  };

  // Determine hover styling based on variant
  const getHoverStyles = () => {
    if (variant === 'public') {
      return isScrolled 
        ? 'text-white hover:bg-white/10' 
        : 'text-gray-700 hover:bg-gray-100';
    } else {
      // Protected variant
      return 'text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <header className={`h-16 fixed top-0 right-0 left-0 lg:left-64 z-10 transition-all duration-300 ${getHeaderStyles()}`}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Mobile title - centered on mobile, hidden on desktop */}
        <h1 className={`text-xl font-semibold lg:hidden flex-1 text-center transition-colors duration-300 ${getTextStyles()}`}>
          {currentAdmin ? 'Admin Dashboard' : 'Employee Portal'}
        </h1>
        
        {/* Center logo and company name - hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <a 
            href="https://adysunventures.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Image
              src="/adysun-logo.png"
              alt="Adysun Ventures Logo"
              width={30}
              height={30}
              className="object-contain mr-2"
              priority
            />
            <span className={`text-xl font-semibold transition-colors duration-300 ${getTextStyles()}`}>
              Adysun Ventures
            </span>
          </a>
        </div>
        
        {/* User dropdown on the right side */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${getHoverStyles()}`}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className={`text-sm font-medium transition-colors duration-300 ${
                variant === 'public' ? (isScrolled ? 'text-white' : 'text-gray-900') : 'text-gray-900'
              }`}>{userInfo.name}</div>
              <div className={`text-xs transition-colors duration-300 ${
                variant === 'public' ? (isScrolled ? 'text-white/70' : 'text-gray-500') : 'text-gray-500'
              }`}>
                {userInfo.type === 'Employee' && userInfo.employeeId ? (
                  <span className="flex items-center">
                    {/* <span className="mr-1">EMP ID:</span> */}
                    <span className="font-medium">{userInfo.employeeId}</span>
                  </span>
                ) : (
                  userInfo.type
                )}
              </div>
            </div>
            <FiChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FiUser className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 