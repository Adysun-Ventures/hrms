import React from 'react';
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { commonStyles } from './PDFStyles';
import { offerLetterStyles } from './PDFStyles';

interface CompanyHeaderProps {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  companyLogo?: string;
  companyColor?: string;
}

// Company Header Component
export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  companyName,
  companyAddress,
  companyPhone,
  companyWebsite,
  companyLogo,
  companyColor = '#0066cc'
}) => {
  // Create a custom style with the dynamic color
  const styles = StyleSheet.create({
    header: {
      ...offerLetterStyles.header,
      borderBottomColor: companyColor,
    },
    companyName: {
      ...offerLetterStyles.companyName,
      color: companyColor,
    }
  });

  return (
    <View style={styles.header}>
      <View style={offerLetterStyles.companyInfo}>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={offerLetterStyles.companyAddress}>{companyAddress}</Text>
        <Text style={offerLetterStyles.companyContact}>Phone: {companyPhone}</Text>
        <Text style={offerLetterStyles.companyContact}>{companyWebsite}</Text>
      </View>
      {companyLogo && (
        <Image 
          src={companyLogo} 
          style={offerLetterStyles.logo} 
        />
      )}
    </View>
  );
};

interface LetterTitleProps {
  title: string;
}

// Letter Title Component
export const LetterTitle: React.FC<LetterTitleProps> = ({ title }) => (
  <Text style={offerLetterStyles.letterTitle}>{title}</Text>
);

interface FormattedDateProps {
  date: string;
}

// Formatted Date Component
export const FormattedDate: React.FC<FormattedDateProps> = ({ date }) => (
  <View style={offerLetterStyles.dateSection}>
    <Text>Date: {date}</Text>
  </View>
);

interface AddresseeProps {
  name: string;
}

// Addressee Component
export const Addressee: React.FC<AddresseeProps> = ({ name }) => (
  <View style={offerLetterStyles.toSection}>
    <Text>Dear {name},</Text>
  </View>
);

interface ParagraphProps {
  children: React.ReactNode;
}

// Paragraph Component
export const Paragraph: React.FC<ParagraphProps> = ({ children }) => (
  <Text style={offerLetterStyles.paragraph}>{children}</Text>
);

interface SignatureProps {
  companyName: string;
  employeeName: string;
}

// Signature Component
export const Signature: React.FC<SignatureProps> = ({ companyName, employeeName }) => (
  <View style={offerLetterStyles.signature}>
    <View style={offerLetterStyles.signatureBox}>
      <Text>For {companyName}</Text>
      <View style={offerLetterStyles.signatureLine}></View>
      <Text style={offerLetterStyles.signatureText}>Authorized Signatory</Text>
    </View>
    
    <View style={offerLetterStyles.signatureBox}>
      <Text>Acceptance of Employee</Text>
      <View style={offerLetterStyles.signatureLine}></View>
      <Text style={offerLetterStyles.signatureText}>{employeeName}</Text>
      <Text style={offerLetterStyles.signatureText}>Date: </Text>
    </View>
  </View>
);

interface FooterProps {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  companyColor?: string;
}

// Footer Component
export const Footer: React.FC<FooterProps> = ({
  companyName,
  companyAddress,
  companyPhone,
  companyWebsite,
  companyColor = '#0066cc'
}) => {
  // Create a custom style with the dynamic color
  const styles = StyleSheet.create({
    footer: {
      ...offerLetterStyles.footer,
      borderTopColor: companyColor,
      textAlign: 'center',
    },
    footerText: {
      fontSize: 10,
      textAlign: 'center',
      marginBottom: 2,
    }
  });

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{companyName}</Text>
      <Text style={styles.footerText}>{companyAddress}</Text>
      <Text style={styles.footerText}>{companyPhone}</Text>
      <Text style={styles.footerText}>{companyWebsite}</Text>
    </View>
  );
};

// Salary Table Component
interface SalaryTableProps {
  items: { 
    label: string; 
    value: string;
  }[];
  total: string;
}

export const SalaryTable: React.FC<SalaryTableProps> = ({ items, total }) => (
  <View style={offerLetterStyles.salaryTable}>
    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Compensation Heads</Text>
    
    {items.map((item, index) => (
      <View key={index} style={offerLetterStyles.tableRow}>
        <Text>{item.label}</Text>
        <Text>: ₹{item.value}</Text>
      </View>
    ))}
    
    <View style={offerLetterStyles.tableRowTotal}>
      <Text>Annual Total</Text>
      <Text>: ₹{total}</Text>
    </View>
  </View>
);

// Watermark Component for background company logo
interface WatermarkProps {
  logoSrc?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ logoSrc }) => {
  // Only render if logo exists
  if (!logoSrc) return null;
  
  const watermarkStyles = StyleSheet.create({
    watermarkContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    watermarkImage: {
      width: '70%',
      height: 'auto',
      opacity: 0.12, // Lighter opacity (0.12 = 12% opacity, 88% transparent)
    }
  });
  
  return (
    <View style={watermarkStyles.watermarkContainer}>
      <Image src={logoSrc} style={watermarkStyles.watermarkImage} />
    </View>
  );
}; 