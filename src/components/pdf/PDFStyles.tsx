import { StyleSheet, Font } from '@react-pdf/renderer';
import { View, Image } from '@react-pdf/renderer';

// Register fonts - using standard fonts for simplicity
// Default font (Calibri for PDF)
Font.register({
  family: 'Calibri',
  fonts: [
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
    },
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
      fontStyle: 'italic',
    },
  ],
});

// Lato font removed - using Calibri instead (already registered and working)
// Calibri provides similar professional appearance and is reliable

// Monospace font for fixed-width formatting
Font.register({
  family: 'Courier',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/courier-new@1.0.4/Courier New.ttf' },
    { 
      src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/courier-new-bold@1.0.4/Courier New Bold.ttf',
      fontWeight: 'bold'
    }
  ]
});

// Common styles for all PDF documents
export const commonStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#000000',
  },
  section: {
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  title: {
    fontSize: 16, 
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24,
  },
  tableCell: {
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    marginVertical: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    fontSize: 10,
  },
});

// Specific styles for offer letter - matching 5-page template
export const offerLetterStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingLeft: 72,
    paddingRight: 54,
    paddingBottom: 72,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.0,
    color: '#000000',
  },
  // Company header styles
  companyHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontFamily: 'Calibri',
  },
  companyContact: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'Calibri',
  },
  companyAddress: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: 'Calibri',
  },
  companyLogo: {
    width: 60,
    height: 60,
  },
  // Section heading styles
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
    paddingTop: 14,
    paddingBottom: 4,
    lineHeight: 1.0,
    fontFamily: 'Calibri',
    color: '#000000',
  },
  // List item styles
  listItem: {
    marginLeft: 36,
    paddingTop: 12,
    paddingLeft: 0,
    paddingBottom: 0,
    lineHeight: 1.0,
    fontSize: 11,
    fontFamily: 'Calibri',
  },
  listItemNested: {
    marginLeft: 36,
    paddingTop: 0,
    paddingLeft: 0,
    paddingBottom: 0,
    lineHeight: 1.0,
    fontSize: 11,
    fontFamily: 'Calibri',
  },
  // Text styles
  bodyText: {
    fontSize: 12,
    fontFamily: 'Calibri',
    lineHeight: 1.0,
    paddingTop: 12,
    paddingBottom: 12,
    textAlign: 'left',
  },
  bodyTextBold: {
    fontSize: 12,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    lineHeight: 1.0,
  },
  bodyTextItalic: {
    fontSize: 12,
    fontFamily: 'Calibri',
    fontStyle: 'italic',
    color: '#666666',
    lineHeight: 1.0,
  },
    // Title styles
  letterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textDecoration: 'underline',
    textAlign: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    fontFamily: 'Calibri',
  },
  // Date styles
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    paddingTop: 12,
    paddingBottom: 12,
  },
  // Table styles
  table: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderTopStyle: 'solid',
    borderLeftWidth: 1,
    borderLeftColor: '#000000',
    borderLeftStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    fontSize: 12,
    fontFamily: 'Calibri',
  },
  tableCellLast: {
    padding: 5,
    fontSize: 12,
    fontFamily: 'Calibri',
  },
  tableCellBold: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    fontSize: 12,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
  },
  tableCellBoldLast: {
    padding: 5,
    fontSize: 12,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
  },
  // Watermark styles
  watermark: {
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
    width: '80%',
    height: 'auto',
    opacity: 0.15,
  },
});

// Specific styles for appointment letter
export const appointmentLetterStyles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.6,
  },
  subjectLine: {
    margin: '20px 0',
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontWeight: 'bold',
    margin: '20px 0 10px',
  },
  tableContainer: {
    marginVertical: 20,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    borderLeft: '1pt solid black',
    borderRight: '1pt solid black',
  },
  tableRowFirst: {
    flexDirection: 'row',
    borderTop: '1pt solid black',
    borderBottom: '1pt solid black',
    borderLeft: '1pt solid black',
    borderRight: '1pt solid black',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    padding: 8,
    flex: 1,
    borderRight: '1pt solid black',
  },
  tableCell: {
    padding: 8,
    flex: 1,
    borderRight: '1pt solid black',
  },
  tableCellLast: {
    padding: 8,
    flex: 1,
  },
});

// Other document-specific styles
export const appraisalLetterStyles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.6,
  },
  subjectLine: {
    margin: '20px 0',
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontWeight: 'bold',
    margin: '20px 0 10px',
  },
});

export const relievingLetterStyles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.6,
  },
  subjectLine: {
    margin: '20px 0',
    fontWeight: 'bold',
  },
});

export const incrementLetterStyles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.6,
  },
  subjectLine: {
    margin: '20px 0',
    fontWeight: 'bold',
  },
});

// Salary slip specific styles
export const salarySlipStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Calibri',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Calibri',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
    fontFamily: 'Calibri',
  },
  section: {
    marginVertical: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  tableColWide: {
    width: '50%',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    padding: 5,
    fontFamily: 'Calibri',
  },
  tableCell: {
    padding: 5,
    fontFamily: 'Calibri',
  },
  summaryBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Calibri',
  },
});

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