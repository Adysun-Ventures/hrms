# PAN Card Validation Guide

## Overview

This document outlines the implementation of PAN (Permanent Account Number) card validation and uniqueness checking across the HRMS application. The system ensures that PAN cards are primary and unique across both enquiries and employees collections.

## Features Implemented

### 1. PAN Format Validation
- **Pattern**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Example**: `ABCDE1234F`
- **Rules**:
  - 5 uppercase letters
  - 4 digits
  - 1 uppercase letter
  - Total length: 10 characters

### 2. Uniqueness Checking
- **Scope**: Across both `enquiries` and `employees` collections
- **Case-insensitive**: All PANs are stored in uppercase
- **Real-time validation**: Checks during form submission

### 3. User Experience
- **Real-time feedback**: Shows validation errors as user types
- **Clear error messages**: Specific guidance for invalid formats
- **Required field**: PAN is now marked as required in enquiry form

## Implementation Details

### Utility Functions

Located in `src/utils/firebaseUtils.ts`:

```typescript
// Validate PAN format
export const validatePANFormat = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

// Check if PAN exists in enquiries collection
export const checkPANExistsInEnquiries = async (pan: string): Promise<boolean> => {
  // Implementation details...
};

// Check if PAN exists in employees collection
export const checkPANExistsInEmployees = async (pan: string): Promise<boolean> => {
  // Implementation details...
};

// Check if PAN exists anywhere in the system
export const checkPANExistsAnywhere = async (pan: string): Promise<boolean> => {
  // Implementation details...
};
```

### Form Integration

#### Enquiry Form (`src/app/candidate/enquiry/page.tsx`)

**Changes Made:**
1. Added PAN validation import
2. Added real-time validation state
3. Enhanced form submission with PAN checks
4. Updated UI to show validation errors
5. Made PAN field required with visual indicator

**Key Features:**
- Real-time format validation
- Uniqueness check on submission
- Clear error messages
- Uppercase normalization

#### Employee Forms

**Add Employee (`src/app/employees/add/page.tsx`):**
- PAN validation on form submission
- Uniqueness check across all collections
- Uppercase normalization before storage

**Edit Employee (`src/app/employees/[id]/edit/page.tsx`):**
- PAN validation on form submission
- Uniqueness check (allows same PAN for same employee)
- Uppercase normalization before storage

## Database Structure

### Enquiries Collection
```typescript
interface Enquiry {
  // ... other fields
  pan: string | null; // Stored in uppercase
  // ... other fields
}
```

### Employees Collection
```typescript
interface Employee {
  // ... other fields
  panCard?: string; // Stored in uppercase
  // ... other fields
}
```

## Firestore Indexes

### Required Indexes
For optimal query performance, create the following indexes in Firebase Console:

1. **Collection**: `enquiries`
   - **Field**: `pan` (Ascending)
   - **Query scope**: Collection

2. **Collection**: `employees`
   - **Field**: `panCard` (Ascending)
   - **Query scope**: Collection

### Index Setup Script
Use `scripts/setup-pan-indexes.js` to test index functionality:

```bash
node scripts/setup-pan-indexes.js
```

## Error Messages

### Format Validation
- **Invalid format**: "Please enter a valid PAN number (e.g., ABCDE1234F)"
- **Real-time feedback**: Shows as user types

### Uniqueness Validation
- **Already exists**: "This PAN number is already registered. Please use a different PAN or contact support."
- **Employee edit**: "This PAN number is already registered with another user. Please use a different PAN or contact support."

## Security Considerations

### Data Protection
- PANs are stored in uppercase for consistency
- No sensitive data exposure in error messages
- Validation happens server-side for security

### Access Control
- PAN validation functions are utility functions
- No direct database access from client-side validation
- All uniqueness checks go through Firebase security rules

## Testing

### Manual Testing Checklist

1. **Format Validation**:
   - [ ] Test valid PAN: `ABCDE1234F`
   - [ ] Test invalid PAN: `ABCD1234F` (missing letter)
   - [ ] Test invalid PAN: `ABCDE12345` (wrong format)
   - [ ] Test lowercase input: `abcde1234f` (should convert to uppercase)

2. **Uniqueness Testing**:
   - [ ] Submit enquiry with PAN
   - [ ] Try to submit another enquiry with same PAN
   - [ ] Add employee with PAN
   - [ ] Try to add another employee with same PAN
   - [ ] Edit employee to use existing PAN (should fail)
   - [ ] Edit employee to keep same PAN (should succeed)

3. **Edge Cases**:
   - [ ] Empty PAN field (should be allowed in enquiry, required in employee)
   - [ ] Special characters in PAN
   - [ ] Very long PAN numbers
   - [ ] PAN with spaces

### Automated Testing

```typescript
// Example test cases
describe('PAN Validation', () => {
  test('validates correct PAN format', () => {
    expect(validatePANFormat('ABCDE1234F')).toBe(true);
    expect(validatePANFormat('abcde1234f')).toBe(true); // Should convert to uppercase
  });

  test('rejects invalid PAN format', () => {
    expect(validatePANFormat('ABCD1234F')).toBe(false);
    expect(validatePANFormat('ABCDE12345')).toBe(false);
    expect(validatePANFormat('ABCDE1234')).toBe(false);
  });
});
```

## Performance Considerations

### Query Optimization
- Single-field indexes for PAN lookups
- Efficient uniqueness checks using `where` clauses
- Parallel queries for checking both collections

### Caching Strategy
- Consider implementing client-side caching for frequently checked PANs
- Server-side caching for validation results

## Future Enhancements

### Potential Improvements
1. **Bulk Validation**: Validate multiple PANs at once
2. **PAN Verification API**: Integrate with government PAN verification service
3. **Audit Trail**: Track PAN changes for compliance
4. **Export Functionality**: Export PAN data for reporting
5. **Advanced Search**: Search by PAN across all collections

### Monitoring
- Track validation failures for pattern analysis
- Monitor query performance for PAN lookups
- Alert on unusual PAN validation patterns

## Troubleshooting

### Common Issues

1. **Index Not Found Error**:
   - Solution: Create required Firestore indexes
   - Check Firebase Console > Firestore > Indexes

2. **Validation Not Working**:
   - Check browser console for JavaScript errors
   - Verify utility functions are properly imported
   - Test PAN format regex manually

3. **Performance Issues**:
   - Ensure indexes are built and active
   - Check network tab for slow queries
   - Consider implementing caching

### Debug Steps

1. **Check Console Logs**:
   ```javascript
   console.log('PAN validation result:', validatePANFormat('TEST123456A'));
   ```

2. **Test Database Queries**:
   ```javascript
   const exists = await checkPANExistsAnywhere('TEST123456A');
   console.log('PAN exists:', exists);
   ```

3. **Verify Indexes**:
   - Go to Firebase Console
   - Navigate to Firestore > Indexes
   - Check if required indexes are built

## Conclusion

The PAN card validation system ensures data integrity and prevents duplicate entries across the HRMS application. The implementation follows established patterns and provides a robust, user-friendly experience with proper error handling and security considerations. 