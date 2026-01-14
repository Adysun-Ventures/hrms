'use client';

import React, { useState, useRef, useEffect } from "react";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CompanyDetailsForm from "./companyDetails";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";


function SalarySlipGenerator() {
  const containerRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState({});

  const handleUpdateCompanyDetails = (details) => {
    setCompanyDetails(details);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchCompanies();
        await fetchCandidates();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, "companies"));
    const companyList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCompanies(companyList);
  };

  const fetchCandidates = async () => {
    try {
      // Try fetching from 'employees' collection instead of 'candidates'
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Employees:", employeesList);
      setCandidates(employeesList);

      // Now fetch all employments for these employees
      const employmentData = {};
      for (const employee of employeesList) {
        try {
          // Query employments for this employee
          const q = query(collection(db, 'employments'), where('employeeId', '==', employee.id));
          const empSnapshot = await getDocs(q);

          if (!empSnapshot.empty) {
            // Get the most recent employment (usually there will be just one)
            const employmentsList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by startDate (descending) to get the most recent employment first
            const sortedEmployments = employmentsList.sort((a, b) => {
              return new Date(b.startDate) - new Date(a.startDate);
            });

            employmentData[employee.id] = sortedEmployments[0];
            console.log(`Found employment for ${employee.name}:`, sortedEmployments[0]);
          } else {
            console.log(`No employment found for employee: ${employee.name}`);
          }
        } catch (err) {
          console.error(`Error fetching employment for employee ${employee.id}:`, err);
        }
      }

      setEmployments(employmentData);

      if (employeesList.length === 0) {
        console.warn("No employees found in the database. Please add employees in the admin dashboard first.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Add this function to calculate days in month
  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month + 1, 0).getDate();
  };

  // Calculate salary components
  const calculateSalary = (lpa, leaves = 0, selectedMonth) => {
    // Convert inputs to numbers and provide defaults
    const lpaNum = Number(lpa) || 0;
    const leavesNum = Number(leaves) || 0;
    const monthNum = Number(selectedMonth) || new Date().getMonth();

    // Get total days in selected month
    const daysInMonth = getDaysInMonth(monthNum);

    // Calculate base annual salary
    const annualSalary = lpaNum * 100000;

    // Calculate per day salary
    const perDaySalary = (annualSalary / 12) / daysInMonth;

    // Calculate effective monthly salary after leave deductions
    const effectiveSalary = Math.max(0, (annualSalary / 12) - (perDaySalary * leavesNum));

    // Calculate components with null checks and Math.max to prevent negative values
    const monthlyBasic = Math.max(0, Math.round(effectiveSalary * 0.5));
    const da = Math.max(0, Math.round(monthlyBasic * 0.2));
    const conveyanceAllowance = Math.max(0, Math.round(1600));
    const medicalAllowance = Math.max(0, Math.round(1250));
    const cca = Math.max(0, Math.round(500));
    const otherAllowance = Math.max(0, Math.round(effectiveSalary - monthlyBasic - da - conveyanceAllowance - medicalAllowance - cca));

    // Professional tax varies by state, using standard 200 for example
    const professionalTax = 200;

    // Calculate net amount
    const totalEarnings = monthlyBasic + da + conveyanceAllowance + otherAllowance + medicalAllowance + cca;
    const totalDeductions = professionalTax;
    const netAmount = totalEarnings - totalDeductions;

    // Convert to Indian words
    const amountInWords = `Rupees ${numberToWords(netAmount)} Only`;

    return {
      basicSalary: monthlyBasic,
      da,
      conveyanceAllowance,
      otherAllowance,
      medicalAllowance,
      cca,
      professionalTax,
      otherDeductions: 0,
      amountInWords
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "company") {
      const selectedCompany = companies.find(company => company.name === value);
      if (selectedCompany) {
        setCompanyDetails(prev => ({
          ...prev,
          companyName: selectedCompany.name,
          companyAddressLine1: selectedCompany.address,
          companyColor: selectedCompany.serverColor,
          companyEmail: selectedCompany.email,
          companyPhone: selectedCompany.mobile,
          companyWebsite: selectedCompany.website,
          companyLogo: selectedCompany.logo
        }));
      }
    } else if (name === "employeeName") {
      const selectedEmployee = candidates.find(employee => employee.name === value);
      if (selectedEmployee) {
        console.log("Selected Employee:", selectedEmployee);

        // Get the employment details for this employee
        const employmentDetails = employments[selectedEmployee.id];
        console.log("Employment details:", employmentDetails);

        let employeeSalary;
        let employeeDesignation;
        let employeeDepartment;
        let employeeLocation;
        let employeePAN;

        if (employmentDetails) {
          // If we have employment details, use those
          employeeSalary = employmentDetails.salary || employmentDetails.ctc || 0;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
          employeeDepartment = employmentDetails.department;
          employeeLocation = employmentDetails.location;
          employeePAN = selectedEmployee.pan; // Usually PAN is in employee record
        } else {
          // Fallback to employee record if no employment details
          employeeSalary = selectedEmployee.salary || 0;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
          employeeDepartment = selectedEmployee.department;
          employeeLocation = selectedEmployee.location;
          employeePAN = selectedEmployee.pan;
        }

        // Calculate CTC in LPA
        const ctcValue = employeeSalary ? (employeeSalary / 100000) : 0;

        // Get current month and leaves
        const currentMonth = formData.month;
        const leaves = formData.leaves;

        // Calculate salary components
        const salaryComponents = calculateSalary(ctcValue, leaves, currentMonth);

        setCompanyDetails(prev => ({
          ...prev,
          employeeName: selectedEmployee.name,
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          designation: employeeDesignation || "",
          department: employeeDepartment || "",
          location: employeeLocation || "",
          pan: employeePAN || "",
          ...salaryComponents
        }));
      }
    } else if (name === "leaves" || name === "month") {
      // Recalculate salary when leaves or month changes
      const updatedFormData = { ...formData, [name]: value };

      // Find the selected employee to get LPA
      const selectedEmployee = candidates.find(employee => employee.name === formData.employeeName);
      if (selectedEmployee) {
        // Get the employment details
        const employmentDetails = employments[selectedEmployee.id];
        let employeeSalary;

        if (employmentDetails) {
          employeeSalary = employmentDetails.salary || employmentDetails.ctc || 0;
        } else {
          employeeSalary = selectedEmployee.salary || 0;
        }

        // Calculate CTC in LPA
        const ctcValue = employeeSalary ? (employeeSalary / 100000) : 0;

        // Calculate updated salary
        const salaryComponents = calculateSalary(
          ctcValue,
          updatedFormData.leaves,
          updatedFormData.month
        );

        setCompanyDetails({
          ...updatedFormData,
          ...salaryComponents
        });
      } else {
        setCompanyDetails(updatedFormData);
      }
    } else {
      setCompanyDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-12 mt-4 md:mt-6">
          <div className="ml-2 md:ml-4">
            <Link
              to="/"
              className="back-link flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="text-sm md:text-base">Back to Home</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <CompanyDetailsForm
            onUpdateCompanyDetails={handleUpdateCompanyDetails}
          />

          <div className="">
            {/* Removed PaySlip import */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalarySlipGenerator;
