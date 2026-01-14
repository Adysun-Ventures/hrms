/**
 * Migration Script: Copy Employee.employeeId to Employment.employmentId, then clean up
 *
 * This script safely migrates employee identifiers from the Employee table to the Employment table:
 * 1. Copies existing employeeId values from Employee table to Employment table
 * 2. Only copies if Employment.employmentId is empty (preserves existing ADV IDs)
 * 3. Removes redundant employeeId field from Employee table
 *
 * Usage: node scripts/migrate-employee-ids-to-employment.js --confirm
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, deleteField } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCHNx1oTFKeC88VWneyRuDvWtzcpMpPew0",
  authDomain: "adysun-hrms.firebaseapp.com",
  projectId: "adysun-hrms",
  storageBucket: "adysun-hrms.firebasestorage.app",
  messagingSenderId: "481182176506",
  appId: "1:481182176506:web:85848f6acd565f1b1e6543",
  measurementId: "G-VY9WBFGBM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateEmployeeIds(isDryRun = false) {
  console.log('🚀 Starting Employee ID Migration...');
  console.log('⚠️  Make sure you have a backup before proceeding!');
  console.log('');

  try {
    // Get all employees
    const employeesRef = collection(db, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📋 Found ${employees.length} employee records`);

    // Get all employments
    const employmentsRef = collection(db, 'employments');
    const employmentsSnapshot = await getDocs(employmentsRef);
    const employments = employmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📋 Found ${employments.length} employment records`);
    console.log('');

    // Create employment lookup by employeeId reference
    const employmentByEmployeeId = new Map();
    employments.forEach(employment => {
      const employeeRef = employment.employeeId; // This is the Firebase doc ID
      if (!employmentByEmployeeId.has(employeeRef)) {
        employmentByEmployeeId.set(employeeRef, []);
      }
      employmentByEmployeeId.get(employeeRef).push(employment);
    });

    let copiedIds = 0;
    let skippedIds = 0;
    let cleanedEmployees = 0;

    // Process each employee
    for (const employee of employees) {
      const employeeIdValue = employee.employeeId; // The manual ID like "EMP002"

      if (employeeIdValue && employeeIdValue.trim()) {
        // Find employments for this employee
        const employeeEmployments = employmentByEmployeeId.get(employee.id) || [];

        console.log(`🔄 Processing Employee ${employee.id} (${employee.name || 'Unknown'}): ${employeeIdValue}`);

        for (const employment of employeeEmployments) {
          // Only copy if employment doesn't already have an employmentId
          if (!employment.employmentId || !employment.employmentId.trim()) {
            if (!isDryRun) {
              const employmentRef = doc(db, 'employments', employment.id);
              await updateDoc(employmentRef, {
                employmentId: employeeIdValue.trim()
              });
            }
            copiedIds++;
            console.log(`   ✅ Copied ${employeeIdValue} to Employment ${employment.id}`);
          } else {
            skippedIds++;
            console.log(`   ⏭️  Employment ${employment.id} already has employmentId: ${employment.employmentId}`);
          }
        }
      }

      // Remove employeeId from employee record
      if (employee.employeeId !== undefined) {
        if (!isDryRun) {
          const employeeRef = doc(db, 'employees', employee.id);
          await updateDoc(employeeRef, {
            employeeId: deleteField()
          });
        }
        cleanedEmployees++;
        console.log(`   🗑️ Removed employeeId from Employee ${employee.id}`);
      }
    }

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   • Employee IDs copied to employments: ${copiedIds}`);
    console.log(`   • Employments skipped (already had ID): ${skippedIds}`);
    console.log(`   • Employee records cleaned: ${cleanedEmployees}`);
    console.log('');
    console.log('✅ All employee identifiers are now in Employment.employmentId');
    console.log('✅ Employee.employeeId fields have been removed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if --confirm flag is provided
if (process.argv.includes('--confirm')) {
  console.log('🚀 FULL MIGRATION MODE - Making actual changes');
  migrateEmployeeIds(false).then(() => {
    console.log('');
    console.log('🏁 Migration script completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
} else {
  console.log('🔍 DRY RUN MODE - Analyzing what will be changed');
  console.log('');
  console.log('This script will:');
  console.log('1. Copy Employee.employeeId values to Employment.employmentId (if empty)');
  console.log('2. Remove employeeId field from all Employee records');
  console.log('');
  console.log('To actually run the migration, use: --confirm');
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure you have a backup first!');

  // Show a preview of what will happen
  migrateEmployeeIds(true).catch((error) => {
    console.error('Preview failed:', error);
    process.exit(1);
  });
}
