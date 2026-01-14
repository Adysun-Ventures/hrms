# Firestore Rules Breakdown & Explanation

## Quick Reference

- **Status**: TEMPORARY - For testing custom Mobile + Password authentication
- **Security Level**: LOW - Allows all access (not production ready)
- **Next Steps**: Implement proper session validation for production

## Collections Covered

- ✅ `/admins` - Admin user data
- ✅ `/admin_sessions` - Custom authentication sessions
- ✅ `/employees` - Employee records
- ✅ `/employments` - Employment records
- ✅ `/companies` - Company data
- ✅ `/candidates` - Candidate data
- ✅ `/banks` - Bank information
- ✅ `/documents` - Document storage

## History

- **Today**: Simplified rules for custom authentication testing
- **Previous**: Complex rules with Firebase Auth checks (caused permission errors)

## Rule Analysis

### 1. Admin Collection (`/admins/{adminId}`)
- **Purpose**: Allows login system to check admin credentials
- **Access**: Public read access (`allow read: if true`)
- **Why**: Login needs to verify admin credentials without authentication
- **Security Impact**: LOW - Only read access, no sensitive data exposure

### 2. Admin Sessions Collection (`/admin_sessions/{sessionId}`)
- **Purpose**: Stores custom authentication sessions for Mobile + Password auth
- **Access**: Public read/write access (`allow read, write: if true`)
- **Why**: Custom authentication system needs to create and read sessions
- **Security Impact**: MEDIUM - Session data accessible, but temporary

### 3. All Other Collections (`/{document=**}`)
- **Purpose**: Temporary rule to allow all access for testing
- **Access**: Public read/write access (`allow read, write: if true`)
- **Why**: Custom authentication bypasses Firebase Auth, so we temporarily allow all access
- **Security Impact**: HIGH - Allows all operations (temporary only)

## Collections Covered

- ✅ `/admins` - Admin user data
- ✅ `/admin_sessions` - Custom authentication sessions
- ✅ `/employees` - Employee records
- ✅ `/employments` - Employment records
- ✅ `/companies` - Company data
- ✅ `/candidates` - Candidate data
- ✅ `/banks` - Bank information
- ✅ `/documents` - Document storage

## Security Considerations

### Current Status
- **Environment**: Development/Testing
- **Security Level**: LOW (temporary)
- **Authentication**: Custom Mobile + Password
- **Firebase Auth**: Bypassed

### Production Requirements
- **Session Validation**: Implement proper session checks
- **Access Control**: Restrict based on valid sessions
- **Data Protection**: Encrypt sensitive data
- **Audit Logging**: Track all operations

## Rule History

### Previous Rules (Complex)
```javascript
// This caused permission errors
allow read, write: if 
  request.auth != null || 
  exists(/databases/$(database)/documents/admin_sessions/$(request.auth.uid)) ||
  resource.data != null;
```

### Current Rules (Simple)
```javascript
// This allows custom authentication to work
allow read, write: if true;
```

## Next Steps for Production

1. **Implement Session Validation**: Check if admin session exists and is valid
2. **Add Time-based Expiry**: Sessions should expire after certain time
3. **Restrict Access**: Only allow access to authenticated sessions
4. **Add Audit Trail**: Log all operations for security monitoring
5. **Encrypt Sensitive Data**: Protect employee and company information

## Custom Authentication Flow

```
1. User enters Mobile + Password
2. Check /admins collection for credentials
3. If valid → Create session in /admin_sessions
4. Store session ID in localStorage
5. All subsequent requests use session for access
```

## Troubleshooting

### Common Issues
- **Permission Denied**: Check if session exists in localStorage
- **Session Expired**: Re-login to create new session
- **Admin Not Found**: Verify admin exists in /admins collection

### Debug Steps
1. Check browser localStorage for `adminSessionId`
2. Verify session exists in Firestore `/admin_sessions`
3. Check admin credentials in `/admins` collection
4. Ensure Firestore rules allow the operation 