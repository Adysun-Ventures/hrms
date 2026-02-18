import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image
} from '@react-pdf/renderer';

import { offerLetterStyles } from '@/components/pdf/PDFStyles';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';

/* ---------- CONSTANTS ---------- */
const COMPANY_DATA = {
  name: 'ADYSUN VENTURES PVT. LTD.',
  logo: '/assets/adysunventures_logo.png'
};

/* ---------- HELPERS ---------- */
const Watermark = ({ logoSrc }) => {
  if (!logoSrc) return null;
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

console.log()
const Row = ({ label, m, a }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

const RowBoldGray = ({ label, m, a }) => (
  <View style={[offerLetterStyles.tableRow, { backgroundColor: '#e0e0e0' }]}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

/* ---------- PDF DOC ---------- */
export default function OfferDoc({ offer }) {
  if (!offer) {
    return (
      <Document>
        <Page><Text>No Data</Text></Page>
      </Document>
    );
  }

  const annual = offer.salary || 0;
  const monthly = Math.round(annual / 12);

  return (
    <Document>
      <Page size="A4" style={offerLetterStyles.page}>
        <Watermark logoSrc={COMPANY_DATA.logo} />
        <GlobalPDFHeader />

        <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
          OFFER LETTER
        </Text>

        <Text style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Employee Name: </Text>
          {offer.name}
        </Text>

        <Text style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Address: </Text>
          {offer.address}
        </Text>

        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Joining Date: </Text>
          {formatDate(offer.joiningDate)}
        </Text>

        <View style={{ marginTop: 12 }}>
          <Row label="CTC" m={monthly} a={annual} />
          <RowBoldGray label="Total CTC" m={monthly} a={annual} />
        </View>

        <Text style={{ marginTop: 20, fontSize: 11 }}>
          This letter confirms your appointment with the organization under the above
          mentioned terms and conditions hello.
        </Text>

        <GlobalPDFFooter />
      </Page>
    </Document>
  );
}
