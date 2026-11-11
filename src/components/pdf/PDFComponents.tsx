import React from 'react';
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
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








// Watermark Component for background company logo
interface WatermarkProps {
  logoSrc?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ logoSrc }) => {
  return null;
}; 