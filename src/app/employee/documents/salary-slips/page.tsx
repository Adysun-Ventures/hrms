'use client';

import React, { useState } from 'react';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeSelf, getEmployeeSalaries } from '@/utils/firebaseUtils';
import { useEffect } from 'react';
import { Employee, Salary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { FiDownload, FiCalendar, FiDollarSign } from 'react-icons/fi';
import TableHeader from '@/components/ui/TableHeader';

interface SalarySlip {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: number;
  status: 'pending' | 'paid' | 'cancelled';
  issueDate?: string;
  documentUrl?: string;
}

export default function EmployeeSalarySlipsPage() {
  const { currentUserData, currentEmployee } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Get the current employee ID from the authentication hook
  const getCurrentEmployeeId = () => {
    // Priority: currentEmployee.id > currentUserData.id
    return currentEmployee?.id || currentUserData?.id;
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const employeeId = getCurrentEmployeeId();
      
      console.log('🔍 Current employee ID:', employeeId);
      console.log('🔍 Current user data:', currentUserData);
      console.log('🔍 Current employee data:', currentEmployee);
      
      // Debug localStorage data
      const employeeSessionId = localStorage.getItem('employeeSessionId');
      const employeeData = localStorage.getItem('employeeData');
      console.log('🔍 localStorage employeeSessionId:', employeeSessionId);
      console.log('🔍 localStorage employeeData:', employeeData);
      
      if (!employeeId) {
        console.error('No employee ID found in authentication context');
        console.error('This means the employee is not properly logged in');
        toast.error('Employee authentication required');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch employee data using employee self-access function
        const employeeData = await getEmployeeSelf(employeeId);
        setEmployee(employeeData);
        
        // Fetch salary records for the current employee from salaries collection
        const salaryData = await getEmployeeSalaries(employeeId);
        
        console.log('📊 Raw salary data received:', salaryData);
        
        // Transform salary data to salary slip format
        const transformedSalarySlips: SalarySlip[] = salaryData.map((salary: any) => {
          console.log('🔄 Processing salary record:', salary);
          
          // Extract month and year from various possible fields
          let month = '';
          let year = new Date().getFullYear();
          
          // Try different date fields that might exist in the salary data
          if (salary.issueDate) {
            const date = new Date(salary.issueDate);
            month = date.toISOString().slice(0, 7);
            year = date.getFullYear();
          } else if (salary.month && salary.year) {
            // If month and year are separate fields
            const monthNum = parseInt(salary.month);
            year = parseInt(salary.year);
            const date = new Date(year, monthNum - 1, 1); // month is 0-indexed
            month = date.toISOString().slice(0, 7);
          } else if (salary.createdAt) {
            // Use creation date as fallback
            const date = new Date(salary.createdAt);
            month = date.toISOString().slice(0, 7);
            year = date.getFullYear();
          } else {
            // Default to current month if no date info
            const now = new Date();
            month = now.toISOString().slice(0, 7);
            year = now.getFullYear();
          }
          
          console.log('📅 Extracted month/year:', { month, year, originalData: { issueDate: salary.issueDate, month: salary.month, year: salary.year, createdAt: salary.createdAt } });
          
          const transformed = {
            id: salary.id,
            employeeId: salary.employeeId,
            basicSalary: parseFloat(salary.basicSalary) || 0,
            allowances: (parseFloat(salary.da) || 0) + (parseFloat(salary.hra) || 0) + (parseFloat(salary.lta) || 0) + (parseFloat(salary.educationAllowance) || 0) + (parseFloat(salary.additionalAllowance) || 0),
            deductions: (parseFloat(salary.employerPF) || 0) + (parseFloat(salary.gratuity) || 0) + (parseFloat(salary.healthInsurance) || 0) + (parseFloat(salary.lossOfPay) || 0),
            netSalary: parseFloat(salary.basicSalary) || 0,
            month: month,
            year: year,
            status: salary.status || 'paid',
            issueDate: salary.issueDate,
            documentUrl: salary.documentUrl
          };
          
          console.log('✅ Transformed salary slip:', transformed);
          return transformed;
        });
        
        console.log('📋 Final transformed salary slips:', transformedSalarySlips);
        setSalarySlips(transformedSalarySlips);
        
      } catch (error) {
        console.error('Error fetching employee data:', error);
        toast.error('Failed to load employee data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [currentUserData, currentEmployee]);

  // Generate last 12 months for salary slips
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthYear = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      const value = date.toISOString().slice(0, 7); // YYYY-MM format
      
      months.push({
        label: monthYear,
        value: value
      });
    }
    
    return months;
  };

  const months = generateMonths();

  // Debug: Show what months are being generated
  console.log('📅 Generated months for display:', months.map(m => ({ label: m.label, value: m.value })));
  console.log('💰 Available salary slips:', salarySlips.map(s => ({ id: s.id, month: s.month, year: s.year })));

  const handleDownload = (month: string) => {
    // Find the salary slip for the selected month
    const salarySlip = salarySlips.find(slip => slip.month === month);
    
    if (salarySlip) {
      // If we have actual salary slip data, use it
      const monthLabel = months.find(m => m.value === month)?.label || month;
      toast.success(`Downloading salary slip for ${monthLabel}`);
      
      // Simulate download with actual data
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = '#';
        link.download = `salary-slip-${month}-${getCurrentEmployeeId()}.pdf`;
        link.click();
      }, 1000);
    } else {
      // Fallback for months without salary slips
      const monthLabel = months.find(m => m.value === month)?.label || month;
      toast.success(`Downloading salary slip for ${monthLabel}`);
      
      // Simulate download
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = '#';
        link.download = `salary-slip-${month}.pdf`;
        link.click();
      }, 1000);
    }
  };

  const getSalaryDetails = (month: string) => {
    const salarySlip = salarySlips.find(slip => slip.month === month);
    console.log('🔍 Looking for salary slip for month:', month);
    console.log('🔍 Available salary slip months:', salarySlips.map(s => s.month));
    console.log('🔍 Found salary slip:', salarySlip);
    return salarySlip;
  };

  if (isLoading) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Salary Slips', isCurrent: true }
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading salary slips...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!employee) {
    return (
      <EmployeeLayout
        breadcrumbItems={[
          { label: 'Dashboard', href: '/employee-dashboard' },
          { label: 'Documents', href: '/employee/documents' },
          { label: 'Salary Slips', isCurrent: true }
        ]}
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Salary Slips</h1>
            <p className="text-gray-600 mt-2">Download your monthly salary slips</p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Slips Available</h3>
              <p className="text-gray-500 mb-4">
                Your salary slips are not available at the moment. This could be because:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Your employment details are still being processed</li>
                <li>• No salary slips have been generated yet</li>
                <li>• Your profile information needs to be updated</li>
              </ul>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/employee-dashboard' },
        { label: 'Documents', href: '/employee/documents' },
        { label: 'Salary Slips', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Salary Slips"
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          showStats={true}
          backButton={{ href: '/employee/documents', label: 'Back' }}
          headerClassName="px-6 pt-6 pb-4"
        />

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-medium text-gray-900">{employee?.employeeId || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{employee.department || 'General'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Salary Slips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {months.map((month, index) => {
                // Check if we have actual salary slip data for this month
                const salaryDetails = getSalaryDetails(month.value);
                const hasSalarySlip = !!salaryDetails;
                
                return (
                  <div key={month.value} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FiCalendar className="text-gray-500 mr-2" />
                        <span className="font-medium text-gray-800">{month.label}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(month.value)}
                        className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                          hasSalarySlip 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={!hasSalarySlip}
                      >
                        <FiDownload className="mr-1" size={14} />
                        {hasSalarySlip ? 'Download' : 'Not Available'}
                      </button>
                    </div>
                    
                    {hasSalarySlip && salaryDetails && (
                      <div className="space-y-2">
                        <div className="flex text-gray-600 justify-between text-sm">
                          <span className="">Basic Salary:</span>
                          <span className="font-medium">₹{salaryDetails.basicSalary.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex text-blue-600 justify-between text-sm font-semibold">
                            <span>Net Salary:</span>
                            <span className="">₹{salaryDetails.netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!hasSalarySlip && (
                      <div className="text-xs text-gray-500">
                        No salary data available for this month
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
} 