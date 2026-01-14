'use client';

import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const CompanyDetailsForm = ({ onUpdateCompanyDetails }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [attendance, setAttendance] = useState({
    leaves: 0
  });

  useEffect(() => {
    fetchCompanies();
    fetchCandidates();
  }, []);

  const [companies, setCompanies] = useState([]);
  
  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, "companies"));
    const companyList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCompanies(companyList);
  };

  const fetchCandidates = async () => {
    const querySnapshot = await getDocs(collection(db, "candidates"));
    const candidateList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCandidates(candidateList);
  };

  const [companyDetails, setCompanyDetails] = useState({
    empCode: "",
    employeeName: "",
    designation: "",
    pan: "",
    location: "",
    doj: "",
    department: "",
    payableDays: "",
    lpa: "",
    basic: "",
    da: "",
    conveyanceAllowance: "",
    otherAllowance: "",
    medicalAllowance: "",
    gross: "",
    cca: "",
    professionalTax: "",
    otherDeductions: "",
    totalDeductions: "",
    netPay: "",
    hra: "",
    lta: "",
    specialAllowance: "",
    epfEmployee: "",
    epfEmployer: "",
    esi: "",
    gratuity: "",
    annualBonus: "",
    monthlyCTC: "",
    annualCTC: "",
  });

  // Add this function to calculate days in month
  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month + 1, 0).getDate();
  };

  // Update the calculateSalary function
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
    const hra = Math.max(0, Math.round(monthlyBasic * 0.4));
    const da = Math.max(0, Math.round(monthlyBasic * 0.2));
    const conveyanceAllowance = Math.max(0, Math.round(1600 * ((daysInMonth - leavesNum) / daysInMonth)));
    const medicalAllowance = Math.max(0, Math.round(1250 * ((daysInMonth - leavesNum) / daysInMonth)));
    const lta = Math.max(0, Math.round(monthlyBasic * 0.1));
    
    // Calculate allowances total
    const totalFixedAllowances = monthlyBasic + hra + da + conveyanceAllowance + medicalAllowance + lta;
    const monthlyCTC = Math.max(0, Math.round(effectiveSalary));
    const specialAllowance = Math.max(0, Math.round(monthlyCTC - totalFixedAllowances));
    
    // Calculate deductions
    const epfEmployee = Math.min(Math.max(0, monthlyBasic * 0.12), 1800);
    const epfEmployer = epfEmployee;
    const esi = monthlyCTC <= 21000 ? Math.max(0, Math.round(monthlyCTC * 0.0075)) : 0;
    const professionalTax = Math.max(0, Math.round(200 * ((daysInMonth - leavesNum) / daysInMonth)));
    
    // Calculate final amounts
    const grossSalary = monthlyBasic + hra + da + conveyanceAllowance + 
                       medicalAllowance + lta + specialAllowance;
    const totalDeductions = epfEmployee + esi + professionalTax;
    const netPay = Math.max(0, grossSalary - totalDeductions);
  
    // Return values with toString() and null checks
    return {
      basic: monthlyBasic.toString(),
      hra: hra.toString(),
      da: da.toString(),
      conveyanceAllowance: conveyanceAllowance.toString(),
      medicalAllowance: medicalAllowance.toString(),
      lta: lta.toString(),
      specialAllowance: specialAllowance.toString(),
      gross: grossSalary.toString(),
      epfEmployee: epfEmployee.toString(),
      epfEmployer: epfEmployer.toString(),
      esi: esi.toString(),
      professionalTax: professionalTax.toString(),
      totalDeductions: totalDeductions.toString(),
      netPay: netPay.toString(),
      monthlyCTC: monthlyCTC.toString(),
      daysInMonth: daysInMonth.toString(),
      presentDays: (daysInMonth - leavesNum).toString(),
      // Additional CTC components
      gratuity: Math.max(0, Math.round((monthlyBasic * 15) / 26)).toString(),
      annualBonus: Math.max(0, Math.round(monthlyBasic * 0.0833 * 12)).toString(),
      annualCTC: annualSalary.toString()
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "month") {
      const monthIndex = parseInt(value);
      setSelectedMonth(monthIndex);
      
      // Recalculate salary with new month if candidate is selected
      if (selectedCandidate) {
        const calculatedValues = calculateSalary(
          selectedCandidate.packageLPA,
          attendance.leaves,
          monthIndex
        );
        
        setCompanyDetails(prev => ({
          ...prev,
          ...calculatedValues
        }));
      }
    } else if (name === "company") {
      const selectedCompany = companies.find((company) => company.name === value);
      if (selectedCompany) {
        setCompanyDetails((prevState) => {
          const updatedDetails = {
            ...prevState,
            name: selectedCompany.name,
            address: selectedCompany.address,
            email: selectedCompany.email,
            phone: selectedCompany.mobile
            ,
            website: selectedCompany.website,
            logo: selectedCompany.logo,
            color: selectedCompany.serverColor
          };
          onUpdateCompanyDetails(updatedDetails);
          return updatedDetails;
        });
      }
    } else if (name === "employeeName") {
      const candidate = candidates.find((c) => c.candidateName === value);
      if (candidate) {
        setSelectedCandidate(candidate);
        const calculatedValues = calculateSalary(
          candidate.packageLPA,
          attendance.leaves,
          selectedMonth
        );
        const updatedDetails = {
          ...companyDetails,
          employeeName: candidate.candidateName,
          empCode: candidate.employeeCode || '',
          designation: candidate.designation || '',
          pan: candidate.panNo || '',
          location: candidate.location || '',
          doj: candidate.DateOfJoining || '',
          department: candidate.department || '',
          lpa: candidate.packageLPA || '0',
          ...calculatedValues
        };
        setCompanyDetails(updatedDetails);
        onUpdateCompanyDetails(updatedDetails);
      }
    } else if (name === "pan") {
      const updatedValue = value.toUpperCase();
      setCompanyDetails((prevState) => {
        const updatedDetails = { ...prevState, [name]: updatedValue };
        onUpdateCompanyDetails(updatedDetails);
        return updatedDetails;
      });
    } else {
      setCompanyDetails((prevState) => {
        const updatedDetails = { ...prevState, [name]: value };
        onUpdateCompanyDetails(updatedDetails);
        return updatedDetails;
      });
    }
  };

  const renderInput = (name, label, type = "text", isReadOnly = false) => {
    const value = selectedCandidate && companyDetails[name] ? companyDetails[name] : "";
    const isDisabled = isReadOnly || (selectedCandidate && name !== "payableDays");
    const amountFields = [
      "lpa", "basic", "hra", "da", "conveyanceAllowance", 
      "medicalAllowance", "lta", "specialAllowance", "gross",
      "epfEmployee", "epfEmployer", "esi", "professionalTax",
      "totalDeductions", "netPay", "gratuity", "annualBonus",
      "monthlyCTC", "annualCTC"
    ];
    const isAmountField = amountFields.includes(name);

    const inputProps = {
      type,
      name,
      value: value,
      onChange: handleChange,
      placeholder: `Enter ${label.toLowerCase()}`,
      readOnly: isDisabled,
      disabled: isDisabled,
      className: `${isDisabled ? "readonly-input" : ""} ${isAmountField ? "amount-input" : ""}`,
    };

    if (type === "number") {
      inputProps.onWheel = (e) => e.target.blur();
      inputProps.onKeyDown = (e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); } };
      inputProps.step = "any";
      inputProps.onKeyPress = (e) => { if (!/[\d.]|\b(Backspace|Delete|Tab)\b/.test(e.key)) { e.preventDefault(); } };
    }

    return (
      <div className="form-group">
        <label>{label}:</label>
        <div className={isAmountField ? "input-with-symbol" : ""}>
          {isAmountField && <span className="rupee-symbol">₹</span>}
          <input {...inputProps} />
        </div>
      </div>
    );
  };

  const renderMonthYearSelectors = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return (
      <div className="mb-4">
        <div className="form-group">
          <label className="block mb-1 text-sm font-medium text-gray-700">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };
  
  const renderAttendanceDetails = () => {
    const updateAttendance = (value) => {
      const numberValue = parseInt(value) || 0;
      const daysInMonth = getDaysInMonth(selectedMonth);
      
      // Validate leaves against days in month
      const validLeaves = Math.min(numberValue, daysInMonth);
      
      setAttendance({ leaves: validLeaves });
      
      // Recalculate salary with new leaves
      if (selectedCandidate) {
        const calculatedValues = calculateSalary(
          selectedCandidate.packageLPA, 
          validLeaves,
          selectedMonth
        );
        
        setCompanyDetails(prev => ({
          ...prev,
          ...calculatedValues,
          payableDays: (daysInMonth - validLeaves).toString()
        }));
      }
    };

    return (
      <div className="form-group mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Leaves (Max: {getDaysInMonth(selectedMonth)} days)
        </label>
        <input
          type="number"
          value={attendance.leaves}
          onChange={(e) => updateAttendance(e.target.value)}
          min="0"
          max={getDaysInMonth(selectedMonth)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Enter Salary Slip Detail</h2>
      <div className="form-group">
        <label className="block mb-1 text-sm font-medium text-gray-700">Company</label>
        <select 
          name="company" 
          onChange={handleChange} 
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.name}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="block mb-1 text-sm font-medium text-gray-700">Employee Name</label>
        <select
          name="employeeName"
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Employee</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.candidateName}>
              {candidate.candidateName} 
              {/* - {candidate.packageLPA} LPA */}
            </option>
          ))}
        </select>
      </div>
      {renderMonthYearSelectors()}
      {renderAttendanceDetails()}
    
      {renderInput("payableDays", "Payable Days", "number")}

   
    </div>
  );
};

export default CompanyDetailsForm;
