# Firebase Database Structure

## Overview

This document outlines the Firebase Firestore database structure for the HRMS application. The database consists of 5 main collections as per strict requirements.

## Collections

### 1. `admins` Collection

**Purpose:** Store admin user accounts and authentication data

**Document Structure:**
```typescript
interface Admin {
  id: string;                    // Auto-generated document ID
  name: string;                  // Admin full name
  email: string;                 // Admin email address
  mobile: string;                // Admin phone number (without +91 prefix)
  password: string;              // Hashed password for authentication
  active: boolean;               // Account status (true/false)
  createdAt: Timestamp;          // Account creation timestamp
  isAdmin: boolean;              // Always true for admin accounts
  userType: 'admin';             // User type identifier
}
```

**Example Document:**
```json
{
  "id": "admin_001",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "mobile": "9876543210",
  "password": "hashed_password_here",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "isAdmin": true,
  "userType": "admin"
}
```

**Security Rules:**
- Only authenticated admins can read/write admin documents
- Admin can only access their own data or manage other admins

---

### 2. `employees` Collection

**Purpose:** Store employee user accounts and basic information

**Document Structure:**
```typescript
interface Employee {
  id: string;                    // Auto-generated document ID
  name: string;                  // Employee full name
  email: string;                 // Employee email address
  phone: string;                 // Employee phone number
  password: string;              // Hashed password for authentication
  status: 'active' | 'inactive'; // Account status
  createdAt: Timestamp;          // Account creation timestamp
  isEmployee: boolean;           // Always true for employee accounts
  isAdmin: boolean;              // Always false for employee accounts
  userType: 'employee';          // User type identifier
  employeeId?: string;           // Optional employee ID
  department?: string;           // Optional department
  position?: string;             // Optional position
  joinDate?: string;             // Optional joining date
}
```

**Example Document:**
```json
{
  "id": "emp_001",
  "name": "Jane Smith",
  "email": "jane.smith@company.com",
  "phone": "9876543210",
  "password": "hashed_password_here",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "isEmployee": true,
  "isAdmin": false,
  "userType": "employee",
  "employeeId": "EMP001",
  "department": "Engineering",
  "position": "Software Developer",
  "joinDate": "2024-01-15"
}
```

**Security Rules:**
- Employees can only read their own data
- Admins can read/write all employee data
- Employees cannot modify other employee data

---

### 3. `attendance` Collection

**Purpose:** Store employee attendance records

**Document Structure:**
```typescript
interface Attendance {
  id: string;                    // Auto-generated document ID
  employeeId: string;            // Reference to employee
  date: string;                  // Date in YYYY-MM-DD format
  checkIn: string;               // Check-in time (HH:MM AM/PM)
  checkOut?: string;             // Check-out time (HH:MM AM/PM)
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours: number;            // Total working hours
  createdAt: Timestamp;          // Record creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  notes?: string;                // Optional notes
}
```

**Example Document:**
```json
{
  "id": "att_001",
  "employeeId": "emp_001",
  "date": "2024-01-15",
  "checkIn": "09:00 AM",
  "checkOut": "06:00 PM",
  "status": "present",
  "totalHours": 9,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T18:00:00Z",
  "notes": "Regular working day"
}
```

**Security Rules:**
- Employees can only read their own attendance records
- Admins can read/write all attendance records
- Employees can create/update their own attendance records

---

### 4. `leaves` Collection

**Purpose:** Store employee leave requests and records

**Document Structure:**
```typescript
interface Leave {
  id: string;                    // Auto-generated document ID
  employeeId: string;            // Reference to employee
  type: 'casual' | 'sick' | 'annual' | 'personal' | 'maternity' | 'paternity';
  startDate: string;             // Start date in YYYY-MM-DD format
  endDate: string;               // End date in YYYY-MM-DD format
  reason: string;                // Leave reason
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;           // Application date in YYYY-MM-DD format
  totalDays: number;             // Total leave days
  approvedBy?: string;           // Admin who approved/rejected
  approvedAt?: Timestamp;        // Approval timestamp
  createdAt: Timestamp;          // Record creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  comments?: string;             // Optional comments
}
```

**Example Document:**
```json
{
  "id": "leave_001",
  "employeeId": "emp_001",
  "type": "casual",
  "startDate": "2024-01-20",
  "endDate": "2024-01-20",
  "reason": "Personal work",
  "status": "approved",
  "appliedDate": "2024-01-15",
  "totalDays": 1,
  "approvedBy": "admin_001",
  "approvedAt": "2024-01-16T10:30:00Z",
  "createdAt": "2024-01-15T14:00:00Z",
  "updatedAt": "2024-01-16T10:30:00Z",
  "comments": "Approved for personal work"
}
```

**Security Rules:**
- Employees can read their own leave records
- Employees can create new leave requests
- Admins can read/write all leave records
- Employees cannot modify approved/rejected leaves

---

### 5. `salary` Collection

**Purpose:** Store employee salary information and records

**Document Structure:**
```typescript
interface Salary {
  id: string;                    // Auto-generated document ID
  employeeId: string;            // Reference to employee
  month: string;                 // Month in YYYY-MM format
  year: number;                  // Year
  basicSalary: number;           // Basic salary amount
  allowances: number;            // Allowances amount
  deductions: number;            // Deductions amount
  netSalary: number;             // Net salary after deductions
  paymentDate?: string;          // Payment date in YYYY-MM-DD format
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Timestamp;          // Record creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  notes?: string;                // Optional notes
  salarySlipUrl?: string;           // Optional salary slip document URL
}
```

**Example Document:**
```json
{
  "id": "salary_001",
  "employeeId": "emp_001",
  "month": "2024-01",
  "year": 2024,
  "basicSalary": 50000,
  "allowances": 10000,
  "deductions": 5000,
  "netSalary": 55000,
  "paymentDate": "2024-01-31",
  "status": "paid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-31T10:00:00Z",
  "notes": "January 2024 salary",
  "salarySlipUrl": "https://storage.googleapis.com/salary-slips/emp_001_2024_01.pdf"
}
```

**Security Rules:**
- Employees can only read their own salary records
- Admins can read/write all salary records
- Employees cannot modify salary records

---

## Database Relationships

### Primary Relationships:
1. **Employee → Attendance:** One employee can have multiple attendance records
2. **Employee → Leaves:** One employee can have multiple leave records
3. **Employee → Salary:** One employee can have multiple salary records
4. **Admin → Employee Management:** Admins manage all employee data

### Query Patterns:

**Get Employee Attendance:**
```typescript
const q = query(
  collection(db, 'attendance'), 
  where('employeeId', '==', employeeId)
);
```

**Get Employee Leaves:**
```typescript
const q = query(
  collection(db, 'leaves'), 
  where('employeeId', '==', employeeId)
);
```

**Get Employee Salary:**
```typescript
const q = query(
  collection(db, 'salary'), 
  where('employeeId', '==', employeeId)
);
```

**Get Employee by Phone:**
```typescript
const q = query(
  collection(db, 'employees'), 
  where('phone', '==', phoneNumber)
);
```

---

## Security Rules

### Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin rules
    match /admins/{adminId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == adminId || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Employee rules
    match /employees/{employeeId} {
      allow read: if request.auth != null && 
        (request.auth.uid == employeeId || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Attendance rules
    match /attendance/{attendanceId} {
      allow read: if request.auth != null && 
        (resource.data.employeeId == request.auth.uid || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
        (resource.data.employeeId == request.auth.uid || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Leave rules
    match /leaves/{leaveId} {
      allow read: if request.auth != null && 
        (resource.data.employeeId == request.auth.uid || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
      allow create: if request.auth != null && 
        request.resource.data.employeeId == request.auth.uid;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Salary rules
    match /salary/{salaryId} {
      allow read: if request.auth != null && 
        (resource.data.employeeId == request.auth.uid || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## Data Migration Guidelines

### When Adding New Fields:
1. **Backward Compatibility:** Always make new fields optional
2. **Default Values:** Provide sensible defaults for existing records
3. **Migration Scripts:** Create scripts to update existing documents

### Example Migration Script:
```typescript
// Add new field to existing employees
const migrateEmployees = async () => {
  const employeesRef = collection(db, 'employees');
  const snapshot = await getDocs(employeesRef);
  
  snapshot.docs.forEach(async (doc) => {
    const data = doc.data();
    if (!data.hasOwnProperty('department')) {
      await updateDoc(doc.ref, {
        department: 'General',
        position: 'Employee'
      });
    }
  });
};
```

---

## Best Practices

### 1. Data Consistency:
- Always use consistent field names across collections
- Use the same data types for similar fields
- Maintain referential integrity between collections

### 2. Performance:
- Create composite indexes for complex queries
- Use pagination for large datasets
- Implement caching for frequently accessed data

### 3. Security:
- Never store sensitive data in plain text
- Use Firebase Auth for authentication
- Implement proper access controls

### 4. Monitoring:
- Set up Firebase Analytics
- Monitor database usage and costs
- Implement error logging

---

## Collection Indexes

### Required Indexes:
```javascript
// attendance collection
{
  "employeeId": "Ascending",
  "date": "Descending"
}

// leaves collection
{
  "employeeId": "Ascending",
  "status": "Ascending",
  "appliedDate": "Descending"
}

// salary collection
{
  "employeeId": "Ascending",
  "month": "Descending"
}

// employees collection
{
  "phone": "Ascending"
}
```

---

## Backup and Recovery

### Backup Strategy:
1. **Automated Backups:** Use Firebase's built-in backup features
2. **Manual Exports:** Regular exports of critical data
3. **Version Control:** Track schema changes in code

### Recovery Procedures:
1. **Data Restoration:** Use Firebase console for point-in-time recovery
2. **Schema Migration:** Apply migration scripts after restoration
3. **Validation:** Verify data integrity after recovery

---

## Monitoring and Alerts

### Key Metrics to Monitor:
- **Read/Write Operations:** Track usage patterns
- **Error Rates:** Monitor failed operations
- **Costs:** Track database usage costs
- **Performance:** Monitor query response times

### Alert Setup:
- High error rates
- Unusual access patterns
- Cost threshold breaches
- Performance degradation

---

This database structure ensures data integrity, security, and scalability while maintaining the strict collection requirements for the HRMS application. 