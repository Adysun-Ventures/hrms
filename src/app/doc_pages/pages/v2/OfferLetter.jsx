'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import TableHeader from '@/components/ui/TableHeader';
import { 
  Document, 
  Page, 
  PDFDownloadLink, 
  PDFViewer,
  Text, 
  View, 
  Image,
  StyleSheet
} from '@react-pdf/renderer';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { offerLetterStyles } from '@/components/pdf/PDFStyles';

// Hardcoded data for now (will be connected to actual data later)
const HARDCODED_DATA = {
  companyName: 'ADYSUN VENTURES PVT. LTD.',
  companyContact: '9579537523 | hr@adysunventures.com | AdysunVentures.com',
  companyAddress: 'Adysun Ventures Pvt. Ltd., S no 47, Workplex, Pune-Satara Rd, Opp City Pride Theater, Near Bhapkar petrol pump, Pune, Maharashtra - 411009',
  employeeName: 'Mr. Arnab Kumar Baishya',
  employeeFirstName: 'Arnab',
  employeeAddress: [
    'C/O: Apurba Kumar Baishya,',
    'H.No.-5, Ananda Nagar,',
    'Six Mile, Khanapara,',
    'Kamrup Metro, Assam-781022'
  ],
  designation: 'Software Engineer',
  joiningDate: '01 Aug 2024',
  letterDate: '19-July-2024',
  ctc: '₹4,00,000',
  fixedCompensation: '₹3,00,000',
  variablePay: '₹1,00,000',
  hrName: 'Prachi Jadhav',
  hrDesignation: 'Head - HR Department',
  hrEmail: 'hr@adysunventures.com',
  salaryBreakdown: {
    basic: { monthly: '5,400', annual: '64,800' },
    hra: { monthly: '2,000', annual: '24,000' },
    conveyance: { monthly: '800', annual: '9,600' },
    otherAllowances: { monthly: '7,000', annual: '84,000' },
    grossSalary: { monthly: '15,200', annual: '1,82,400' },
    professionalTax: { monthly: '200', annual: '2,400' },
    totalDeductions: { monthly: '200', annual: '2,400' },
    netInHand: { monthly: '15,000', annual: '1,80,000' },
    variableIncentive: { monthly: '', annual: '2,20,000' },
    totalCTC: { monthly: '33,533', annual: '4,00,000' }
  }
};

// Watermark Component
const Watermark = ({ logoSrc }) => {
  if (!logoSrc) return null;
  
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};

// Offer Letter PDF Document Component
const OfferLetterPDF = ({ formData }) => {
  // Use hardcoded data for now
  const data = HARDCODED_DATA;
  const companyLogo = formData?.companyLogo || '';
  const signatureLogo = formData?.signatureLogo || '';

  return (
    <Document>
      {/* Page 1 - Header, Date, Address, Title, Greeting, Opening */}
      <Page size="A4" style={offerLetterStyles.page}>
        {/* Watermark */}
        <Watermark logoSrc={companyLogo} />
        
        {/* Company Header */}
        <View style={offerLetterStyles.companyHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={offerLetterStyles.companyName}>{data.companyName}</Text>
              <Text style={offerLetterStyles.companyContact}>{data.companyContact}</Text>
              <Text style={offerLetterStyles.companyAddress}>{data.companyAddress}</Text>
            </View>
            {companyLogo && (
              <Image src={companyLogo} style={offerLetterStyles.companyLogo} />
            )}
          </View>
        </View>
        
        {/* Date */}
        <Text style={offerLetterStyles.dateText}>Date: {data.letterDate}</Text>
        
        {/* Recipient Address */}
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <Text style={offerLetterStyles.bodyTextBold}>{data.employeeName}</Text>
          {data.employeeAddress.map((line, index) => (
            <Text key={index} style={offerLetterStyles.bodyText}>{line}</Text>
          ))}
        </View>
        
        {/* Letter Title */}
        <Text style={offerLetterStyles.letterTitle}>LETTER OF APPOINTMENT</Text>
        
        {/* Greeting */}
        <Text style={offerLetterStyles.bodyText}>Dear {data.employeeFirstName},</Text>
        
        {/* Opening Paragraphs */}
        <View style={{ marginTop: 12 }}>
          <Text style={offerLetterStyles.bodyText}>
            We are pleased to extend this formal appointment as a symbol of our mutual commitment to integrity, excellence, and professional growth. This letter marks the beginning of your journey with <Text style={offerLetterStyles.bodyTextBold}>{data.companyName}</Text>, where we strive to build a future founded on vision, discipline, and respect.
          </Text>
          
          <Text style={offerLetterStyles.bodyText}>
            You are hereby appointed to the position of <Text style={offerLetterStyles.bodyTextBold}>{data.designation}</Text>, effective from <Text style={offerLetterStyles.bodyTextBold}>{data.joiningDate}</Text>. Please note, this offer shall be considered null and void should you fail to commence employment on or before the aforementioned date.
          </Text>
        </View>
      </Page>

      {/* Page 2 - Pre-Employment, Responsibilities, Confidentiality, IP Rights */}
      <Page size="A4" style={offerLetterStyles.page}>
        <Watermark logoSrc={companyLogo} />
        
        {/* Pre-Employment Formalities */}
        <Text style={offerLetterStyles.sectionHeading}>Pre-Employment Formalities</Text>
        <Text style={offerLetterStyles.bodyText}>
          The continuation of your employment is contingent upon submission of the following documents:
        </Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>Relieving letter from your previous employer</Text>
          <Text style={offerLetterStyles.listItemNested}>Last 3 months' pay slips (digital copy)</Text>
          <Text style={offerLetterStyles.listItemNested}>Last 3 months' bank statements reflecting salary credits</Text>
          <Text style={offerLetterStyles.listItemNested}>Scanned copy of Aadhaar card or Passport</Text>
          <Text style={offerLetterStyles.listItemNested}>Valid residential proof (e.g., electricity bill, property tax receipt)</Text>
          <Text style={offerLetterStyles.listItemNested}>Valid email ID and mobile contact number</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Four (4) recent passport-size photographs with a white background</Text>
        </View>
        
        {/* Responsibilities and Expectations */}
        <Text style={offerLetterStyles.sectionHeading}>Responsibilities and Expectations</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>You are expected to execute duties as assigned, including any future assignments, promotions, or departmental transitions.</Text>
          <Text style={offerLetterStyles.listItemNested}>Working hours and shift timings may vary depending on business needs.</Text>
          <Text style={offerLetterStyles.listItemNested}>In case of illness or emergency, the management must be informed promptly.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Any fraudulent activity or damage to company assets must be reported without delay.</Text>
        </View>
        
        {/* Confidentiality and Data Ethics */}
        <Text style={offerLetterStyles.sectionHeading}>Confidentiality and Data Ethics</Text>
        <Text style={offerLetterStyles.bodyText}>
          Throughout and post your tenure, you shall:
        </Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>Maintain absolute confidentiality over proprietary, personal, strategic, technical, and financial information.</Text>
          <Text style={offerLetterStyles.listItemNested}>Refrain from sharing, misusing, duplicating, or disclosing such data without written authorization.</Text>
          <Text style={offerLetterStyles.listItemNested}>Not exploit any intellectual or operational asset of the company for personal or third-party benefit.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Acknowledge that all such information is and remains the exclusive property of {data.companyName}.</Text>
        </View>
        
        {/* Intellectual Property Rights */}
        <Text style={offerLetterStyles.sectionHeading}>Intellectual Property Rights</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>
            All intellectual contributions made by you during the course of employment—arising from company work or resources—shall be deemed the exclusive property of <Text style={offerLetterStyles.bodyTextBold}>{data.companyName}</Text>.
          </Text>
          <Text style={offerLetterStyles.listItemNested}>You are obligated to report such innovations and assign all rights, titles, and interests to the company.</Text>
          <Text style={offerLetterStyles.listItemNested}>No separate compensation shall be claimable for such assignment, as it is inherent in your remuneration</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>You shall offer full cooperation in registering or protecting any such intellectual property, both during and after employment.</Text>
        </View>
      </Page>

      {/* Page 3 - Conflict of Interest, General Terms, Jurisdiction, Probationary Terms */}
      <Page size="A4" style={offerLetterStyles.page}>
        <Watermark logoSrc={companyLogo} />
        
        {/* Conflict of Interest & Ethical Compliance */}
        <Text style={offerLetterStyles.sectionHeading}>Conflict of Interest & Ethical Compliance</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>You must refrain from engaging in any external business, employment, or consulting activities that conflict with the interests of {data.companyName}.</Text>
          <Text style={offerLetterStyles.listItemNested}>Any actual or potential conflict must be reported immediately for review and resolution.</Text>
          <Text style={offerLetterStyles.listItemNested}>Acceptance of gifts, favors, or commissions from individuals or entities conducting business with the company is strictly prohibited.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Use of company resources must reflect integrity and alignment with corporate objectives.</Text>
        </View>
        
        {/* General Terms */}
        <Text style={offerLetterStyles.sectionHeading}>General Terms</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>All official communications shall be in English and delivered via hand, email, courier, or registered post.</Text>
          <Text style={offerLetterStyles.listItemNested}>If any provision of this letter is held unenforceable, the remaining provisions shall continue in full force and effect.</Text>
          <Text style={offerLetterStyles.listItemNested}>Disparagement or defamation of the company or its affiliates shall attract disciplinary or legal action.</Text>
          <Text style={offerLetterStyles.listItemNested}>This document, along with any annexures, constitutes the entire agreement and supersedes any prior discussions or arrangements.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>{data.companyName} reserves the right to seek injunctive relief in case of breach of obligations.</Text>
        </View>
        
        {/* Jurisdiction */}
        <Text style={offerLetterStyles.sectionHeading}>Jurisdiction</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>This letter shall be governed by the applicable laws of India. Any disputes shall fall under the exclusive jurisdiction of competent courts.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>You are required to devote your full working time and attention solely to the business interests. Any concurrent employment or freelance engagements shall render this appointment liable for immediate termination and legal recourse.</Text>
        </View>
        
        {/* Probationary Terms */}
        <Text style={offerLetterStyles.sectionHeading}>Probationary Terms</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>Your appointment is subject to a probationary period of three (3) months. The duration may be extended or shortened at the sole discretion of the management, contingent upon performance and conduct.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Leave shall not be availed during the probation period. Any such absence, if unavoidable, shall be adjusted against paid leave, subject to management approval.</Text>
        </View>
        
        {/* Joining and Probation Period */}
        <Text style={offerLetterStyles.sectionHeading}>Joining and Probation Period</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={[offerLetterStyles.listItem, { paddingBottom: 12 }]}>
            The initial <Text style={offerLetterStyles.bodyTextBold}>probation period will be for 3 months</Text> from your joining date. Based on satisfactory performance, your employment will be confirmed thereafter.
          </Text>
        </View>
      </Page>

      {/* Page 4 - Notice Period, Compensation Structure, CTC Breakdown */}
      <Page size="A4" style={offerLetterStyles.page}>
        <Watermark logoSrc={companyLogo} />
        
        {/* Notice Period */}
        <Text style={offerLetterStyles.sectionHeading}>Notice Period</Text>
        <View style={{ marginLeft: 36 }}>
          <Text style={offerLetterStyles.listItem}>You are required to serve a notice period of 30 days in case of resignation.</Text>
          <Text style={[offerLetterStyles.listItemNested, { paddingBottom: 12 }]}>Failure to serve the full notice period may result in salary deductions or forfeiture of dues and legal action.</Text>
        </View>
        
        {/* Compensation Structure */}
        <Text style={offerLetterStyles.sectionHeading}>Compensation Structure</Text>
        <Text style={offerLetterStyles.bodyText}>
          Your total <Text style={offerLetterStyles.bodyTextBold}>Annual Cost to Company (CTC)</Text> will be {data.ctc}, broken down as follows:
        </Text>
        <Text style={[offerLetterStyles.bodyText, { marginTop: 8 }]}>
          <Text style={offerLetterStyles.bodyTextBold}>A. Fixed Compensation:</Text> {data.fixedCompensation} per annum
        </Text>
        <Text style={offerLetterStyles.bodyText}>
          <Text style={offerLetterStyles.bodyTextBold}>B. Performance-Based Variable Pay:</Text> {data.variablePay} per annum
        </Text>
        <Text style={[offerLetterStyles.bodyTextItalic, { marginTop: 4, marginBottom: 12 }]}>
          (Payable annually based on performance parameters set by the company)
        </Text>
        
        {/* CTC Breakdown Table */}
        <Text style={offerLetterStyles.sectionHeading}>CTC Breakdown – Annual and Monthly</Text>
        
        {/* Table */}
        <View style={{ marginTop: 8 }}>
          {/* Table Header */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Component</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
              <Text>Monthly (₹)</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
              <Text>Annual (₹)</Text>
            </View>
          </View>
          
          {/* Basic Salary */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>Basic Salary</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.basic.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.basic.annual}</Text>
            </View>
          </View>
          
          {/* HRA */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>HRA</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.hra.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.hra.annual}</Text>
            </View>
          </View>
          
          {/* Conveyance Allowance */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>Conveyance Allowance</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.conveyance.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.conveyance.annual}</Text>
            </View>
          </View>
          
          {/* Other Allowances */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>Other Allowances</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.otherAllowances.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.otherAllowances.annual}</Text>
            </View>
          </View>
          
          {/* Gross Salary */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Gross Salary</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.grossSalary.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.grossSalary.annual}</Text>
            </View>
          </View>
          
          {/* Deductions Header */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Deductions</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text></Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text></Text>
            </View>
          </View>
          
          {/* Professional Tax */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>Professional Tax (est.)</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.professionalTax.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.professionalTax.annual}</Text>
            </View>
          </View>
          
          {/* Total Deductions */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Total Deductions</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.totalDeductions.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.totalDeductions.annual}</Text>
            </View>
          </View>
          
          {/* Net In-Hand Salary */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Net In-Hand Salary</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.netInHand.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.netInHand.annual}</Text>
            </View>
          </View>
          
          {/* Additional Benefits Header */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Additional Benefits</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text></Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text></Text>
            </View>
          </View>
          
          {/* Variable Incentive */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
              <Text>Ann. Perfr. Incentive (Variable)</Text>
            </View>
            <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.variableIncentive.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.variableIncentive.annual}</Text>
            </View>
          </View>
          
          {/* Total CTC */}
          <View style={offerLetterStyles.tableRow}>
            <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
              <Text>Total CTC</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.totalCTC.monthly}</Text>
            </View>
            <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
              <Text>{data.salaryBreakdown.totalCTC.annual}</Text>
            </View>
          </View>
        </View>
        
        {/* Note */}
        <Text style={[offerLetterStyles.bodyText, { marginTop: 12 }]}>
          Note: There is currently <Text style={offerLetterStyles.bodyTextBold}>no deduction for Provident Fund (PF)</Text>.
        </Text>
      </Page>

      {/* Page 5 - Acknowledgement & Acceptance */}
      <Page size="A4" style={offerLetterStyles.page}>
        <Watermark logoSrc={companyLogo} />
        
        {/* Acknowledgement And Acceptance */}
        <Text style={offerLetterStyles.sectionHeading}>Acknowledgement And Acceptance</Text>
        <Text style={offerLetterStyles.bodyText}>
          I, the undersigned, hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter. I accept the offer of employment with {data.companyName} and confirm my commitment to fulfill all responsibilities entrusted to me with sincerity and integrity.
        </Text>
        
        <Text style={[offerLetterStyles.bodyText, { marginTop: 12 }]}>
          Candidate Name: <Text style={offerLetterStyles.bodyTextBold}>{data.employeeName}</Text>
        </Text>
        
        <Text style={[offerLetterStyles.bodyText, { marginTop: 8 }]}>
          Signature: _________________________
        </Text>
        
        <Text style={[offerLetterStyles.bodyText, { marginTop: 8 }]}>
          Date: _________________________
        </Text>
        
        <Text style={[offerLetterStyles.bodyText, { marginTop: 12 }]}>
          Warm regards,
        </Text>
        
        {/* Signature Image */}
        {signatureLogo && (
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <Image src={signatureLogo} style={{ width: 120, height: 60 }} />
          </View>
        )}
        
        {/* HR Details */}
        <Text style={offerLetterStyles.bodyTextBold}>{data.hrName}</Text>
        <Text style={offerLetterStyles.bodyText}>{data.hrDesignation}</Text>
        <Text style={offerLetterStyles.bodyText}>{data.hrEmail}</Text>
      </Page>
    </Document>
  );
};

// Main Component
function OfferLetterV2() {
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    joiningDate: "",
    designation: "",
    lpa: "",
    salaryComponentsV2: null,
    companyName: "",
    companyAddressLine1: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    companyLogo: "",
    signatureLogo: "",
    hrDesignation: "",
    hrEmail: ""
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

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
    try {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const companiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies data');
    }
  };

  const fetchCandidates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
          }
        } catch (err) {
          console.error(`Error fetching employment for employee ${employee.id}:`, err);
        }
      }
      
      setEmployments(employmentData);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "companyName") {
      const selectedCompany = companies.find(company => company.id === value);
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          companyName: value,
          companyAddressLine1: selectedCompany.address,
          companyEmail: selectedCompany.email,
          companyPhone: selectedCompany.mobile,
          companyWebsite: selectedCompany.website,
          companyLogo: selectedCompany.logo || "",
          signatureLogo: selectedCompany.signatureLogo || "",
          hrDesignation: selectedCompany.hrDesignation || "",
          hrEmail: selectedCompany.hrEmail || selectedCompany.email || ""
        }));
      } else if (value === "") {
        setFormData(prev => ({
          ...prev,
          companyName: "",
          companyAddressLine1: "",
          companyEmail: "",
          companyPhone: "",
          companyWebsite: "",
          companyLogo: "",
          signatureLogo: "",
          hrDesignation: "",
          hrEmail: ""
        }));
      }
    } else if (name === "employeeName") {
      const selectedEmployee = candidates.find(employee => employee.id === value);
      if (selectedEmployee) {
        const employmentDetails = employments[selectedEmployee.id];
        let employeeSalary;
        let joiningDate;
        let employeeDesignation;
        
        if (employmentDetails) {
          employeeSalary = employmentDetails.salary || employmentDetails.ctc;
          joiningDate = employmentDetails.joiningDate || employmentDetails.startDate;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
        } else {
          employeeSalary = selectedEmployee.salary;
          joiningDate = selectedEmployee.joinDate;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
        }
        
        setFormData(prev => ({
          ...prev,
          employeeId: value,
          employeeName: selectedEmployee.name,
          designation: employeeDesignation || "",
          joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        }));
      }
    }
  };

  const handleGenerateDocument = () => {
    try {
      if (!formData.employeeId) {
        toast.error('Please select an employee');
        return;
      }
      
      let finalFormData = { 
        ...formData,
        employeeName: formData.employeeName || candidates.find(emp => emp.id === formData.employeeId)?.name || 'Employee'
      };
      
      if (!formData.companyName || formData.companyName === "") {
        finalFormData = {
          ...finalFormData,
          companyName: 'Sample Company Name',
          companyAddressLine1: 'Sample Company Address',
          companyEmail: 'sample@company.com',
          companyPhone: '+91 1234567890',
          companyWebsite: 'www.samplecompany.com',
          companyLogo: '',
          signatureLogo: '',
          hrDesignation: 'Head - HR Department',
          hrEmail: 'sample@company.com'
        };
        toast('Using sample company data for PDF generation');
      }
      
      setFormData(finalFormData);
      setShowPDF(true);
      toast.success('Offer letter generated successfully!');
    } catch (error) {
      console.error('Error generating offer letter:', error);
      toast.error(`Failed to generate offer letter: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDownloadSuccess = () => {
    toast.success('Offer letter downloaded successfully');
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <TableHeader
          title="Generate Offer Letter"
          backButton={{ href: '/dashboard/documents', label: 'Back' }}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-8 pt-8 mb-0"
          searchValue=""
          onSearchChange={() => {}}
        />
        
        <div className="px-8 pb-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-slate-800">Employee</label>
            <select
              name="employeeName"
              value={formData.employeeId || ""}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Employee</option>
              {candidates.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-slate-800">
              Company <span className="text-gray-400 text-xs">(Optional - will use sample data if not selected)</span>
            </label>
            <select
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Company (Optional)</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleGenerateDocument}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-md transition-all duration-200"
            >
              <FiDownload size={18} className="mr-2" />
              <span>Generate Offer Letter</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* PDF Preview Section */}
      {showPDF && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
            
            <PDFDownloadLink
              document={<OfferLetterPDF formData={formData} />}
              fileName={`OfferLetter_${formData.employeeName || 'Employee'}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleDownloadSuccess}
            >
              {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>
          
          <div className="border rounded-lg" style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              <OfferLetterPDF formData={formData} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferLetterV2;