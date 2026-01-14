import { db, storage } from '@/firebase/config';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Document, Company, Employee } from '@/types';

// Document related functions
export const getDocument = async (id: string): Promise<Document> => {
  const docRef = doc(db, 'documents', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Document not found');
  }
  
  return { id: docSnap.id, ...docSnap.data() } as Document;
};

export const getDocuments = async (): Promise<Document[]> => {
  const querySnapshot = await getDocs(collection(db, 'documents'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Document);
};

export const getEmployeeDocuments = async (employeeId: string): Promise<Document[]> => {
  const q = query(collection(db, 'documents'), where('employeeId', '==', employeeId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Document);
};

export const addDocument = async (document: Omit<Document, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'documents'), document);
  return docRef.id;
};

export const updateDocument = async (id: string, document: Partial<Document>): Promise<void> => {
  await updateDoc(doc(db, 'documents', id), document);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'documents', id));
};

// Employee related functions
export const getEmployee = async (id: string): Promise<Employee> => {
  const docRef = doc(db, 'employees', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Employee not found');
  }
  
  return { id: docSnap.id, ...docSnap.data() } as Employee;
};

export const getEmployees = async (): Promise<Employee[]> => {
  const querySnapshot = await getDocs(collection(db, 'employees'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Employee);
};

// Company related functions
export const getCompany = async (id: string): Promise<Company> => {
  try {
    const docRef = doc(db, 'companies', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create a default company if none exists with the provided ID
      const defaultCompany: Omit<Company, 'id'> = {
        name: 'Adysun Technologies',
        address: '123 Tech Park, Bangalore, Karnataka, India',
        mobile: '+91 9876543210',
        email: 'contact@adysun.com',
        website: 'www.adysun.com',
        logo: '',
        signatureLogo: '',
        hrName: 'HR Manager',
        hrDesignation: 'Head - HR Department',
        hrEmail: 'contact@adysun.com'
      };
      
      // Add the company to the database
      const newCompanyRef = await addDoc(collection(db, 'companies'), defaultCompany);
      
      // Return the newly created company
      return { id: newCompanyRef.id, ...defaultCompany };
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Company;
  } catch (error) {
    console.error('Error in getCompany:', error);
    throw new Error('Failed to get or create company');
  }
};

export const getCompanies = async (): Promise<Company[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    const companies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Company);
    
    // If no companies exist, create a default one
    if (companies.length === 0) {
      const defaultCompany = await getCompany('default');
      return [defaultCompany];
    }
    
    return companies;
  } catch (error) {
    console.error('Error in getCompanies:', error);
    throw new Error('Failed to get companies');
  }
};

export const addCompany = async (company: Omit<Company, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies'), company);
    return docRef.id;
  } catch (error) {
    console.error('Error in addCompany:', error);
    throw new Error('Failed to add company');
  }
};

export const updateCompany = async (id: string, company: Partial<Company>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'companies', id), company);
  } catch (error) {
    console.error('Error in updateCompany:', error);
    throw new Error('Failed to update company');
  }
};

export const deleteCompany = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'companies', id));
  } catch (error) {
    console.error('Error in deleteCompany:', error);
    throw new Error('Failed to delete company');
  }
};

// Calculate monthly salary slip components
export const calculateSalarySlipComponents = (salary: number) => {
  // Base calculations
  const basic = Math.round(salary * 0.40); // 40% of salary
  const hra = Math.round(basic * 0.50); // 50% of basic
  const specialAllowance = salary - (basic + hra);
  
  // Deductions
  const pf = Math.min(Math.round(basic * 0.12), 1800); // 12% of basic, max 1800
  const pt = 200; // Professional Tax, fixed
  
  // Calculate net salary
  const totalEarnings = basic + hra + specialAllowance;
  const totalDeductions = pf + pt;
  const netSalary = totalEarnings - totalDeductions;
  
  return {
    earnings: {
      basic,
      hra,
      specialAllowance
    },
    deductions: {
      pf,
      pt
    },
    totalEarnings,
    totalDeductions,
    netSalary
  };
};

// Calculate salary components for offer letter
export const calculateSalaryComponents = (lpa: number) => {
  const annualSalary = lpa * 100000;

  // Calculate components based on annual salary
  const basic = Math.round(annualSalary * 0.35); // 35% of CTC
  const da = Math.round(annualSalary * 0.30); // 30% of CTC
  const conveyance = Math.round(annualSalary * 0.20); // 20% of CTC
  const otherAllowance = Math.round(annualSalary * 0.15); // 15% of CTC

  // Monthly calculations
  const monthlyBasic = Math.round(basic / 12);
  const monthlyDA = Math.round(da / 12);
  const monthlyConveyance = Math.round(conveyance / 12);
  const monthlyOther = Math.round(otherAllowance / 12);
  const monthlyTotal = monthlyBasic + monthlyDA + monthlyConveyance + monthlyOther;

  // Convert number to words for salary in words
  const numberToWords = (num: number) => {
    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const formatTens = (num: number) => {
      if (num < 10) return single[num];
      if (num < 20) return double[num - 10];
      return tens[Math.floor(num / 10)] + (num % 10 ? " " + single[num % 10] : "");
    };

    if (num === 0) return "Zero";
    const convert = (num: number): string => {
      if (num < 100) return formatTens(num);
      if (num < 1000) return single[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + formatTens(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
      return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
    };

    return convert(Math.floor(num));
  };

  return {
    annual: {
      basic,
      da,
      conveyance,
      otherAllowance,
      total: annualSalary
    },
    monthly: {
      basic: monthlyBasic,
      da: monthlyDA,
      conveyance: monthlyConveyance,
      otherAllowance: monthlyOther,
      total: monthlyTotal
    },
    lpa,
    salaryInWords: `${numberToWords(lpa)} Lakh`,
  };
}; 