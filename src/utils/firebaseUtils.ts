import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, runTransaction, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Employee, Employment, Salary, SecondaryEducationEntry } from '../types';

/**
 * Sanitizes data for Firestore by removing undefined values
 * @param {any} data - The data to sanitize
 * @returns {any} - Sanitized data safe for Firestore
 */
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

// Admin authentication functions
export const checkAdminByPhone = async (phoneNumber: string) => {
  try {
    // Remove +91 prefix if present and clean the phone number
    const cleanPhone = phoneNumber.replace(/^\+91/, '');
    
    const q = query(collection(db, 'admins'), where('mobile', '==', cleanPhone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      return { 
        id: adminDoc.id, 
        name: adminData.name || '',
        email: adminData.email || '',
        mobile: adminData.mobile || '',
        pass: adminData.password || '', // Changed from 'pass' to 'password'
        active: adminData.active || false,
        createdAt: adminData.createdAt,
        isAdmin: true,
        userType: 'admin' as const
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking admin by phone:', error);
    throw error;
  }
};

export const checkAdminByEmail = async (email: string) => {
  try {
    const q = query(collection(db, 'admins'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0];
      return { 
        id: adminDoc.id, 
        ...adminDoc.data(),
        isAdmin: true 
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking admin by email:', error);
    throw error;
  }
};

// Custom session management for Mobile + Password authentication
export const createAdminSession = async (adminId: string, adminData: any) => {
  try {
    console.log('🔐 Creating custom admin session...');
    
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
    console.log('✅ Admin session created:', sessionRef.id);
    
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

// Employee CRUD operations
export const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
  try {
    console.log('🚀 Starting employee creation process...');
    
    // Handle employee ID - make it nullable if not provided
    let finalEmployeeId = employeeData.employeeId;

    if (finalEmployeeId && finalEmployeeId.trim() !== '') {
      // Validate manual employee ID if provided
      const exists = await checkEmployeeIdExists(finalEmployeeId);
      if (exists) {
        throw new Error('Employee ID already exists. Please use a different ID.');
      }
      console.log('✅ Manual Employee ID validated:', finalEmployeeId);
    } else {
      // Set to undefined if not provided (skip auto-generation)
      finalEmployeeId = undefined;
      console.log('ℹ️ Employee ID set to undefined (no auto-generation)');
    }
    
    // Ensure password field is always present
    const employeeDataWithPassword = {
      ...employeeData,
      employeeId: finalEmployeeId,
      password: employeeData.password || '1234', // Default password if not provided
    };
    
    console.log('📋 Employee data to save:', employeeDataWithPassword);
    
    // Validate education entries if present
    if (employeeDataWithPassword.secondaryEducation) {
      validateEducationEntries(employeeDataWithPassword.secondaryEducation);
    }
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('🔐 === FIRESTORE WRITE ATTEMPT ===');
    console.log('📁 Collection: employees');
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(employeeDataWithPassword);
    console.log('🧹 Sanitized data (removed undefined values)');
    console.log('📄 Document data:', JSON.stringify(sanitizedData, null, 2));
    
    const docRef = await addDoc(collection(db, 'employees'), sanitizedData);
    
    console.log('✅ === SUCCESS ===');
    console.log('🆔 New Employee ID:', docRef.id);
    console.log('📁 Document created in Firestore successfully!');
    
    return { id: docRef.id, ...employeeDataWithPassword };
  } catch (error: any) {
    console.log('❌ === ERROR ===');
    console.log('🚨 Error type:', error.constructor.name);
    console.log('📝 Error message:', error.message);
    console.log('🔍 Error code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('🔒 PERMISSION DENIED - This means:');
      console.log('   1. Custom admin session is invalid or expired');
      console.log('   2. Firestore rules are blocking the operation');
      console.log('   3. Check if admin is properly logged in with Mobile + Password');
    }
    
    console.error('Error adding employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    console.log('🔄 Starting employee update process...');
    
    // Get audit fields using the hook
    const { getAuditFields } = useAuditTrail();
    const auditFields = getAuditFields();
    
    // Validate education entries if present
    if (employeeData.secondaryEducation) {
      validateEducationEntries(employeeData.secondaryEducation);
    }
    
    // Ensure password field is preserved if not being updated
    const updateDataWithAudit = {
      ...employeeData,
      ...auditFields,
    };
    
    // If password is not being updated, ensure it's not removed
    if (!employeeData.password) {
      // Get current employee data to preserve existing password
      const currentEmployee = await getEmployee(id);
      if (currentEmployee && currentEmployee.password) {
        updateDataWithAudit.password = currentEmployee.password;
      } else {
        // Set default password if none exists
        updateDataWithAudit.password = '1234';
      }
    }
    
    console.log('📋 Employee update data with audit:', updateDataWithAudit);
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    console.log('🧹 Sanitized data for update (removed undefined values)');
    
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, sanitizedData);
    
    console.log('✅ Employee updated successfully with audit trail');
    return { id, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'employees', id));
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const getEmployees = async () => {
  try {
    console.log('🔍 Fetching employees with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching from collection: employees');
    
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() } as Employee);
    });
    
    console.log('✅ Successfully fetched employees:', employees.length);
    return employees;
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

// Update getEmployee function to include admin session validation
export const getEmployee = async (id: string) => {
  try {
    console.log('🔍 Fetching employee with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching employee ID:', id);
    
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Employee found successfully');
      const data = docSnap.data() as Employee;
      
      // MIGRATION: Convert old structure to new
      if (!data.secondaryEducation && (data.twelthStandard || data.diploma)) {
        console.log('🔄 Migrating old education structure to new format...');
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
        console.log('✅ Migration completed:', migratedEducation.length, 'entries created');
      }
      
      return { ...data, id: docSnap.id } as Employee;
    } else {
      console.log('❌ Employee not found in database');
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
    const docRef = await addDoc(collection(db, 'employments'), employmentData);
    return { id: docRef.id, ...employmentData };
  } catch (error) {
    console.error('Error adding employment:', error);
    throw error;
  }
};

export const updateEmployment = async (id: string, employmentData: Partial<Employment>) => {
  try {
    console.log('🔄 Starting employment update process...');
    
    // Get audit fields using the hook
    const { getAuditFields } = useAuditTrail();
    const auditFields = getAuditFields();
    
    // Add audit fields to update data
    const updateDataWithAudit = {
      ...employmentData,
      ...auditFields,
    };
    
    console.log('📋 Employment update data with audit:', updateDataWithAudit);
    
    // Sanitize data before sending to Firestore (remove undefined values)
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    console.log('🧹 Sanitized employment update data (removed undefined values)');
    
    const employmentRef = doc(db, 'employments', id);
    await updateDoc(employmentRef, sanitizedData);
    
    console.log('✅ Employment updated successfully with audit trail');
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
    console.log('🔍 Fetching employments with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching from collection: employments');
    
    const querySnapshot = await getDocs(collection(db, 'employments'));
    const employments: Employment[] = [];
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    
    console.log('✅ Successfully fetched employments:', employments.length);
    return employments;
  } catch (error) {
    console.error('Error getting employments:', error);
    throw error;
  }
};

// Check if employment ID is unique (excluding current employment for updates)
export const checkEmploymentIdUnique = async (employmentId: string, excludeId?: string) => {
  try {
    console.log('🔍 Checking employment ID uniqueness:', employmentId, excludeId ? `(excluding ${excludeId})` : '');

    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');

    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      throw new Error('No admin session found. Please log in as admin first.');
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
      isUnique = false;
      existingEmployment = { id: doc.id, ...doc.data() };
    });

    console.log(`✅ Employment ID "${employmentId}" is ${isUnique ? 'unique' : 'not unique'}`);
    if (!isUnique) {
      console.log('📋 Existing employment:', existingEmployment);
    }

    return { isUnique, existingEmployment };
  } catch (error) {
    console.error('Error checking employment ID uniqueness:', error);
    throw error;
  }
};

export const getEmployment = async (id: string) => {
  try {
    console.log('🔍 Fetching employment with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching employment ID:', id);
    
    const docRef = doc(db, 'employments', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Employment found successfully');
      return { id: docSnap.id, ...docSnap.data() } as Employment;
    } else {
      console.log('❌ Employment not found in database');
      throw new Error('Employment not found');
    }
  } catch (error) {
    console.error('Error getting employment:', error);
    throw error;
  }
};

export const getEmploymentsByEmployee = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employments by employee with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching employments for employee ID:', employeeId);
    
    const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const employments: Employment[] = [];
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    
    console.log('✅ Employments fetched successfully:', employments.length, 'records');
    return employments;
  } catch (error) {
    console.error('Error getting employments by employee:', error);
    throw error;
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
 * Get admin name by admin ID
 * @param adminId - The admin ID to look up
 * @returns Admin name or 'Unknown Admin' if not found
 */
export const getAdminNameById = async (adminId: string): Promise<string> => {
  try {
    if (!adminId) return 'Unknown Admin';
    
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
    
    const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
    
    if (employeeDoc.exists()) {
      const employeeData = employeeDoc.data();
      return employeeData.name || 'Unknown Employee';
    }
    
    return 'Unknown Employee';
  } catch (error) {
    console.error('Error getting employee name by ID:', error);
    return 'Unknown Employee';
  }
};

/**
 * Get employment title by employment ID
 * @param employmentId - The employment ID to look up
 * @returns Employment title or 'Unknown Employment' if not found
 */
export const getEmploymentTitleById = async (employmentId: string): Promise<string> => {
  try {
    if (!employmentId) return 'Unknown Employment';
    
    const employmentDoc = await getDoc(doc(db, 'employments', employmentId));
    
    if (employmentDoc.exists()) {
      const employmentData = employmentDoc.data();
      return employmentData.jobTitle || employmentData.contractType || 'Unknown Employment';
    }
    
    return 'Unknown Employment';
  } catch (error) {
    console.error('Error getting employment title by ID:', error);
    return 'Unknown Employment';
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
    console.log('🧹 Sanitized salary data (removed undefined values)');
    
    const docRef = await addDoc(collection(db, 'salaries'), sanitizedData);
    console.log('✅ Salary added successfully for employee:', salaryData.employeeId, 'Salary ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding salary:', error);
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
    console.log('🧹 Sanitized salary update data (removed undefined values)');
    
    const salaryRef = doc(db, 'salaries', id);
    await updateDoc(salaryRef, sanitizedData);
    console.log('✅ Salary updated successfully:', id);
  } catch (error) {
    console.error('Error updating salary:', error);
    throw error;
  }
};

export const deleteSalary = async (id: string) => {
  try {
    // Get salary data before deletion for logging
    const salaryDoc = await getDoc(doc(db, 'salaries', id));
    if (salaryDoc.exists()) {
      const salaryData = salaryDoc.data() as Salary;
      console.log('🗑️ Deleting salary for employee:', salaryData.employeeId, 'Salary ID:', id);
    }
    
    await deleteDoc(doc(db, 'salaries', id));
    console.log('✅ Salary deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting salary:', error);
    throw error;
  }
};

export const getSalaries = async () => {
  try {
    console.log('🔍 Fetching salaries with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching from collection: salaries');
    
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
    
    console.log('✅ Successfully fetched salaries:', sortedSalaries.length);
    return sortedSalaries;
  } catch (error) {
    console.error('Error getting salaries:', error);
    throw error;
  }
};

export const getSalary = async (id: string) => {
  try {
    console.log('🔍 Fetching salary with custom authentication...');
    
    // Check for custom admin session
    const sessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    console.log('🔐 === CUSTOM AUTHENTICATION CHECK ===');
    console.log('🔑 Session ID:', sessionId);
    console.log('👤 Admin Data:', adminData ? '✅ Found' : '❌ Not found');
    
    if (!sessionId || !adminData) {
      console.log('❌ CRITICAL: No admin session found!');
      console.log('💡 This means custom authentication failed');
      console.log('🔧 Solution: Make sure admin is logged in with Mobile + Password');
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    console.log('✅ Custom authentication session found');
    console.log('📁 Fetching salary ID:', id);
    
    const salaryDoc = await getDoc(doc(db, 'salaries', id));
    
    if (salaryDoc.exists()) {
      console.log('✅ Salary found successfully');
      return { id: salaryDoc.id, ...salaryDoc.data() } as Salary;
    }
    
    console.log('❌ Salary not found in database');
    throw new Error('Salary not found');
  } catch (error) {
    console.error('Error getting salary:', error);
    throw error;
  }
};

export const getSalariesByEmployee = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching salaries for employee with custom authentication...');
    
    // Check for admin session (since this is called from admin dashboard)
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminSessionId || !adminData) {
      throw new Error('No admin session found. Please log in as admin first.');
    }
    
    const currentAdmin = JSON.parse(adminData);
    console.log('✅ Admin session validated for employee salary slips');
    
    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const salaryRecords: any[] = [];
    
    querySnapshot.forEach((doc) => {
      salaryRecords.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Employee salary slips found:', salaryRecords.length);
    return salaryRecords;
  } catch (error) {
    console.error('Error getting employee salary slips:', error);
    throw error;
  }
}; 

// Employee authentication functions
export const checkEmployeeByPhone = async (phoneNumber: string) => {
  try {
    // Remove +91 prefix if present and clean the phone number
    const cleanPhone = phoneNumber.replace(/^\+91/, '');
    
    const q = query(collection(db, 'employees'), where('phone', '==', cleanPhone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const employeeDoc = querySnapshot.docs[0];
      const employeeData = employeeDoc.data();
      return { 
        id: employeeDoc.id, 
        name: employeeData.name || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        password: employeeData.password || '', // Assuming employees have password field
        status: employeeData.status || 'inactive',
        is_resigned: employeeData.is_resigned || false,
        createdAt: employeeData.createdAt,
        isEmployee: true,
        isAdmin: false,
        userType: 'employee' as const
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking employee by phone:', error);
    throw error;
  }
};

// Function to update employee password
export const updateEmployeePassword = async (employeeId: string, newPassword: string) => {
  try {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, {
      password: newPassword,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Employee password updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating employee password:', error);
    throw error;
  }
};

// Function to add password field to existing employees (for migration)
export const addPasswordToEmployees = async () => {
  try {
    console.log('🔄 Starting password migration for employees...');
    
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const updatePromises: Promise<any>[] = [];
    
    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      
      // If employee doesn't have a password field, add a default one
      if (!employeeData.password) {
        // New pattern: last 5 digits of mobile + @#$$
        const defaultPassword = `${employeeData.phone.slice(-5)}@#$$`;
        updatePromises.push(
          updateDoc(doc.ref, {
            password: defaultPassword,
            updatedAt: new Date().toISOString()
          })
        );
        console.log(`📝 Adding default password to employee: ${employeeData.name} (${defaultPassword})`);
      }
    });
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅ Successfully updated ${updatePromises.length} employees with default passwords`);
    } else {
      console.log('ℹ️ All employees already have passwords');
    }
    
    return updatePromises.length;
  } catch (error) {
    console.error('Error adding passwords to employees:', error);
    throw error;
  }
};

// Function to add resignation fields to existing employees (for migration)
// IMPORTANT: This function is idempotent - safe to run multiple times.
// It only adds default values if fields are completely missing (undefined/null).
// It will NEVER overwrite existing values, so resigned employees stay resigned.
export const migrateEmployeesWithResignationFields = async () => {
  try {
    console.log('🔄 Starting resignation fields migration for employees...');
    
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const updatePromises: Promise<any>[] = [];
    
    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      const updates: any = {};
      let needsUpdate = false;
      
      // Only add is_resigned: false if the field is completely missing (undefined, null, or empty string)
      // This ensures we NEVER overwrite existing values (e.g., if someone is already resigned)
      if (employeeData.is_resigned === undefined || employeeData.is_resigned === null || employeeData.is_resigned === '') {
        updates.is_resigned = false;
        needsUpdate = true;
        console.log(`📝 Adding is_resigned: false to employee: ${employeeData.name || doc.id}`);
      } else {
        console.log(`✓ Employee ${employeeData.name || doc.id} already has is_resigned: ${employeeData.is_resigned} (skipping)`);
      }
      
      // Only add employmentStatus: 'working' if the field is completely missing or invalid
      // Check for undefined, null, empty string, or any value that's not 'working' or 'resigned'
      // IMPORTANT: Only set to 'working' if the field is missing/invalid, NOT if it's already 'resigned'
      const validStatuses = ['working', 'resigned'];
      const currentStatus = employeeData.employmentStatus;
      
      if (
        currentStatus === undefined || 
        currentStatus === null || 
        currentStatus === '' ||
        !validStatuses.includes(currentStatus)
      ) {
        // Only set to 'working' if status is missing/invalid
        // If status is already 'resigned', keep it as 'resigned'
        updates.employmentStatus = 'working';
        needsUpdate = true;
        console.log(`📝 Adding employmentStatus: 'working' to employee: ${employeeData.name || doc.id}`);
      } else {
        console.log(`✓ Employee ${employeeData.name || doc.id} already has employmentStatus: ${currentStatus} (skipping)`);
      }
      
      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString();
        updatePromises.push(updateDoc(doc.ref, updates));
      }
    });
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅ Successfully updated ${updatePromises.length} employees with resignation fields`);
      console.log('ℹ️ Migration is idempotent - safe to run multiple times without overwriting existing values');
    } else {
      console.log('ℹ️ All employees already have resignation fields - no updates needed');
    }
    
    return updatePromises.length;
  } catch (error) {
    console.error('Error adding resignation fields to employees:', error);
    throw error;
  }
};

// Function to remove isActive field from existing employees (for migration)
// IMPORTANT: This function is idempotent - safe to run multiple times.
// It removes the redundant isActive field from all employee documents.
export const removeIsActiveFieldFromEmployees = async () => {
  try {
    console.log('🔄 Starting isActive field removal migration for employees...');
    
    const querySnapshot = await getDocs(collection(db, 'employees'));
    const updatePromises: Promise<any>[] = [];
    
    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      
      // Only update if isActive field exists
      if (employeeData.isActive !== undefined) {
        const updates: any = {
          isActive: deleteField(),
          updatedAt: new Date().toISOString()
        };
        
        updatePromises.push(updateDoc(doc.ref, updates));
        console.log(`📝 Removing isActive field from employee: ${employeeData.name || doc.id}`);
      } else {
        console.log(`✓ Employee ${employeeData.name || doc.id} already has isActive field removed (skipping)`);
      }
    });
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅ Successfully removed isActive field from ${updatePromises.length} employees`);
      console.log('ℹ️ Migration is idempotent - safe to run multiple times');
    } else {
      console.log('ℹ️ All employees already have isActive field removed - no updates needed');
    }
    
    return updatePromises.length;
  } catch (error) {
    console.error('Error removing isActive field from employees:', error);
    throw error;
  }
};

// Function for employee to access their own data
export const getEmployeeSelf = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee self data...');
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    console.log('🔐 === EMPLOYEE SESSION CHECK ===');
    console.log('🔑 Employee Session ID:', employeeSessionId);
    console.log('👤 Employee Data:', employeeData ? '✅ Found' : '❌ Not found');
    
    if (!employeeSessionId || !employeeData) {
      console.log('❌ CRITICAL: No employee session found!');
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only access their own data
    if (currentEmployee.id !== employeeId) {
      console.log('❌ SECURITY: Employee trying to access other employee data!');
      throw new Error('Access denied. You can only view your own data.');
    }
    
    console.log('✅ Employee session validated');
    console.log('📁 Fetching employee ID:', employeeId);
    
    const docRef = doc(db, 'employees', employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Employee self data found successfully');
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    } else {
      console.log('❌ Employee not found in database');
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
    console.log('🔄 Starting employee self-update process...');
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeDataStorage = localStorage.getItem('employeeData');
    
    console.log('🔐 === EMPLOYEE SESSION CHECK ===');
    console.log('🔑 Employee Session ID:', employeeSessionId);
    console.log('👤 Employee Data:', employeeDataStorage ? '✅ Found' : '❌ Not found');
    
    if (!employeeSessionId || !employeeDataStorage) {
      console.log('❌ CRITICAL: No employee session found!');
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeDataStorage);
    
    // Security check: Employee can only update their own data
    if (currentEmployee.id !== employeeId) {
      console.log('❌ SECURITY: Employee trying to update other employee data!');
      throw new Error('Access denied. You can only update your own data.');
    }
    
    console.log('✅ Employee session validated');
    
    // Get current employee data to preserve password if not being updated
    const currentEmployeeData = await getEmployeeSelf(employeeId);
    
    // Prepare update data with employee audit fields (no admin session needed)
    const updateDataWithAudit = {
      ...employeeData,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId, // Employee updating their own profile
    };
    
    // If password is not being updated, preserve existing password
    if (!employeeData.password && currentEmployeeData.password) {
      updateDataWithAudit.password = currentEmployeeData.password;
    }
    
    // Don't allow employees to update sensitive fields
    delete (updateDataWithAudit as any).status;
    delete (updateDataWithAudit as any).is_resigned;
    delete (updateDataWithAudit as any).employmentStatus;
    delete (updateDataWithAudit as any).resignedDate;
    delete (updateDataWithAudit as any).lastWorkingDay;
    
    console.log('📋 Employee self-update data:', updateDataWithAudit);
    
    // Sanitize data before sending to Firestore
    const sanitizedData = sanitizeForFirestore(updateDataWithAudit);
    console.log('🧹 Sanitized data for self-update (removed undefined values)');
    
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, sanitizedData);
    
    console.log('✅ Employee self-update successful');
    return { id: employeeId, ...updateDataWithAudit };
  } catch (error) {
    console.error('Error updating employee self:', error);
    throw error;
  }
};

// Function for employee to access their own employment data
export const getEmployeeSelfEmployment = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee self employment data...');
    
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
    
    console.log('✅ Employee session validated for employment data');
    
    const q = query(collection(db, 'employments'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const employments: Employment[] = [];
    
    querySnapshot.forEach((doc) => {
      employments.push({ id: doc.id, ...doc.data() } as Employment);
    });
    
    console.log('✅ Employee employment data found:', employments.length);
    return employments;
  } catch (error) {
    console.error('Error getting employee self employment data:', error);
    throw error;
  }
};

// Common authentication function that checks both admin and employee
export const checkUserByPhone = async (phoneNumber: string) => {
  try {
    console.log('🔍 Checking user by phone:', phoneNumber);
    
    // First check if it's an admin
    const adminData = await checkAdminByPhone(phoneNumber);
    if (adminData && adminData.active) {
      console.log('✅ Found active admin');
      return { ...adminData, userType: 'admin' as const };
    }
    
    // Then check if it's an employee
    const employeeData = await checkEmployeeByPhone(phoneNumber);
    if (employeeData && employeeData.status === 'active') {
      console.log('✅ Found active employee');
      return { ...employeeData, userType: 'employee' as const };
    }
    
    console.log('❌ No active user found');
    return null;
  } catch (error) {
    console.error('Error checking user by phone:', error);
    throw error;
  }
}; 

// Employee-specific data access functions
export const getEmployeeAttendance = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee attendance data...');
    
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
    
    console.log('✅ Employee session validated for attendance data');
    
    const q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const attendanceRecords: any[] = [];
    
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Employee attendance data found:', attendanceRecords.length);
    return attendanceRecords;
  } catch (error) {
    console.error('Error getting employee attendance data:', error);
    throw error;
  }
};

export const getEmployeeLeaves = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee leave data...');
    
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
          console.log('✅ Admin session validated - FULL ACCESS GRANTED');
        }
      } catch (error) {
        console.log('❌ Invalid admin session data');
      }
    }
    
    // Validate employee session - EMPLOYEE CAN ONLY ACCESS OWN DATA
    if (!isAdmin && employeeSessionId && employeeData) {
      try {
        const employee = JSON.parse(employeeData);
        if (employee && employee.id) {
          // Employee can only access their own leave data
          if (employee.id === employeeId) {
            isEmployee = true;
            console.log('✅ Employee session validated - OWN DATA ACCESS ONLY');
          } else {
            throw new Error('Access denied. You can only view your own leave data.');
          }
        }
      } catch (error) {
        console.log('❌ Invalid employee session data');
      }
    }
    
    // If neither session is valid, throw error
    if (!isAdmin && !isEmployee) {
      throw new Error('No valid session found. Please log in as admin or employee first.');
    }
    
    console.log('✅ Session validated for leave data access');
    
    // Get employment for this employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      console.log('✅ No employment found for employee, returning empty array');
      return [];
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const leaves = employmentData.leaves || [];
    
    // Add employment context to each leave record
    const leavesWithContext = leaves.map((leaveRecord: any) => ({
      ...leaveRecord,
      employeeId: employmentData.employeeId,
      employmentId: employmentDoc.id
    }));
    
    // Sort by applied date descending (most recent first)
    leavesWithContext.sort((a: any, b: any) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    
    console.log('✅ Employee leave data found in employment:', leavesWithContext.length);
    return leavesWithContext;
  } catch (error) {
    console.error('Error getting employee leave data:', error);
    throw error;
  }
};

/**
 * Update an existing leave's end date (employee self-service)
 * - Only allows changing endDate
 * - Recomputes totalDays
 * - Marks the leave as edited for UI indication
 */
export const updateEmployeeLeaveEndDate = async (
  employmentId: string,
  leaveId: string,
  employeeId: string,
  newEndDate: string
) => {
  try {
    console.log('🔧 Updating leave end date...', { employmentId, leaveId, employeeId, newEndDate });

    // Validate employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }

    const currentEmployee = JSON.parse(employeeData);
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only edit your own leave.');
    }

    // Load employment doc
    const employmentRef = doc(db, 'employments', employmentId);
    const employmentSnap = await getDoc(employmentRef);
    if (!employmentSnap.exists()) {
      throw new Error('Employment record not found.');
    }

    const employmentData = employmentSnap.data();
    const leaves = (employmentData.leaves || []) as any[];
    const index = leaves.findIndex((l: any) => l.id === leaveId);
    if (index === -1) {
      throw new Error('Leave record not found.');
    }

    const leave = leaves[index];

    // Compute total days inclusive from startDate → newEndDate
    const start = new Date(leave.startDate);
    const end = new Date(newEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date provided.');
    }
    const ONE_DAY = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / ONE_DAY) + 1);

    const updatedLeave = {
      ...leave,
      endDate: newEndDate,
      totalDays,
      wasEdited: true,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId,
    };

    const updatedLeaves = [...leaves];
    updatedLeaves[index] = updatedLeave;

    await updateDoc(employmentRef, {
      leaves: updatedLeaves,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId,
    });

    console.log('✅ Leave end date updated successfully');
    return updatedLeave;
  } catch (error) {
    console.error('Error updating leave end date:', error);
    throw error;
  }
};

// Get a specific leave by ID for editing
export const getEmployeeLeaveById = async (employeeId: string, leaveId: string) => {
  try {
    console.log('🔍 Fetching specific leave by ID...');

    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');

    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }

    const currentEmployee = JSON.parse(employeeData);

    // Security check: Employee can only access their own leave data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only access your own leave data.');
    }

    console.log('✅ Employee session validated for leave fetch');

    // Get employment document for the employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);

    if (employmentSnapshot.empty) {
      throw new Error('No employment record found for this employee.');
    }

    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const leaves = employmentData.leaves || [];

    // Find the specific leave record
    const leaveRecord = leaves.find((leave: any) => leave.id === leaveId);

    if (!leaveRecord) {
      throw new Error('Leave request not found.');
    }

    console.log('✅ Leave record found:', leaveRecord);
    return {
      ...leaveRecord,
      employmentId: employmentDoc.id,
      employeeId: employeeId,
    };
  } catch (error) {
    console.error('Error fetching employee leave by ID:', error);
    throw error;
  }
};

// Update entire leave request (for editing)
export const updateEmployeeLeaveRequest = async ({
  leaveId,
  employeeId,
  type,
  startDate,
  endDate,
  reason,
  totalDays,
}: {
  leaveId: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  totalDays: number;
}) => {
  try {
    console.log('🔍 Updating employee leave request...');

    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');

    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }

    const currentEmployee = JSON.parse(employeeData);

    // Security check: Employee can only update their own leave data
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only update your own leave data.');
    }

    console.log('✅ Employee session validated for leave update');

    // Get employment document for the employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);

    if (employmentSnapshot.empty) {
      throw new Error('No employment record found for this employee.');
    }

    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const existingLeaves = employmentData.leaves || [];

    // Find and update the specific leave record
    const leaveIndex = existingLeaves.findIndex((leave: any) => leave.id === leaveId);

    if (leaveIndex === -1) {
      throw new Error('Leave request not found.');
    }

    const updatedLeaves = [...existingLeaves];
    const oldLeave = updatedLeaves[leaveIndex];

    // Check if leave can be edited (only pending leaves can be edited)
    if (oldLeave.status !== 'pending') {
      throw new Error('Only pending leave requests can be edited.');
    }

    updatedLeaves[leaveIndex] = {
      ...oldLeave,
      type,
      startDate,
      endDate,
      reason,
      totalDays,
      wasEdited: true, // Flag to indicate it was edited
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId,
    };

    // Update the employment document
    await updateDoc(doc(db, 'employments', employmentDoc.id), {
      leaves: updatedLeaves,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId,
    });

    console.log('✅ Leave request updated successfully in employment document');
    return updatedLeaves[leaveIndex];
  } catch (error) {
    console.error('Error updating employee leave request:', error);
    throw error;
  }
};

export const getEmployeeDocument = async (employeeId: string, documentType: string) => {
  try {
    console.log('🔍 Fetching employee document:', documentType);
    
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
    
    console.log('✅ Employee session validated for document access');
    
    const q = query(
      collection(db, 'employee_documents'), 
      where('employeeId', '==', employeeId),
      where('documentType', '==', documentType)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      console.log('✅ Employee document found:', documentType);
      return { id: querySnapshot.docs[0].id, ...docData };
    } else {
      console.log('❌ Employee document not found:', documentType);
      return null;
    }
  } catch (error) {
    console.error('Error getting employee document:', error);
    throw error;
  }
};

export const getEmployeeSalarySlips = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee salary slips...');
    
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
    
    console.log('✅ Employee session validated for salary slips');
    
    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const salaryRecords: any[] = [];
    
    querySnapshot.forEach((doc) => {
      salaryRecords.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Employee salary slips found:', salaryRecords.length);
    return salaryRecords;
  } catch (error) {
    console.error('Error getting employee salary slips:', error);
    throw error;
  }
};

// Attendance functions
export const markAttendanceCheckIn = async (employeeId: string, employmentId: string) => {
  try {
    console.log('🔍 Marking attendance check-in...');
    
    // Validate employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only mark their own attendance
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only mark your own attendance.');
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
    
    // Get the employment document
    const employmentRef = doc(db, 'employments', employmentId);
    const employmentDoc = await getDoc(employmentRef);
    
    if (!employmentDoc.exists()) {
      throw new Error('Employment record not found.');
    }
    
    const employmentData = employmentDoc.data();
    const existingAttendance = employmentData.attendance || [];
    
    // Check if attendance already exists for today
    const todayAttendance = existingAttendance.find((att: any) => att.date === today);
    if (todayAttendance) {
      throw new Error('Attendance already marked for today.');
    }
    
    // Determine if late (assuming 11:00 AM is standard check-in time)
    const isLate = now.getHours() > 11 || (now.getHours() === 11 && now.getMinutes() > 0);
    const status = isLate ? 'late' : 'present';
    
    const newAttendanceRecord = {
      date: today,
      checkInTime: currentTime,
      checkOutTime: null,
      checkInTimestamp: now,
      checkOutTimestamp: null,
      status,
      totalHours: 0,
      isLate,
      isEarlyCheckOut: false,
      checkInLocation: null,
      checkOutLocation: null,
      notes: ''
    };
    
    // Add new attendance record to employment document
    const updatedAttendance = [...existingAttendance, newAttendanceRecord];
    
    await updateDoc(employmentRef, {
      attendance: updatedAttendance,
      updatedAt: now,
      updatedBy: employeeId
    });
    
    console.log('✅ Attendance check-in marked successfully');
    return { id: employmentId, ...newAttendanceRecord };
  } catch (error) {
    console.error('Error marking attendance check-in:', error);
    throw error;
  }
};

export const markAttendanceCheckOut = async (employeeId: string) => {
  try {
    console.log('🔍 Marking attendance check-out...');
    
    // Validate employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only mark their own attendance
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only mark your own attendance.');
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
    
    // Find employment for this employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      throw new Error('No employment record found for this employee.');
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const existingAttendance = employmentData.attendance || [];
    
    // Find today's attendance record
    const todayAttendanceIndex = existingAttendance.findIndex((att: any) => att.date === today);
    
    if (todayAttendanceIndex === -1) {
      throw new Error('No check-in record found for today. Please check-in first.');
    }
    
    const todayAttendance = existingAttendance[todayAttendanceIndex];
    
    if (todayAttendance.checkOutTime) {
      throw new Error('Already checked out for today.');
    }
    
    // Calculate total hours
    const checkInTime = new Date(todayAttendance.checkInTimestamp.toDate());
    const totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    // Determine if early check-out (assuming 8:00 PM is standard check-out time)
    const isEarlyCheckOut = now.getHours() < 20;
    
    // Update status based on total hours
    let status = todayAttendance.status;
    if (totalHours < 4) {
      status = 'half-day';
    } else if (totalHours < 8) {
      status = 'present';
    }
    
    // Update the attendance record
    const updatedAttendance = [...existingAttendance];
    updatedAttendance[todayAttendanceIndex] = {
      ...todayAttendance,
      checkOutTime: currentTime,
      checkOutTimestamp: now,
      totalHours: Math.round(totalHours * 100) / 100,
      isEarlyCheckOut,
      status
    };
    
    // Update the employment document
    await updateDoc(doc(db, 'employments', employmentDoc.id), {
      attendance: updatedAttendance,
      updatedAt: now,
      updatedBy: employeeId
    });
    
    console.log('✅ Attendance check-out marked successfully');
    return { id: employmentDoc.id, ...updatedAttendance[todayAttendanceIndex] };
  } catch (error) {
    console.error('Error marking attendance check-out:', error);
    throw error;
  }
};

export const getTodayAttendance = async (employeeId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find employment for this employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      return {
        isCheckedIn: false,
        isCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        checkInTimestamp: null,
        status: null,
        totalHours: 0
      };
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const attendance = employmentData.attendance || [];
    
    // Find today's attendance record
    const todayAttendance = attendance.find((att: any) => att.date === today);
    
    if (!todayAttendance) {
      return {
        isCheckedIn: false,
        isCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        checkInTimestamp: null,
        status: null,
        totalHours: 0
      };
    }
    
    return {
      isCheckedIn: true,
      isCheckedOut: !!todayAttendance.checkOutTime,
      checkInTime: todayAttendance.checkInTime,
      checkOutTime: todayAttendance.checkOutTime,
      checkInTimestamp: todayAttendance.checkInTimestamp || null,
      status: todayAttendance.status,
      totalHours: todayAttendance.totalHours || 0
    };
  } catch (error) {
    console.error('Error getting today\'s attendance:', error);
    throw error;
  }
};

export const getAllAttendance = async () => {
  try {
    console.log('🔍 Fetching all attendance records...');
    
    // Check for admin session - ONLY ADMIN CAN ACCESS ALL ATTENDANCE
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminSessionId || !adminData) {
      throw new Error('No admin session found. Only admins can view all attendance records.');
    }
    
    console.log('✅ Admin session validated - FULL ACCESS TO ALL ATTENDANCE');
    
    // Get all employments and extract attendance data
    const employmentsQuery = query(collection(db, 'employments'));
    const employmentsSnapshot = await getDocs(employmentsQuery);
    
    const allAttendanceRecords: any[] = [];
    
    employmentsSnapshot.forEach((employmentDoc) => {
      const employmentData = employmentDoc.data();
      const attendance = employmentData.attendance || [];
      
      // Add employment context to each attendance record
      attendance.forEach((attRecord: any) => {
        allAttendanceRecords.push({
          id: `${employmentDoc.id}_${attRecord.date}`, // Create unique ID
          employeeId: employmentData.employeeId,
          employmentId: employmentDoc.id,
          employeeName: employmentData.employeeName || 'Unknown Employee',
          jobTitle: employmentData.jobTitle || 'Unknown Position',
          department: employmentData.department || 'Unknown Department',
          ...attRecord
        });
      });
    });
    
    // Sort by date descending (most recent first)
    allAttendanceRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('✅ All attendance records found:', allAttendanceRecords.length);
    return allAttendanceRecords;
  } catch (error) {
    console.error('Error getting all attendance records:', error);
    console.log('⚠️ Returning empty attendance array due to error');
    return [];
  }
};

// Helper function to check if attendance collection exists
export const checkAttendanceCollection = async () => {
  try {
    console.log('🔍 Checking if attendance collection exists...');
    const q = query(collection(db, 'attendance'), limit(1));
    const querySnapshot = await getDocs(q);
    console.log('✅ Attendance collection exists');
    return true;
  } catch (error) {
    console.log('❌ Attendance collection does not exist or error accessing it:', error);
    return false;
  }
};

export const getAttendanceByEmployee = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching attendance for employee:', employeeId);
    
    // Get employment for this employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      console.log('✅ No employment found for employee, returning empty array');
      return [];
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const attendance = employmentData.attendance || [];
    
    // Add employment context to each attendance record
    const attendanceWithContext = attendance.map((attRecord: any) => ({
      id: `${employmentDoc.id}_${attRecord.date}`, // Create unique ID
      employeeId: employmentData.employeeId,
      employmentId: employmentDoc.id,
      ...attRecord
    }));
    
    // Sort by date descending (most recent first)
    attendanceWithContext.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('✅ Attendance records found in employment:', attendanceWithContext.length);
    return attendanceWithContext;
  } catch (error) {
    console.error('Error getting attendance by employee:', error);
    throw error;
  }
}; 

// Employee-specific salary fetching function
export const getEmployeeSalaries = async (employeeId: string) => {
  try {
    console.log('🔍 Fetching employee salary data...');
    
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
          console.log('✅ Admin session validated - FULL ACCESS GRANTED');
        }
      } catch (error) {
        console.log('❌ Invalid admin session data');
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
            console.log('✅ Employee session validated - OWN DATA ACCESS ONLY');
          } else {
            throw new Error('Access denied. You can only view your own salary data.');
          }
        }
      } catch (error) {
        console.log('❌ Invalid employee session data');
      }
    }
    
    // If neither session is valid, throw error
    if (!isAdmin && !isEmployee) {
      throw new Error('No valid session found. Please log in as admin or employee first.');
    }
    
    console.log('✅ Session validated for salary data access');
    console.log('🔍 Fetching salaries for employee:', employeeId);
    
    const q = query(collection(db, 'salaries'), where('employeeId', '==', employeeId));
    console.log('📝 Query created with filter:', { employeeId });
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Query results count:', querySnapshot.size);
    
    const salaries: any[] = [];
    querySnapshot.forEach((doc) => {
      const salary = { id: doc.id, ...doc.data() } as any;
      salaries.push(salary);
      console.log('💰 Found salary:', { id: doc.id, basicSalary: salary.basicSalary, employeeId: salary.employeeId });
    });
    
    console.log('✅ Employee salary data found:', salaries.length);
    return salaries;
  } catch (error) {
    console.error('Error getting employee salary data:', error);
    throw error;
  }
}; 

// Function to create leave request for employee
export const createEmployeeLeaveRequest = async (leaveData: {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  totalDays: number;
}) => {
  try {
    console.log('🔍 Creating employee leave request...');
    
    // Check for employee or admin session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    let createdBy = leaveData.employeeId;
    let isAdmin = false;
    
    // Check if admin is creating the leave
    if (adminSessionId && adminData) {
      const currentAdmin = JSON.parse(adminData);
      createdBy = currentAdmin.id;
      isAdmin = true;
      console.log('✅ Admin session validated for leave request');
    } 
    // Check if employee is creating their own leave
    else if (employeeSessionId && employeeData) {
      const currentEmployee = JSON.parse(employeeData);
      
      // Security check: Employee can only create leave requests for themselves
      if (currentEmployee.id !== leaveData.employeeId) {
        throw new Error('Access denied. You can only create leave requests for yourself.');
      }
      
      console.log('✅ Employee session validated for leave request');
    } 
    // No valid session found
    else {
      throw new Error('No valid session found. Please log in first.');
    }
    
    // Find employment for this employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', leaveData.employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      throw new Error('No employment record found for this employee.');
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const existingLeaves = employmentData.leaves || [];
    
    // Create new leave record
    const newLeaveRecord = {
      id: `${employmentDoc.id}_${Date.now()}`, // Generate unique ID
      type: leaveData.type,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
      totalDays: leaveData.totalDays,
      status: isAdmin ? 'approved' : 'pending', // Auto-approve if created by admin
      appliedDate: new Date().toISOString().split('T')[0],
      approvedBy: isAdmin ? createdBy : null,
      approvedAt: isAdmin ? new Date().toISOString() : null,
      comments: isAdmin ? 'Created by admin' : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: createdBy
    };
    
    // Add new leave record to employment document
    const updatedLeaves = [...existingLeaves, newLeaveRecord];
    
    await updateDoc(doc(db, 'employments', employmentDoc.id), {
      leaves: updatedLeaves,
      updatedAt: new Date().toISOString(),
      updatedBy: createdBy
    });
    
    console.log('✅ Leave request created successfully in employment document');
    return newLeaveRecord;
  } catch (error) {
    console.error('Error creating employee leave request:', error);
    throw error;
  }
}; 

// Function to approve/reject leave request
export const updateLeaveRequest = async (employmentId: string, leaveId: string, status: 'approved' | 'rejected', approvedBy: string, comments?: string) => {
  try {
    console.log('🔍 Updating leave request...');
    
    // Check for admin session
    const adminSessionId = localStorage.getItem('adminSessionId');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminSessionId || !adminData) {
      throw new Error('No admin session found. Only admins can approve/reject leave requests.');
    }
    
    // Get employment document
    const employmentRef = doc(db, 'employments', employmentId);
    const employmentDoc = await getDoc(employmentRef);
    
    if (!employmentDoc.exists()) {
      throw new Error('Employment record not found.');
    }
    
    const employmentData = employmentDoc.data();
    const existingLeaves = employmentData.leaves || [];
    
    // Find and update the specific leave record
    const leaveIndex = existingLeaves.findIndex((leave: any) => leave.id === leaveId);
    
    if (leaveIndex === -1) {
      throw new Error('Leave request not found.');
    }
    
    const updatedLeaves = [...existingLeaves];
    updatedLeaves[leaveIndex] = {
      ...updatedLeaves[leaveIndex],
      status,
      approvedBy,
      approvedAt: new Date().toISOString().split('T')[0],
      comments: comments || updatedLeaves[leaveIndex].comments,
      updatedAt: new Date().toISOString()
    };
    
    // Update the employment document
    await updateDoc(employmentRef, {
      leaves: updatedLeaves,
      updatedAt: new Date().toISOString(),
      updatedBy: approvedBy // Assuming updatedBy is the admin who approved/rejected
    });
    
    console.log('✅ Leave request updated successfully');
    return updatedLeaves[leaveIndex];
  } catch (error) {
    console.error('Error updating leave request:', error);
    throw error;
  }
}; 

/**
 * Cancel an employee leave request
 * - Only pending leaves can be cancelled
 * - Only the employee who created the leave can cancel it
 */
export const cancelEmployeeLeaveRequest = async (employeeId: string, leaveId: string) => {
  try {
    console.log('🔍 Cancelling employee leave request...');
    
    // Check for employee session
    const employeeSessionId = localStorage.getItem('employeeSessionId');
    const employeeData = localStorage.getItem('employeeData');
    
    if (!employeeSessionId || !employeeData) {
      throw new Error('No employee session found. Please log in as employee first.');
    }
    
    const currentEmployee = JSON.parse(employeeData);
    
    // Security check: Employee can only cancel their own leave requests
    if (currentEmployee.id !== employeeId) {
      throw new Error('Access denied. You can only cancel your own leave requests.');
    }
    
    console.log('✅ Employee session validated for leave cancellation');
    
    // Get employment document for the employee
    const employmentQuery = query(
      collection(db, 'employments'),
      where('employeeId', '==', employeeId)
    );
    const employmentSnapshot = await getDocs(employmentQuery);
    
    if (employmentSnapshot.empty) {
      throw new Error('No employment record found for this employee.');
    }
    
    const employmentDoc = employmentSnapshot.docs[0];
    const employmentData = employmentDoc.data();
    const existingLeaves = employmentData.leaves || [];
    
    // Find the specific leave record
    const leaveIndex = existingLeaves.findIndex((leave: any) => leave.id === leaveId);
    
    if (leaveIndex === -1) {
      throw new Error('Leave request not found.');
    }
    
    const leave = existingLeaves[leaveIndex];
    
    // Check if leave can be cancelled (only pending leaves can be cancelled)
    if (leave.status !== 'pending') {
      throw new Error('Only pending leave requests can be cancelled.');
    }
    
    // Remove the leave from the array
    const updatedLeaves = existingLeaves.filter((leave: any) => leave.id !== leaveId);
    
    // Update the employment document
    await updateDoc(doc(db, 'employments', employmentDoc.id), {
      leaves: updatedLeaves,
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId
    });
    
    console.log('✅ Leave request cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    throw error;
  }
};

// Enquiry Firestore utilities
export const getEnquiries = async () => {
  const q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEnquiry = async (id: string) => {
  const docSnap = await getDoc(doc(db, 'enquiries', id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const addEnquiry = async (enquiryData: any) => {
  const docRef = await addDoc(collection(db, 'enquiries'), {
    ...enquiryData,
    createdAt: enquiryData.createdAt || new Date(),
  });
  return docRef.id;
};

export const updateEnquiry = async (id: string, enquiryData: any) => {
  await updateDoc(doc(db, 'enquiries', id), enquiryData);
};

export const deleteEnquiry = async (id: string) => {
  await deleteDoc(doc(db, 'enquiries', id));
}; 

// PAN Card validation and uniqueness check functions
export const validatePANFormat = (pan: string): boolean => {
  // PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const checkPANExistsInEnquiries = async (pan: string): Promise<boolean> => {
  try {
    if (!pan || !validatePANFormat(pan)) {
      return false;
    }
    
    const q = query(
      collection(db, 'enquiries'), 
      where('pan', '==', pan.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking PAN in enquiries:', error);
    return false;
  }
};

export const checkPANExistsInEmployees = async (pan: string): Promise<boolean> => {
  try {
    if (!pan || !validatePANFormat(pan)) {
      return false;
    }
    
    const q = query(
      collection(db, 'employees'), 
      where('panCard', '==', pan.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking PAN in employees:', error);
    return false;
  }
};

export const checkPANExistsAnywhere = async (pan: string): Promise<boolean> => {
  try {
    // Check in enquiries collection
    const enquiryQuery = query(collection(db, 'enquiries'), where('pan', '==', pan));
    const enquirySnapshot = await getDocs(enquiryQuery);
    
    if (!enquirySnapshot.empty) {
      return true; // PAN exists in enquiries
    }
    
    // Check in employees collection
    const employeeQuery = query(collection(db, 'employees'), where('panCard', '==', pan));
    const employeeSnapshot = await getDocs(employeeQuery);
    
    if (!employeeSnapshot.empty) {
      return true; // PAN exists in employees
    }
    
    return false; // PAN doesn't exist anywhere
  } catch (error) {
    console.error('Error checking PAN existence:', error);
    throw error;
  }
};

export const checkMobileExists = async (mobile: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'enquiries'), where('mobile', '==', mobile));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking mobile existence:', error);
    throw error;
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'enquiries'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
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