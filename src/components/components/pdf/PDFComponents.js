import React from 'react';
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { commonStyles } from './PDFStyles';

// Company Header Component
export const CompanyHeader = ({ companyName, companyAddress, companyLogo, companyPhone, companyWebsite, companyColor }) => (
  <>
    <View style={commonStyles.companyHeader}>
      <View>
        <Text 
          style={[
            commonStyles.companyName, 
            { color: companyColor || '#FF0000', fontFamily: 'Calibri' }
          ]}
        >
          {companyName}
        </Text>f
        <Text style={commonStyles.companyAddress}>{companyAddress}</Text>
        <Text style={commonStyles.companyAddress}>Phone: {companyPhone}</Text>
        <Text style={commonStyles.companyAddress}>{companyWebsite}</Text>
      </View>
      {companyLogo && (
        <Image 
          src={companyLogo} 
          style={commonStyles.companyLogo} 
        />
      )}
    </View>
    <View style={[commonStyles.separatorLine, { borderBottomColor: companyColor || '#FF0000' }]} />
  </>
);

// Letter Title Component
export const LetterTitle = ({ title }) => (
  <Text style={commonStyles.letterTitle}>{title}</Text>
);

// Date Component with formatting
export const FormattedDate = ({ date, style }) => {
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return "";
    }
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };
  
  return (
    <Text style={[commonStyles.letterDate, style]}>Date: {formatDate(date)}</Text>
  );
};

// Addressee Component
export const Addressee = ({ name, style }) => (
  <View style={{ marginBottom: 8, ...style }}>
    <Text style={{ fontSize: 11.5, fontFamily: 'Calibri' }}>Dear {name},</Text>
  </View>
);

// Paragraph Component - Optimized with less margin for better content fit
export const Paragraph = ({ children, style }) => (
  <Text style={[commonStyles.letterParagraph, style]}>{children}</Text>
);

// Signature Component
export const Signature = ({ name, designation, style }) => (
  <View style={[commonStyles.signatureSection, style]}>
    <Text style={{ marginBottom: 5, fontFamily: 'Calibri' }}>Signature</Text>
    <Text style={{ marginTop: 15, fontFamily: 'Calibri' }}>{designation || 'Head - HR Dept'}</Text>
  </View>
);

// Footer Component - Center-aligned text like in current version
export const Footer = ({ companyName, companyAddress, companyPhone, companyWebsite, companyColor }) => (
  <View style={commonStyles.footer}>
    <View style={[commonStyles.footerSeparator, { borderTopColor: companyColor || '#FF0000' }]} />
    <Text style={commonStyles.footerText}>{companyName}</Text>
    <Text style={commonStyles.footerText}>{companyAddress}</Text>
    <Text style={commonStyles.footerText}>{companyPhone}</Text>
    <Text style={commonStyles.footerText}>{companyWebsite}</Text>
  </View>
);

// Table Component for Salary/Compensation - Fix number rendering and borders
const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1pt solid #ddd',
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: 11.5,
    marginBottom: 2,
    fontFamily: 'Calibri',
  },
  tableCell: {
    flex: 3,
    fontSize: 11.5,
    fontFamily: 'Calibri',
  },
  tableCellValue: {
    flex: 2,
    textAlign: 'right',
    fontSize: 11.5,
    fontFamily: 'Calibri',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    borderTop: '2pt solid #000',
    borderBottom: '2pt solid #000',
    paddingVertical: 4,
    fontWeight: 'bold',
    fontSize: 11.5,
    fontFamily: 'Calibri',
  },
});

export const SalaryTable = ({ components }) => (
  <View style={tableStyles.table}>
    <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 11.5, fontFamily: 'Calibri' }}>Compensation Heads</Text>
    
    {components && components.slice(0, -1).map((item, index) => (
      <View key={index} style={tableStyles.tableRow}>
        <Text style={tableStyles.tableCell}>{item.label}</Text>
        <Text style={tableStyles.tableCellValue}>: Rs. {item.value}</Text>
      </View>
    ))}
    
    {components && components.length > 0 && (
      <View style={tableStyles.totalRow}>
        <Text style={tableStyles.tableCell}>Annual Total</Text>
        <Text style={tableStyles.tableCellValue}>: Rs. {components[components.length - 1].total}</Text>
      </View>
    )}
  </View>
); 