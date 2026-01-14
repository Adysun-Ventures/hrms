import { Employee } from '@/types';
import { addEmployee, checkUserByPhone, checkPANExistsAnywhere, validatePANFormat, getAdminDataForAudit } from './firebaseUtils';
import Papa from 'papaparse';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface BulkUploadResult {
  success: boolean;
  createdCount: number;
  errors: ValidationError[];
  message: string;
}

export interface ParsedEmployee {
  name: string;
  dateOfBirth: string;
  employeeType: 'internal' | 'external';
  phone: string;
  email: string;
  currentAddress: string;
  aadharCard: string;
  panCard: string;
}

// Parse CSV file to employee objects using PapaParse
export const parseCSV = async (file: File): Promise<ParsedEmployee[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      comments: '#', // Skip lines starting with #
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            const error = results.errors[0];
            throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`);
          }
          
          const requiredHeaders = ['name', 'dateOfBirth', 'employeeType', 'phone', 'email', 'currentAddress', 'aadharCard', 'panCard'];
          
          // Check if all required headers are present
          if (results.meta.fields) {
            const missingHeaders = requiredHeaders.filter(header => !results.meta.fields?.includes(header));
            if (missingHeaders.length > 0) {
              throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
            }
          }
          
          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file must contain at least one data row');
          }
          
          // Transform parsed data to ParsedEmployee format
          const parsedData = results.data as Record<string, string>[];
          const employees: ParsedEmployee[] = parsedData.map((row) => ({
            name: row.name?.trim() || '',
            dateOfBirth: row.dateOfBirth?.trim() || '',
            employeeType: (row.employeeType?.trim() || '') as 'internal' | 'external',
            phone: row.phone?.trim() || '',
            email: row.email?.trim() || '',
            currentAddress: row.currentAddress?.trim() || '',
            aadharCard: row.aadharCard?.trim() || '',
            panCard: row.panCard?.trim() || ''
          }));
          
          resolve(employees);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}`));
      }
    });
  });
};

// Validate bulk employees
export const validateBulkEmployees = async (employees: ParsedEmployee[]): Promise<ValidationResult> => {
  const errors: ValidationError[] = [];
  
  // Check for duplicates within CSV
  const phoneNumbers = new Set<string>();
  const panNumbers = new Set<string>();
  
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const row = i + 2; // +2 because CSV has header row and arrays are 0-indexed
    
    // Required field validation
    if (!employee.name || employee.name.trim() === '') {
      errors.push({ row, field: 'name', message: 'Name is required' });
    } else if (employee.name.length < 2) {
      errors.push({ row, field: 'name', message: 'Name must be at least 2 characters' });
    } else if (employee.name.length > 50) {
      errors.push({ row, field: 'name', message: 'Name cannot exceed 50 characters' });
    }
    
    if (!employee.dateOfBirth || employee.dateOfBirth.trim() === '') {
      errors.push({ row, field: 'dateOfBirth', message: 'Date of birth is required' });
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(employee.dateOfBirth)) {
        errors.push({ row, field: 'dateOfBirth', message: 'Date must be in YYYY-MM-DD format' });
      } else {
        const date = new Date(employee.dateOfBirth);
        if (isNaN(date.getTime())) {
          errors.push({ row, field: 'dateOfBirth', message: 'Invalid date' });
        }
      }
    }
    
    if (!employee.employeeType || !['internal', 'external'].includes(employee.employeeType)) {
      errors.push({ row, field: 'employeeType', message: 'Employee type must be "internal" or "external"' });
    }
    
    if (!employee.phone || employee.phone.trim() === '') {
      errors.push({ row, field: 'phone', message: 'Phone number is required' });
    } else if (!/^[0-9]{10}$/.test(employee.phone)) {
      errors.push({ row, field: 'phone', message: 'Phone number must be exactly 10 digits' });
    } else {
      // Check for duplicates within CSV
      if (phoneNumbers.has(employee.phone)) {
        errors.push({ row, field: 'phone', message: 'Duplicate phone number in CSV' });
      } else {
        phoneNumbers.add(employee.phone);
      }
    }
    
    if (!employee.email || employee.email.trim() === '') {
      errors.push({ row, field: 'email', message: 'Email is required' });
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(employee.email)) {
      errors.push({ row, field: 'email', message: 'Invalid email format' });
    }
    
    if (!employee.currentAddress || employee.currentAddress.trim() === '') {
      errors.push({ row, field: 'currentAddress', message: 'Current address is required' });
    }
    
    if (!employee.aadharCard || employee.aadharCard.trim() === '') {
      errors.push({ row, field: 'aadharCard', message: 'Aadhar card number is required' });
    } else if (!/^\d{12}$/.test(employee.aadharCard)) {
      errors.push({ row, field: 'aadharCard', message: 'Aadhar card number must be exactly 12 digits' });
    }
    
    if (!employee.panCard || employee.panCard.trim() === '') {
      errors.push({ row, field: 'panCard', message: 'PAN card number is required' });
    } else if (!validatePANFormat(employee.panCard)) {
      errors.push({ row, field: 'panCard', message: 'PAN card number must be in format ABCDE1234F' });
    } else {
      // Check for duplicates within CSV
      if (panNumbers.has(employee.panCard.toUpperCase())) {
        errors.push({ row, field: 'panCard', message: 'Duplicate PAN number in CSV' });
      } else {
        panNumbers.add(employee.panCard.toUpperCase());
      }
    }
  }
  
  // If there are validation errors, return them
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Check for existing records in database
  try {
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const row = i + 2;
      
      // Check if phone number already exists
      const formattedPhone = `+91${employee.phone}`;
      const existingUser = await checkUserByPhone(formattedPhone);
      if (existingUser) {
        const userType = existingUser.userType === 'admin' ? 'admin' : 'employee';
        errors.push({ row, field: 'phone', message: `Phone number is already registered with an ${userType}` });
      }
      
      // Check if PAN already exists
      const panExists = await checkPANExistsAnywhere(employee.panCard.toUpperCase());
      if (panExists) {
        errors.push({ row, field: 'panCard', message: 'PAN number is already registered' });
      }
    }
  } catch (error) {
    console.error('Error checking existing records:', error);
    errors.push({ row: 0, field: 'general', message: 'Failed to validate against existing records' });
  }
  
  return { isValid: errors.length === 0, errors };
};

// Bulk create employees
export const bulkCreateEmployees = async (employees: ParsedEmployee[]): Promise<BulkUploadResult> => {
  try {
    const { adminId, currentTimestamp } = getAdminDataForAudit();
    let createdCount = 0;
    const errors: ValidationError[] = [];
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const row = i + 2;
      
      try {
        // Transform to Employee format
        const employeeData: Omit<Employee, 'id'> = {
          name: employee.name,
          dateOfBirth: employee.dateOfBirth,
          employeeType: employee.employeeType,
          phone: employee.phone,
          email: employee.email,
          currentAddress: employee.currentAddress,
          aadharCard: employee.aadharCard,
          panCard: employee.panCard.toUpperCase(),
          password: `${employee.phone.slice(-5)}@#$$`, // Auto-generated password
          status: 'active',
          position: '', // Empty for bulk upload - can be updated later
          department: '', // Empty for bulk upload - can be updated later
          joinDate: '', // Empty for bulk upload - can be updated later
          createdAt: currentTimestamp,
          createdBy: adminId,
          updatedAt: currentTimestamp,
          updatedBy: adminId,
        };
        
        await addEmployee(employeeData);
        createdCount++;
      } catch (error) {
        console.error(`Error creating employee at row ${row}:`, error);
        errors.push({
          row,
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create employee'
        });
      }
    }
    
    return {
      success: errors.length === 0,
      createdCount,
      errors,
      message: errors.length === 0 
        ? `Successfully created ${createdCount} employees`
        : `Created ${createdCount} employees with ${errors.length} errors`
    };
  } catch (error) {
    console.error('Error in bulk create:', error);
    return {
      success: false,
      createdCount: 0,
      errors: [{ row: 0, field: 'general', message: 'Failed to process bulk upload' }],
      message: 'Failed to process bulk upload'
    };
  }
};
