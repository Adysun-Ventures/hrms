/**
 * One-Time Migration Script: Normalize Employee Type Values
 * 
 * This script updates all employeeType values to only 'internal' or 'external'.
 * It handles old data patterns like:
 * - "Insider" -> "internal"
 * - "insider" -> "internal"
 * - "Internal" -> "internal"
 * - "External" -> "external"
 * - null/undefined -> "internal" (default)
 * 
 * Usage: node scripts/migrate-employee-type.js
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
 * Map old employeeType values to new standardized values
 */
function normalizeEmployeeType(value) {
  if (!value || value === null || value === undefined || value === '') {
    return 'internal'; // Default to internal
  }
  
  const normalized = String(value).toLowerCase().trim();
  
  // Mapping old values to new values
  const mapping = {
    'insider': 'internal',
    'internal': 'internal',
    'external': 'external',
    'extern': 'external',
    'out': 'external',
    'outsider': 'external',
  };
  
  return mapping[normalized] || 'internal'; // Default to internal if unknown
}

/**
 * Migrate employee type for all employees
 */
async function migrateEmployeeType() {
  console.log('🔄 Starting employee type migration...');
  console.log('📋 This script will normalize all employeeType values to "internal" or "external"');
  console.log('⚠️  Mapping: "Insider" -> "internal", "External" -> "external"\n');
  
  try {
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    console.log(`📊 Found ${snapshot.docs.length} employee records to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const updateLog = [];
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const employeeData = docSnapshot.data();
        const employeeId = docSnapshot.id;
        const employeeName = employeeData.name || employeeId;
        const currentType = employeeData.employeeType;
        
        const normalizedType = normalizeEmployeeType(currentType);
        
        // Check if update is needed
        if (currentType !== normalizedType) {
          const updates = {
            employeeType: normalizedType,
            updatedAt: new Date().toISOString()
          };
          
          await updateDoc(doc(db, 'employees', employeeId), updates);
          updatedCount++;
          
          updateLog.push({
            name: employeeName,
            old: currentType || '(empty)',
            new: normalizedType
          });
          
          console.log(`✅ Updated ${employeeName}: "${currentType || '(empty)'}" -> "${normalizedType}"`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipping ${employeeName} - already has correct type: "${currentType}"`);
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
    console.log(`   ⏭️  Skipped: ${skippedCount} employees (already correct)`);
    console.log(`   ❌ Errors: ${errorCount} employees`);
    console.log('='.repeat(60));
    
    if (updateLog.length > 0) {
      console.log('\n📝 Update Details:');
      updateLog.forEach(({ name, old, new: newType }) => {
        console.log(`   • ${name}: "${old}" -> "${newType}"`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  }
}

// Execute the migration
migrateEmployeeType()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });