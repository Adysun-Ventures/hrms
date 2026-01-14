'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

function RelievingLetter() {
  const containerRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    employeeName: "",
    designation: "",
    lastWorkingDate: "",
    employeeSignDate: "",
    employeeSignPlace: ""
  });

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
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Employees:", employeesList);
      setCandidates(employeesList);
      
      const employmentData = {};
      for (const employee of employeesList) {
        try {
          const q = query(collection(db, 'employments'), where('employeeId', '==', employee.id));
          const empSnapshot = await getDocs(q);
          
          if (!empSnapshot.empty) {
            const employmentsList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "company") {
      const selectedCompany = companies.find(company => company.name === value);
      if (selectedCompany) {
        setFormData(prev => ({
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
        
        const employmentDetails = employments[selectedEmployee.id];
        console.log("Employment details:", employmentDetails);
        
        let joiningDate;
        let employeeDesignation;
        let lastWorkingDate;
        
        if (employmentDetails) {
          joiningDate = employmentDetails.joiningDate || employmentDetails.startDate;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
          lastWorkingDate = employmentDetails.lastWorkingDate || employmentDetails.endDate;
        } else {
          joiningDate = selectedEmployee.joinDate;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
          lastWorkingDate = new Date().toISOString().split('T')[0];
        }
        
        setFormData(prev => ({
          ...prev,
          employeeName: selectedEmployee.name,
          designation: employeeDesignation || "",
          joiningDate: joiningDate || new Date().toISOString().split('T')[0],
          lastWorkingDate: lastWorkingDate || new Date().toISOString().split('T')[0]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const elements = containerRef.current.getElementsByClassName("relieving-letter-page");

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

    pdf.save("relieving-letter.pdf");
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
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800">Enter Relieving Letter Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block text-gray-700 text-sm font-bold mb-2">Employee Name:</label>
              <select
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select an employee</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block mb-1 text-sm font-medium text-gray-700">Employee Sign Date</label>
              <input
                type="date"
                name="employeeSignDate"
                value={formData.employeeSignDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter signing date"
              />
            </div>

            <div className="form-group">
              <label className="block mb-1 text-sm font-medium text-gray-700">Place of Signing</label>
              <input
                type="text"
                name="employeeSignPlace"
                value={formData.employeeSignPlace}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter place"
              />
            </div>

            <div className="form-group">
              <label className="block mb-1 text-sm font-medium text-gray-700">Company</label>
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

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleDownload}
              className="download-btn flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg transition-all duration-200 text-sm md:text-base"
            >
              <Download size={18} className="mr-2" />
              <span>Generate Relieving Letter</span>
            </button>
          </div>
        </div>

        {/* Hidden PDF Content */}
        <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div className="relieving-letter-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div 
              className="letter-header pb-4 mb-4" 
              style={{
                borderBottomColor: formData.companyColor,
                borderBottomStyle: "solid",
                borderBottomWidth: "1px"
              }}
            >
              <div>
                <h1 className="company-name" style={{ color: formData.companyColor }}>{formData.companyName}</h1>
                <p className="company-address">
                  {formData.companyAddressLine1}
                  <br />
                  Phone: {formData.companyPhone}
                  <br />
                  {formData.companyWebsite}
                </p>
              </div>
              <img src={formData.companyLogo} alt={formData.companyName} className="company-logo" />
            </div>

            <div className="letter-content">
              <p className="letter-date">{formatDate(formData.lastWorkingDate)}</p>

              <h2 className="letter-title">Relieving Letter</h2>

              <p className="employee-name capitalize">{formData.employeeName}</p>

              <p className="capitalize">Dear {formData.employeeName},</p>

              <p className="opening-para capitalize">
                We are relieving you from your duties as {formData.designation} end of the day {formatDate(formData.lastWorkingDate)}.
              </p>

              <p>
                Please note that on release from the employment with company,
                you shall continue to be bound by the obligations related to
                confidentiality, non-solicitation, intellectual property rights
                and other such commitments. A few of these are described as
                below:
              </p>

              <div className="section">
                <h3>Company Property:</h3>
                <p>
                  You certify that you do not possess any documents, maps,
                  blueprints, designs, books, manuals, software code or any
                  other material which belongs to the company or which was
                  developed by you during the course of your association. You
                  understand that either these documents or codes could be in a
                  paper format or computer storage format and you certify that
                  you do not possess them in either format and the same has been
                  handed over to the reporting Manager in the company.
                </p>
              </div>

              <div className="section">
                <h3>Non-Solicitation:</h3>
                <p>
                  You confirm that for a period of 12 months after release from
                  the association with the company, you will not solicit,
                  assist, refer, cause or force any employee of Nitor, which
                  could result either directly or indirectly in the employee
                  leaving the company.
                </p>
                <p>
                  During the course of your association with the company, you
                  have been privy to information related to the company, its
                  services, processes and systems, business transactions,
                  business plans, software products & IT infrastructure, clients
                  and their business information and other administrative and
                  organizational matters. You agree to treat this information
                  confidential after termination of your association with the
                  company and that you will not share this information by word
                  of mouth or otherwise, with any employee of the company
                  whether past or present, or any third person whether known or
                  unknown to the company and understand that you shall be liable
                  for legal action in case of breach of faith or agreement.
                </p>
              </div>

              <div className="section">
                <h3>Non-Compete:</h3>
                <p>
                  You understand, agree and acknowledge that Nitor has spent
                  substantial money, invested time and efforts over the years in
                  developing and solidifying its relationships with its
                  customers and consultants. Hence on the basis of non-compete
                  clause you hereby agree that for a period of twenty four (24)
                  months from date of relieving for any reason, whether with or
                  without good cause or for any or no cause, at your disposal or
                  at Nitor's, with or without notice, you will not compete with
                  the Nitor and its successors and assigns for all customers and
                  clients introduced by Nitor, without prior written consent
                  from Nitor.
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
          </div>

          <div className="relieving-letter-page bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div 
              className="letter-header pb-4 mb-4" 
              style={{
                borderBottomColor: formData.companyColor,
                borderBottomStyle: "solid",
                borderBottomWidth: "1px"
              }}
            >
              <div>
                <h1 className="company-name" style={{ color: formData.companyColor }}>{formData.companyName}</h1>
                <p className="company-address">
                  {formData.companyAddressLine1}
                  <br />
                  Phone: {formData.companyPhone}
                  <br />
                  {formData.companyWebsite}
                </p>
              </div>
              <img src={formData.companyLogo} alt={formData.companyName} className="company-logo" />
            </div>

            <div className="letter-content">
              <p className="non-compete-continuation">
                The term "non-compete" as used herein shall mean that you shall
                not, without the prior written consent of Nitor, (i) serve as a
                contractor, partner, employee, consultant, officer, director,
                manager, agent, associate, invest, servant with greater than 5%
                or otherwise (by itself directly or indirectly, own, manage,
                operate, join, control, participate in, invest in, work or
                consult for or otherwise affiliate with) all customers and
                clients introduced by Nitor or business in competition with or
                otherwise similar to Nitor's business.
              </p>

              <p className="further-declaration">
                Furthermore, you declare that you have no further claims of
                whatsoever nature resulting from my association and or
                termination thereof, against either the company, its group
                companies, its affiliates or officers or its representatives.
              </p>

              <div className="signature-section">
                <div className="date-place">
                  <p>Date: _________________</p>
                  <p className="capitalize">Place: {formData.employeeSignPlace}</p>
                </div>

                <div className="signatures">
                  <div className="employee-sign">
                    <p>Sign</p>
                    <p className="sign-name capitalize">{formData.employeeName}</p>
                  </div>

                  <div className="company-sign">
                    <p>{formData.companyName}</p>
                    <p className="sign-name capitalize">{formData.companyHR}</p>
                    <p className="designation">Head - HR Dept</p>
                  </div>
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
      </div>
    </div>
  );
}

export default RelievingLetter;
