/**
 * One-Time Migration Script: Set Employment Status to 'working'
 * 
 * This script ensures all existing employees have employmentStatus: 'working'
 * unless they are already marked as 'resigned'. It handles:
 * - undefined/null values
 * - empty strings
 * - invalid values
 * 
 * This is a one-time migration script. Run it once to update all existing employees.
 * 
 * Usage: node scripts/migrate-employment-status.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase configuration
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
 * Migrate employment status for all employees
 */
async function migrateEmploymentStatus() {
  console.log('🔄 Starting employment status migration...');
  console.log('📋 This script will set employmentStatus: "working" for all employees');
  console.log('⚠️  Employees already marked as "resigned" will be preserved\n');
  
  try {
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    console.log(`📊 Found ${snapshot.docs.length} employee records to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const validStatuses = ['working', 'resigned'];
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const employeeData = docSnapshot.data();
        const employeeId = docSnapshot.id;
        const employeeName = employeeData.name || employeeId;
        
        const updates = {};
        let needsUpdate = false;
        
        // Check employmentStatus
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
          console.log(`✅ Setting employmentStatus: 'working' for employee: ${employeeName}`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipping ${employeeName} - already has employmentStatus: ${currentStatus}`);
        }
        
        // Also ensure is_resigned is set if missing
        if (employeeData.is_resigned === undefined || employeeData.is_resigned === null || employeeData.is_resigned === '') {
          updates.is_resigned = false;
          needsUpdate = true;
          if (!updates.employmentStatus) {
            console.log(`✅ Setting is_resigned: false for employee: ${employeeName}`);
          }
        }
        
        // Update document if needed
        if (needsUpdate) {
          updates.updatedAt = new Date().toISOString();
          await updateDoc(doc(db, 'employees', employeeId), updates);
          updatedCount++;
        }
      } catch (error) {
        errorCount++;
        const employeeName = docSnapshot.data().name || docSnapshot.id;
        console.error(`❌ Error updating employee ${employeeName}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} employees`);
    console.log(`   ⏭️  Skipped: ${skippedCount} employees (already have valid status)`);
    console.log(`   ❌ Errors: ${errorCount} employees`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  }
}

// Execute the migration
migrateEmploymentStatus()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });

