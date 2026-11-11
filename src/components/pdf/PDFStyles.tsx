import { StyleSheet, Font } from '@react-pdf/renderer';
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

