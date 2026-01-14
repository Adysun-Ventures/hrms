# PDF Generation Parameters Guide

This document provides a comprehensive reference for PDF generation parameters used in the current codebase, to facilitate migration to React-PDF in the V2 implementation.

## Core Document Specifications

| Parameter | Value | Description |
|-----------|-------|-------------|
| Format | A4 | Standard paper size (210mm × 297mm) |
| Orientation | "p" (Portrait) | Vertical orientation |
| Unit | "mm" (Millimeters) | Unit of measurement |
| Width | 210mm | Document width |
| Height | 297mm | Document height |
| Padding | 40-60mm | Page padding (varies by document type) |

## Document Initialization

Current jsPDF initialization pattern:

```javascript
const pdf = new jsPDF("p", "mm", "a4");
```

## Font & Typography

| Document Type | Primary Font | Font Size | Line Height |
|---------------|--------------|-----------|-------------|
| Offer Letter | Times New Roman | 14px | 1.6 |
| Appointment Letter | Arial/Sans-serif | 12px | 1.6 |
| Appraisal Letter | System default | 12px | 1.6 |
| Relieving Letter | Arial | 12px | 1.6 |
| Increment Letter | Arial | 12px | 1.6 |

## Page Layout & Structure

### Common Page Structure
- **Header**: Company logo (80px width) and company name
- **Date**: Formatted as "DD MMM YYYY" (e.g., "05 Feb 2025")
- **Addressee**: Employee name and details
- **Content**: Letter body with defined sections
- **Footer**: Contact information, often absolute positioned at bottom
- **Multi-page**: Page breaks defined with `page-break-after: always`

### CSS Classes & Styling

```css
.{document-type}-page {
    font-family: Arial/Times New Roman;
    font-size: 12px/14px;
    line-height: 1.6;
    color: #000000;
    padding: 40px 60px;
    background: white;
    height: 297mm;
    width: 210mm;
    margin: 0 auto;
    position: relative;
    box-sizing: border-box;
    page-break-after: always;
}
```

### Common Elements & Classes

| Element | Class | Description |
|---------|-------|-------------|
| Document Page | `{document-type}-letter-page` | Main container for each page |
| Company Header | `company-name`, `company-logo` | Company branding elements |
| Letter Content | `letter-content` | Main content wrapper |
| Salary Table | `salary-table` | Table for compensation details |
| Signature | `signature-section` | Section for signatures |
| Footer | `footer` | Page footer with contact info |

## Document-Specific Details

### Appointment Letter
- Multiple pages with consistent header
- Salary table with fixed column structure
- Sections numbered with specific formatting

### Offer Letter
- Company name in uppercase
- Centered title with underline
- Indented paragraphs (40px)

### Appraisal Letter
- Table for compensation comparison
- Two-column signature section
- Uses bold for emphasis in specific sections

### Relieving Letter
- Specific spacing for signature section
- Date and place section with fixed formatting

### Increment Letter
- Logo section with specific layout
- Detailed compensation table
- Policy content with alphabetical lists

## Tables & Data Presentation

### Salary Table Structure
```jsx
<table>
  <thead>
    <tr>
      <th>EARNINGS</th>
      <th>MONTHLY</th>
      <th>YEARLY</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Basic</td>
      <td>{monthly.basic.toFixed(2)}</td>
      <td>{annual.basic.toFixed(2)}</td>
    </tr>
    {/* Additional rows */}
    <tr className="total">
      <td>TOTAL</td>
      <td>{(annual.total/12).toFixed(2)}</td>
      <td>{annual.total.toFixed(2)}</td>
    </tr>
  </tbody>
</table>
```

## Current PDF Generation Process

The current implementation uses a combination of HTML/CSS for layout and `html2canvas` + `jsPDF` to generate PDFs:

1. **Render HTML**: Create HTML structure with proper CSS
2. **Capture Pages**: Use `html2canvas` to convert each page to canvas
3. **Add to PDF**: Add each canvas as an image to jsPDF document
4. **Save PDF**: Generate and download the complete document

```javascript
const handleDownload = async () => {
  if (!containerRef.current) return;
  const pdf = new jsPDF("p", "mm", "a4");
  const elements = containerRef.current.getElementsByClassName("{document-type}-letter-page");

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

  pdf.save("{document-type}-letter.pdf");
};
```

## React-PDF Migration Considerations

When implementing with React-PDF:

1. **Component Structure**: Create components for each document section
2. **Styles**: Replace CSS with React-PDF style objects
3. **Fonts**: Register and embed fonts explicitly
4. **Page Breaks**: Use `<Page>` components instead of CSS page breaks
5. **Tables**: Create custom table components using `<View>` and flex layout
6. **Text Formatting**: Use `<Text>` with appropriate styles instead of HTML tags

### Example React-PDF Structure

```jsx
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Times New Roman',
  src: '/fonts/times-new-roman.ttf',
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineHeight: 1.6,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  // Additional styles
});

// Document component
const AppointmentLetterPDF = ({ formData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Company header */}
      <View style={styles.companyHeader}>
        {/* Logo and company name */}
      </View>
      
      {/* Document content */}
      <View style={styles.content}>
        {/* Sections */}
      </View>
    </Page>
    {/* Additional pages */}
  </Document>
);
```

## Implementation Recommendations

1. Create reusable components for common elements (headers, tables, signatures)
2. Implement one document type fully before moving to others
3. Use consistent styling approaches across documents
4. Structure components for maximum reuse
5. Test PDF generation with real data from the current system 