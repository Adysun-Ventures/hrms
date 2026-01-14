/**
 * BACKUP Script: Export Enquiries to CSV
 *
 * This script backs up all enquiries from Firestore to a CSV file.
 * It preserves existing data and appends new enquiries (avoiding duplicates).
 *
 * Output: backup/enquiry.csv
 *
 * Usage: node scripts/backup-enquiries.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

// CSV file path
const backupDir = path.join(__dirname, '..', 'backup');
const csvFilePath = path.join(backupDir, 'enquiry.csv');

/**
 * Escape CSV field value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert Firestore timestamp to string
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  
  return String(timestamp);
}

/**
 * Convert enquiry object to CSV row
 */
function enquiryToCSVRow(enquiry) {
  return [
    escapeCSV(enquiry.id || ''),
    escapeCSV(enquiry.name || ''),
    escapeCSV(enquiry.mobile || ''),
    escapeCSV(enquiry.email || ''),
    escapeCSV(enquiry.pan || ''),
    escapeCSV(enquiry.technology || ''),
    escapeCSV(enquiry.role || ''),
    escapeCSV(enquiry.totalWorkExperience || ''),
    escapeCSV(enquiry.passoutYear || ''),
    escapeCSV(enquiry.message || ''),
    escapeCSV(formatTimestamp(enquiry.createdAt))
  ].join(',');
}

/**
 * Parse CSV row to object
 */
function parseCSVRow(row) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue); // Add last value
  return values;
}

/**
 * Read existing CSV file and return set of existing IDs
 */
function readExistingCSV() {
  if (!fs.existsSync(csvFilePath)) {
    return new Set();
  }
  
  try {
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length <= 1) {
      return new Set(); // Only header or empty
    }
    
    const existingIds = new Set();
    
    // Skip header row and parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]);
      if (values[0]) {
        existingIds.add(values[0]);
      }
    }
    
    return existingIds;
  } catch (error) {
    console.error('⚠️  Error reading existing CSV:', error.message);
    return new Set();
  }
}

/**
 * Write CSV file with header and data
 */
function writeCSV(enquiries, existingIds) {
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Created backup directory: ${backupDir}`);
  }
  
  const csvHeader = [
    'ID',
    'Name',
    'Mobile',
    'Email',
    'PAN',
    'Technology',
    'Role',
    'Experience',
    'Passout Year',
    'Message',
    'Created At'
  ].join(',');
  
  // Read existing CSV content if file exists
  let existingContent = '';
  if (fs.existsSync(csvFilePath)) {
    existingContent = fs.readFileSync(csvFilePath, 'utf-8');
  }
  
  // Prepare new enquiries to append
  const newEnquiries = enquiries.filter(enquiry => !existingIds.has(enquiry.id));
  
  if (newEnquiries.length === 0) {
    console.log('✅ No new enquiries to add. All enquiries already backed up.');
    return { newCount: 0, totalCount: existingIds.size };
  }
  
  // Convert new enquiries to CSV rows
  const newRows = newEnquiries.map(enquiry => enquiryToCSVRow(enquiry));
  
  // Write CSV file
  let csvContent = '';
  
  if (!existingContent || existingContent.trim() === '') {
    // New file - write header and all rows
    csvContent = csvHeader + '\n' + newRows.join('\n');
  } else {
    // Append to existing file
    csvContent = existingContent.trim();
    if (!csvContent.endsWith('\n')) {
      csvContent += '\n';
    }
    csvContent += newRows.join('\n');
  }
  
  fs.writeFileSync(csvFilePath, csvContent, 'utf-8');
  
  return { 
    newCount: newEnquiries.length, 
    totalCount: existingIds.size + newEnquiries.length 
  };
}

/**
 * Main backup function
 */
async function backupEnquiries() {
  console.log('🔄 Starting Enquiries Backup...');
  console.log('');
  
  try {
    // Read existing CSV to get IDs of already backed up enquiries
    console.log('📖 Reading existing backup file...');
    const existingIds = readExistingCSV();
    console.log(`   Found ${existingIds.size} existing enquiries in backup`);
    console.log('');
    
    // Fetch all enquiries from Firestore
    console.log('📋 Fetching enquiries from Firestore...');
    const enquiriesRef = collection(db, 'enquiries');
    const q = query(enquiriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const enquiries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        pan: data.pan || '',
        technology: data.technology || '',
        role: data.role || '',
        totalWorkExperience: data.totalWorkExperience || '',
        passoutYear: data.passoutYear || '',
        message: data.message || '',
        createdAt: data.createdAt || null
      };
    });
    
    console.log(`✅ Found ${enquiries.length} total enquiries in Firestore`);
    console.log('');
    
    // Write to CSV
    console.log('💾 Writing to CSV file...');
    const { newCount, totalCount } = writeCSV(enquiries, existingIds);
    
    console.log('');
    console.log('🎉 Backup completed successfully!');
    console.log('');
    console.log('📊 Backup Summary:');
    console.log(`   • Total enquiries in Firestore: ${enquiries.length}`);
    console.log(`   • New enquiries added: ${newCount}`);
    console.log(`   • Total enquiries in backup: ${totalCount}`);
    console.log(`   • File: ${csvFilePath}`);
    
    if (fs.existsSync(csvFilePath)) {
      const stats = fs.statSync(csvFilePath);
      console.log(`   • File size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('');
    console.log('💡 The backup preserves all existing data and appends new enquiries.');
    console.log('   Duplicate entries (by ID) are automatically avoided.');
    
    return csvFilePath;
    
  } catch (error) {
    console.error('');
    console.error('❌ Backup failed:', error);
    console.error('');
    throw error;
  }
}

// Run the backup
backupEnquiries()
  .then((filePath) => {
    console.log('');
    console.log(`✅ Backup saved to: ${filePath}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Backup failed:', error);
    process.exit(1);
  });

