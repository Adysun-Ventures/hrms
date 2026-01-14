'use client';

import React, { useState, useEffect, useRef } from "react";
import { Download, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";
;
import { db } from "@/firebase/config";

import { collection, getDocs, query, where } from "firebase/firestore";

function OfferLetter() {
  const containerRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    employeeName: "",
    joiningDate: "",
    designation: "",
    lpa: "",
    salary: "",
    salaryInWords: "",
    basic: "",
    hra: "",
    da: "",
    conveyance: "",
    medical: "",
    lta: "",
    special: "",
    gross: ""
  });

  // Convert number to words
  const numberToWords = (num) => {
    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const formatTens = (num) => {
      if (num < 10) return single[num];
      if (num < 20) return double[num - 10];
      return tens[Math.floor(num / 10)] + (num % 10 ? " " + single[num % 10] : "");
    };

    if (num === 0) return "Zero";
    const convert = (num) => {
      if (num < 100) return formatTens(num);
      if (num < 1000) return single[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + formatTens(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
      return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
    };

    // Split the number into integer and decimal parts
    const [integerPart, decimalPart] = num.toString().split('.');

    // Convert the integer part
    let words = convert(parseInt(integerPart));

    // If there's a decimal part, convert it to words
    if (decimalPart) {
      words += " Point " + decimalPart.split('').map(digit => single[parseInt(digit)]).join(" ");
    }

    return words;
  };
  useEffect(() => {
    fetchCompanies();
    fetchCandidates();
  }, []);

  const fetchCompanies = async () => {

    const querySnapshot = await getDocs(collection(db, "companies"));
    const companyList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log(companyList);
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

  // Calculate salary components based on LPA
  const calculateSalaryComponents = (lpa) => {
    const annualSalary = parseFloat(lpa) * 100000;

    // Calculate components based on annual salary
    const basic = Math.round(annualSalary * 0.35); // 35% of CTC = 131,250 for 3.75L
    const da = Math.round(annualSalary * 0.30); // 30% of CTC = 112,500 for 3.75L
    const conveyance = Math.round(annualSalary * 0.20); // 20% of CTC = 75,000 for 3.75L
    const otherAllowance = Math.round(annualSalary * 0.15); // 15% of CTC = 56,250 for 3.75L

    // Monthly calculations
    const monthlyBasic = Math.round(basic / 12);
    const monthlyDA = Math.round(da / 12);
    const monthlyConveyance = Math.round(conveyance / 12);
    const monthlyOtherAllowance = Math.round(otherAllowance / 12);

    return {
      basic: monthlyBasic.toFixed(2),
      da: monthlyDA.toFixed(2),
      conveyance: monthlyConveyance.toFixed(2),
      medical: monthlyOtherAllowance.toFixed(2), // Using medical field for other allowance
      annualSalary: annualSalary.toFixed(2),
      lpa: parseFloat(lpa),
      salaryInWords: `${numberToWords(parseFloat(lpa))} Lakh`,

      // Annual values for display
      annualBasic: basic.toFixed(2),
      annualDA: da.toFixed(2),
      annualConveyance: conveyance.toFixed(2),
      annualOtherAllowance: otherAllowance.toFixed(2),
      totalAnnual: annualSalary.toFixed(2)
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "company") {
      const selectedCompany = companies.find(company => company.name === value);
      if (selectedCompany) {
        setFormData({
          ...formData,
          companyName: selectedCompany.name,
          companyAddressLine1: selectedCompany.address,
          companyColor: selectedCompany.serverColor,
          companyEmail: selectedCompany.email,
          companyPhone: selectedCompany.mobile,
          companyWebsite: selectedCompany.website,
          companyLogo: selectedCompany.logo,
          companypackageLPA: selectedCompany.packageLPA
          // Add any additional fields as needed
        });
      }
    } else if (name === "employeeName") {
      const selectedEmployee = candidates.find(employee => employee.name === value);
      if (selectedEmployee) {
        console.log("Selected Employee:", selectedEmployee);
        
        // Get the employment details for this employee
        const employmentDetails = employments[selectedEmployee.id];
        console.log("Employment details:", employmentDetails);
        
        let employeeSalary;
        let joiningDate;
        let employeeDesignation;
        
        if (employmentDetails) {
          // If we have employment details, use those for salary, joining date, etc.
          employeeSalary = employmentDetails.salary || employmentDetails.ctc;
          joiningDate = employmentDetails.joiningDate || employmentDetails.startDate;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
        } else {
          // Fallback to employee record if no employment details
          employeeSalary = selectedEmployee.salary;
          joiningDate = selectedEmployee.joinDate;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
        }
        
        // Calculate LPA from annual salary if it exists
        const employeeLPA = employeeSalary ? (employeeSalary / 100000) : 0;
        
        // Calculate salary components
        const components = calculateSalaryComponents(employeeLPA);
        
        setFormData(prev => ({
          ...prev,
          employeeName: selectedEmployee.name,
          designation: employeeDesignation || "",
          joiningDate: joiningDate || new Date().toISOString().split('T')[0],
          lpa: employeeLPA,
          ...components
        }));
      }
    } else if (name === 'lpa') {
      const components = calculateSalaryComponents(value);
      setFormData(prev => ({
        ...prev,
        lpa: value,
        basic: components.basic,
        hra: components.hra,
        da: components.da,
        conveyance: components.conveyance,
        medical: components.medical,
        lta: components.lta,
        special: components.special,
        gross: components.gross,
        annualSalary: components.annualSalary,
        salaryInWords: components.salaryInWords
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date); // "05 Feb 2025"
  };
  const handleDownload = async () => {
    if (!containerRef.current) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const elements = containerRef.current.getElementsByClassName("offer-letter-page");

    for (let i = 0; i < elements.length; i++) {
      const canvas = await html2canvas(elements[i]);
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      if (i > 0) {
        pdf.addPage();
      }

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("offer-letter.pdf");
  };

  const wordToNumber = (word) => {
    const wordMap = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
      'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
      'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000, 'lakh': 100000,
      'million': 1000000, 'billion': 1000000000
    };

    const wordArray = word.toLowerCase().split(' ');

    let total = 0;
    let currentValue = 0;

    wordArray.forEach(word => {
      if (wordMap[word] >= 100) {
        currentValue *= wordMap[word];
      } else if (wordMap[word] === 1000 || wordMap[word] === 100000 || wordMap[word] === 1000000) {
        currentValue *= wordMap[word];
        total += currentValue;
        currentValue = 0;
      } else {
        currentValue += wordMap[word];
      }
    });

    total += currentValue; // Add remaining value
    return total;
  };

  const convertSalaryInWordsToNumber = (salaryInWords) => {
    const words = salaryInWords.toLowerCase().split(' ');

    let integerPart = [];
    let decimalPart = [];
    let foundPoint = false;
    let hasLakh = false;

    words.forEach(word => {
      if (word === 'point') {
        foundPoint = true;
      } else if (word === 'lakh') {
        hasLakh = true;
      } else if (foundPoint) {
        decimalPart.push(word);
      } else {
        integerPart.push(word);
      }
    });

    // Convert the integer and decimal parts
    let integerValue = wordToNumber(integerPart.join(' '));
    let decimalValue = 0;

    if (decimalPart.length > 0) {
      let decimalDigits = decimalPart.map(word => wordToNumber(word));
      decimalValue = decimalDigits.reduce((acc, val, index) => acc + val / Math.pow(10, index + 1), 0);
    }

    // Apply Lakh multiplier if present
    let finalSalary = integerValue + decimalValue;
    if (hasLakh) {
      finalSalary *= 100000;
    }

    return Math.round(finalSalary);  // Ensure no floating-point issues
  };

  // Example usage:
  const numericSalary = convertSalaryInWordsToNumber(formData.salaryInWords || "0");

  console.log("digit salary:", numericSalary);  // Outputs: 450000
  console.log("salary in word:", formData.salaryInWords);
  // Outputs: "Five Lakh"
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-12 mt-4 md:mt-6">
          <div className="ml-2 md:ml-4">
            <Link href="/" className="back-link flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="text-sm md:text-base">Back to Home</span>
            </Link>
          </div>
        </div>


        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8">Enter Offer Letter Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Name */}
            <div className="form-group">
              <label className="block mb-2 text-sm font-medium text-gray-700">Employee Name</label>
              <select
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Employee</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Joining Date */}


            {/* Total Salary (in Lakhs) */}


            {/* Company Selection */}
            <div className="form-group">
              <label className="block mb-2 text-sm font-medium text-gray-700">Company</label>
              <select
                name="company"
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleDownload}
              className="download-btn flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 shadow-lg transform hover:scale-105 transition-all duration-200 text-sm md:text-base"
            >
              <Download size={20} className="mr-2" />
              <span>Generate Offer Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden PDF Content */}
      <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {/* Page 1 - Terms and Conditions */}
        <div className="offer-letter-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
          <div
            className="letter-header pb-4 mb-4"
            style={{
              borderBottomColor: formData.companyColor,  // Apply bottom border color
              borderBottomStyle: "solid",               // Solid line
              borderBottomWidth: "1px"                  // 1px thickness
            }}
          >

            <div className="company-info ">
              <h1 className="company-name capitalize" style={{ color: formData.companyColor }}>
                {formData.companyName}
              </h1>
              <p className="company-address capitalize">
                {/* Office No -309, 3<sup>rd</sup> Floor, Navale Icon, Near Navale
                  Bridge, Narhe
                  <br />
                  Pune - 411041, (Maharashtra) INDIA. */}
                {formData.companyAddressLine1}
                <p>Phone: {formData.companyPhone} </p>
                <p> {formData.companyWebsite}</p>
              </p>
            </div>
            <img
              src={formData.companyLogo} alt={formData.companyName}
              className="company-logo"
            />
          </div>

          <h2 className="letter-title">Joining Cum Appointment Letter</h2>

          <div className="letter-content">
            <p className="date">Date: {formatDate(formData.joiningDate)}</p>
            <p className="employee-name capitalize">Dear {formData.employeeName || '[Employee Name]'},</p>

            <p className="letter-paragraph capitalize">
              We pleased in appointing you as {formData.designation} in {formData.companyName},at our Office in our organization, effective
              from {formatDate(formData.joiningDate)} on the following terms and conditions:
            </p>

            <p className="letter-paragraph">
              You will be placed in the appropriate responsibility level of
              the Company, and will be entitled to compensation (salary and
              other applicable benefits) as discussed. Compensation will be
              governed by the rules of the Company on the subject, as
              applicable and/or amended hereafter.
            </p>

            <p className="letter-paragraph">
              You will be eligible to the benefits of the Company's Leave
              Rules on your confirmation in the Company's Service as
              discussed. During the period of your employment you will devote
              full time to the work of the Company. Further, you will not take
              any other employment or assignment or any office honorary or for
              any consideration in cash or in kind or otherwise, without the
              prior written permission of the Company.
            </p>

            <p className="letter-paragraph">
              You will be on a Probation period for the Three months based on
              your performance. During the probation period your services can
              be terminated with seven day's notice on either side and without
              any reasons whatsoever. If your services are found satisfactory
              during the probation period, you will be confirmed in the
              present position and thereafter your services can be terminated
              on one month's notice on either side. The period of probation
              can be extended at the discretion of the Management and you will
              continue to be on probation till an order of confirmation has
              been issued in writing.
            </p>

            <p className="letter-paragraph">
              Your salary package will be Rs. {new Intl.NumberFormat().format(numericSalary)}/- ({formData.salaryInWords} Rupees Only) and no other allowance is provided in that period.
            </p>

          </div>
          <div
            className="footer w-full flex flex-col items-start text-left border-t leading-5 pt-2 absolute bottom-10 left-15 right-15"
            style={{
              borderTopColor: formData.companyColor,
              borderTopStyle: "solid",
              borderTopWidth: "1px",
            }}
          >
            <p className="m-0">{formData.companyName}</p>
            <p className="m-0">{formData.companyAddressLine1}</p>
            <p className="m-0">{formData.companyPhone}</p>
            <p className="m-0">{formData.companyWebsite}</p>

          </div>




        </div>

        {/* Page 2 - Additional Terms */}
        <div className="offer-letter-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
          <div
            className="letter-header pb-4 mb-4"
            style={{
              borderBottomColor: formData.companyColor,  // Apply bottom border color
              borderBottomStyle: "solid",               // Solid line
              borderBottomWidth: "1px"                  // 1px thickness
            }}
          >
            <div className="company-info">
              <h1 className="company-name capitalize" style={{ color: formData.companyColor }}>
                {formData.companyName}
              </h1>
              <p className="company-address capitalize ">
                {formData.companyAddressLine1}
                <p>Phone: {formData.companyPhone} </p>
                <p> {formData.companyWebsite}</p>
              </p>
            </div>
            <img
              src={formData.companyLogo} alt={formData.companyName}
              className="company-logo"
            />
          </div>

          <h2 className="letter-title">Additional Terms</h2>

          <div className="letter-content">
            <p className="letter-paragraph">
              You will not disclose any of our technical or other important
              information which might come into your possession during the
              continuation of your service with us shall not be disclosed,
              divulged or made public by you even thereafter.
            </p>

            <p className="letter-paragraph">
              If you conceive any new or advanced method of improving designs
              / processes / formulae / systems, etc. related to the interest /
              business of the Company, such developments will be fully
              communicated to the company and will be and will remain the sole
              right/property of the Company. Also includes Technology,
              Software packages license, Company's policy, Company's platform
              & Trade Mark and Company's human assets profile. Also the usage
              of personal USB Drives and CD-ROM's are strictly prohibited.
            </p>

            <p className="letter-paragraph">
              If any declaration given or information furnished by you, to the
              Company proves to be false, or if you are found to have
              willfully suppressed any material information, in such cases you
              will be liable to removal from services without any notice.
            </p>

            <p className="letter-paragraph">
              During the probationary period and any extension thereof, your
              service may be terminated on either side by giving one week's
              notice or salary in lieu thereof. Upon confirmation the services
              can be terminated from either side by giving one-month (30 Days)
              notice or salary in lieu thereof. Upon termination of employment
              you will immediately hand over to the Company all
              correspondence, specifications, formulae, books, documents,
              market data, cost data, drawings, affects or records belonging
              to the Company or relating to its business and shall not retain
              or make copies of these items.
            </p>

            <p className="letter-paragraph">
              If at any time in our opinion which is final in this matter you
              are found non-performer or guilty of fraud, dishonest,
              disobedience, disorderly behavior, negligence, indiscipline,
              absence from duty without permission or any other conduct
              considered by us deterrent to our interest or of violation of
              one or more terms of this letter, your services may be
              terminated without notice.
            </p>

            <p className="letter-paragraph">
              You will be responsible for safekeeping and return in good
              condition and order of all Company property which may be in your
              use, custody or charge.
            </p>

            <p className="letter-paragraph">
              All legal matters are subject to Pune Jurisdiction.
            </p>

            <p className="letter-paragraph">
              Please confirm your acceptance of the appointment on the above
              terms and conditions by signing and returning this letter to us
              for our records.
            </p>

            <p className="letter-paragraph">
              Enclosure:- Attaching herewith your salary annexure.
            </p>
          </div>

          <div
            className="footer w-full flex flex-col items-start text-left border-t leading-5 pt-2 absolute bottom-10 left-15 right-15"
            style={{
              borderTopColor: formData.companyColor,
              borderTopStyle: "solid",
              borderTopWidth: "1px",
            }}
          >
            <p className="m-0">{formData.companyName}</p>
            <p className="m-0">{formData.companyAddressLine1}</p>
            <p className="m-0">{formData.companyPhone}</p>
            <p className="m-0">{formData.companyWebsite}</p>

          </div>
        </div>

        {/* Page 3 - Salary Structure */}
        <div className="offer-letter-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
          <div
            className="letter-header pb-4 mb-4"
            style={{
              borderBottomColor: formData.companyColor,  // Apply bottom border color
              borderBottomStyle: "solid",               // Solid line
              borderBottomWidth: "1px"                  // 1px thickness
            }}
          >
            <div className="company-info">
              <h1 className="company-name capitalize" style={{ color: formData.companyColor }}>
                {formData.companyName}
              </h1>
              <p className="company-address capitalize ">
                {formData.companyAddressLine1}
                <p>Phone: {formData.companyPhone} </p>
                <p> {formData.companyWebsite}</p>
              </p>
            </div>
            <img
              src={formData.companyLogo} alt={formData.companyName}
              className="company-logo"
            />
          </div>

          <h2 className="letter-title">Salary Annexure</h2>

          <div className="letter-content">
            <p className="date">Date: {new Date().toLocaleDateString()}</p>
            <p className="employee-name capitalize">Dear {formData.employeeName || '[Employee Name]'},</p>

            <p className="letter-paragraph">
              As per mentioned in the offer letter, here with attaching your
              salary structure which includes your Basic salary and other
              benefits received by you from the company.
            </p>

            <p className="font-semibold mt-4">
              Your salary structure as follows:
            </p>

            <div className="mt-4 salary-table">
              <h4 className="font-semibold mb-2">Compensation Heads</h4>
              <div className="space-y-2">
                <div className="compensation-row">
                  <span>Basic</span>
                  <span>: ₹{formData.annualBasic || '0.00'}</span>
                </div>

                <div className="compensation-row">
                  <span>Dearness Allowance</span>
                  <span>: ₹{formData.annualDA || '0.00'}</span>
                </div>
                <div className="compensation-row">
                  <span>Conveyance Allowance</span>
                  <span>: ₹{formData.annualConveyance || '0.00'}</span>
                </div>
                <div className="compensation-row">
                  <span>Other Allowance</span>
                  <span>: ₹{formData.annualOtherAllowance || '0.00'}</span>
                </div>
                <div className="compensation-row font-bold mt-4 pt-2 border-t">
                  <span>Annual Total</span>
                  <span>: ₹{new Intl.NumberFormat().format(formData.lpa * 100000)}</span>
                </div>

              </div>
            </div>

            <div className="mt-8">
              <p className="letter-paragraph">
                We expect you to keep up your performance in the years to come
                and grow with the organization and we will expect you will get
                happy and enthusiastic environment for work at the
                organization.
              </p>
              <p className="mt-2">Wish you all the best.</p>
            </div>

            <div className="mt-3">
              <p>Signature</p>
              <p className="mt-4">Head - HR Dept</p>
            </div>
          </div>

          <div
            className="footer w-full flex flex-col items-start text-left border-t leading-5 pt-2 absolute bottom-10 left-15 right-15"
            style={{
              borderTopColor: formData.companyColor,
              borderTopStyle: "solid",
              borderTopWidth: "1px",
            }}
          >
            <p className="m-0">{formData.companyName}</p>
            <p className="m-0">{formData.companyAddressLine1}</p>
            <p className="m-0">{formData.companyPhone}</p>
            <p className="m-0">{formData.companyWebsite}</p>

          </div>

        </div>
      </div>
    </div>


  );
}

export default OfferLetter;
