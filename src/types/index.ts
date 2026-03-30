import { ReactNode } from "react";

// Secondary Education Entry type for dynamic 12th/Diploma entries
export interface SecondaryEducationEntry {
  id: string;
  type: '12th' | 'diploma';
  twelthData?: {
    school?: string;      // @deprecated - Use schoolName instead
    branch?: string;
    month?: string;
    passingYear?: string;
    schoolName?: string;  // Standard field for school name
    board?: string;
    marks?: string;
    grade?: string;
  };
  diplomaData?: {
    name?: string;
    branch?: string;
    month?: string;
    passingYear?: string;
    collegeName?: string;
    institute?: string;
    marks?: string;
    grade?: string;
  };
}

// Employee type
export interface Employee {
  employeeId: ReactNode;
  id: string;
  // Personal Details
  name: string;
  dateOfBirth?: string;
  // employeeId removed - now only in Employment.employmentId
  // Note: Use 'status' field ('active' | 'inactive') as the single source of truth for employee active/inactive state
  homeTown?: string;
  employeeType: 'internal' | 'external'; // Internal/External flag
  
  // Contact Information
  email: string;
  phone: string;
  currentAddress?: string;
  permanentAddress?: string;
  
  // Login Credentials - Make password required
  password: string; // Changed from optional to required
  
  // Identification Documents
  aadharCard?: string;
  drivingLicense?: string;
  panCard?: string;
  voterID?: string;
  
  // OLD: Bank Details - Moved to Employment (keep for backward compatibility)
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
  branchName?: string;
  panNumber?: string;
  
  // Educational Details
  // Higher Education
  graduation?: {
    degree?: string;
    branch?: string;
    month?: string;
    passingYear?: string;
    collegeName?: string;
    universityName?: string;
    marks?: string;
    grade?: string;
  };
  
  // NEW: Array-based secondary education (12th/Diploma)
  secondaryEducation?: SecondaryEducationEntry[];
  
  // OLD: Keep for backward compatibility
  // 12th Standard
  twelthStandard?: {
    school?: string;      // @deprecated - Use schoolName instead
    branch?: string;
    month?: string;
    passingYear?: string;
    schoolName?: string;  // Standard field for school name
    marks?: string;
    board?: string;
    grade?: string;
  };
  
  // Diploma
  diploma?: {
    name?: string;
    branch?: string;
    month?: string;
    passingYear?: string;
    collegeName?: string;
    marks?: string;
    institute?: string;
    grade?: string;
  };
  
  // 10th Standard
  tenthStandard?: {
    school?: string;      // @deprecated - Use schoolName instead
    month?: string;
    passingYear?: string;
    schoolName?: string;  // Standard field for school name
    marks?: string;
    board?: string;
    grade?: string;
    medium?: string;
  };
  
  // Legacy fields (keeping for backward compatibility)
  position: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  joiningDate?: string; // Moved to Employment.joiningDate for better separation of concerns
  
  // Resignation tracking
  employmentStatus?: 'working' | 'resigned'; // Working/Resigned dropdown value
  resignedDate?: string; // Auto-filled date when set to resigned
  lastWorkingDay?: string; // Manual input for last working day
  is_resigned?: boolean; // Boolean flag for login check (default: false)
  
  // Salary information for offer letter
  salary?: number;
  
  // Audit fields
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Employment type
export interface ProfessionalReference {
  nameDesignation?: string;
  emailAndMobile?: string;
  natureOfAssociation?: string;
}

export interface EmploymentIncrement {
  id?: string;
  incrementDate?: string;
  newSalary?: number;
  incrementedCtc?: number;
  incrementedInHandCtc?: number;
  previousDesignation?: string;
  newDesignation?: string;
}

export interface Employment {
  id: string;
  employeeId: string;
  
  // Employment Information
  employmentId?: string;
  joiningDate?: string;
  incrementDate?: string;
  contractType: 'full-time' | 'part-time' | 'contract';
  startDate: string;
  endDate?: string;
  joiningCtc?: number;
  inHandCtc?: number;
  relievingCtc?: number | null;
  isResignation?: boolean;

  // CTC split (optional) - requested for Employment Add/Edit forms
  joiningFixedPay?: number;
  joiningVariablePay?: number;
  currentFixedPay?: number;
  currentVariablePay?: number;
  joiningOtherAllowance?: number;
  currentOtherAllowance?: number;
  
  // Salary Information
  salary: number;
  salaryPerMonth?: number;
  basic?: number;
  da?: number;
  hra?: number;
  pf?: number;
  medicalAllowance?: number;
  transport?: number;
  gratuity?: number;
  additionalAllowance?: number;
  specialAllowance?: number;
  totalLeaves?: number;
  salaryCreditDate?: string;
  payableDays?: number;
  paymentMode?: string;
  educationAllowance?: number;
  monthlyReimbursement?: number;
  lta?: number;
  statutoryBonus?: number;
  healthInsurance?: number;
  employerPF?: number;
  paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  
  
  // Bank Details (for salary account)
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
  panNumber?: string;
  
  // Job Details
  jobTitle?: string;
  designation?: string;
  department?: string;
  location?: string;
  reportingManager?: string;
  reportingAuthority?: string;
  employmentType?: string;
  workSchedule?: string;
  probationPeriod?: string;
  noticePeriod?: string;
  benefits: string[];

  /** Up to three professional references (indexed 0 → Ref 1, 1 → Ref 2, 2 → Ref 3). */
  professionalReferences?: ProfessionalReference[];
  
  // Resignation Details
  resignationDate?: string;
  lastWorkingDate?: string;
  reasonForLeaving?: string;
  exitInterviewDate?: string;
  lastSalaryDate?: string;
  lastSalaryAmount?: number;
  lastDrawnSalary?: number;
  
  // Appraisal Details
  appraisalDate?: string;
  previousSalary?: number;
  newSalary?: number;
  incrementedCtc?: number;
  incrementedInHandCtc?: number;
  percentageIncrease?: number;
  performanceRating?: string;
  effectiveDate?: string;
  increments?: EmploymentIncrement[];
  
  // NEW: Attendance Array
  attendance?: AttendanceRecord[];
  
  // NEW: Leaves Array
  leaves?: LeaveRecord[];
  
  // Audit fields
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// NEW: Simplified attendance record for employment array
export interface AttendanceRecord {
  date: string; // YYYY-MM-DD format
  checkInTime?: string; // HH:MM:SS format
  checkOutTime?: string; // HH:MM:SS format
  checkInTimestamp?: any; // Firestore timestamp
  checkOutTimestamp?: any; // Firestore timestamp
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours?: number;
  isLate?: boolean;
  isEarlyCheckOut?: boolean;
  checkInLocation?: string;
  checkOutLocation?: string;
  notes?: string;
}

// NEW: Leave record for employment array
export interface LeaveRecord {
  id?: string; // Generated ID for the leave record
  type: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'other';
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  reason: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string; // YYYY-MM-DD format
  approvedBy?: string; // Admin/Manager ID who approved
  approvedAt?: string; // YYYY-MM-DD format
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Salary Slip type
export interface SalarySlip {
  id: string;
  employeeId: string;
  employmentId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    type: string;
    amount: number;
  }[];
  deductions: {
    type: string;
    amount: number;
  }[];
  netSalary: number;
  grossSalary?: number;
  totalAllowances?: number;
  totalDeductions?: number;
  lossOfPay?: number;
  workingDays?: number;
  paidDays?: number;
  issueDate: string;
  paidDate?: string;
  status: 'draft' | 'issued' | 'paid';
  documentUrl?: string;
}

// Document types for document generation
export interface Document {
  id: string;
  employeeId: string;
  employmentId?: string;
  documentType: 'offer' | 'appointment' | 'relieving' | 'appraisal' | 'increment' | 'salary-slip';
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'issued' | 'signed';
  documentUrl?: string;
  data?: any;
}

// Company information for documents
export interface Company {
  id: string;
  name: string;
  address: string;
  mobile: string;
  email: string;
  website: string;
  logo: string;
  signatureLogo?: string;
  hrName: string;
  hrDesignation: string;
  hrEmail?: string;
} 

// Simplify the Salary interface to only include essential fields
export interface Salary {
  id: string;
  employeeId: string;
  employmentId: string;

  
  // Essential Salary Information Only
  basicSalary: number;
  inhandSalary: number;
  totalSalary: number;
  fixedPay: number;
  variablePay: number;
  pf: number;
  leavesCount: number;
  leavesDeductAmt: number;

totalDeduction: number;
ptDeduct: number;

  
  // Period Information
  month: number;
  year: number;
  
  // Audit fields
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Attendance type
export interface Attendance {
  id: string;
  employeeId: string;
  employmentId: string;
  
  // Attendance Details
  date: string; // YYYY-MM-DD format
  checkInTime?: string; // HH:MM:SS format
  checkOutTime?: string; // HH:MM:SS format
  checkInTimestamp?: any; // Firestore timestamp
  checkOutTimestamp?: any; // Firestore timestamp
  
  // Status and Calculations
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours?: number;
  isLate?: boolean;
  isEarlyCheckOut?: boolean;
  
  // Location (Optional)
  checkInLocation?: string;
  checkOutLocation?: string;
  
  // Notes
  notes?: string;
  
  // Audit fields
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
} 