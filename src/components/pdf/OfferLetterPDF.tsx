import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { offerLetterStyles } from './PDFStyles';
import { 
  CompanyHeader, 
  LetterTitle,
  FormattedDate,
  Addressee,
  Paragraph,
  Signature,
  Footer,
  SalaryTable,
  Watermark
} from './PDFComponents';
import { 
  formatDateToDDMMMYYYY,
  formatIndianCurrency,
  numberToWords,
  calculateSalaryComponentsV2
} from '@/utils/pdfUtils';

interface OfferLetterPDFProps {
  formData: {
    employeeName: string;
    designation: string;
    joiningDate: string;
    lpa: string;
    companyName: string;
    companyAddressLine1: string;
    companyColor: string;
    companyEmail: string;
    companyPhone: string;
    companyWebsite: string;
    companyLogo: string;
    salaryInWords: string;
    salaryComponentsV2?: any;
  };
}

const OfferLetterPDF: React.FC<OfferLetterPDFProps> = ({ formData }) => {
  // Make sure we have salary components
  const salaryComponents = formData.salaryComponentsV2 || calculateSalaryComponentsV2(formData.lpa || '0');
  
  // Format salary values for display
  const formatSalaryValues = () => {
    return [
      {
        label: 'Basic',
        value: formatIndianCurrency(salaryComponents.annual.basic),
      },
      {
        label: 'Dearness Allowance',
        value: formatIndianCurrency(salaryComponents.annual.dearnessAllowance),
      },
      {
        label: 'Conveyance Allowance',
        value: formatIndianCurrency(salaryComponents.annual.conveyanceAllowance),
      },
      {
        label: 'Other Allowance',
        value: formatIndianCurrency(salaryComponents.annual.otherAllowance),
      }
    ];
  };

  // Calculate total annual salary
  const total = formatIndianCurrency(salaryComponents.annual.total);
  
  // Format joining date
  const formattedJoiningDate = formatDateToDDMMMYYYY(formData.joiningDate || new Date());
  
  // Salary in words
  const salaryInWords = formData.salaryInWords || 
    `${numberToWords(parseFloat(formData.lpa || '0'))} Lakh`;

  // Custom styles for improved spacing to match original
  const customStyles = StyleSheet.create({
    page: {
      ...offerLetterStyles.page,
      padding: 35,
      fontSize: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 8,
    },
    contentSection: {
      marginBottom: 12,
    },
    paragraph: {
      fontSize: 12,
      marginBottom: 7,
      textAlign: 'justify',
    }
  });

  return (
    <Document>
      {/* Page 1 - Joining Cum Appointment Letter */}
      <Page size="A4" style={customStyles.page}>
        {/* Watermark */}
        <Watermark logoSrc={formData.companyLogo} />
        
        {/* Company Header */}
        <CompanyHeader 
          companyName={formData.companyName || 'COMPANY NAME'} 
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'} 
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyLogo={formData.companyLogo}
          companyColor={formData.companyColor || '#0066cc'}
        />
        
        {/* Letter Title */}
        <LetterTitle title="Joining Cum Appointment Letter" />
        
        {/* Letter Date */}
        <FormattedDate date={formattedJoiningDate} />
        
        {/* Addressee */}
        <Addressee name={formData.employeeName || 'EMPLOYEE NAME'} />
        
        {/* Letter Content */}
        <View style={customStyles.contentSection}>
          <Paragraph>
            We are pleased in appointing you as {formData.designation || 'DESIGNATION'} in {formData.companyName || 'COMPANY NAME'}, 
            at our Office in our organization, effective from {formattedJoiningDate} on the following terms and conditions:
          </Paragraph>
          
          <Paragraph>
            You will be placed in the appropriate responsibility level of the Company, and will be entitled to compensation (salary and other applicable benefits) as discussed. Compensation will be governed by the rules of the Company on the subject, as applicable and/or amended hereafter.
          </Paragraph>
          
          <Paragraph>
            You will be eligible to the benefits of the Company's Leave Rules on your confirmation in the Company's Service as discussed. During the period of your employment you will devote full time to the work of the Company. Further, you will not take any other employment or assignment or any office honorary or for any consideration in cash or in kind or otherwise, without the prior written permission of the Company.
          </Paragraph>
          
          <Paragraph>
            You will be on a Probation period for the Three months based on your performance. During the probation period your services can be terminated with seven day's notice on either side and without any reasons whatsoever. If your services are found satisfactory during the probation period, you will be confirmed in the present position and thereafter your services can be terminated on one month's notice on either side. The period of probation can be extended at the discretion of the Management and you will continue to be on probation till an order of confirmation has been issued in writing.
          </Paragraph>
          
          <Paragraph>
            Your salary package will be Rs. {total}/- ({salaryInWords} Rupees Only) and no other allowance is provided in that period.
          </Paragraph>
        </View>
        
        {/* Footer */}
        <Footer
          companyName={formData.companyName || 'COMPANY NAME'}
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'}
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyColor={formData.companyColor || '#0066cc'}
        />
      </Page>

      {/* Page 2 - Additional Terms */}
      <Page size="A4" style={customStyles.page}>
        {/* Watermark */}
        <Watermark logoSrc={formData.companyLogo} />
        
        {/* Company Header */}
        <CompanyHeader 
          companyName={formData.companyName || 'COMPANY NAME'} 
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'}
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyLogo={formData.companyLogo}
          companyColor={formData.companyColor || '#0066cc'}
        />
        
        {/* Letter Title */}
        <LetterTitle title="Additional Terms" />
        
        {/* Letter Content */}
        <View style={customStyles.contentSection}>
          <Paragraph>
            You will not disclose any of our technical or other important information which might come into your possession during the continuation of your service with us shall not be disclosed, divulged or made public by you even thereafter.
          </Paragraph>
          
          <Paragraph>
            If you conceive any new or advanced method of improving designs / processes / formulae / systems, etc. related to the interest / business of the Company, such developments will be fully communicated to the company and will be and will remain the sole right/property of the Company. Also includes Technology, Software packages license, Company's policy, Company's platform & Trade Mark and Company's human assets profile. Also the usage of personal USB Drives and CD-ROM's are strictly prohibited.
          </Paragraph>
          
          <Paragraph>
            If any declaration given or information furnished by you, to the Company proves to be false, or if you are found to have willfully suppressed any material information, in such cases you will be liable to removal from services without any notice.
          </Paragraph>
          
          <Paragraph>
            During the probationary period and any extension thereof, your service may be terminated on either side by giving one week's notice or salary in lieu thereof. Upon confirmation the services can be terminated from either side by giving one-month (30 Days) notice or salary in lieu thereof. Upon termination of employment you will immediately hand over to the Company all correspondence, specifications, formulae, books, documents, market data, cost data, drawings, affects or records belonging to the Company or relating to its business and shall not retain or make copies of these items.
          </Paragraph>
          
          <Paragraph>
            If at any time in our opinion which is final in this matter you are found non-performer or guilty of fraud, dishonest, disobedience, disorderly behavior, negligence, indiscipline, absence from duty without permission or any other conduct considered by us deterrent to our interest or of violation of one or more terms of this letter, your services may be terminated without notice.
          </Paragraph>
        </View>
        
        {/* Footer */}
        <Footer
          companyName={formData.companyName || 'COMPANY NAME'}
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'}
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyColor={formData.companyColor || '#0066cc'}
        />
      </Page>

      {/* Page 3 - Continuation and Salary Annexure */}
      <Page size="A4" style={customStyles.page}>
        {/* Watermark */}
        <Watermark logoSrc={formData.companyLogo} />
        
        {/* Company Header */}
        <CompanyHeader 
          companyName={formData.companyName || 'COMPANY NAME'} 
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'}
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyLogo={formData.companyLogo}
          companyColor={formData.companyColor || '#0066cc'}
        />
        
        {/* Additional Terms Continuation */}
        <View style={{marginBottom: 5}}>
          <Paragraph>
            You will be responsible for safekeeping and return in good condition and order of all Company property which may be in your use, custody or charge.
          </Paragraph>
          
          <Paragraph>
            All legal matters are subject to Pune Jurisdiction.
          </Paragraph>
          
          <Paragraph>
            Please confirm your acceptance of the appointment on the above terms and conditions by signing and returning this letter to us for our records.
          </Paragraph>
          
          <Paragraph>
            Enclosure:- Attaching herewith your salary annexure.
          </Paragraph>
        </View>
        
        {/* Salary Annexure Section */}
        <View style={{marginTop: 5}}>
          <LetterTitle title="Salary Annexure" />
          
          <FormattedDate date={formattedJoiningDate} />
          
          <Addressee name={formData.employeeName || 'EMPLOYEE NAME'} />
          
          <Paragraph>
            As per mentioned in the offer letter, here with attaching your salary structure which includes your Basic salary and other benefits received by you from the company.
          </Paragraph>
          
          {/* Salary Table */}
          <SalaryTable 
            items={formatSalaryValues()}
            total={total}
          />
          
          <Paragraph>
            We expect you to keep up your performance in the years to come and grow with the organization and we will expect you will get happy and enthusiastic environment for work at the organization.
          </Paragraph>
          
          <Text style={{ marginTop: 10 }}>Wish you all the best.</Text>
          
          {/* Signature - Compact version to prevent page overflow */}
          <View style={{ marginTop: 15, marginBottom: 70 }}>
            <Text>Signature</Text>
            <Text style={{ marginTop: 5 }}>Head - HR Dept</Text>
          </View>
        </View>
        
        {/* Footer */}
        <Footer
          companyName={formData.companyName || 'COMPANY NAME'}
          companyAddress={formData.companyAddressLine1 || 'COMPANY ADDRESS'}
          companyPhone={formData.companyPhone || 'PHONE NUMBER'}
          companyWebsite={formData.companyWebsite || 'WEBSITE'}
          companyColor={formData.companyColor || '#0066cc'}
        />
      </Page>
    </Document>
  );
};

export default OfferLetterPDF; 