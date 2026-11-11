
import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser, FiChevronDown, FiFileText, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/lib/navigation';
import { toTitleCase } from '@/utils/stringUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

const readStoredEmployeeId = (): string | null => {
  for (const key of ['employeeData', 'fullEmployeeData']) {
    try {
      const id = JSON.parse(localStorage.getItem(key) || 'null')?.employeeId;
      if (id) return String(id);
    } catch {}
  }
  return null;
};

const toDateMs = (value: any): number => {
  if (!value) return 0;
  const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
};

const Header = () => {
  const { logout, currentAdmin, currentEmployee, isEmployeeExited } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localEmployeeData, setLocalEmployeeData] = useState<any>(null);
  const [employeeLastWorkingDate, setEmployeeLastWorkingDate] = useState<string | null>(null);
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

  // Keep employee name/ID fresh after profile edits (same tab: 'profileUpdated', other tabs: 'storage').
  useEffect(() => {
    if (!currentEmployee) return;
    const update = () => {
      try {
        const stored = localStorage.getItem('employeeData');
        if (stored) setLocalEmployeeData(JSON.parse(stored));
      } catch {}
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'employeeData') update();
    };
    update();
    window.addEventListener('storage', onStorage);
    window.addEventListener('profileUpdated', update);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('profileUpdated', update);
    };
  }, [currentEmployee]);

  // Last working date from the latest Employment (shown for exited employees).
  useEffect(() => {
    let cancelled = false;
    setEmployeeLastWorkingDate(null);
    if (!currentEmployee?.id || !isEmployeeExited) return;
    getDocs(query(collection(db, 'employments'), where('employeeId', '==', currentEmployee.id)))
      .then((snap) => {
        const rows = snap.docs.map((d) => d.data() as any);
        rows.sort(
          (a, b) =>
            (toDateMs(b?.updatedAt) || toDateMs(b?.startDate || b?.joiningDate)) -
            (toDateMs(a?.updatedAt) || toDateMs(a?.startDate || a?.joiningDate))
        );
        const lwd = rows[0]?.lastWorkingDate || rows[0]?.endDate || null;
        if (!cancelled) setEmployeeLastWorkingDate(lwd ? String(lwd) : null);
      })
      .catch((error) => console.error('Error loading employment last working date:', error));
    return () => {
      cancelled = true;
    };
  }, [currentEmployee?.id, isEmployeeExited]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    router.replace('/login');
  };

  const go = (path: string) => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  const employee = localEmployeeData || currentEmployee;
  const userName = toTitleCase((currentAdmin || employee)?.name || '') || (currentAdmin ? 'Admin User' : 'User');
  const subtitle = currentAdmin
    ? 'Admin'
    : (employee as any)?.employeeId || (currentEmployee ? readStoredEmployeeId() : null) || 'Employee';

  const menuItem = 'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100';

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-[var(--sidebar-w)] z-30 bg-white border-b border-slate-200">
      <div className="relative flex items-center h-full pl-14 pr-3 lg:pl-4">
        {/* Employee status */}
        {currentEmployee && (
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isEmployeeExited ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-green-50 text-green-700 ring-1 ring-green-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isEmployeeExited ? 'bg-red-500' : 'bg-green-500'}`} />
            {isEmployeeExited
              ? `Exited${employeeLastWorkingDate ? ` · LWD ${formatDateToDayMonYear(employeeLastWorkingDate)}` : ''}`
              : 'Working'}
          </span>
        )}

        {/* Centered brand */}
        <a
          href="https://adysunventures.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <img src="/adysun-logo.png" alt="Adysun Ventures" width={28} height={28} className="object-contain" />
          <span className="hidden sm:inline text-base font-bold text-slate-900 tracking-wide">ADYSUN VENTURES</span>
        </a>

        {/* User menu */}
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
          >
            <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-sm font-semibold text-slate-900">{userName}</span>
              <span className="block text-xs text-slate-500">{subtitle}</span>
            </span>
            <FiChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {isDropdownOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg p-1 z-50 border border-slate-200">
              <button onClick={() => go(currentAdmin ? '/profile' : '/employee/profile')} className={menuItem}>
                <FiUser className="w-4 h-4" /> My Profile
              </button>
              {currentEmployee && (
                <>
                  <button onClick={() => go('/employee/employment')} className={menuItem}>
                    <FiBriefcase className="w-4 h-4" /> My Employment
                  </button>
                  <button onClick={() => go('/employee/my-salary')} className={menuItem}>
                    <FiFileText className="w-4 h-4" /> My Salaries
                  </button>
                </>
              )}
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                <FiLogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
