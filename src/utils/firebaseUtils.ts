import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toTitleCase } from './stringUtils';
import { apiPost, isAdminSession } from './api';

/** Passwords live server-side (credentials/{uid}, hashed); never in Firestore docs the browser reads. */
export const setUserPassword = (uid: string, password: string) =>
  apiPost('/api/auth/password', { uid, password });
import { Employee, Employment, Salary, SecondaryEducationEntry } from '../types';

/**
 * Sanitizes data for Firestore by removing undefined values
 * @param {any} data - The data to sanitize
 * @returns {any} - Sanitized data safe for Firestore
 */
const PROFILE_IMAGE_KEYS = new Set(['profilePhoto', 'imageUrl']);

export function sanitizeForFirestore(data: any): any {
  // Handle null or undefined input
  if (data === null || data === undefined) {
    return null;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Profile pictures are not supported: never persist them.
      if (PROFILE_IMAGE_KEYS.has(key)) continue;
      // Skip undefined values
      if (value !== undefined) {
        // Recursively sanitize nested objects and arrays
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    
    return sanitized;
  }
  
  // Return primitive values as is
  return data;
}

// Validate education entries before saving
const validateEducationEntries = (entries: SecondaryEducationEntry[]): boolean => {
  if (entries.length > 2) {
    throw new Error('Maximum 2 education entries allowed');
  }
  
  const types = entries.map(e => e.type);
  const uniqueTypes = new Set(types);
  
  if (types.length !== uniqueTypes.size) {
    throw new Error('Duplicate education types not allowed');
  }
  
  return true;
};

// Generate next sequential employee ID
export async function getNextEmployeeId(): Promise<string> {
  const counterRef = doc(db, 'counters', 'employeeIdCounter');
  
  try {
    // Use Firestore transaction to prevent race conditions
    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber = 1;
      
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().lastNumber || 0) + 1;
      } else {
        // Initialize counter if it doesn't exist
        transaction.set(counterRef, {
          lastNumber: 0,
          lastGeneratedId: 'EMP000',
          updatedAt: serverTimestamp()
        });
      }
      
      // Generate new ID with padding
      const newEmployeeId = `EMP${String(nextNumber).padStart(3, '0')}`;
      
      // Update counter
      transaction.update(counterRef, {
        lastNumber: nextNumber,
        lastGeneratedId: newEmployeeId,
        updatedAt: serverTimestamp()
      });
      
      return newEmployeeId;
    });
    
    return newId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
}

// Check if employee ID already exists
export async function checkEmployeeIdExists(employeeId: string): Promise<boolean> {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking employee ID:', error);
    throw new Error('Failed to check employee ID');
  }
}
import { useAuditTrail } from '../hooks/useAuditTrail';

// Custom session management for Mobile + Password authentication
export const createAdminSession = async (adminId: string, adminData: any) => {
  try {
    
    // Create a session document
    const sessionData = {
      adminId: adminId,
      adminName: adminData.name,
      adminEmail: adminData.email,
      adminMobile: adminData.mobile,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true
    };
    
    const sessionRef = await addDoc(collection(db, 'admin_sessions'), sessionData);
    
    return sessionRef.id;
  } catch (error) {
    console.error('Error creating admin session:', error);
    throw error;
  }
};

export const validateAdminSession = async (sessionId: string) => {
  try {
    const sessionDoc = await getDoc(doc(db, 'admin_sessions', sessionId));
    
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();
      const now = new Date();
      const expiresAt = sessionData.expiresAt.toDate();
      
      if (sessionData.isActive && now < expiresAt) {
        return sessionData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error validating admin session:', error);
    return null;
  }
};

// Login logs
export const createLoginLog = async (payload: {
  userId: string;
  userType: 'admin' | 'employee';
  userName?: string;
  ipAddress?: string;
  city?: string;
  deviceType?: string;
  userAgent?: string;
  browserNameVersion?: string;
  sessionId?: string;
}) => {
  try {
    const logRef = await addDoc(collection(db, 'login_logs'), {
      userId: payload.userId,
      userType: payload.userType,
      userName: payload.userName || '',
      ipAddress: payload.ipAddress || '-',
      city: payload.city || '-',
      deviceType: payload.deviceType || '-',
      userAgent: payload.userAgent || '-',
      browserNameVersion: payload.browserNameVersion || '-',
      sessionId: payload.sessionId || '',
      sessionOpenedAt: new Date(),
      sessionLastSeenAt: new Date(),
      sessionClosedAt: null,
      sessionClosedThrough: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return logRef.id;
  } catch (error) {
    console.error('Error creating login log:', error);
    throw error;
  }
};

export const touchLoginLog = async (logId: string) => {
  try {
    if (!logId) return;
    await updateDoc(doc(db, 'login_logs', logId), {
      sessionLastSeenAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    // keep silent; this runs on an interval
  }
};

export const closeLoginLog = async (
  logId: string,
  closedThrough:
    | 'logout'
    | 'browser_tab_close'
    | 'session_expired'
    | 'network_lost'
    | 'unknown' = 'unknown'
) => {
  try {
    if (!logId) return;
    await updateDoc(doc(db, 'login_logs', logId), {
      sessionClosedAt: new Date(),
      sessionClosedThrough: closedThrough,
      sessionLastSeenAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error closing login log:', error);
  }
};

export const getEmployeeLoginLogs = async (employeeId: string) => {
  try {
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }

    const sessionData = await validateAdminSession(sessionId);
    if (!sessionData) {
      throw new Error('Admin session expired. Please log in again.');
    }

    const q = query(collection(db, 'login_logs'), where('userId', '==', employeeId));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    const employeeLogs = logs
      .filter((l) => l.userType === 'employee')
      .sort((a, b) => {
        const aTime = a?.sessionOpenedAt?.toDate
          ? a.sessionOpenedAt.toDate().getTime()
          : new Date(a?.sessionOpenedAt || 0).getTime();
        const bTime = b?.sessionOpenedAt?.toDate
          ? b.sessionOpenedAt.toDate().getTime()
          : new Date(b?.sessionOpenedAt || 0).getTime();
        return bTime - aTime;
      });

    // Best-effort: mark stale "open" sessions as closed via tab/browser close.
    // This is needed because browsers often kill async Firestore writes on tab close.
    const STALE_MS = 90 * 1000;
    const now = Date.now();
    const closedAt = new Date();
    const staleToClose = employeeLogs.filter((l) => {
      if (l?.sessionClosedAt) return false;
      const lastSeen = l?.sessionLastSeenAt?.toDate
        ? l.sessionLastSeenAt.toDate()
        : l?.sessionLastSeenAt
          ? new Date(l.sessionLastSeenAt)
          : l?.updatedAt?.toDate
            ? l.updatedAt.toDate()
            : l?.updatedAt
              ? new Date(l.updatedAt)
              : l?.sessionOpenedAt?.toDate
                ? l.sessionOpenedAt.toDate()
                : new Date(l?.sessionOpenedAt || 0);
      return now - lastSeen.getTime() > STALE_MS;
    });

    if (staleToClose.length > 0) {
      // Update Firestore + also update local objects so UI shows reason immediately.
      await Promise.allSettled(
        staleToClose.map((l) => closeLoginLog(String(l.id || ''), 'browser_tab_close'))
      );
      staleToClose.forEach((l) => {
        l.sessionClosedAt = closedAt;
        l.sessionClosedThrough = 'browser_tab_close';
        l.sessionLastSeenAt = closedAt;
        l.updatedAt = closedAt;
      });
    }

    // Return logs (with any best-effort local updates applied)
    return employeeLogs.sort((a, b) => {
      const aTime = a?.sessionOpenedAt?.toDate
        ? a.sessionOpenedAt.toDate().getTime()
        : new Date(a?.sessionOpenedAt || 0).getTime();
      const bTime = b?.sessionOpenedAt?.toDate
        ? b.sessionOpenedAt.toDate().getTime()
        : new Date(b?.sessionOpenedAt || 0).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error fetching employee login logs:', error);
    throw error;
  }
};

// Employee CRUD operations
export const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
  try {
    
    // Handle employee ID - make it nullable if not provided
    let finalEmployeeId = employeeData.employeeId;

    const candidateEmployeeId =
      typeof finalEmployeeId === 'string'
        ? finalEmployeeId.trim()
        : (finalEmployeeId as any)?.toString?.().trim?.() || '';

    if (candidateEmployeeId) {
      // Validate manual employee ID if provided
      const exists = await checkEmployeeIdExists(candidateEmployeeId);
      if (exists) {
        throw new Error('Employee ID already exists. Please use a different ID.');
      }
      finalEmployeeId = candidateEmployeeId;
    } else {
      // Auto-generate employeeId when not provided
      finalEmployeeId = await getNextEmployeeId();
    }
    
    // Password goes to the server (hashed), never into the employee doc.
    const { password: initialPassword, ...employeeDataWithoutPassword } = employeeData as any;
    const employeeDataWithPassword = {
      ...employeeDataWithoutPassword,
      employeeId: finalEmployeeId,
    };
    
    // Validate education entries if present
    if (employeeDataWithPassword.secondaryEducation) {
      validateEducationEntries(employeeDataWithPassword.secondaryEducation);
    }
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(employeeDataWithPassword);
    
    const docRef = await addDoc(collection(db, 'employees'), sanitizedData);
    await setUserPassword(docRef.id, initialPassword || '1234');
    
    
    return { id: docRef.id, ...employeeDataWithPassword };
  } catch (error: any) {
    
    if (error.code === 'permission-denied') {
    }
    
    console.error('Error adding employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    
    // Get audit fields using the hook
    const { getAuditFields } = useAuditTrail();
    const auditFields = getAuditFields();
    
    // Validate education entries if present
    if (employeeData.secondaryEducation) {
      validateEducationEntries(employeeData.secondaryEducation);
    }
    
    // Password goes to the server (hashed); blank means "keep the current one".
    const { password: newPassword, ...employeeDataWithoutPassword } = employeeData as any;
    const updateDataWithAudit = {
      ...employeeDataWithoutPassword,
      ...auditFields,
    };
    if (newPassword) await setUserPassword(id, newPassword);
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, sanitizedData);
    
    return { id, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    const [employmentsSnap, salariesSnap] = await Promise.all([
      getDocs(query(collection(db, 'employments'), where('employeeId', '==', id))),
      getDocs(query(collection(db, 'salaries'), where('employeeId', '==', id))),
    ]);

    const refsToDelete = [
      ...employmentsSnap.docs.map((d) => doc(db, 'employments', d.id)),
      ...salariesSnap.docs.map((d) => doc(db, 'salaries', d.id)),
      doc(db, 'employees', id),
    ];

    const BATCH_LIMIT = 500;
    for (let i = 0; i < refsToDelete.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      for (const ref of refsToDelete.slice(i, i + BATCH_LIMIT)) {
        batch.delete(ref);
      }
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const getEmployees = async () => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Employee;
      employees.push({
        ...data,
        id: doc.id,
        name: toTitleCase(data.name),
      } as Employee);
    });
    
    return employees;
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

// Update getEmployee function to include admin session validation
export const getEmployee = async (id: string) => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Employee;
      
      // MIGRATION: Convert old structure to new
      if (!data.secondaryEducation && (data.twelthStandard || data.diploma)) {
        const migratedEducation: SecondaryEducationEntry[] = [];
        
        if (data.twelthStandard) {
          migratedEducation.push({
            id: crypto.randomUUID(),
            type: '12th',
            twelthData: data.twelthStandard,
          });
        }
        
        if (data.diploma) {
          migratedEducation.push({
            id: crypto.randomUUID(),
            type: 'diploma',
            diplomaData: data.diploma,
          });
        }
        
        data.secondaryEducation = migratedEducation;
      }
      
      return { ...data, id: docSnap.id, name: toTitleCase((data as any).name) } as Employee;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

// Employment CRUD operations
export const addEmployment = async (employmentData: Omit<Employment, 'id'>) => {
  try {
    const sanitizedData = sanitizeForFirestore(employmentData);
    const docRef = await addDoc(collection(db, 'employments'), sanitizedData);
    return { id: docRef.id, ...sanitizedData };
  } catch (error) {
    console.error('Error adding employment:', error);
    throw error;
  }
};

export const updateEmployment = async (id: string, employmentData: Partial<Employment>) => {
  try {
    
    // Get audit fields using the hook
    const { getAuditFields } = useAuditTrail();
    const auditFields = getAuditFields();
    
    // Add audit fields to update data
    const updateDataWithAudit = {
      ...employmentData,
      ...auditFields,
    };
    
    
    // Sanitize data before sending to Firestore (remove undefined values)
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    
    const employmentRef = doc(db, 'employments', id);
    await updateDoc(employmentRef, sanitizedData);
    
    return { id, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employment:', error);
    throw error;
  }
};

export const deleteEmployment = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'employments', id));
    return true;
  } catch (error) {
    console.error('Error deleting employment:', error);
    throw error;
  }
};

export const getEmployments = async () => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const querySnapshot = await getDocs(collection(db, 'employments'));
    const employments: Employment[] = [];
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    
    return employments;
  } catch (error) {
    console.error('Error getting employments:', error);
    throw error;
  }
};

// Check if employment ID is unique (excluding current employment for updates)
export const checkEmploymentIdUnique = async (employmentId: string, excludeId?: string) => {
  try {

    // Check for custom admin session OR employee session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeDataStorage = localStorage.getItem('employeeData');

    const hasAdminSession = !!sessionId && !!adminData;
    const hasEmployeeSession = !!employeeSessionId && !!employeeDataStorage;

    if (!hasAdminSession && !hasEmployeeSession) {
      throw new Error('No valid session found. Please log in first.');
    }

    // Query for employments with the same employmentId
    const q = query(collection(db, 'employments'), where('employmentId', '==', employmentId));
    const querySnapshot = await getDocs(q);

    let isUnique = true;
    let existingEmployment = null;

    querySnapshot.forEach((doc) => {
      // If excludeId is provided, skip the current employment being edited
      if (excludeId && doc.id === excludeId) {
        return;
      }

      // Allow historical employments to share the same employmentId.
      // Treat it as conflict only when the other record is still active.
      const docData = doc.data() as any;
      const isEnded =
        !!docData?.endDate ||
        docData?.isResignation === true ||
        docData?.is_resigned === true ||
        docData?.employmentStatus === 'resigned' ||
        !!docData?.resignedDate ||
        !!docData?.lastWorkingDay ||
        !!docData?.lastWorkingDate;

      if (!isEnded) {
        isUnique = false;
        // Return only minimal fields to avoid leaking full data to employee clients
        existingEmployment = {
          id: doc.id,
          employeeId: docData?.employeeId,
          // Help debug why this record is treated as "active"
          endDate: docData?.endDate ?? null,
          isResignation: docData?.isResignation ?? null,
          is_resigned: docData?.is_resigned ?? null,
          employmentStatus: docData?.employmentStatus ?? null,
        } as any;
      }
    });

    if (!isUnique) {
    }

    return { isUnique, existingEmployment };
  } catch (error) {
    console.error('Error checking employment ID uniqueness:', error);
    throw error;
  }
};

export const getEmployment = async (id: string) => {
  try {
    
    // Check for custom admin session OR employee session (self only)
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeDataStorage = localStorage.getItem('employeeData');

    const hasAdminSession = !!adminSessionId && !!adminData;
    const hasEmployeeSession = !!employeeSessionId && !!employeeDataStorage;

    if (!hasAdminSession && !hasEmployeeSession) {
      throw new Error('No admin session found. Please log in as admin first.');
    }

    const currentEmployee = hasEmployeeSession ? JSON.parse(employeeDataStorage as string) : null;
    
    const docRef = doc(db, 'employments', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const employment = { id: docSnap.id, ...docSnap.data() } as Employment;

      // Employee can only view their own employment
      if (currentEmployee && employment.employeeId !== currentEmployee.id) {
        throw new Error('Access denied. You can only view your own employment.');
      }

      return employment;
    } else {
      throw new Error('Employment not found');
    }
  } catch (error) {
    console.error('Error getting employment:', error);
    throw error;
  }
};

// Function for employee to access their own salary slips (self only)
export const getEmployeeSelfSalariesByEmployee = async (employeeId: string) => {
  try {
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');

    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }

    const currentEmployee = JSON.parse(employeeData);

    // Security check: Employee can only access their own data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only view your own data.');
    }

    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const salaryRecords: any[] = [];

    querySnapshot.forEach((doc) => {
      salaryRecords.push({ id: doc.id, ...doc.data() });
    });

    return salaryRecords;
  } catch (error) {
    console.error('Error getting employee self salary slips:', error);
    throw error;
  }
};

export const getEmploymentsByEmployee = async (employeeId: string) => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const employments: Employment[] = [];
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    employments.sort((a: any, b: any) => {
      const ad = new Date(a.startDate || a.joiningDate || 0).getTime();
      const bd = new Date(b.startDate || b.joiningDate || 0).getTime();
      return bd - ad;
    });
    
    return employments;
  } catch (error) {
    console.error('Error getting employments by employee:', error);
    throw error;
  }
}; 

// Employee-safe: fetch employments for self only
export const getEmploymentsByEmployeeSelf = async (employeeId: string) => {
  try {
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    const currentEmployee = JSON.parse(employeeData);
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only view your own data.');
    }

    const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const employments: Employment[] = [];
    querySnapshot.forEach((d) => {
      employments.push({ id: d.id, ...d.data() } as Employment);
    });
    employments.sort((a: any, b: any) => {
      const ad = new Date(a.startDate || a.joiningDate || 0).getTime();
      const bd = new Date(b.startDate || b.joiningDate || 0).getTime();
      return bd - ad;
    });
    return employments;
  } catch (error) {
    console.error('Error getting employments by employee (self):', error);
    throw error;
  }
};

const toDateMsSafe = (value: any): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const ensureEmployeeNotExitedForWrite = async (employeeId: string) => {
  if (!employeeId) return;
  const snap = await getDocs(query(collection(db, 'employments'), where('employeeId', '==', employeeId)));
  if (snap.empty) return;
  const rows = snap.docs.map((d) => d.data() as any);
  rows.sort((a, b) => {
    const aMs = toDateMsSafe(a?.updatedAt) || toDateMsSafe(a?.startDate || a?.joiningDate);
    const bMs = toDateMsSafe(b?.updatedAt) || toDateMsSafe(b?.startDate || b?.joiningDate);
    return bMs - aMs;
  });
  const latest = rows[0] || {};
  const status = String(latest?.employeeStatus || '').trim().toLowerCase();
  if (status === 'exited') {
    throw new Error('Your account is in Exited status. Add/Update/Delete actions are disabled.');
  }
};

/**
 * Get admin data from localStorage for audit purposes
 * @returns Admin data object or throws error if not found
 */
export const getAdminDataForAudit = () => {
  const adminSessionId = localStorage.getItem('adminSessionId');
  const adminData = localStorage.getItem('adminData');
  
  if (!adminSessionId || !adminData) {
    throw new Error('No admin session found. Please log in as admin first.');
  }
  
  const admin = JSON.parse(adminData);
  return {
    adminId: admin.id,
    adminName: admin.name,
    currentTimestamp: new Date().toISOString()
  };
};

/**
 * Get employee data from localStorage for audit purposes
 * @returns Employee data object or throws error if not found
 */
export const getEmployeeDataForAudit = () => {
  const employeeSessionId = localStorage.getItem('employeeSessionId');
  const employeeData = localStorage.getItem('employeeData');

  if (!employeeSessionId || !employeeData) {
    throw new Error('No employee session found. Please log in as employee first.');
  }

  const employee = JSON.parse(employeeData);
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    currentTimestamp: new Date().toISOString(),
  };
};

/**
 * Get admin name by admin ID
 * @param adminId - The admin ID to look up
 * @returns Admin name or 'Unknown Admin' if not found
 */
export const getAdminNameById = async (adminId: string): Promise<string> => {
  try {
    if (!adminId) return 'Unknown Admin';
    if (!(await isAdminSession())) {
      const { name } = await apiPost('/api/lookup', { kind: 'name', collection: 'admins', value: adminId });
      return name || 'Unknown Admin';
    }
    
    const adminDoc = await getDoc(doc(db, 'admins', adminId));
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return adminData.name || 'Unknown Admin';
    }
    
    return 'Unknown Admin';
  } catch (error) {
    console.error('Error getting admin name by ID:', error);
    return 'Unknown Admin';
  }
};

/**
 * Get employee name by employee ID
 * @param employeeId - The employee ID to look up
 * @returns Employee name or 'Unknown Employee' if not found
 */
export const getEmployeeNameById = async (employeeId: string): Promise<string> => {
  try {
    if (!employeeId) return 'Unknown Employee';
    if (!(await isAdminSession())) {
      const { name } = await apiPost('/api/lookup', { kind: 'name', collection: 'employees', value: employeeId });
      return name || 'Unknown Employee';
    }
    
    const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
    
    if (employeeDoc.exists()) {
      const employeeData = employeeDoc.data();
      return toTitleCase(employeeData.name) || 'Unknown Employee';
    }
    
    return 'Unknown Employee';
  } catch (error) {
    console.error('Error getting employee name by ID:', error);
    return 'Unknown Employee';
  }
};

// Salary CRUD functions
export const addSalary = async (salaryData: Omit<Salary, 'id'>) => {
  try {
    const adminData = getAdminDataForAudit();
    
    // Validate that employeeId is provided
    if (!salaryData.employeeId) {
      throw new Error('Employee ID is required to create a salary record');
    }
    
    // Verify employee exists
    const employeeDoc = await getDoc(doc(db, 'employees', salaryData.employeeId));
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found. Please select a valid employee.');
    }
    
    const salaryWithAudit = {
      ...salaryData,
      createdAt: new Date().toISOString(),
      createdBy: adminData.adminId,
      updatedAt: new Date().toISOString(),
      updatedBy: adminData.adminId,
    };
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(salaryWithAudit);
    
    const docRef = await addDoc(collection(db, 'salaries'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding salary:', error);
    throw error;
  }
};

// Employee-safe: employee can create salary for self only (no admin session)
export const addSalaryEmployeeSelf = async (salaryData: Omit<Salary, 'id'>) => {
  try {
    const employeeAudit = getEmployeeDataForAudit();

    if (!salaryData.employeeId) {
      throw new Error('Employee ID is required to create a salary record');
    }
    if (salaryData.employeeId !== employeeAudit.employeeId) {
      throw new Error('Access denied. You can only create salary for yourself.');
    }
    await ensureEmployeeNotExitedForWrite(employeeAudit.employeeId);

    const employeeDoc = await getDoc(doc(db, 'employees', salaryData.employeeId));
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found. Please contact HR/Admin.');
    }

    const salaryWithAudit = {
      ...salaryData,
      createdAt: new Date().toISOString(),
      createdBy: employeeAudit.employeeId,
      createdByType: 'employee',
      updatedAt: new Date().toISOString(),
      updatedBy: employeeAudit.employeeId,
      updatedByType: 'employee',
    } as any;

    const sanitizedData = sanitizeForFirestore(salaryWithAudit);
    const docRef = await addDoc(collection(db, 'salaries'), sanitizedData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding salary (self):', error);
    throw error;
  }
};

export const updateSalary = async (id: string, salaryData: Partial<Salary>) => {
  try {
    const adminData = getAdminDataForAudit();
    
    // If employeeId is being updated, validate the employee exists
    if (salaryData.employeeId) {
      const employeeDoc = await getDoc(doc(db, 'employees', salaryData.employeeId));
      if (!employeeDoc.exists()) {
        throw new Error('Employee not found. Please select a valid employee.');
      }
    }
    
    const salaryWithAudit = {
      ...salaryData,
      updatedAt: new Date().toISOString(),
      updatedBy: adminData.adminId,
    };
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(salaryWithAudit);
    
    const salaryRef = doc(db, 'salaries', id);
    await updateDoc(salaryRef, sanitizedData);
  } catch (error) {
    console.error('Error updating salary:', error);
    throw error;
  }
};

// Employee-safe salary detail fetch (self only)
export const getSalaryEmployeeSelf = async (id: string) => {
  try {
    const employeeAudit = getEmployeeDataForAudit();
    const salaryDoc = await getDoc(doc(db, 'salaries', id));

    if (!salaryDoc.exists()) {
      throw new Error('Salary not found');
    }

    const salaryData = salaryDoc.data() as Salary;
    if (salaryData.employeeId !== employeeAudit.employeeId) {
      throw new Error('Access denied. You can only view your own salary record.');
    }

    return { id: salaryDoc.id, ...salaryData } as Salary;
  } catch (error) {
    console.error('Error getting salary (self):', error);
    throw error;
  }
};

// Employee-safe salary update (self only)
export const updateSalaryEmployeeSelf = async (id: string, salaryData: Partial<Salary>) => {
  try {
    const employeeAudit = getEmployeeDataForAudit();
    await ensureEmployeeNotExitedForWrite(employeeAudit.employeeId);
    const salaryRef = doc(db, 'salaries', id);
    const salaryDoc = await getDoc(salaryRef);

    if (!salaryDoc.exists()) {
      throw new Error('Salary not found');
    }

    const existingSalary = salaryDoc.data() as Salary;
    if (existingSalary.employeeId !== employeeAudit.employeeId) {
      throw new Error('Access denied. You can only update your own salary record.');
    }

    if (
      salaryData.employeeId &&
      String(salaryData.employeeId).trim() !== String(employeeAudit.employeeId).trim()
    ) {
      throw new Error('Access denied. You can only update your own salary record.');
    }

    const salaryWithAudit = {
      ...salaryData,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeAudit.employeeId,
      updatedByType: 'employee',
    } as any;

    const sanitizedData = sanitizeForFirestore(salaryWithAudit);
    await updateDoc(salaryRef, sanitizedData);
  } catch (error) {
    console.error('Error updating salary (self):', error);
    throw error;
  }
};

export const deleteSalary = async (id: string) => {
  try {
    // Get salary data before deletion for logging
    const salaryDoc = await getDoc(doc(db, 'salaries', id));
    if (salaryDoc.exists()) {
    }
    
    await deleteDoc(doc(db, 'salaries', id));
  } catch (error) {
    console.error('Error deleting salary:', error);
    throw error;
  }
};

export const getSalaries = async () => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const querySnapshot = await getDocs(collection(db, 'salaries'));
    const salaries: Salary[] = [];
    querySnapshot.forEach((doc) => {
      salaries.push({ id: doc.id, ...doc.data() } as Salary);
    });
    
    const sortedSalaries = salaries.sort((a, b) => {
      // Sort by year descending, then by month descending
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    return sortedSalaries;
  } catch (error) {
    console.error('Error getting salaries:', error);
    throw error;
  }
};

export const getSalary = async (id: string) => {
  try {
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    
    if (!sessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    
    const salaryDoc = await getDoc(doc(db, 'salaries', id));
    
    if (salaryDoc.exists()) {
      return { id: salaryDoc.id, ...salaryDoc.data() } as Salary;
    }
    
    throw new Error('Salary not found');
  } catch (error) {
    console.error('Error getting salary:', error);
    throw error;
  }
};

export const getSalariesByEmployee = async (employeeId: string) => {
  try {
    
    // Check for admin session (since this is called from admin dashboard)
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminSessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    const currentAdmin = JSON.parse(adminData);
    
    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const salaryRecords: any[] = [];
    
    querySnapshot.forEach((doc) => {
      salaryRecords.push({ id: doc.id, ...doc.data() });
    });
    
    return salaryRecords;
  } catch (error) {
    console.error('Error getting employee salary slips:', error);
    throw error;
  }
};

// Function for employee to access their own data
export const getEmployeeSelf = async (employeeId: string) => {
  try {
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only access their own data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only view your own data.');
    }
    
    
    const docRef = doc(db, 'employees', employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Employee;
      return { id: docSnap.id, ...data, name: toTitleCase((data as any).name) } as Employee;
    } else {
      throw new Error('Employee not found');
    }
  } catch (error) {
    console.error('Error getting employee self data:', error);
    throw error;
  }
};

/**
 * Update employee's own profile data (for employee self-service)
 * @param employeeId - The employee ID (must match logged-in employee)
 * @param employeeData - Partial employee data to update
 * @returns Updated employee data
 */
export const updateEmployeeSelf = async (employeeId: string, employeeData: Partial<Employee>) => {
  try {
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeDataStorage = localStorage.getItem('employeeData');
    
    
    if (!employeeSessionId || !employeeDataStorage) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeDataStorage);
    
    // Security check: Employee can only update their own data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only update your own data.');
    }
    await ensureEmployeeNotExitedForWrite(employeeId);
    
    
    // Password and phone (login ID) are admin-only: drop them from a self edit.
    const { password: _password, phone: _phone, ...employeeDataWithoutPassword } = employeeData as any;
    const updateDataWithAudit = {
      ...employeeDataWithoutPassword,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId, // Employee updating their own profile
    };
    
    // Don't allow employees to update sensitive fields
    delete (updateDataWithAudit as any).status;
    delete (updateDataWithAudit as any).is_resigned;
    delete (updateDataWithAudit as any).employmentStatus;
    delete (updateDataWithAudit as any).resignedDate;
    delete (updateDataWithAudit as any).lastWorkingDay;
    
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, sanitizedData);
    
    return { id: employeeId, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employee self:', error);
    throw error;
  }
};

// Function for employee to access their own employment data
export const getEmployeeSelfEmployment = async (employeeId: string) => {
  try {
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only access their own data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only view your own data.');
    }
    
    
    const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const employments: Employment[] = [];
    
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    employments.sort((a: any, b: any) => {
      const ad = new Date(a.startDate || a.joiningDate || 0).getTime();
      const bd = new Date(b.startDate || b.joiningDate || 0).getTime();
      return bd - ad;
    });
    
    return employments;
  } catch (error) {
    console.error('Error getting employee self employment data:', error);
    throw error;
  }
};

/**
 * Update employee's own employment data (for employee self-service)
 * Only allows updating a safe subset of fields.
 */
export const updateEmployeeSelfEmployment = async (
  employeeId: string,
  employmentId: string,
  employmentData: Partial<Employment>
) => {
  try {

    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeDataStorage = localStorage.getItem('employeeData');

    if (!employeeSessionId || !employeeDataStorage) {
      throw new Error('No employee session found. Please log in as employee first.');
    }

    const currentEmployee = JSON.parse(employeeDataStorage);

    // Security check: Employee can only update their own data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only update your own data.');
    }
    await ensureEmployeeNotExitedForWrite(employeeId);

    if (!employmentId) {
      throw new Error('Employment id is required.');
    }

    // Load employment doc and validate ownership
    const employmentRef = doc(db, 'employments', employmentId);
    const employmentSnap = await getDoc(employmentRef);
    if (!employmentSnap.exists()) {
      throw new Error('Employment record not found.');
    }

    const existing = employmentSnap.data() as any;
    if (existing.employeeId !== employeeId) {
      throw new Error('Access denied. You can only update your own employment.');
    }

    // Allow-list fields employees can update themselves
    const allowedKeys: string[] = [
      // Employment identifiers/info
      'employmentId',
      'joiningDate',
      'startDate',
      'endDate',
      'contractType',
      'joiningCtc',
      'inHandCtc',
      'relievingCtc',
      'joiningFixedPay',
      'joiningVariablePay',
      'currentFixedPay',
      'currentVariablePay',
      'joiningOtherAllowance',
      'currentOtherAllowance',
      'employerPF',
      'benefits',
      'paymentFrequency',
      // Professional References (employee self-edit)
      'professionalReferences',
      // Salary details
      'salary',
      'salaryPerMonth',
      'basic',
      'da',
      'hra',
      'pf',
      'medicalAllowance',
      'transport',
      'gratuity',
      'additionalAllowance',
      'specialAllowance',
      // Optional leave/pay fields (currently hidden in UI, but keep editable if present)
      'totalLeaves',
      'payableDays',
      'salaryCreditDate',
      'paymentMode',
      'bankName',
      'accountNo',
      'ifscCode',
      'accountHolderName',
      'panNumber',
      'reportingManager',
      'location',
      'workSchedule',
      'probationPeriod',
      'noticePeriod',
      // Dates (employee self-edit)
      'joiningDate',
      'startDate',
      'endDate',
      // Job details (non-salary)
      'jobTitle',
      'designation',
      'department',
      'reportingAuthority',
      'whereWereYouEmploid',
      'whereWereYouEmployed',
      'whereWereYouEmployd',
      // Increment fields
      'increments',
      'incrementDate',
      'newSalary',
      'incrementedCtc',
      'incrementedInHandCtc',
      // Resignation details
      'isResignation',
      'employeeStatus',
      'resignationDate',
      'lastWorkingDate',
      'lastDrawnSalary',
      'reasonForLeaving',
      'exitInterviewDate',
      'lastSalaryDate',
    ];

    const filtered: Record<string, any> = {};
    for (const key of allowedKeys) {
      if ((employmentData as any)[key] !== undefined) {
        filtered[key] = (employmentData as any)[key];
      }
    }

    const updateDataWithAudit: Partial<Employment> & { updatedAt: string; updatedBy: string } = {
      ...filtered,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId,
    };

    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    await updateDoc(employmentRef, sanitizedData);

    return { id: employmentId, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employee self employment:', error);
    throw error;
  }
};

// Common authentication function that checks both admin and employee
/** Who (if anyone) owns this phone number: `{ id, userType }` or null. Server-side lookup. */
export const checkUserByPhone = async (
  phoneNumber: string
): Promise<{ id: string; userType: 'admin' | 'employee' } | null> => {
  const { user } = await apiPost('/api/lookup', { kind: 'phone', value: phoneNumber });
  return user || null;
}; 

// Employee-specific salary fetching function
export const getEmployeeSalaries = async (employeeId: string) => {
  try {
    
    // Check for admin session first - ADMIN HAS FULL ACCESS
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    // Check for employee session as fallback - EMPLOYEE RESTRICTED TO OWN DATA
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    let isAdmin = false;
    let isEmployee = false;
    
    // Validate admin session - ADMIN CAN ACCESS ANY EMPLOYEE DATA
    if (adminSessionId && adminData) {
      try {
        const admin = JSON.parse(adminData);
        if (admin && admin.id) {
          isAdmin = true;
        }
      } catch (error) {
      }
    }
    
    // Validate employee session - EMPLOYEE CAN ONLY ACCESS OWN DATA
    if (!isAdmin && employeeSessionId && employeeData) {
      try {
        const employee = JSON.parse(employeeData);
        if (employee && employee.id) {
          // Employee can only access their own salary data
          if (employee.id === employeeId) {
            isEmployee = true;
          } else {
            throw new Error('Access denied. You can only view your own salary data.');
          }
        }
      } catch (error) {
      }
    }
    
    // If neither session is valid, throw error
    if (!isAdmin && !isEmployee) {
      throw new Error('No valid session found. Please log in as admin or employee first.');
    }
    
    
    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    
    const querySnapshot = await getDocs(q);
    
    const salaries: any[] = [];
    querySnapshot.forEach((doc) => {
      const salary = { id: doc.id, ...doc.data() } as any;
      salaries.push(salary);
    });
    
    return salaries;
  } catch (error) {
    console.error('Error getting employee salary data:', error);
    throw error;
  }
};

// PAN Card validation and uniqueness check functions
export const validatePANFormat = (pan: string): boolean => {
  // PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const checkPANExistsAnywhere = async (pan: string): Promise<boolean> => {
  try {
    // Server-side: the browser can't scan other people's records.
    const { exists } = await apiPost('/api/lookup', { kind: 'pan', value: pan });
    return Boolean(exists);
  } catch (error) {
    console.error('Error checking PAN existence:', error);
    throw error;
  }
};

// Check for existing salary entries to prevent duplicates
export const checkExistingSalary = async (employeeId: string, month: number, year: number, excludeId?: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'salaries'),
      where('employeeId', '==', employeeId),
      where('month', '==', month),
      where('year', '==', year)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (excludeId) {
      // For edit: exclude current salary from duplicate check
      return querySnapshot.docs.some(doc => doc.id !== excludeId);
    } else {
      // For add: any existing entry is a duplicate
      return !querySnapshot.empty;
    }
  } catch (error) {
    console.error('Error checking existing salary:', error);
    throw error;
  }
}; 