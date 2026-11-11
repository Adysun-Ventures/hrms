
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { signOut, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import {
  createAdminSession,
  createLoginLog,
  closeLoginLog,
  touchLoginLog,
} from '../utils/firebaseUtils';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  pass?: string;
  active: boolean;
  createdAt: any;
  isAdmin: boolean;
  userType: 'admin';
};

type EmployeeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  status: 'active' | 'inactive';
  createdAt: any;
  isEmployee: boolean;
  isAdmin: boolean;
  userType: 'employee';
};

type CurrentUser = AdminUser | EmployeeUser | null;

/** Session copies of a user never carry the password (localStorage / React state). */
export const withoutSecrets = <T extends Record<string, any> | null | undefined>(user: T): T => {
  if (!user) return user;
  const { pass: _pass, password: _password, confirmPassword: _confirm, ...rest } = user as Record<string, any>;
  return rest as T;
};

/** The small employee object kept in React state / localStorage (no secrets, no PII beyond contact). */
const toEmployeeSession = (id: string, d: Record<string, any>): EmployeeUser =>
  ({
    id,
    name: d.name || '',
    email: d.email || '',
    phone: d.phone || '',
    status: d.status || 'inactive',
    employmentStatus: d.employmentStatus || '',
    is_resigned: d.is_resigned === true || d.is_resigned === 'true' || d.is_resigned === 1,
    createdAt: d.createdAt,
    isEmployee: true,
    isAdmin: false,
    userType: 'employee',
  }) as EmployeeUser;

const SESSION_COOKIES = ['adminSessionId', 'employeeSessionId'] as const;
const hasCookie = (name: string) =>
  typeof document !== 'undefined' && document.cookie.split('; ').some((c) => c.startsWith(`${name}=`) && c.length > name.length + 1);
const setSessionCookie = (name: string, value: string) => {
  // `secure` only on https so login also works on plain-http LAN/dev hosts.
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=86400; samesite=strict${secure}`;
};
const clearCookie = (name: string) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

type AuthContextType = {
  currentUser: User | null;
  currentAdmin: AdminUser | null;
  currentEmployee: EmployeeUser | null;
  currentUserData: CurrentUser;
  isEmployeeExited: boolean;
  loading: boolean;
  signInWithCredentials: (phoneNumber: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeUser | null>(null);
  const [currentUserData, setCurrentUserData] = useState<CurrentUser>(null);
  const [isEmployeeExited, setIsEmployeeExited] = useState(false);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const toDateMs = (value: any): number => {
    if (!value) return 0;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const isEmployeeTerminated = async (employeeId: string): Promise<boolean> => {
    try {
      if (!employeeId) return false;
      const employmentSnap = await getDocs(
        query(collection(db, 'employments'), where('employeeId', '==', employeeId))
      );
      if (employmentSnap.empty) return false;

      const rows = employmentSnap.docs.map((d) => d.data() as any);
      rows.sort((a, b) => {
        const aMs = toDateMs(a?.updatedAt) || toDateMs(a?.startDate || a?.joiningDate);
        const bMs = toDateMs(b?.updatedAt) || toDateMs(b?.startDate || b?.joiningDate);
        return bMs - aMs;
      });

      const latest = rows[0] || {};
      const status = String(latest?.employeeStatus || '').trim().toLowerCase();
      return status === 'terminated';
    } catch (error) {
      console.error('Failed to evaluate employee termination status:', error);
      return false;
    }
  };

  const isEmployeeExitedStatus = async (employeeId: string): Promise<boolean> => {
    try {
      if (!employeeId) return false;
      const employmentSnap = await getDocs(
        query(collection(db, 'employments'), where('employeeId', '==', employeeId))
      );
      if (employmentSnap.empty) return false;

      const rows = employmentSnap.docs.map((d) => d.data() as any);
      rows.sort((a, b) => {
        const aMs = toDateMs(a?.updatedAt) || toDateMs(a?.startDate || a?.joiningDate);
        const bMs = toDateMs(b?.updatedAt) || toDateMs(b?.startDate || b?.joiningDate);
        return bMs - aMs;
      });

      const latest = rows[0] || {};
      const status = String(latest?.employeeStatus || '').trim().toLowerCase();
      return status === 'exited';
    } catch (error) {
      console.error('Failed to evaluate employee exited status:', error);
      return false;
    }
  };

  const closeActiveLoginLogs = (
    reason: 'logout' | 'browser_tab_close' | 'session_expired' | 'network_lost' | 'unknown'
  ) => {
    const ids = [localStorage.getItem('adminLoginLogId'), localStorage.getItem('employeeLoginLogId')].filter(Boolean);
    return Promise.all(ids.map((id) => closeLoginLog(id as string, reason))).catch(() => {});
  };

  const getDeviceType = (ua: string) => {
    const s = ua.toLowerCase();
    if (/tablet|ipad/.test(s)) return 'Tablet';
    if (/mobile|android|iphone/.test(s)) return 'Mobile';
    return 'Desktop';
  };

  const getBrowserNameVersion = (ua: string) => {
    const patterns = [
      { name: 'Edge', regex: /Edg\/([\d.]+)/ },
      { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
      { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
      { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
    ];
    for (const p of patterns) {
      const match = ua.match(p.regex);
      if (match?.[1]) return `${p.name} ${match[1]}`;
    }
    return 'Unknown';
  };

  const fetchClientNetworkMeta = async () => {
    try {
      // Primary: ipapi.co provides ip + location fields
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const ipAddress =
          data?.ip ||
          data?.ip_address ||
          data?.query ||
          '-';
        const city =
          data?.city ||
          data?.region ||
          data?.region_code ||
          '-';
        if (ipAddress !== '-' || city !== '-') {
          return { ipAddress, city };
        }
      }

      // Fallback: ipify for IP only (location may remain '-')
      const ipRes = await fetch('https://api.ipify.org?format=json');
      if (!ipRes.ok) return { ipAddress: '-', city: '-' };
      const ipData = await ipRes.json();
      return { ipAddress: ipData?.ip || '-', city: '-' };
    } catch {
      return { ipAddress: '-', city: '-' };
    }
  };

  // Restore sessions from localStorage on component mount.
  // Cookie and localStorage must agree, otherwise /login <-> dashboard can loop.
  useEffect(() => {
    const clearAdmin = () => {
      localStorage.removeItem('adminSessionId');
      localStorage.removeItem('adminData');
      clearCookie('adminSessionId');
    };
    const clearEmployee = () => {
      localStorage.removeItem('employeeSessionId');
      localStorage.removeItem('employeeData');
      clearCookie('employeeSessionId');
    };

    // The Firebase session (persisted by the SDK) is what Firestore rules see, so it must be
    // restored before any screen renders and reads data. Old sessions without one must log in again.
    const restoreSessions = async () => {
      let restored = false;
      try {
        await auth.authStateReady();
        const fbUser = auth.currentUser;
        const role = fbUser ? (await fbUser.getIdTokenResult()).claims.role : null;

        const adminData = localStorage.getItem('adminData');
        if (role === 'admin' && adminData && localStorage.getItem('adminSessionId') && hasCookie('adminSessionId')) {
          const adminUser = withoutSecrets(JSON.parse(adminData));
          setCurrentAdmin(adminUser);
          setCurrentEmployee(null);
          setCurrentUserData(adminUser);
          setIsEmployeeExited(false);
          restored = true;
        } else if (role === 'employee' && fbUser && hasCookie('employeeSessionId')) {
          const snap = await getDoc(doc(db, 'employees', fbUser.uid));
          if (snap.exists()) {
            const [terminated, exited] = await Promise.all([
              isEmployeeTerminated(fbUser.uid),
              isEmployeeExitedStatus(fbUser.uid),
            ]);
            if (!terminated) {
              const safe = toEmployeeSession(fbUser.uid, snap.data());
              localStorage.setItem('employeeSessionId', fbUser.uid);
              localStorage.setItem('employeeData', JSON.stringify(safe));
              setCurrentEmployee(safe);
              setCurrentAdmin(null);
              setCurrentUserData(safe);
              setIsEmployeeExited(exited);
              restored = true;
            }
          }
        }
      } catch (error) {
        console.error('Error restoring sessions:', error);
      } finally {
        if (!restored) {
          clearAdmin();
          clearEmployee();
          if (auth.currentUser) await signOut(auth).catch(() => {});
        }
        setLoading(false);
      }
    };

    restoreSessions();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Don't set loading to false here as we handle it in session restoration
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handlePageClose = () => {
      if (isLoggingOutRef.current) return;
      closeActiveLoginLogs('browser_tab_close');
    };
    const handleOffline = () => closeActiveLoginLogs('network_lost');
    const handleVisibility = () => {
      const adminLogId = localStorage.getItem('adminLoginLogId') || '';
      const employeeLogId = localStorage.getItem('employeeLoginLogId') || '';
      if (adminLogId) touchLoginLog(adminLogId);
      if (employeeLogId) touchLoginLog(employeeLogId);
    };

    window.addEventListener('pagehide', handlePageClose);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', handlePageClose);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const adminLogId = localStorage.getItem('adminLoginLogId') || '';
      const employeeLogId = localStorage.getItem('employeeLoginLogId') || '';
      if (adminLogId) touchLoginLog(adminLogId);
      if (employeeLogId) touchLoginLog(employeeLogId);
    };

    // heartbeat so we can detect "tab closed" reliably
    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Note: no employment-status-based auto-logout.

  const signInWithCredentials = async (phoneNumber: string, password: string) => {
    // IP/city lookup for the login log runs alongside the login call instead of after it
    // (it never rejects; failures resolve to '-').
    const networkMetaPromise = fetchClientNetworkMeta();
    try {
      // Password is checked on the server; it answers with a Firebase custom token whose
      // claims (role, employeeId) are what firestore.rules enforce.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Invalid mobile number or password.');
      await signInWithCustomToken(auth, json.token);
      const userData = json.user;

      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const networkMeta = await networkMetaPromise;
      const logMeta = {
        ipAddress: networkMeta.ipAddress,
        city: networkMeta.city,
        userAgent: ua || '-',
        deviceType: getDeviceType(ua),
        browserNameVersion: getBrowserNameVersion(ua),
      };

      if (userData.userType === 'admin') {
        const sessionId = await createAdminSession(userData.id, userData);
        const adminLogId = await createLoginLog({
          userId: userData.id,
          userType: 'admin',
          userName: userData.name,
          sessionId,
          ...logMeta,
        });

        const safeAdmin = withoutSecrets(userData);
        localStorage.setItem('adminSessionId', sessionId);
        localStorage.setItem('adminData', JSON.stringify(safeAdmin));
        localStorage.setItem('adminLoginLogId', adminLogId);

        // Cookie marks the session for restore on reload.
        clearCookie('employeeSessionId');
        setSessionCookie('adminSessionId', sessionId);

        setCurrentAdmin(safeAdmin);
        setCurrentEmployee(null);
        setCurrentUserData(safeAdmin);
        setIsEmployeeExited(false);
        return { admin: safeAdmin, userType: 'admin' };
      }

      const safeEmployee = withoutSecrets(userData);
      localStorage.setItem('employeeSessionId', userData.id);
      localStorage.setItem('employeeData', JSON.stringify(safeEmployee));

      const employeeLogId = await createLoginLog({
        userId: userData.id,
        userType: 'employee',
        userName: userData.name,
        sessionId: userData.id,
        ...logMeta,
      });
      localStorage.setItem('employeeLoginLogId', employeeLogId);

      clearCookie('adminSessionId');
      setSessionCookie('employeeSessionId', userData.id);

      setCurrentEmployee(safeEmployee);
      setCurrentAdmin(null);
      setCurrentUserData(safeEmployee);
      setIsEmployeeExited(await isEmployeeExitedStatus(userData.id));
      return { employee: safeEmployee, userType: 'employee' };
    } catch (error) {
      console.error('Error during credential sign in:', error);
      return Promise.reject(error);
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;
    // Close the login log while still signed in; Firestore rules reject it after signOut.
    await closeActiveLoginLogs('logout');

    setCurrentAdmin(null);
    setCurrentEmployee(null);
    setCurrentUserData(null);
    setIsEmployeeExited(false);
    
    // Clear localStorage
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminLoginLogId');
    localStorage.removeItem('employeeSessionId');
    localStorage.removeItem('employeeData');
    localStorage.removeItem('employeeLoginLogId');
    
    // Clear cookies
    SESSION_COOKIES.forEach(clearCookie);
    localStorage.removeItem('fullEmployeeData');

    return signOut(auth);
  };

  const value = {
    currentUser,
    currentAdmin,
    currentEmployee,
    currentUserData,
    isEmployeeExited,
    loading,
    signInWithCredentials,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 