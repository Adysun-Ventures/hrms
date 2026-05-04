import { StyleSheet, Font } from '@react-pdf/renderer';
import { View, Image } from '@react-pdf/renderer';
import { BODY_FONT_FAMILY, ensureDocumentFonts } from './documentFont';

ensureDocumentFonts();

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
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
    lineHeight: 1.5,
    color: '#000000',
  },
  section: {
    marginBottom: 10,
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  title: {
    fontSize: 12, 
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 12,
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
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
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
    fontFamily: BODY_FONT_FAMILY,
  },
  companyContact: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: BODY_FONT_FAMILY,
  },
  companyAddress: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: BODY_FONT_FAMILY,
  },
  companyLogo: {
    width: 60,
    height: 60,
  },
  // Section heading styles
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    textDecoration: 'underline',
    paddingTop: 14,
    paddingBottom: 4,
    lineHeight: 1.0,
    fontFamily: BODY_FONT_FAMILY,
    color: '#000000',
  },
  // List item styles
  listItem: {
    marginLeft: 36,
    paddingTop: 12,
    paddingLeft: 0,
    paddingBottom: 0,
    lineHeight: 1.0,
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
  },
  listItemNested: {
    marginLeft: 36,
    paddingTop: 0,
    paddingLeft: 0,
    paddingBottom: 0,
    lineHeight: 1.0,
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
  },
  // Text styles
  bodyText: {
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
    lineHeight: 1.0,
    paddingTop: 12,
    paddingBottom: 12,
    textAlign: 'left',
  },
  bodyTextBold: {
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
    fontWeight: 'bold',
    lineHeight: 1.0,
  },
  bodyTextItalic: {
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
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
    fontFamily: BODY_FONT_FAMILY,
  },
  // Date styles
  dateText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: BODY_FONT_FAMILY,
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
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
  },
  tableCellLast: {
    padding: 5,
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
  },
  tableCellBold: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderRightStyle: 'solid',
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
    fontWeight: 'bold',
  },
  tableCellBoldLast: {
    padding: 5,
    fontSize: 10,
    fontFamily: BODY_FONT_FAMILY,
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
    width: '72%',
    height: 'auto',
    opacity: 0.10,
  },
});

// Specific styles for appointment letter
export const appointmentLetterStyles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
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
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
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
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 10,
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
    fontFamily: BODY_FONT_FAMILY,
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
    fontFamily: BODY_FONT_FAMILY,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: BODY_FONT_FAMILY,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
    fontFamily: BODY_FONT_FAMILY,
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
    fontFamily: BODY_FONT_FAMILY,
  },
  tableCell: {
    padding: 5,
    fontFamily: BODY_FONT_FAMILY,
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
    fontFamily: BODY_FONT_FAMILY,
  },
});

// Watermark Component for background company logo
interface WatermarkProps {
  logoSrc?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ logoSrc }) => {
  return null;
}; 