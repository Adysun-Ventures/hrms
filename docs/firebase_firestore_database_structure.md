# Firebase Firestore Database Structure - Adysun HRMS

## 📊 Project Overview
- **Project Name**: adysun-hrms
- **Database Location**: asia-south1 (Mumbai region)
- **Billing Plan**: Spark (Free tier)
- **Current Usage**: 1.4K reads, 32 writes
- **Daily Active Users**: 1

---

## 🗂️ Collections Structure

### 1. **admin_sessions** Collection
**Purpose**: Manages admin authentication sessions and user sessions

#### Document Structure:
```javascript
{
  "adminEmail": "string",           // Admin email address
  "adminId": "string",              // Reference to admin document ID
  "adminMobile": "string",          // Admin mobile number
  "adminName": "string",            // Admin full name
  "createdAt": "timestamp",         // Session creation time
  "expiresAt": "timestamp",         // Session expiration time
  "isActive": "boolean"             // Session status (true/false)
}
```

#### Sample Document:
```javascript
{
  "adminEmail": "sugatraj.2106@gmail.com",
  "adminId": "67nAPSAUOK0CCoL5sBbz",
  "adminMobile": "7972908961",
  "adminName": "Sugatraj Sarwade",
  "createdAt": "2025-07-31T05:35:58.000Z",
  "expiresAt": "2025-08-01T05:35:58.000Z",
  "isActive": true
}
```

---

### 2. **admins** Collection
**Purpose**: Stores admin user information and authentication details

#### Document Structure:
```javascript
{
  "active": "boolean",              // Admin account status
  "createdAt": "timestamp",         // Account creation time
  "email": "string",                // Admin email address
  "mobile": "string",               // Admin mobile number
  "name": "string",                 // Admin full name
  "password": "string"              // Encrypted password
}
```

#### Sample Document:
```javascript
{
  "active": true,
  "createdAt": "2025-07-29T15:30:26.000Z",
  "email": "sugatraj.2106@gmail.com",
  "mobile": "7972908961",
  "name": "Sugatraj Sarwade",
  "password": "88888$$&&"
}
```

---

### 3. **employees** Collection
**Purpose**: Comprehensive employee information and personal details

#### Document Structure:
```javascript
{
  // Personal Information
  "name": "string",                 // Employee full name
  "email": "string",                // Employee email
  "phone": "string",                // Contact number
  "dateOfBirth": "string",          // Birth date (YYYY-MM-DD)
  "employeeId": "string",           // Unique employee ID
  "status": "string",               // "active" or inactive
  
  // Address Information
  "currentAddress": "string",       // Current residential address
  "permanentAddress": "string",     // Permanent address
  "homeTown": "string",             // Hometown
  
  // Banking Details
  "accountHolderName": "string",    // Bank account holder name
  "accountNo": "string",            // Bank account number
  "bankName": "string",             // Bank name
  "ifscCode": "string",             // IFSC code
  
  // Identity Documents
  "aadharCard": "string",           // Aadhar card number
  "panCard": "string",              // PAN card number
  "drivingLicense": "string",       // Driving license
  "voterID": "string",              // Voter ID
  
  // Employment Details
  "department": "string",           // Department name
  "position": "string",             // Job position
  
  // Authentication
  "password": "string",             // Encrypted password
  "confirmPassword": "string",      // Password confirmation
  
  // Education Records (Nested Objects)
  "tenthStandard": {
    "board": "string",              // Board name
    "grade": "string",              // Grade/percentage
    "marks": "string",              // Marks obtained
    "month": "string",              // Month of completion
    "passingYear": "string",        // Year of completion
    "schoolName": "string",         // School name (full name of the institution)
    "medium": "string"              // Medium of instruction
  },
  "twelthStandard": {
    "board": "string",              // Board name
    "branch": "string",             // Branch/stream
    "grade": "string",              // Grade/percentage
    "marks": "string",              // Marks obtained
    "month": "string",              // Month of completion
    "passingYear": "string",        // Year of completion
    "schoolName": "string"          // School name (full name of the institution)
  },
  "graduation": {
    "branch": "string",             // Branch/stream
    "collegeName": "string",        // College name
    "degree": "string",             // Degree name
    "grade": "string",              // Grade/percentage
    "marks": "string",              // Marks obtained
    "month": "string",              // Month of completion
    "passingYear": "string",        // Year of completion
    "universityName": "string"      // University name
  },
  "otherEducation": {
    "branch": "string",             // Branch/stream
    "collegeName": "string",        // College name
    "diploma": "string",            // Diploma name
    "grade": "string",              // Grade/percentage
    "institute": "string",          // Institute name
    "marks": "string",              // Marks obtained
    "month": "string",              // Month of completion
    "passingYear": "string"         // Year of completion
  },
  
  // Audit Fields
  "createdAt": "string",            // Record creation timestamp
  "createdBy": "string",            // Creator admin ID
  "updatedAt": "string",            // Last update timestamp
  "updatedBy": "string"             // Last updater admin ID
}
```

#### Sample Document:
```javascript
{
  "name": "Sugatraj Employee",
  "email": "sugatr.a.j2.1.0.6@gmail.com",
  "phone": "8308377308",
  "dateOfBirth": "2025-01-01",
  "employeeId": "115",
  "status": "active",
  "currentAddress": "sdadsad",
  "homeTown": "Paranda",
  "accountHolderName": "Sugat Bhimraj Sarwade",
  "accountNo": "123456789012",
  "bankName": "State Bank of India",
  "ifscCode": "SBIN0000456",
  "aadharCard": "123456789012",
  "panCard": "GHYTR5678K",
  "department": "",
  "position": "",
  "password": "77308@#$$",
  "confirmPassword": "77308@#$$",
  "graduation": {
    "branch": "",
    "collegeName": "",
    "degree": "",
    "grade": "",
    "marks": "",
    "month": "",
    "passingYear": "",
    "universityName": ""
  },
  "createdAt": "2025-07-31T06:14:52.886Z",
  "createdBy": "67nAPSAUOK0CCoL5sBbz",
  "updatedAt": "2025-08-02T17:06:15.876Z",
  "updatedBy": "67nAPSAUOK0CCoL5sBbz"
}
```

---

### 4. **employments** Collection
**Purpose**: Employment records and job details for employees

#### Document Structure:
```javascript
{
  // Employment Details
  "employmentId": "string",         // Unique employment ID
  "employeeId": "string",           // Reference to employee document
  "employmentType": "string",       // "full-time", "part-time", etc.
  "jobTitle": "string",             // Job title/position
  "department": "string",           // Department name
  "location": "string",             // Work location
  "reportingManager": "string",     // Manager name
  
  // Salary Information
  "salary": "number",               // Total salary
  "ctc": "number",                  // Cost to company
  "basic": "number",                // Basic salary
  "hra": "number",                  // House rent allowance
  "da": "number",                   // Dearness allowance
  "pf": "number",                   // Provident fund
  "specialAllowance": "number",     // Special allowance
  "medicalAllowance": "number",     // Medical allowance
  "transport": "number",            // Transport allowance
  "additionalAllowance": "number",  // Additional allowance
  "gratuity": "number",             // Gratuity amount
  "inHandCtc": "number",            // In-hand CTC
  "salaryPerMonth": "string",       // Monthly salary
  "relievingCtc": "number",         // Relieving CTC
  
  // Employment Dates
  "joiningDate": "string",          // Joining date (YYYY-MM-DD)
  "incrementDate": "string",        // Increment date (YYYY-MM-DD)
  
  // Payment Details
  "paymentFrequency": "string",     // "monthly", "weekly", etc.
  "paymentMode": "string",          // "bank-transfer", "cash", etc.
  "salaryCreditDate": "string",     // Salary credit date
  "salaryId": "string",             // Salary ID
  
  // Work Schedule
  "workSchedule": "string",         // Work timing
  "payableDays": "number",          // Payable days
  "totalLeaves": "number",          // Total leaves allocated
  
  // Employment Status
  "isResignation": "boolean",       // Resignation status
  "isIT": "string"                  // IT employee flag
}
```

#### Sample Document:
```javascript
{
  "employmentId": "111",
  "employeeId": "Do2O8A6qgwgU20AwbLCA",
  "employmentType": "full-time",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "location": "Headquarters",
  "reportingManager": "Ramesh Iyer",
  "salary": 800000,
  "ctc": 800000,
  "basic": 30000,
  "hra": 15000,
  "da": 5000,
  "pf": 3600,
  "specialAllowance": 5814,
  "medicalAllowance": 1250,
  "transport": 2000,
  "additionalAllowance": 2500,
  "gratuity": 1500,
  "inHandCtc": 58000,
  "salaryPerMonth": "66667",
  "relievingCtc": 0,
  "joiningDate": "2025-07-29",
  "incrementDate": "2025-07-29",
  "paymentFrequency": "monthly",
  "paymentMode": "bank-transfer",
  "salaryCreditDate": "1st of every month",
  "salaryId": "SAL-001",
  "workSchedule": "9:00 AM – 6:00 PM",
  "payableDays": 30,
  "totalLeaves": 24,
  "isResignation": false,
  "isIT": "true"
}
```

---

### 5. **leaves** Collection
**Purpose**: Leave management and tracking

#### Document Structure:
```javascript
{
  // Leave Details
  "employeeId": "string",           // Reference to employee document
  "type": "string",                 // "sick", "casual", "annual", etc.
  "startDate": "string",            // Leave start date (YYYY-MM-DD)
  "endDate": "string",              // Leave end date (YYYY-MM-DD)
  "totalDays": "number",            // Total leave days
  "reason": "string",               // Leave reason
  "comments": "string",             // Additional comments
  
  // Application Details
  "appliedDate": "string",          // Application date (YYYY-MM-DD)
  "status": "string",               // "pending", "approved", "rejected"
  
  // Approval Details
  "approvedBy": "string|null",      // Approver admin ID
  "approvedAt": "timestamp|null",   // Approval timestamp
  
  // Audit Fields
  "createdAt": "timestamp",         // Application creation time
  "updatedAt": "timestamp"          // Last update time
}
```

#### Sample Document:
```javascript
{
  "employeeId": "7BkDKQ8u67ljofnlvrc8",
  "type": "sick",
  "startDate": "2025-08-27",
  "endDate": "2025-09-02",
  "totalDays": 7,
  "reason": "wewretgfrasgd",
  "comments": "",
  "appliedDate": "2025-08-03",
  "status": "pending",
  "approvedBy": null,
  "approvedAt": null,
  "createdAt": "2025-08-03T08:50:55.000Z",
  "updatedAt": "2025-08-03T08:50:55.000Z"
}
```

---

### 6. **salaries** Collection
**Purpose**: Monthly salary records and payroll management

#### Document Structure:
```javascript
{
  // Employee Reference
  "employeeId": "string",           // Reference to employee document
  "employmentId": "string",         // Reference to employment document
  
  // Salary Period
  "year": "string",                 // Salary year
  "month": "string",                // Salary month
  
  // Basic Salary Components
  "basicSalary": "string",          // Basic salary amount
  "hra": "number",                  // House rent allowance
  "da": "number",                   // Dearness allowance
  "specialAllowance": "number",     // Special allowance
  "medicalAllowance": "number",     // Medical allowance
  "transportAllowance": "number",   // Transport allowance
  "additionalAllowance": "number",  // Additional allowance
  "educationAllowance": "number",   // Education allowance
  "lta": "number",                  // Leave travel allowance
  
  // Deductions
  "pf": "number",                   // Provident fund
  "employerPF": "number",           // Employer PF contribution
  "gratuity": "number",             // Gratuity
  "statutoryBonus": "number",       // Statutory bonus
  "lossOfPay": "number",            // Loss of pay
  
  // Benefits
  "healthInsurance": "number",      // Health insurance
  "monthlyReimbursement": "number", // Monthly reimbursement
  
  // Salary Totals
  "totalSalary": "string",          // Total salary
  "netSalary": "string",            // Net salary after deductions
  
  // Working Days
  "totalWorkingDays": "number",     // Total working days
  "paidDays": "number",             // Paid days
  
  // Payment Details
  "paymentFrequency": "string",     // "monthly", "weekly", etc.
  "paymentMode": "string",          // Payment mode
  "salaryCreditDate": "string",     // Salary credit date
  "paidDate": "string",             // Date when paid
  "issueDate": "string",            // Issue date
  
  // Document
  "documentUrl": "string",          // Salary slip document URL
  
  // Status
  "status": "string",               // "draft", "paid", "pending"
  
  // Audit Fields
  "createdAt": "string",            // Record creation timestamp
  "createdBy": "string",            // Creator admin ID
  "updatedAt": "string",            // Last update timestamp
  "updatedBy": "string"             // Last updater admin ID
}
```

#### Sample Document:
```javascript
{
  "employeeId": "7BkDKQ8u67ljofnlvrc8",
  "employmentId": "Gc26vQybJpheNv1pMyQZ",
  "year": "2026",
  "month": "3",
  "basicSalary": "429",
  "hra": 0,
  "da": 0,
  "specialAllowance": 0,
  "medicalAllowance": 0,
  "transportAllowance": 0,
  "additionalAllowance": 0,
  "educationAllowance": 0,
  "lta": 0,
  "pf": 0,
  "employerPF": 0,
  "gratuity": 0,
  "statutoryBonus": 0,
  "lossOfPay": 0,
  "healthInsurance": 0,
  "monthlyReimbursement": 0,
  "totalSalary": "195",
  "netSalary": "448",
  "totalWorkingDays": 0,
  "paidDays": 0,
  "paymentFrequency": "monthly",
  "paymentMode": "",
  "salaryCreditDate": "",
  "paidDate": "",
  "issueDate": "",
  "documentUrl": "",
  "status": "draft",
  "createdAt": "2025-08-02T17:07:05.730Z",
  "createdBy": "67nAPSAUOK0CCoL5sBbz",
  "updatedAt": "2025-08-02T17:07:05.730Z",
  "updatedBy": "67nAPSAUOK0CCoL5sBbz"
}
```

---

## 🔗 Collection Relationships & Connections

### Primary Relationships:

1. **Admin Authentication Flow**:
   ```
   admins → admin_sessions
   ```
   - `admins.id` → `admin_sessions.adminId`
   - Used for session management and authentication

2. **Employee Management Flow**:
   ```
   employees → employments → salaries
   ```
   - `employees.id` → `employments.employeeId`
   - `employments.id` → `salaries.employmentId`
   - `employees.id` → `salaries.employeeId`

3. **Leave Management Flow**:
   ```
   employees → leaves
   ```
   - `employees.id` → `leaves.employeeId`

4. **Audit Trail Connections**:
   ```
   admins → (createdBy/updatedBy) → all collections
   ```
   - `admins.id` → `employees.createdBy/updatedBy`
   - `admins.id` → `employments.createdBy/updatedBy`
   - `admins.id` → `salaries.createdBy/updatedBy`
   - `admins.id` → `leaves.approvedBy`

### Data Flow Architecture:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   admins    │───▶│admin_sessions│    │  employees  │
└─────────────┘    └──────────────┘    └─────────────┘
       │                                        │
       │                                        │
       ▼                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  employments│◀───│   salaries  │    │    leaves   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Key Connection Points:

1. **Employee ID References**:
   - `employees.id` is referenced in:
     - `employments.employeeId`
     - `salaries.employeeId`
     - `leaves.employeeId`

2. **Employment ID References**:
   - `employments.id` is referenced in:
     - `salaries.employmentId`

3. **Admin ID References**:
   - `admins.id` is referenced in:
     - `admin_sessions.adminId`
     - All audit fields (`createdBy`, `updatedBy`, `approvedBy`)

---

## 🔐 Security & Access Control

### Security Features:
- **App Check**: Recommended for protection against abuse
- **Custom Rules**: Firestore security rules
- **Authentication**: Integrated with Firebase Auth
- **Session Management**: Admin sessions with expiration

### Data Protection:
- **Encrypted Passwords**: Stored in encrypted format
- **Session Expiration**: Automatic session cleanup
- **Audit Trail**: Complete tracking of all changes
- **Access Control**: Role-based access through admin sessions

---

## 📈 Usage Statistics

### Current Usage:
- **Reads**: 1.4K (current period)
- **Writes**: 32 (current period)
- **Daily Active Users**: 1
- **Database Location**: asia-south1 (Mumbai region)

### Performance Metrics:
- **Response Time**: Optimized for real-time operations
- **Scalability**: Designed for horizontal scaling
- **Backup**: Automatic backup and disaster recovery

---

## 🎯 Key Features & Capabilities

### 1. **Comprehensive Employee Management**:
- Complete personal information storage
- Educational background tracking
- Banking and identity document management
- Employment history and status tracking

### 2. **Advanced Payroll System**:
- Detailed salary component breakdown
- Multiple allowance types
- Deduction tracking
- Payment status management

### 3. **Leave Management**:
- Multiple leave types support
- Approval workflow
- Leave balance tracking
- Status management

### 4. **Admin Control**:
- Multi-admin support
- Session management
- Audit trail for all operations
- Role-based access control

### 5. **Data Integrity**:
- Referential integrity through document references
- Timestamp tracking for all operations
- User tracking for all changes
- Status management for all records

---

## 🚀 Scalability Considerations

### Current Structure Benefits:
1. **NoSQL Flexibility**: Easy to add new fields without schema changes
2. **Document References**: Efficient data relationships
3. **Nested Objects**: Organized data structure for complex information
4. **Audit Trail**: Complete change tracking
5. **Session Management**: Secure authentication flow

### Future Enhancement Possibilities:
1. **Attendance Tracking**: New collection for daily attendance
2. **Performance Reviews**: Employee performance evaluation system
3. **Training Records**: Employee training and certification tracking
4. **Asset Management**: Company asset allocation to employees
5. **Expense Management**: Employee expense tracking and reimbursement

---

## 📋 Database Rules & Best Practices

### Data Validation:
- Required fields validation
- Data type consistency
- Reference integrity maintenance
- Status field validation

### Security Rules:
- Admin-only access for sensitive operations
- Employee data access restrictions
- Session-based authentication
- Audit trail maintenance

### Performance Optimization:
- Indexed queries on frequently accessed fields
- Efficient document structure
- Minimal data duplication
- Optimized read/write operations

---

*This database structure supports a comprehensive HR Management System with proper data organization, security, audit capabilities, and scalability for future enhancements.* 