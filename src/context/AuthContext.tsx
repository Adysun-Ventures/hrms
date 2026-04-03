'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { checkAdminByPhone, createAdminSession, checkUserByPhone } from '../utils/firebaseUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Extend Window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  pass: string;
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
  password: string;
  status: 'active' | 'inactive';
  createdAt: any;
  isEmployee: boolean;
  isAdmin: boolean;
  userType: 'employee';
};

type CurrentUser = AdminUser | EmployeeUser | null;

type AuthContextType = {
  currentUser: User | null;
  currentAdmin: AdminUser | null;
  currentEmployee: EmployeeUser | null;
  currentUserData: CurrentUser;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  signInWithCredentials: (phoneNumber: string, password: string) => Promise<any>;
  verifyOTP: (verificationId: string, otp: string) => Promise<any>;
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
  const [loading, setLoading] = useState(true);

  // Restore sessions from localStorage on component mount
  useEffect(() => {
    const restoreSessions = async () => {
      try {
        type EmploymentMinimal = {
          isResignation?: boolean;
          is_resigned?: boolean;
          employmentStatus?: string | null;
        };

        const hasActiveEmployment = async (employeeId: string) => {
          const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
          const snap = await getDocs(q);
          if (snap.empty) return false;

          const employments = snap.docs.map((d) => d.data() as EmploymentMinimal);

          // Active = not resigned and not ended.
          return employments.some((emp) => {
            const isResigned =
              emp.isResignation === true ||
              emp.is_resigned === true ||
              emp.employmentStatus === 'resigned';

            const isInactive = emp.employmentStatus === 'inactive';
            return !isResigned && !isInactive;
          });
        };

        // Check for admin session
        const adminSessionId = localStorage.getItem('adminSessionId');
        const adminData = localStorage.getItem('adminData');
        
        if (adminSessionId && adminData) {
          // console.log('🔍 Restoring admin session from localStorage');
          const adminUser = JSON.parse(adminData);
          setCurrentAdmin(adminUser);
          setCurrentEmployee(null);
          setCurrentUserData(adminUser);
         
        }
        
        // Check for employee session
        const employeeSessionId = localStorage.getItem('employeeSessionId');
        const employeeData = localStorage.getItem('employeeData');
        
        if (employeeSessionId && employeeData) {
          console.log('🔍 Restoring employee session from localStorage');
          const employeeUser = JSON.parse(employeeData);

          // Security: if employee is inactive/resigned, do not restore session
          // (status might have changed after last login)
          try {
            const latest = await checkUserByPhone(employeeUser.phone);
            const activeEmployment = latest?.id ? await hasActiveEmployment(latest.id) : false;

            if (
              !latest ||
              latest.userType !== 'employee' ||
              !activeEmployment
            ) {
              localStorage.removeItem('employeeSessionId');
              localStorage.removeItem('employeeData');
              document.cookie = 'employeeSessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            } else {
              setCurrentEmployee(latest);
              setCurrentAdmin(null);
              setCurrentUserData(latest);
            }
          } catch (e) {
            // If validation fails, clear session for safety
            localStorage.removeItem('employeeSessionId');
            localStorage.removeItem('employeeData');
            document.cookie = 'employeeSessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }
      } catch (error) {
        console.error('Error restoring sessions:', error);
        // Clear invalid sessions
        localStorage.removeItem('adminSessionId');
        localStorage.removeItem('adminData');
        localStorage.removeItem('employeeSessionId');
        localStorage.removeItem('employeeData');
      } finally {
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

  // If an employee becomes resigned/inactive after login, block further access by validating
  // their current employment records and auto-logging them out when no active employment exists.
  useEffect(() => {
    const validateEmployeeEmployment = async () => {
      if (!currentUserData || currentUserData.userType !== 'employee') return;

      type EmploymentMinimal = {
        isResignation?: boolean;
        is_resigned?: boolean;
        employmentStatus?: string | null;
      };

      try {
        const q = query(
          collection(db, 'employments'),
          where('employeeId', '==', currentUserData.id)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          void logout();
          return;
        }

        const employments = snap.docs.map((d) => d.data() as EmploymentMinimal);
        const hasActiveEmployment = employments.some((emp) => {
          const isResigned =
            emp.isResignation === true ||
            emp.is_resigned === true ||
            emp.employmentStatus === 'resigned';

          const isInactive = emp.employmentStatus === 'inactive';
          return !isResigned && !isInactive;
        });

        if (!hasActiveEmployment) {
          void logout();
        }
      } catch (e) {
        // If validation fails, keep the session (don't lock out due to transient errors).
        console.warn('Employment validation failed:', e);
      }
    };

    void validateEmployeeEmployment();
  }, [currentUserData]);

  const signInWithCredentials = async (phoneNumber: string, password: string) => {
    try {
      console.log('🔍 Debug: Input phoneNumber:', phoneNumber);
      console.log('🔍 Debug: Input password:', password);
      
      // Use the common authentication function
      const userData = await checkUserByPhone(phoneNumber);
      
      console.log('🔍 Debug: User data from DB:', userData);
      
      if (!userData) {
        console.log('❌ No user found');
        throw new Error('User not found');
      }
      
      if (userData.userType === 'admin') {
        // Admin authentication
        if (userData.active && userData.pass === password) {
          console.log('✅ Admin password match successful!');
          
          // Create a custom session for the admin
          const sessionId = await createAdminSession(userData.id, userData);
          console.log('✅ Custom authentication session created:', sessionId);
          
          // Store session ID in localStorage for persistence
          localStorage.setItem('adminSessionId', sessionId);
          localStorage.setItem('adminData', JSON.stringify(userData));
          
          // Set cookie for server-side middleware
          document.cookie = `adminSessionId=${sessionId}; path=/; max-age=86400; secure; samesite=strict`;
          
          setCurrentAdmin(userData);
          setCurrentEmployee(null);
          setCurrentUserData(userData);
          return { admin: userData, userType: 'admin' };
        } else {
          console.log('❌ Admin password mismatch or inactive!');
          throw new Error('Invalid password or inactive account');
        }
      } else if (userData.userType === 'employee') {
        // Employee authentication
        if (userData.password === password) {
          console.log('✅ Employee password match successful!');

          // Block login if employee has no active employment
          type EmploymentMinimal = {
            isResignation?: boolean;
            is_resigned?: boolean;
            employmentStatus?: string | null;
          };

          const q = query(collection(db, 'employments'), where('employeeId', '==', userData.id));
          const snap = await getDocs(q);
          const employments = snap.docs.map((d) => d.data() as EmploymentMinimal);

          const hasActiveEmployment = employments.some((emp) => {
            const isResigned =
              emp.isResignation === true ||
              emp.is_resigned === true ||
              emp.employmentStatus === 'resigned';

            const isInactive = emp.employmentStatus === 'inactive';
            return !isResigned && !isInactive;
          });

          if (!hasActiveEmployment) {
            throw new Error('Your employment is inactive/resigned. Please contact administrator.');
          }
          
          // Store employee data in localStorage for persistence
          localStorage.setItem('employeeSessionId', userData.id);
          localStorage.setItem('employeeData', JSON.stringify(userData));
          
          // Set cookie for server-side middleware
          document.cookie = `employeeSessionId=${userData.id}; path=/; max-age=86400; secure; samesite=strict`;
          
          setCurrentEmployee(userData);
          setCurrentAdmin(null);
          setCurrentUserData(userData);
          return { employee: userData, userType: 'employee' };
        } else {
          console.log('❌ Employee password mismatch or inactive!');
          throw new Error('Invalid password or inactive account');
        }
      } else {
        console.log('❌ Unknown user type');
        throw new Error('Invalid user type');
      }
    } catch (error) {
      console.error('Error during credential sign in:', error);
      return Promise.reject(error);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      // TEMPORARY: Development bypass for testing admin collection
      if (phoneNumber === '+918806431723') {
        console.log('Using development bypass for admin testing');
        return { verificationId: 'dev-bypass-verification-id' };
      }

      // For development, you can use the test phone number: +1 999-999-9999
      // Create a RecaptchaVerifier instance
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log('Recaptcha verified');
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            console.log('Recaptcha expired');
          }
        });
      }

      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('RecaptchaVerifier is not initialized');
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return { verificationId: confirmationResult.verificationId };
    } catch (error) {
      console.error('Error during phone sign in:', error);
      // Reset the reCAPTCHA so the user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      return Promise.reject(error);
    }
  };

  const verifyOTP = async (verificationId: string, otp: string) => {
    try {
      // TEMPORARY: Development bypass for testing admin collection
      if (verificationId === 'dev-bypass-verification-id') {
        console.log('Using development bypass for admin verification');
        // Check if the user is an admin using the phone number from the login form
        const userData = await checkUserByPhone('8806431723');
        
        if (userData) {
          if (userData.userType === 'admin') {
            setCurrentAdmin(userData);
            setCurrentEmployee(null);
            setCurrentUserData(userData);
            return { user: null, admin: userData, userType: 'admin' };
          } else if (userData.userType === 'employee') {
            setCurrentEmployee(userData);
            setCurrentAdmin(null);
            setCurrentUserData(userData);
            return { user: null, employee: userData, userType: 'employee' };
          }
        } else {
          setCurrentAdmin(null);
          setCurrentEmployee(null);
          setCurrentUserData(null);
          return { user: null, admin: null, employee: null };
        }
      }

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      
      // Check if the user is an admin or employee
      const userData = await checkUserByPhone(result.user.phoneNumber || '');
      
      if (userData) {
        if (userData.userType === 'admin') {
          setCurrentAdmin(userData);
          setCurrentEmployee(null);
          setCurrentUserData(userData);
          return { user: result.user, admin: userData, userType: 'admin' };
        } else if (userData.userType === 'employee') {
          setCurrentEmployee(userData);
          setCurrentAdmin(null);
          setCurrentUserData(userData);
          return { user: result.user, employee: userData, userType: 'employee' };
        }
      } else {
        // User is authenticated but not found in admin or employee collections
        setCurrentAdmin(null);
        setCurrentEmployee(null);
        setCurrentUserData(null);
        return { user: result.user, admin: null, employee: null };
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      return Promise.reject(error);
    }
  };

  const logout = () => {
    setCurrentAdmin(null);
    setCurrentEmployee(null);
    setCurrentUserData(null);
    
    // Clear localStorage
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('adminData');
    localStorage.removeItem('employeeSessionId');
    localStorage.removeItem('employeeData');
    
    // Clear cookies
    document.cookie = 'adminSessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'employeeSessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    return signOut(auth);
  };

  const value = {
    currentUser,
    currentAdmin,
    currentEmployee,
    currentUserData,
    loading,
    signInWithPhone,
    signInWithCredentials,
    verifyOTP,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 