'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PDFViewer, PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { CompanyHeader, FormattedDate, Paragraph, Signature, Footer, Watermark } from '@/components/pdf/PDFComponents';
import { commonStyles } from '@/components/pdf/PDFStyles';
import { storage } from '@/firebase/config';
import { ref, getDownloadURL } from "firebase/storage";

// Initialize Firebase Storage
const fireStorage = storage;

// PDF Styles
const relievingLetterStyles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 12,
    fontFamily: 'Calibri',
    lineHeight: 1.5,
    color: '#000000',
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  date: {
    marginBottom: 15,
    fontFamily: 'Calibri',
  },
  employeeName: {
    marginBottom: 8,
    fontFamily: 'Calibri',
  },
  salutation: {
    marginBottom: 8,
    fontFamily: 'Calibri',
  },
  para: {
    marginBottom: 8,
    textAlign: 'justify',
    fontFamily: 'Calibri',
    lineHeight: 1.4,
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: 'Calibri',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Calibri',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
    fontFamily: 'Calibri',
  },
  signatureBlock: {
    width: '40%',
    fontFamily: 'Calibri',
  },
  signatureName: {
    marginTop: 20,
    fontFamily: 'Calibri',
  },
  signatureTitle: {
    fontFamily: 'Calibri',
    fontSize: 11,
    marginTop: 3,
  },
  datePlaceSection: {
    marginTop: 15,
    marginBottom: 15,
    fontFamily: 'Calibri',
  },
  companyHeader: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 11,
    fontFamily: 'Calibri',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#FF0000',
    paddingTop: 5,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    marginBottom: 1,
    fontFamily: 'Calibri',
    textAlign: 'center',
  },
  // Add compact styles for tighter layout
  compact: {
    lineHeight: 1.3,
    fontSize: 10,
  }
});

// Watermark styles
const watermarkStyles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkImage: {
    width: '80%',
    height: 'auto',
    opacity: 0.17,
  }
});

// We now use the imported Watermark component from PDFComponents

// Relieving Letter PDF Document Component
const RelievingLetterPDF = ({ formData }) => {
  // Helper to safely access formData
  const safeFormData = formData || {};
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return "";
    }
  };

  // Shared component for company header to maintain consistency
  const CompanyHeaderComponent = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#0066cc',
      paddingBottom: 5,
      marginBottom: 10, // Reduced margin
    }}>
      <View>
        <Text style={{
          color: '#0066cc',
          fontSize: 13, // Reduced size
          fontWeight: 'bold',
          fontFamily: 'Calibri',
          textTransform: 'uppercase',
        }}>
          {safeFormData.companyName || 'COMPANY NAME'}
        </Text>
        <Text style={{fontFamily: 'Calibri', fontSize: 9}}>
          {safeFormData.companyAddressLine1 || 'COMPANY ADDRESS'}
        </Text>
        <Text style={{fontFamily: 'Calibri', fontSize: 9}}>
          Phone: {safeFormData.companyPhone || 'PHONE NUMBER'}
        </Text>
        <Text style={{fontFamily: 'Calibri', fontSize: 9}}>
          {safeFormData.companyWebsite || 'WEBSITE'}
        </Text>
      </View>
      {safeFormData.companyLogo && (
        <Image src={safeFormData.companyLogo} style={{width: 45, height: 45}} />
      )}
    </View>
  );

  // Shared component for footer to maintain consistency
  const FooterComponent = () => (
    <View style={{
      position: 'absolute',
      bottom: 30,
      left: 50,
      right: 50,
      borderTopWidth: 1,
      borderTopColor: '#0066cc',
      paddingTop: 5,
      textAlign: 'center',
    }}>
      <Text style={relievingLetterStyles.footerText}>{safeFormData.companyName || 'COMPANY NAME'}</Text>
      <Text style={relievingLetterStyles.footerText}>{safeFormData.companyAddressLine1 || 'COMPANY ADDRESS'}</Text>
      <Text style={relievingLetterStyles.footerText}>+91 {safeFormData.companyPhone || 'PHONE NUMBER'}</Text>
      <Text style={relievingLetterStyles.footerText}>{safeFormData.companyWebsite || 'WEBSITE'}</Text>
    </View>
  );
  
  return (
    <Document>
      {/* Page 1 - All text content with more compact styling */}
      <Page wrap={false} size="A4" style={{...commonStyles.page, ...relievingLetterStyles.page}}>
        {/* Watermark */}
        <Watermark logoSrc={safeFormData.companyLogo} />
        
        {/* Company Header */}
        <CompanyHeaderComponent />
        
        {/* Content container with fixed height to prevent footer overlap */}
        <View style={{ height: '680px', position: 'relative' }}>
          {/* Letter Date */}
          <Text style={{...relievingLetterStyles.date, fontSize: 10, marginBottom: 10}}>
            {formatDate(safeFormData.lastWorkingDate)}
          </Text>
          
          {/* Letter Title */}
          <Text style={{
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 10,
            marginTop: 4,
            fontWeight: 'bold',
            fontFamily: 'Calibri',
          }}>
            Relieving Letter
          </Text>
          
          {/* Employee Name */}
          <Text style={{
            fontFamily: 'Calibri',
            fontSize: 10,
            marginBottom: 6,
          }}>
            {safeFormData.employeeName || 'Employee Name'}
          </Text>
          
          {/* Salutation */}
          <Text style={{
            fontFamily: 'Calibri', 
            fontSize: 10,
            marginBottom: 6,
          }}>
            Dear {safeFormData.employeeName || 'Employee'},
          </Text>
          
          {/* Opening Paragraph */}
          <Text style={{...relievingLetterStyles.para, fontSize: 10, marginBottom: 6, lineHeight: 1.25}}>
            We Are Relieving You From Your Duties As {safeFormData.designation || 'Designation'} End Of The Day {formatDate(safeFormData.lastWorkingDate)}.
          </Text>
          
          {/* General Note */}
          <Text style={{...relievingLetterStyles.para, fontSize: 10, marginBottom: 6, lineHeight: 1.25}}>
            Please note that on release from the employment with company, you shall continue to be bound by the obligations related to confidentiality, non-solicitation, intellectual property rights and other such commitments. A few of these are described as below:
          </Text>
          
          {/* Company Property Section */}
          <View style={{...relievingLetterStyles.section, marginTop: 4, marginBottom: 2}}>
            <Text style={{
              fontWeight: 'bold',
              marginBottom: 2,
              fontFamily: 'Calibri',
              fontSize: 10,
            }}>
              Company Property:
            </Text>
            <Text style={{...relievingLetterStyles.para, fontSize: 9.5, marginBottom: 4, lineHeight: 1.25}}>
              You certify that you do not possess any documents, maps, blueprints, designs, books, manuals, software code or any other material which belongs to the company or which was developed by you during the course of your association. You understand that either these documents or codes could be in a paper format or computer storage format and you certify that you do not possess them in either format and the same has been handed over to the reporting Manager in the company.
            </Text>
          </View>
          
          {/* Non-Solicitation Section */}
          <View style={{...relievingLetterStyles.section, marginTop: 4, marginBottom: 2}}>
            <Text style={{
              fontWeight: 'bold',
              marginBottom: 2,
              fontFamily: 'Calibri',
              fontSize: 10,
              marginTop: 2,
            }}>
              Non-Solicitation:
            </Text>
            <Text style={{...relievingLetterStyles.para, fontSize: 9.5, marginBottom: 3, lineHeight: 1.25}}>
              You confirm that for a period of 12 months after release from the association with the company, you will not solicit, assist, refer, cause or force any employee of Nitor, which could result either directly or indirectly in the employee leaving the company.
            </Text>
            <Text style={{...relievingLetterStyles.para, fontSize: 9.5, marginBottom: 3, lineHeight: 1.25}}>
              During the course of your association with the company, you have been privy to information related to the company, its services, processes and systems, business transactions, business plans, software products & IT infrastructure, clients and their business information and other administrative and organizational matters. You agree to treat this information confidential after termination of your association with the company and that you will not share this information by word of mouth or otherwise, with any employee of the company whether past or present, or any third person whether known or unknown to the company and understand that you shall be liable for legal action in case of breach of faith or agreement.
            </Text>
          </View>
          
          {/* Non-Compete Section (Part 1) */}
          <View style={{...relievingLetterStyles.section, marginTop: 2, marginBottom: 2}}>
            <Text style={{
              fontWeight: 'bold',
              marginBottom: 2,
              fontFamily: 'Calibri',
              fontSize: 10,
              marginTop: 2,
            }}>
              Non-Compete:
            </Text>
            <Text style={{...relievingLetterStyles.para, fontSize: 9.5, marginBottom: 3, lineHeight: 1.25}}>
              You understand, agree and acknowledge that Nitor has spent substantial money, invested time and efforts over the years in developing and solidifying its relationships with its customers and consultants. Hence on the basis of non-compete clause you hereby agree that for a period of twenty four (24) months from date of relieving for any reason, whether with or without good cause or for any or no cause, at your disposal or at Nitor's, with or without notice, you will not compete with the Nitor and its successors and assigns for all customers and clients introduced by Nitor, without prior written consent from Nitor.
            </Text>
            <Text style={{...relievingLetterStyles.para, fontSize: 9.5, marginTop: 2, lineHeight: 1.25}}>
              The term "non-compete" as used herein shall mean that you shall not, without the prior written consent of Nitor, (i) serve as a contractor, partner, employee, consultant, officer, director, manager, agent, associate, invest, servant with greater than 5% or otherwise (by itself directly or indirectly, own, manage, operate, join, control, participate in, invest in, work or consult for or otherwise affiliate with) all customers and clients introduced by Nitor or business in competition with or otherwise similar to Nitor's business.
            </Text>
          </View>
          
          {/* Further Declaration section - on page 1 */}
          <View style={{...relievingLetterStyles.section, marginTop: 10, marginBottom: 6}}>
            <Text style={{
              fontFamily: 'Calibri',
              fontSize: 9.5,
              lineHeight: 1.25,
              textAlign: 'justify',
            }}>
              Furthermore, you declare that you have no further claims of whatsoever nature resulting from my association and or termination thereof, against either the company, its group companies, its affiliates or officers or its representatives.
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <FooterComponent />
      </Page>
      
      {/* Page 2 - Signature page only */}
      <Page wrap={false} size="A4" style={{...commonStyles.page, ...relievingLetterStyles.page}}>
        {/* Watermark */}
        <Watermark logoSrc={safeFormData.companyLogo} />
        
        {/* Company Header */}
        <CompanyHeaderComponent />
        
        {/* Hard-coded structure for page 2 that won't overflow */}
        <View fixed style={{ height: '700px', position: 'relative' }}>
          {/* Date and Place Section */}
          <View style={{ position: 'absolute', top: '70px', left: 0, right: 0 }}>
            <Text style={{fontFamily: 'Calibri', fontSize: 11}}>Date: _________________</Text>
            <Text style={{fontFamily: 'Calibri', fontSize: 11, marginTop: 8}}>Place: {safeFormData.employeeSignPlace || 'Pune'}</Text>
          </View>
          
          {/* Signature Section - positioned with enough space above footer */}
          <View style={{
            position: 'absolute',
            top: '250px',
            left: 0, 
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <View style={{width: '45%'}}>
              <Text style={{fontFamily: 'Calibri', fontSize: 11}}>Sign</Text>
              <Text style={{fontFamily: 'Calibri', fontSize: 11, marginTop: 70}}>{safeFormData.employeeName || 'Employee Name'}</Text>
            </View>
            
            <View style={{width: '45%', textAlign: 'right'}}>
              <Text style={{fontFamily: 'Calibri', fontSize: 11, textAlign: 'right'}}>{safeFormData.companyName || 'Company Name'}</Text>
              <Text style={{fontFamily: 'Calibri', fontSize: 11, marginTop: 70, textAlign: 'right'}}>{safeFormData.companyHR || 'HR Name'}</Text>
              <Text style={{fontFamily: 'Calibri', fontSize: 11, textAlign: 'right'}}>Head - HR Dept</Text>
            </View>
          </View>
        </View>
        
        {/* Footer - positioned relatively to ensure it's at the bottom with no overlap */}
        <View style={{
          position: 'absolute',
          bottom: 30,
          left: 50,
          right: 50,
          borderTopWidth: 1,
          borderTopColor: '#0066cc',
          paddingTop: 5,
          textAlign: 'center',
        }}>
          <Text style={relievingLetterStyles.footerText}>{safeFormData.companyName || 'COMPANY NAME'}</Text>
          <Text style={relievingLetterStyles.footerText}>{safeFormData.companyAddressLine1 || 'COMPANY ADDRESS'}</Text>
          <Text style={relievingLetterStyles.footerText}>+91 {safeFormData.companyPhone || 'PHONE NUMBER'}</Text>
          <Text style={relievingLetterStyles.footerText}>{safeFormData.companyWebsite || 'WEBSITE'}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main Component
function RelievingLetterV2() {
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPDF, setShowPDF] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    designation: "",
    lastWorkingDate: new Date().toISOString().split('T')[0],
    joiningDate: "",
    companyName: "",
    companyAddressLine1: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    companyLogo: "",
    companyHR: ""
  });

  // Use React.useMemo to memoize the PDF document to prevent unnecessary re-renders
  const memoizedPdfDocument = React.useMemo(() => (
    <RelievingLetterPDF formData={formData} />
  ), [formData]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchCompanies();
        await fetchCandidates();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setIsLoading(false);
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
      // Try fetching from 'employees' collection
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "company") {
      const selectedCompany = companies.find(company => company.name === value);
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          companyName: selectedCompany.name,
          companyAddressLine1: selectedCompany.address,
          companyEmail: selectedCompany.email,
          companyPhone: selectedCompany.mobile,
          companyWebsite: selectedCompany.website,
          companyLogo: selectedCompany.logo,
          companyHR: selectedCompany.hrName
        }));
      }
    } else if (name === "employeeName") {
      const selectedEmployee = candidates.find(employee => employee.name === value);
      if (selectedEmployee) {
        console.log("Selected Employee:", selectedEmployee);
        
        // Get the employment details for this employee
        const employmentDetails = employments[selectedEmployee.id];
        console.log("Employment details:", employmentDetails);
        
        let joiningDate;
        let employeeDesignation;
        let lastWorkingDate;
        
        if (employmentDetails) {
          // If we have employment details, use those for dates, etc.
          joiningDate = employmentDetails.joiningDate || employmentDetails.startDate;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
          lastWorkingDate = employmentDetails.lastWorkingDate || employmentDetails.endDate;
        } else {
          // Fallback to employee record if no employment details
          joiningDate = selectedEmployee.joinDate;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
          lastWorkingDate = new Date().toISOString().split('T')[0]; // Default to today
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
  
  const handleGenerateDocument = () => {
    setShowPDF(true);
  };

  return (
    <div className="container mx-auto p-4">
      <BackToDocumentsLink />

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Enter Relieving Letter Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Selection */}
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-gray-700">Employee Name</label>
            <select
              name="employeeName"
              value={formData.employeeName}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Employee</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.name}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Sign Date */}
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-gray-700">Employee Sign Date</label>
            <input
              type="date"
              name="employeeSignDate"
              value={formData.employeeSignDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Place of Signing */}
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-gray-700">Place of Signing</label>
            <input
              type="text"
              name="employeeSignPlace"
              value={formData.employeeSignPlace}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter place"
            />
          </div>

          {/* Company Selection */}
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-gray-700">Company</label>
            <select
              name="company"
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Generate Button */}
          <div className="md:col-span-2 flex justify-end mt-6">
            <button
              onClick={handleGenerateDocument}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-md transition-all duration-200"
            >
              <FiDownload size={18} className="mr-2" />
              <span>Generate Relieving Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Section - only show when Generate button is clicked */}
      {showPDF && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
            
            <PDFDownloadLink 
              document={memoizedPdfDocument}
              fileName={`RelievingLetter_${formData.employeeName || 'Employee'}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>
          
          <div className="border rounded-lg" style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              {memoizedPdfDocument}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

const BackToDocumentsLink = () => (
  <div className="mb-4">
    <Link href="/dashboard/documents" className="text-blue-600 hover:underline flex items-center gap-1">
      <FiArrowLeft size={16} /> Back to Documents
    </Link>
  </div>
);

export default RelievingLetterV2;
