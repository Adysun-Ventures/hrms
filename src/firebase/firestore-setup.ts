'use client';

import { collection, addDoc, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './config';
import { Employee, Employment } from '@/types';

/**
 * This file contains utility functions to help set up and initialize your Firestore database.
 * You can use these functions to create sample data or ensure collections exist.
 */

// Check if employees collection has data
export const checkEmployeesCollection = async (): Promise<boolean> => {
  const employeesQuery = query(collection(db, 'employees'), limit(1));
  const snapshot = await getDocs(employeesQuery);
  return !snapshot.empty;
};

// Check if employments collection has data
export const checkEmploymentsCollection = async (): Promise<boolean> => {
  const employmentsQuery = query(collection(db, 'employments'), limit(1));
  const snapshot = await getDocs(employmentsQuery);
  return !snapshot.empty;
};

// Create a sample employee
export const createSampleEmployee = async (): Promise<string> => {
  const sampleEmployee: Omit<Employee, 'id'> = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9999999999',
    position: 'Software Developer',
    department: 'Engineering',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  const docRef = await addDoc(collection(db, 'employees'), sampleEmployee);
  return docRef.id;
};

// Create a sample employment record
export const createSampleEmployment = async (employeeId: string): Promise<string> => {
  const sampleEmployment: Omit<Employment, 'id'> = {
    employeeId,
    contractType: 'full-time',
    startDate: new Date().toISOString().split('T')[0],
    salary: 50000,
    paymentFrequency: 'monthly',
    benefits: ['Health Insurance', 'Paid Leave']
  };

  const docRef = await addDoc(collection(db, 'employments'), sampleEmployment);
  return docRef.id;
};

// Initialize database with sample data if empty
export const initializeDatabase = async (): Promise<void> => {
  const hasEmployees = await checkEmployeesCollection();
  
  if (!hasEmployees) {
    console.log('Creating sample employee...');
    const employeeId = await createSampleEmployee();
    
    console.log('Creating sample employment record...');
    await createSampleEmployment(employeeId);
    
    console.log('Sample data created successfully!');
  } else {
    console.log('Database already contains data.');
  }
};

// Function to initialize Firestore security rules (for reference only)
// Note: You should set up rules in the Firebase Console
export const firestoreRulesReference = () => {
  return `
  // Example Firestore security rules
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Allow authenticated users to read and write to all collections
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
      
      // Alternative: More restrictive rules
      match /employees/{employeeId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
      
      match /employments/{employmentId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
    }
  }
  `;
}; 