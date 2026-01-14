/**
 * BACKUP Script: Export all Employees and Employments to JSON
 *
 * This script creates a complete backup of all employee and employment data
 * with their relationships preserved. Use this before running any migrations.
 *
 * Output: backup-employees-employments-[timestamp].json
 *
 * Usage: node scripts/backup-employees-employments.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

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

async function createBackup() {
  console.log('🔄 Starting Data Backup...');
  console.log('⚠️  This will export ALL employee and employment data');
  console.log('');

  try {
    // Fetch all employees
    console.log('📋 Fetching employees...');
    const employeesRef = collection(db, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${employees.length} employees`);

    // Fetch all employments
    console.log('📋 Fetching employments...');
    const employmentsRef = collection(db, 'employments');
    const employmentsSnapshot = await getDocs(employmentsRef);
    const employments = employmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${employments.length} employments`);

    // Create linked data structure
    console.log('🔗 Creating linked data structure...');

    const linkedEmployees = employees.map(employee => {
      // Find employments for this employee
      const employeeEmployments = employments.filter(emp =>
        emp.employeeId === employee.id
      );

      return {
        ...employee,
        employments: employeeEmployments
      };
    });

    // Create backup object
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalEmployees: employees.length,
        totalEmployments: employments.length,
        version: '1.0',
        description: 'Complete backup of employees and their employments'
      },
      employees: linkedEmployees,
      // Also include raw data for restoration
      rawData: {
        employees: employees,
        employments: employments
      }
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-employees-employments-${timestamp}.json`;

    // Write to file
    console.log('💾 Writing backup file...');
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

    console.log('');
    console.log('🎉 Backup completed successfully!');
    console.log('');
    console.log('📊 Backup Summary:');
    console.log(`   • Employees: ${employees.length}`);
    console.log(`   • Employments: ${employments.length}`);
    console.log(`   • File: ${filename}`);
    console.log(`   • Size: ${fs.statSync(filename).size} bytes`);
    console.log('');
    console.log('💡 The backup includes:');
    console.log('   • Linked data (employees with their employments)');
    console.log('   • Raw data (separate arrays for restoration)');
    console.log('   • Metadata (timestamp, counts, version)');
    console.log('');
    console.log('🛡️  You can now safely run migrations!');

    return filename;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Run the backup
createBackup().then((filename) => {
  console.log('');
  console.log(`✅ Backup saved as: ${filename}`);
  process.exit(0);
}).catch((error) => {
  console.error('💥 Backup failed:', error);
  process.exit(1);
});
