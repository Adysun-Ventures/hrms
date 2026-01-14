const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkData() {
  console.log('Checking current data state...\n');

  // Check employees
  const employeesRef = collection(db, 'employees');
  const employeesSnapshot = await getDocs(employeesRef);
  const employees = employeesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`Employees (${employees.length}):`);
  employees.forEach(emp => {
    console.log(`  ${emp.id}: ${emp.name} - employeeId: ${emp.employeeId || 'undefined'}`);
  });

  console.log('\n---\n');

  // Check employments
  const employmentsRef = collection(db, 'employments');
  const employmentsSnapshot = await getDocs(employmentsRef);
  const employments = employmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`Employments (${employments.length}):`);
  employments.forEach(emp => {
    console.log(`  ${emp.id}: employeeId=${emp.employeeId}, employmentId=${emp.employmentId}`);
  });
}

checkData().catch(console.error);

