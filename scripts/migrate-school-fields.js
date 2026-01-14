/**
 * Migration Script: Consolidate School Fields
 * 
 * This script migrates data from the 'school' field to the 'schoolName' field
 * where schoolName is not already populated. This is part of an effort to
 * consolidate redundant fields in the database.
 */

// Using require instead of import for better compatibility with Node.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');

// Firebase configuration directly included to avoid import issues
const firebaseConfig = {
  apiKey: "AIzaSyCHNx1oTFKeC88VWneyRuDvWtzcpMpPew0",
  authDomain: "adysun-hrms.firebaseapp.com",
  projectId: "adysun-hrms",
  storageBucket: "adysun-hrms.firebasestorage.app",
  messagingSenderId: "481182176506",
  appId: "1:481182176506:web:85848f6acd565f1b1e6543",
  measurementId: "G-VY9WBFGBM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Migrate school fields from 'school' to 'schoolName' where needed
 */
async function migrateSchoolFields() {
  console.log('Starting school fields migration...');
  
  try {
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    console.log(`Found ${snapshot.docs.length} employee records to process`);
    
    let migratedCount = 0;
    
    for (const doc of snapshot.docs) {
      const employee = doc.data();
      let updates = {};
      
      // Migrate 10th standard data
      if (employee.tenthStandard) {
        if (!employee.tenthStandard.schoolName && employee.tenthStandard.school) {
          updates['tenthStandard.schoolName'] = employee.tenthStandard.school;
          console.log(`Migrating 10th standard school for employee ${employee.name || doc.id}`);
        }
      }
      
      // Migrate 12th standard data
      if (employee.twelthStandard) {
        if (!employee.twelthStandard.schoolName && employee.twelthStandard.school) {
          updates['twelthStandard.schoolName'] = employee.twelthStandard.school;
          console.log(`Migrating 12th standard school for employee ${employee.name || doc.id}`);
        }
      }
      
      // Migrate secondary education array
      if (employee.secondaryEducation && employee.secondaryEducation.length > 0) {
        employee.secondaryEducation.forEach((entry, index) => {
          if (entry.twelthData && !entry.twelthData.schoolName && entry.twelthData.school) {
            updates[`secondaryEducation.${index}.twelthData.schoolName`] = entry.twelthData.school;
            console.log(`Migrating secondary education school for employee ${employee.name || doc.id}`);
          }
        });
      }
      
      // Update document if needed
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc.ref, updates);
        migratedCount++;
      }
    }
    
    console.log(`Migration complete. Updated ${migratedCount} employee records.`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Execute the migration
migrateSchoolFields().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
