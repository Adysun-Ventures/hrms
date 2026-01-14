# Employee Data Access Guide

## Overview

This guide explains how to properly access employee data in the employee dashboard for features like attendance, leaves, documents, and salary slips.

## Employee Authentication Flow

### 1. Employee Login Process

```typescript
// In AuthContext.tsx
const signInWithCredentials = async (phoneNumber: string, password: string) => {
  const userData = await checkUserByPhone(phoneNumber);
  
  if (userData.userType === 'employee') {
    if (userData.status === 'active' && userData.password === password) {
      // Store employee session
      localStorage.setItem('employeeSessionId', userData.id);
      localStorage.setItem('employeeData', JSON.stringify(userData));
      
      setCurrentEmployee(userData);
      setCurrentUserData(userData);
    }
  }
};
```

### 2. Employee ID Sources

**Primary Sources:**
- `currentUserData.id` - Employee ID from authentication context
- `currentEmployee.id` - Employee ID from current employee data

**Usage Pattern:**
```typescript
const { currentUserData, currentEmployee } = useAuth();
const employeeId = currentUserData?.id || currentEmployee?.id;
```

## Employee Data Access Functions

### 1. Employee Self-Access Functions

```typescript
// For employee profile and basic data
export const getEmployeeSelf = async (employeeId: string) => {
  // Security check: Employee can only access their own data
  if (currentEmployee.id !== employeeId) {
    throw new Error('Access denied. You can only view your own data.');
  }
  // Fetch employee data from Firestore
};

// For employee employment records
export const getEmployeeSelfEmployment = async (employeeId: string) => {
  // Security check and fetch employment data
};
```

### 2. Usage in Employee Pages

**Salary Slips Page:**
```typescript
const { currentUserData } = useAuth();

useEffect(() => {
  const fetchEmployeeData = async () => {
    if (!currentUserData) return;
    
    try {
      const employeeData = await getEmployeeSelf(currentUserData.id);
      setEmployee(employeeData);
    } catch (error) {
      toast.error('Failed to load employee data');
    }
  };

  fetchEmployeeData();
}, [currentUserData]);
```

**Attendance Page:**
```typescript
const { currentUserData } = useAuth();

useEffect(() => {
  const fetchAttendanceData = async () => {
    if (!currentUserData) return;
    
    // Fetch attendance records for this employee
    const attendanceData = await getEmployeeAttendance(currentUserData.id);
    setAttendanceRecords(attendanceData);
  };

  fetchAttendanceData();
}, [currentUserData]);
```

**Leaves Page:**
```typescript
const { currentUserData } = useAuth();

useEffect(() => {
  const fetchLeaveData = async () => {
    if (!currentUserData) return;
    
    // Fetch leave records for this employee
    const leaveData = await getEmployeeLeaves(currentUserData.id);
    setLeaveRecords(leaveData);
  };

  fetchLeaveData();
}, [currentUserData]);
```

## Document Access Patterns

### 1. Offer Letter
```typescript
// In /employee/documents/offer-letter/page.tsx
const { currentUserData } = useAuth();

const fetchOfferLetter = async () => {
  const offerLetter = await getEmployeeDocument(currentUserData.id, 'offer-letter');
  return offerLetter;
};
```

### 2. Increment Letter
```typescript
// In /employee/documents/increment-letter/page.tsx
const { currentUserData } = useAuth();

const fetchIncrementLetter = async () => {
  const incrementLetter = await getEmployeeDocument(currentUserData.id, 'increment-letter');
  return incrementLetter;
};
```

### 3. Salary Slips
```typescript
// In /employee/documents/salary-slips/page.tsx
const { currentUserData } = useAuth();

const fetchSalarySlips = async () => {
  const salarySlips = await getEmployeeSalarySlips(currentUserData.id);
  return salarySlips;
};
```

## Security Considerations

### 1. Employee Self-Access Only
```typescript
// Always use employee self-access functions
const employeeData = await getEmployeeSelf(employeeId); // ✅ Correct
const employeeData = await getEmployee(employeeId); // ❌ Wrong (requires admin)
```

### 2. Session Validation
```typescript
// Check employee session before data access
const employeeSessionId = localStorage.getItem('employeeSessionId');
const employeeData = localStorage.getItem('employeeData');

if (!employeeSessionId || !employeeData) {
  throw new Error('No employee session found. Please log in as employee first.');
}
```

### 3. Data Ownership Validation
```typescript
// Ensure employee can only access their own data
if (currentEmployee.id !== employeeId) {
  throw new Error('Access denied. You can only view your own data.');
}
```

## Implementation Checklist

### For Each Employee Page:

1. **Import Required Hooks:**
   ```typescript
   import { useAuth } from '@/context/AuthContext';
   import { getEmployeeSelf } from '@/utils/firebaseUtils';
   ```

2. **Get Employee Context:**
   ```typescript
   const { currentUserData } = useAuth();
   ```

3. **Fetch Employee Data:**
   ```typescript
   const employeeData = await getEmployeeSelf(currentUserData.id);
   ```

4. **Handle Loading States:**
   ```typescript
   const [isLoading, setIsLoading] = useState(true);
   ```

5. **Handle Errors:**
   ```typescript
   try {
     // Fetch data
   } catch (error) {
     toast.error('Failed to load data');
   }
   ```

## Common Patterns

### 1. Employee Profile Data
```typescript
const employee = currentEmployee || currentUserData;
const employeeId = employee?.id;
const employeeName = employee?.name;
const employeeEmail = employee?.email;
```

### 2. Employee Status Check
```typescript
const isEmployeeActive = currentEmployee?.status === 'active';
```

### 3. Employee Authentication Check
```typescript
useEffect(() => {
  if (!currentUserData || currentUserData.userType !== 'employee') {
    router.push('/login');
  }
}, [currentUserData, router]);
```

## Error Handling

### 1. Authentication Errors
```typescript
if (!currentUserData) {
  return <div>Please log in to access this page</div>;
}
```

### 2. Permission Errors
```typescript
if (currentUserData.userType !== 'employee') {
  return <div>Access denied. Employee access only.</div>;
}
```

### 3. Data Loading Errors
```typescript
if (isLoading) {
  return <div>Loading...</div>;
}

if (!employee) {
  return <div>No employee data found</div>;
}
```

## Best Practices

1. **Always use employee self-access functions** for employee dashboard features
2. **Validate employee session** before data access
3. **Check data ownership** to ensure security
4. **Handle loading and error states** properly
5. **Use consistent patterns** across all employee pages
6. **Implement proper authentication checks** in useEffect hooks 