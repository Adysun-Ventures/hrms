import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { fmtHdfcDate, fmtHdfcFullDate, fmtHdfcTimestamp, money } from '../lib/format.js';

const HDFC_LOGO = new URL('./logos/hdfc-logo.jpeg', import.meta.url).href;

const FONT = 'Times-Roman';
const FONT_BOLD = 'Times-Bold';

const pdfText = s => String(s ?? '').replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…€₹\n]/g, '?');

const deriveBranchCode = (ifsc, explicitCode) => {
  if (explicitCode && String(explicitCode).trim()) return String(explicitCode).trim();
  if (ifsc) {
    const match = String(ifsc).match(/^(?:HDFC|DEMO)0*([0-9A-Za-z]+)$/i);
    if (match) return match[1];
  }
  return '794';
};

const deriveEmail = (email, holderName) => {
  if (email && email.trim()) return email.trim().toUpperCase();
  const base = (holderName || 'customer')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${base || 'customer'}@gmail.com`.toUpperCase();
};

const s = StyleSheet.create({
  page: {
    width: 638,
    height: 842,
    paddingTop: 228.88,
    paddingBottom: 60,
    paddingLeft: 28.35,
    paddingRight: 7.29,
    fontFamily: FONT,
    fontSize: 8.0,
    color: '#000000',
    lineHeight: 1.15,
  },

  pageHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 638,
    height: 228.88,
  },

  // 1. Top Meta: Page No and Statement of account
  topPageNo: {
    position: 'absolute',
    top: 16.99,
    left: 292.03,
    fontSize: 8.0,
    fontFamily: FONT,
  },
  topStatementTitle: {
    position: 'absolute',
    top: 16.99,
    left: 513.56,
    fontSize: 8.0,
    fontFamily: FONT,
  },

  // 2. Logo at exact reference coordinate (top: 35.33, left: 28.35)
  logo: {
    position: 'absolute',
    top: 35.33,
    left: 28.35,
    width: 145.0,
    height: 32.0,
  },

  // 3. Customer Box (left: 28.35, top: 81.18, width: 283.46, height: 109.98)
  custBox: {
    position: 'absolute',
    top: 81.18,
    left: 28.35,
    width: 283.46,
    height: 109.98,
    borderWidth: 1.13,
    borderColor: '#000000',
    paddingLeft: 5.66,
    paddingTop: 7.48,
    paddingRight: 4,
  },
  custNameRow: {
    flexDirection: 'row',
    fontSize: 8.0,
    fontFamily: FONT,
    marginBottom: 0,
  },
  custTitle: {
    width: 24.45,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  custName: {
    fontFamily: FONT,
    fontSize: 8.0,
  },
  custAddress: {
    fontSize: 8.0,
    fontFamily: FONT,
    lineHeight: 1.45,
  },
  custJoint: {
    position: 'absolute',
    bottom: 8.0,
    left: 5.66,
    fontSize: 8.0,
    fontFamily: FONT,
  },

  // Customer sub-notes outside the box
  nominationRow: {
    position: 'absolute',
    top: 190.71,
    left: 34.01,
    fontSize: 8.0,
    fontFamily: FONT,
  },
  periodRow: {
    position: 'absolute',
    top: 213.38,
    left: 34.01,
    fontSize: 8.0,
    fontFamily: FONT,
  },

  // 4. Right column Bank & Account details (starts at top: 50.34, left: 340.16)
  bankCol: {
    position: 'absolute',
    top: 50.34,
    left: 340.16,
    width: 283.46,
  },
  bankRow: {
    flexDirection: 'row',
    fontSize: 8.0,
    fontFamily: FONT,
    lineHeight: 1.1,
    marginBottom: 0.5,
  },
  bankLabel: {
    width: 56.69,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  bankLabelSmall: {
    width: 60.0,
    fontFamily: FONT,
    fontSize: 7.1,
  },
  bankColon: {
    width: 8.0,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  bankVal: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  bankValShort: {
    width: 25.67,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  bankValBranch: {
    width: 33.67,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  bankValIfsc: {
    width: 71.00,
    fontFamily: FONT,
    fontSize: 8.0,
  },
  addrIndent: {
    paddingLeft: 64.69,
    fontSize: 8.0,
    fontFamily: FONT,
    lineHeight: 1.1,
    marginBottom: 0.5,
  },
  inlineRightLabel: {
    fontFamily: FONT,
    fontSize: 8.0,
  },

  // 5. Transactions Table (width: 602.36, top: 228.88)
  table: {
    width: 602.36,
    borderWidth: 0.57,
    borderColor: '#7F807F',
    backgroundColor: '#E5FFFF',
  },
  thead: {
    flexDirection: 'row',
    height: 18.18,
    alignItems: 'center',
    borderBottomWidth: 0.57,
    borderBottomColor: '#7F807F',
    backgroundColor: '#FFFFFF',
  },
  th: {
    fontFamily: FONT_BOLD,
    fontSize: 8.0,
    height: 18.18,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderRightWidth: 0.57,
    borderRightColor: '#7F807F',
  },
  thLast: {
    borderRightWidth: 0,
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 0.57,
    borderBottomColor: '#7F807F',
    backgroundColor: '#E5FFFF',
    minHeight: 17.20,
  },
  td: {
    fontSize: 8.0,
    fontFamily: FONT,
    paddingVertical: 3.5,
    paddingHorizontal: 2.0,
    borderRightWidth: 0.57,
    borderRightColor: '#7F807F',
  },
  tdLast: {
    borderRightWidth: 0,
  },

  // Exact reference column widths
  cDate: { width: 39.11, textAlign: 'center' },
  cDesc: { width: 187.09, paddingLeft: 3.0, paddingRight: 3.0, lineHeight: 1.45 },
  cRef: { width: 102.05, textAlign: 'center' },
  cValDt: { width: 39.68, textAlign: 'center' },
  cDr: { width: 77.95, textAlign: 'right', paddingRight: 4.0 },
  cCr: { width: 77.96, textAlign: 'right', paddingRight: 4.0 },
  cBal: { width: 78.52, textAlign: 'right', paddingRight: 4.0 },

  // Summary box on final page
  summaryBox: {
    marginTop: 15,
    borderWidth: 0.57,
    borderColor: '#7F807F',
    backgroundColor: '#FFFFFF',
    width: 602.36,
  },
  summaryTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 8.5,
    padding: 3,
    borderBottomWidth: 0.57,
    borderBottomColor: '#7F807F',
  },
  summaryThead: {
    flexDirection: 'row',
    borderBottomWidth: 0.57,
    borderBottomColor: '#7F807F',
    height: 16,
    alignItems: 'center',
  },
  summaryTh: {
    fontFamily: FONT_BOLD,
    fontSize: 8.0,
    flex: 1,
    textAlign: 'center',
  },
  summaryTr: {
    flexDirection: 'row',
    height: 16,
    alignItems: 'center',
  },
  summaryTd: {
    fontSize: 8.0,
    flex: 1,
    textAlign: 'center',
  },
  genMetaRow: {
    flexDirection: 'row',
    marginTop: 8,
    fontSize: 7.5,
    fontFamily: FONT,
    lineHeight: 1.2,
  },
  genMetaOn: {
    width: 200,
  },
  genMetaBy: {
    width: 170,
  },
  genMetaBranch: {
    flex: 1,
  },
  genMetaNote: {
    marginTop: 18,
    textAlign: 'right',
    fontSize: 7.5,
    fontFamily: FONT,
  },

  // 6. Fixed footer at bottom (top: 782.5)
  footer: {
    position: 'absolute',
    top: 782.5,
    left: 28.35,
    right: 7.29,
    fontSize: 7.0,
    lineHeight: 1.05,
    color: '#000000',
  },
  footerBank: {
    fontFamily: FONT_BOLD,
    fontSize: 9.0,
    color: '#0000FF',
    marginBottom: 1.5,
  },
  footerBlueNote: {
    fontFamily: FONT,
    fontSize: 8.0,
    color: '#0000FF',
    marginBottom: 2.0,
  },
  footerGstnBold: {
    fontFamily: FONT_BOLD,
  },
});

export default function HdfcStatementDocument({ statement, computed, generatedAt }) {
  const a = statement.account;
  const cur = a.currency || 'INR';
  const m = p => money(p, cur);
  const period = `${fmtHdfcFullDate(a.periodStart) || '—'}  To : ${fmtHdfcFullDate(a.periodEnd) || '—'}`;

  const addressLines = [
    ...(a.address || '').split('\n').map(l => l.trim()).filter(Boolean),
    '.',
    [a.city || 'PARBHANI', a.pinCode || '431506'].filter(Boolean).join(' ').toUpperCase(),
    (a.state || 'MAHARASHTRA').toUpperCase(),
  ].filter(Boolean);

  const branchCode = deriveBranchCode(a.ifsc, a.branchCode);
  const email = deriveEmail(a.email, a.holderName);
  const custId = a.customerId || '104582731';
  const openDate = a.openDate || a.accountOpenDate || '15/06/2018';
  const branchName = (a.branch || 'HINJAWADI').toUpperCase();
  const branchAddressLines = a.branchAddress
    ? a.branchAddress.split('\n').map(l => l.trim()).filter(Boolean)
    : ['SURVEY NO 244/3 4 5,', 'RAJIV GANDHI INFOTECH PARK,', 'NR TATA JOHNSON CONTROLS,'];
  const branchCity = (a.branchCity || a.city || 'PUNE').toUpperCase();
  const branchState = (a.branchState || a.state || 'MAHARASHTRA').toUpperCase();
  const productCode = a.productCode || '113';
  const relationship = (a.productName || a.relationshipType || 'PRIME POTENTIAL').toUpperCase();

  const drCount = computed.lines.filter(l => l.debit > 0).length;
  const crCount = computed.lines.filter(l => l.credit > 0).length;

  return (
    <Document
      title={pdfText(`HDFC Statement – ${a.holderName || 'Untitled'}`)}
      subject="HDFC Bank Account Statement"
      creator="Statement Builder"
      producer="Statement Builder"
    >
      <Page size={[638, 842]} style={s.page}>
        {/* Repeating Page Header elements on every page */}
        <View fixed style={s.pageHeaderContainer}>
          <Text style={s.topPageNo} render={({ pageNumber }) => `Page No .: ${pageNumber}`}>Page No .: 1</Text>
          <Text style={s.topStatementTitle}>Statement of account</Text>
          <Image style={s.logo} src={HDFC_LOGO} />

          {/* Customer Box (x: 28.35, y: 81.18) */}
          <View style={s.custBox}>
            <View style={s.custNameRow}>
              <Text style={s.custTitle}>{pdfText((a.title || 'MR').toUpperCase())}</Text>
              <Text style={s.custName}>{pdfText(a.holderName.toUpperCase())}</Text>
            </View>
            <Text style={s.custAddress}>{pdfText(addressLines.join('\n'))}</Text>
            <Text style={s.custJoint}>JOINT HOLDERS :</Text>
          </View>

          <Text style={s.nominationRow}>Nomination : {pdfText(a.nomination === 'Yes' ? 'Registered' : 'Not Registered')}</Text>
          <Text style={s.periodRow}>Statement From : {period}</Text>

          {/* Bank & Account Details (x: 340.16, y: 50.34) */}
          <View style={s.bankCol}>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Account Branch</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(branchName)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Address</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(branchAddressLines[0] || '')}</Text>
            </View>
            {branchAddressLines.slice(1).map((line, idx) => (
              <Text key={idx} style={s.addrIndent}>{pdfText(line)}</Text>
            ))}
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>City</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(branchCity)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>State</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(branchState)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Phone no.</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>18002600/18001600</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>OD Limit</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankValShort}>{pdfText(a.odLimit || '0')}</Text>
              <Text style={s.inlineRightLabel}>Currency : {cur}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Email</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(email)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Cust ID</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(custId)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Account No</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(a.accountNumber)}   {pdfText(relationship)}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>A/C Open Date</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(fmtHdfcDate(openDate))}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Account Status</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankVal}>{pdfText(a.accountStatus || 'Regular')}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabelSmall}>RTGS/NEFT IFSC</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankValIfsc}>{pdfText(a.ifsc || 'HDFC0000794')}</Text>
              <Text style={s.inlineRightLabel}>MICR : {pdfText(a.micr || '411240018')}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Branch Code</Text>
              <Text style={s.bankColon}>:</Text>
              <Text style={s.bankValBranch}>{pdfText(branchCode)}</Text>
              <Text style={s.inlineRightLabel}>Product Code : {pdfText(productCode)}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Table with Repeating White Header and Cyan Data Rows */}
        <View style={s.table}>
          <View fixed style={s.thead}>
            <View style={[s.th, s.cDate]}><Text>Date</Text></View>
            <View style={[s.th, s.cDesc]}><Text>Narration</Text></View>
            <View style={[s.th, s.cRef]}><Text>Chq./Ref.No.</Text></View>
            <View style={[s.th, s.cValDt]}><Text>Value Dt</Text></View>
            <View style={[s.th, s.cDr]}><Text>Withdrawal Amt.</Text></View>
            <View style={[s.th, s.cCr]}><Text>Deposit Amt.</Text></View>
            <View style={[s.th, s.cBal, s.thLast]}><Text>Closing Balance</Text></View>
          </View>

          {computed.lines.map(l => (
            <View key={l.id} style={s.tr} wrap={false}>
              <Text style={[s.td, s.cDate]} hyphenationCallback={word => [word]}>{fmtHdfcDate(l.date)}</Text>
              <Text style={[s.td, s.cDesc]}>{pdfText(l.description)}</Text>
              <Text style={[s.td, s.cRef]} hyphenationCallback={word => [word]}>{pdfText(l.reference)}</Text>
              <Text style={[s.td, s.cValDt]}>{fmtHdfcDate(l.valueDate || l.date)}</Text>
              <Text style={[s.td, s.cDr]}>{l.debit ? m(l.debit) : ''}</Text>
              <Text style={[s.td, s.cCr]}>{l.credit ? m(l.credit) : ''}</Text>
              <Text style={[s.td, s.cBal, s.tdLast]}>{m(l.balance)}</Text>
            </View>
          ))}
        </View>

        {/* Final Statement Summary */}
        <View wrap={false}>
          <View style={s.summaryBox}>
            <Text style={s.summaryTitle}>STATEMENT SUMMARY :-</Text>
            <View style={s.summaryThead}>
              <Text style={s.summaryTh}>Opening Balance</Text>
              <Text style={s.summaryTh}>Dr Count</Text>
              <Text style={s.summaryTh}>Cr Count</Text>
              <Text style={s.summaryTh}>Debits</Text>
              <Text style={s.summaryTh}>Credits</Text>
              <Text style={s.summaryTh}>Closing Bal</Text>
            </View>
            <View style={s.summaryTr}>
              <Text style={s.summaryTd}>{m(computed.opening)}</Text>
              <Text style={s.summaryTd}>{drCount}</Text>
              <Text style={s.summaryTd}>{crCount}</Text>
              <Text style={s.summaryTd}>{m(computed.debit)}</Text>
              <Text style={s.summaryTd}>{m(computed.credit)}</Text>
              <Text style={s.summaryTd}>{m(computed.closing)}</Text>
            </View>
          </View>

          <View style={s.genMetaRow}>
            <Text style={s.genMetaOn}>Generated On: {fmtHdfcTimestamp(generatedAt)}</Text>
            <Text style={s.genMetaBy}>Generated By: {pdfText(custId)}</Text>
            <Text style={s.genMetaBranch}>Requesting Branch Code: {pdfText(branchCode)}</Text>
          </View>
          <Text style={s.genMetaNote}>This is a computer generated statement and does not require signature.</Text>
        </View>

        {/* Fixed footer on every page */}
        <View fixed style={s.footer}>
          <Text style={s.footerBank}>HDFC BANK LIMITED</Text>
          <Text style={s.footerBlueNote}>*Closing balance includes funds earmarked for hold and uncleared funds</Text>
          <Text>Contents of this statement will be considered correct if no error is reported within 30 days of receipt of statement.The address on this statement is that on record with the Bank as at the day of requesting</Text>
          <Text>this statement.</Text>
          <Text>State account branch <Text style={s.footerGstnBold}>GSTN:27AAACH2702H1Z0</Text></Text>
          <Text>HDFC Bank GSTIN number details are available at https://www.hdfcbank.com/personal/making-payments/online-tax-payment/goods-and-service-tax.</Text>
          <Text>Registered Office Address: HDFC Bank House,Senapati Bapat Marg,Lower Parel,Mumbai 400013</Text>
        </View>
      </Page>
    </Document>
  );
}
