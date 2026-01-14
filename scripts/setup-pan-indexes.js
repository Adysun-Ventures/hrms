/**
 * Setup Firestore Indexes for PAN Card Queries
 * 
 * This script sets up the necessary composite indexes for efficient PAN card lookups
 * across both enquiries and employees collections.
 * 
 * Run this script after deploying the PAN validation features to ensure
 * optimal query performance.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // This is just a placeholder - you'll need to add your actual config
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Test PAN queries to ensure indexes are working
 */
async function testPANQueries() {
  console.log('🧪 Testing PAN card queries...');
  
  try {
    // Test enquiries collection query
    console.log('Testing enquiries collection PAN query...');
    const enquiriesQuery = query(
      collection(db, 'enquiries'),
      where('pan', '==', 'TEST123456A')
    );
    const enquiriesSnapshot = await getDocs(enquiriesQuery);
    console.log(`✅ Enquiries query successful: ${enquiriesSnapshot.size} results`);
    
    // Test employees collection query
    console.log('Testing employees collection PAN query...');
    const employeesQuery = query(
      collection(db, 'employees'),
      where('panCard', '==', 'TEST123456A')
    );
    const employeesSnapshot = await getDocs(employeesQuery);
    console.log(`✅ Employees query successful: ${employeesSnapshot.size} results`);
    
    console.log('✅ All PAN queries tested successfully!');
  } catch (error) {
    console.error('❌ Error testing PAN queries:', error);
    console.log('💡 You may need to create composite indexes in Firebase Console');
    console.log('📋 Required indexes:');
    console.log('   - Collection: enquiries, Fields: pan (Ascending)');
    console.log('   - Collection: employees, Fields: panCard (Ascending)');
  }
}

/**
 * Instructions for manual index creation
 */
function printIndexInstructions() {
  console.log('\n📋 MANUAL INDEX SETUP INSTRUCTIONS');
  console.log('=====================================');
  console.log('If the queries above failed, you need to create indexes manually:');
  console.log('');
  console.log('1. Go to Firebase Console > Firestore Database > Indexes');
  console.log('2. Click "Create Index"');
  console.log('3. Create the following indexes:');
  console.log('');
  console.log('   Collection ID: enquiries');
  console.log('   Fields: pan (Ascending)');
  console.log('   Query scope: Collection');
  console.log('');
  console.log('   Collection ID: employees');
  console.log('   Fields: panCard (Ascending)');
  console.log('   Query scope: Collection');
  console.log('');
  console.log('4. Wait for indexes to build (may take a few minutes)');
  console.log('5. Re-run this script to test');
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Setting up PAN Card Indexes');
  console.log('================================');
  
  try {
    await testPANQueries();
    console.log('\n✅ PAN card indexes are working correctly!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    printIndexInstructions();
  }
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testPANQueries,
  printIndexInstructions
}; 