rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read admins collection for login check
    match /admins/{adminId} {
      allow read: if true;
    }
    
    // Allow admin sessions to be created/read
    match /admin_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // TEMPORARY: Allow all access for testing custom authentication
    // This will let your Mobile + Password authentication work
    match /{document=**} {
      allow read, write: if true;
    }
  }
}