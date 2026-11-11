
import { useState } from 'react';
import Link from '@/lib/link';
import { usePathname } from '@/lib/navigation';
import { FiUser, FiMenu, FiX, FiHome, FiFileText, FiBriefcase, FiInfo, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

const EmployeeSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
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

    // "My Salaries" is rendered for both:
    // - the list page: `/employee/my-salary`
    // - the view page: `/salaries/:id` (employee route)
    if (normalizedItemPath === '/employee/my-salary') {
      return (
        normalizedPathname === '/employee/my-salary' ||
        normalizedPathname.startsWith('/employee/my-salary') ||
        normalizedPathname.startsWith('/salaries/')
      );
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
      icon: <FiHome className="w-5 h-5 shrink-0" />
    },
    {
      path: '/employee/profile',
      name: 'My Profile',
      icon: <FiUser className="w-5 h-5 shrink-0" />
    },
    {
      path: '/employee/employment',
      name: 'My Employment',
      icon: <FiBriefcase className="w-5 h-5 shrink-0" />
    },
    {
      path: '/employee/my-salary',
      name: 'My Salaries',
      icon: <FiFileText className="w-5 h-5 shrink-0" />
    },
    {
      path: '/employee/documents',
      name: 'My Document',
      icon: <FiFileText className="w-5 h-5 shrink-0" />,
    },
    {
      path: '/employee/company-information',
      name: 'Company Information',
      icon: <FiInfo className="w-5 h-5 shrink-0" />
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-800 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-900 text-slate-300 w-56 lg:w-[var(--sidebar-w)] z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-3 -right-10 p-1.5 rounded-full bg-slate-700 text-white"
            aria-label="Close menu"
          >
            <FiX size={18} />
          </button>
        )}
        <div className={`flex flex-col h-full p-3 ${collapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center h-10 mb-4 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <span className={`pl-2 text-lg font-bold text-white tracking-wide ${collapsed ? 'lg:hidden' : ''}`}>Employee</span>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:inline-flex p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
            </button>
          </div>
          <nav className="flex-grow">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    title={item.name}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      collapsed ? 'lg:justify-center lg:px-0' : ''
                    } ${isActive(item.path) ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                  >
                    {item.icon}
                    <span className={collapsed ? 'lg:hidden' : ''}>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default EmployeeSidebar; 