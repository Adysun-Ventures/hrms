import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CURRENCY_NAMES, fmtGenerated, fmtStatementDate, money } from '../lib/format.js';
import { displayName, maskCRN } from '../lib/model.js';
import HdfcStatementDocument from './HdfcStatementDocument.jsx';

// Kotak Mahindra Bank branding
const INSTITUTION = 'Kotak Mahindra Bank';

// Top header banner image (Page 1)
const LOGO_BANNER = new URL('./logos/kotak-header-banner.png', import.meta.url).href;
const PROMO_BANNER = new URL('./logos/kotak-promo-banner.jpeg', import.meta.url).href;
const ICON_PHONE = new URL('./logos/kotak-icon-phone.png', import.meta.url).href;
const ICON_BRANCH = new URL('./logos/kotak-icon-branch.png', import.meta.url).href;
const QR_SECURITY = new URL('./logos/kotak-qr-security.jpeg', import.meta.url).href;

// Source Sans 3 (SIL OFL 1.1), authentic Kotak Mahindra Bank typeface. Vite bundles the files and
// rewrites these URLs for the browser and the worker; react-pdf embeds only the glyphs a statement uses.
const FONT = 'Source Sans 3';
Font.register({
  family: FONT,
  fonts: [
    { src: new URL('./fonts/SourceSans3-Regular.ttf', import.meta.url).href },
    { src: new URL('./fonts/SourceSans3-SemiBold.ttf', import.meta.url).href, fontWeight: 'bold' },
  ],
});

// Splits a long token (UPI id, URL) after "/" "_" "." "@" ":" "-" or every 16 characters. The empty strings between
// pieces are zero-width break points, so wrapping does not insert a "-".
const splitToken = word => {
  const parts = word.split(/(?<=[/_.@:-])/).flatMap(part => part.match(/.{1,16}/g) || []);
  return parts.flatMap((part, i) => (i ? ['', part] : [part]));
};
// Avoid breaking standard bank references or dates: only tokens over 28 chars split
Font.registerHyphenationCallback(word => (word.length <= 28 ? [word] : splitToken(word)));

// Anything outside the embedded subset is replaced with "?" rather than drawn as an empty box.
const pdfText = s => String(s ?? '').replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…€₹\n]/g, '?');

const C = {
  ink: '#000000',
  label: '#9FA1A4', // grey labels - Kotak style
  muted: '#9FA1A4', // footer text
  red: '#ED1C24', // Kotak corporate red (exact RGB 237, 28, 36)
  head: '#9FA1A4', // Table header grey - Kotak style
  line: '#9FA1A4', // Table border lines
  warn: '#ED1C24',
  warnTint: '#FFF5F5',
};
// A4 is 595pt wide; 36pt margins leave 523pt. Exact Kotak Mahindra Bank column widths:
// Col 1 (#): 31.18, Col 2 (Date): 49.00, Col 3 (Desc): 155.48, Col 4 (Chq/Ref): 80.19, Col 5 (Dr): 69.05, Col 6 (Cr): 69.05, Col 7 (Bal): 69.05
const W = { no: 31.18, date: 49.00, desc: 155.48, ref: 80.19, amt: 69.05, bal: 69.05 };
// Table header labels and widths. The third field tightens the cell's left padding: "Withdrawal (Dr.)"
// fits on one line with tight inset (3.5pt) matching the reference PDF.
const COLS = [['#', W.no], ['Date', W.date], ['Description', W.desc], ['Chq/Ref. No.', W.ref], ['Withdrawal (Dr.)', W.amt, true], ['Deposit (Cr.)', W.amt], ['Balance', W.bal]];

// Descriptions break at spaces, as on a printed statement; a token is split only when it is too wide for one line of
// the column. Widths are Source Sans 3 advances in em, rounded up so the estimate errs towards splitting.
const charEm = ch => (/[MWmw@%]/.test(ch) ? 0.95 : /[A-Z]/.test(ch) ? 0.72 : /[a-z0-9]/.test(ch) ? 0.6 : 0.45);
const DESC_EM = (W.desc - 6) / 7.68 - 1; // (column - padding) / 7.68pt font, less 1em
const descBreaks = word => ([...word].reduce((w, ch) => w + charEm(ch), 0) <= DESC_EM ? [word] : splitToken(word));

const IMPORTANT_BULLETS = [
  'RBI mandates Positive Pay for high-value cheques from Jan 1, 2021. Customers must submit cheque details via Net/Mobile Banking or at the branch on the day of issuance or before handing it to the beneficiary. For more details, visit www.kotak.bank.in.',
  'From October 4, 2025, same-day cheque clearing will be implemented across all banks. Cheques will be credited or debited within a few hours of issuance.',
  'Complimentary insurance cover on Kotak Debit Cards (linked to Saving and Current accounts) will be discontinued w.e.f. July 20, 2025. All claims will be accepted until July 20, 2025, as per the existing process. Salary account holders may view their insurance covers under Debit Card Services in the Cards & FASTag section on the web portal. For any queries related to Debit Card insurance, write to dc.insurance@kotak.com or visit https://www.kotak.bank.in/en/personal-banking /cards/debit-cards/debit-card-services/insurnace-on-debit-card.html',
  'TDS is applicable from time to time as per the Income Tax Act, 2025 (IT Act) and Income Tax Rules, 2026. Currently, TDS is deducted when the aggregate interest paid / credited across all FDs, RDs exceeds the threshold limit of Rs. 50,000/- for residents and Rs. 1,00,000/- for resident senior citizens in a financial year (FY) for a customer.',
  'You can avail a Tax Deduction at Source (TDS) exemption on the interest earned on your existing or new Fixed Deposits for the current financial year by submitting Form 121 (earlier Form 15G/15H). This exemption is available if you are eligible and the total interest earned on your bank deposits in a financial year exceeds the TDS exemption threshold. If the total interest earned on your bank deposits is below the TDS exemption threshold, submission of Form 121 is not required. A fresh Form 121 must be submitted at the beginning of each financial year for Fixed Deposits and Recurring Deposits.',
  'RBI, vide its circular DOR.CRE.REC.23/21.08.008/2022-23 dated April 19, 2022, has issued guidelines pertaining to the opening and maintenance of Current Account(s) of customers who have availed various credit facilities from the banking system. The term "banking system" refers to Scheduled Commercial Banks and Payments Banks. Banks (whether lending banks or otherwise) are required to monitor all Current Account, Overdraft, and Cash Credit accounts on a regular basis, at least on a half-yearly frequency. This monitoring must specifically consider the aggregate exposure of the banking system to the borrower vis-à-vis the individual bank\'s share in that exposure, in order to ensure compliance with the said instructions. Detailed guidelines are available in the aforementioned circular.',
  'Deposits of up to ₹5,00,000 per depositor are fully insured by the Deposit Insurance and Credit Guarantee Corporation, under the Deposit Insurance Scheme.',
  'Keep your account active for uninterrupted access to your funds: Inoperative accounts can be easily reactivated by submitting a signed request along with valid KYC documents. For details, please click https://www.kotak.bank.in/en/reach-us.html',
  'Registering a nominee is strongly recommended: A nominee can help your family access funds lying in your inoperative account smoothly. In the event of the account holder’s demise, the nominee may visit our nearest branch with the required documents for verification and settlement of claims.',
  'Goods and Services Tax (GST), at the applicable rate of 18%, is levied on relevant service charges.',
  'Dear Customer, any inaccurate, incomplete or false disclosure of statement of financial transaction or reportable account by you would lead to penal consequence on the Bank under applicable law. The Bank shall be entitled to recover from you such amount levied due to such inaccuracy, incompleteness or false disclosure. You will indemnify the Bank in respect of all or any liabilities incurred by Bank, by reason of any of the information or particulars given by you, being incorrect or false or being suppressed or omitted.',
  'Please note: This statement/ advice should not be construed as a Tax Invoice under the Goods and Services Tax Act.',
  'To view the latest General Schedule of Features & Charges applicable to your account, please visit www.kotak.bank.in/en/gsfc.html',
];

const NARRATIONS = [
  ['AP - Autopay for Billpay', 'Netcard - Netc@rd transaction'],
  ['ATL - ATM withdrawal done from other bank ATM machine', 'OS - Online Shopping transaction'],
  ['ATW - ATM withdrawal done from Kotak ATM machine', 'OT - Online Trading transaction via Payment Gateway'],
  ['BP - Bill Pay transaction', 'PB - Transaction done through Phone Banking (IVR)'],
  ['CDM - Kotak Cash Deposit Machine', 'PCI/PCD - POS transaction'],
  ['CMS - Cash Management Service', 'RTGS - Real Time Gross Settlement'],
  ['IB - Transaction done on Kotak Net Banking', 'UPI - Unified Payment Interface'],
  ['IMPS - Immediate Payment Service', 'VISACCPAY - Visa Credit Card Payment'],
  ['IMT - Instant Money Transfer', 'VMT - VISA Money Transfer'],
  ['KB - Billpay transaction via Keya Chatbot', 'WB - Billpay transaction via WhatsApp Banking'],
  ['MB - Transaction done on Mobile banking', 'Int. Pd. - Interest credited on your savings account balance'],
  ['NACH - National Automated Clearing House', 'Sweep transfer to - Booking new Term Deposit'],
  ['NEFT - National Electronic Funds Transfer', 'Sweep transfer from - Broken existing Term Deposit'],
];

const s = StyleSheet.create({
  page: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 36, fontFamily: FONT, fontSize: 7.7, color: C.ink, lineHeight: 1.08 },

  topBanner: { position: 'absolute', top: 0, left: 0, width: 595, height: 74.85 },

  // anchored from the top (A4 = 841.89pt tall): bottom-anchored fixed elements are not drawn by react-pdf
  footer: {
    position: 'absolute', top: 816, left: 36, right: 36, lineHeight: 1.2,
    flexDirection: 'row', justifyContent: 'space-between', fontSize: 9.6, color: C.muted, fontFamily: FONT,
  },

  // Page 2+ continuation header (top-left)
  contHeader: {
    position: 'absolute', top: 11.78, left: 36, right: 36,
  },
  contName: { fontSize: 9.0, lineHeight: 1.33, color: C.ink },
  contRow: { fontSize: 9.0, lineHeight: 1.33, color: C.label },
  contPeriod: { fontSize: 9.0, lineHeight: 1.33, color: C.label },

  // statement header (page 1)
  head: { marginTop: 11.9, marginBottom: 28 },
  title: { fontWeight: 'bold', fontSize: 25, lineHeight: 1.15, color: C.ink },
  period: { fontSize: 11, lineHeight: 1.3, marginTop: 5, color: C.ink },

  // customer block: name, masked CRN and the address on the left; "label value" rows in small groups on the right
  info: { flexDirection: 'row' },
  // 59.5% puts the account-detail column at 347.5pt, where the reference has it.
  cust: { width: '59.5%', paddingLeft: 2, paddingRight: 28 },
  acct: { flex: 1, marginTop: 0 },
  name: { fontWeight: 'bold', fontSize: 14.0, lineHeight: 1.25, color: C.ink },
  crn: { fontSize: 11.0, lineHeight: 1.3, color: C.label, marginTop: 3 },
  address: { fontSize: 9.0, lineHeight: 1.66, marginTop: 18.7, color: C.ink },
  group: { marginBottom: 10 },
  row: { fontSize: 9.0, lineHeight: 1.77, color: C.label },
  val: { fontWeight: 'bold', color: C.ink, fontSize: 9.0 },
  // MICR and IFSC Code on one line under the address, then straight into the transactions table
  codes: { flexDirection: 'row', gap: 14, paddingLeft: 2, marginTop: 9.5, marginBottom: 8.3 },

  // transactions table: red title band, grey header with white dividers, rows separated by thin grey rules
  band: { backgroundColor: C.red, height: 25, justifyContent: 'center', marginBottom: 0 },
  bandText: { color: '#ffffff', fontSize: 12.0, lineHeight: 1.15, textAlign: 'center', fontWeight: 'normal' },
  thead: { flexDirection: 'row', backgroundColor: C.head, color: '#ffffff', fontSize: 9.0, height: 25, alignItems: 'center' },
  th: { height: 25, paddingLeft: 8.0, paddingRight: 2.0, justifyContent: 'center', borderRightWidth: 0.25, borderRightColor: '#ffffff', fontWeight: 'normal' },
  thTight: { paddingLeft: 3.5, paddingRight: 1.0 },
  thLast: { borderRightWidth: 0 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.25, borderBottomColor: C.line },
  td: { paddingVertical: 2.875, paddingHorizontal: 3.0, fontSize: 7.68 },
  cNo: { width: W.no, paddingLeft: 3.0, paddingRight: 2.0 },
  cDate: { width: W.date, paddingLeft: 5.0, paddingRight: 2.0, fontSize: 7.68 },
  cDesc: { width: W.desc, paddingLeft: 3.0, paddingRight: 3.0, fontSize: 7.68, lineHeight: 1.0 },
  cRef: { width: W.ref, paddingLeft: 3.0, paddingRight: 2.0, fontSize: 7.68 },
  cAmt: { width: W.amt, textAlign: 'right', paddingRight: 3.0, fontSize: 7.68 },
  cBal: { width: W.bal, textAlign: 'right', paddingRight: 3.0, fontSize: 7.68 },
  bold: { fontWeight: 'bold' },
  rowTotal: { borderTopWidth: 0.3, borderTopColor: C.head, borderBottomWidth: 0.3, borderBottomColor: C.head },
  empty: { padding: 10, color: C.label, textAlign: 'center', flex: 1, fontSize: 7.7 },

  note: { marginTop: 12, fontSize: 6.5, color: C.muted, lineHeight: 1.45 },
  end: { marginTop: 6, textAlign: 'center', fontSize: 6.5, lineHeight: 1.2, color: C.muted },

  // Summary Page (Page N-1) Styles
  summaryThead: {
    flexDirection: 'row', backgroundColor: C.head, color: '#ffffff', fontSize: 9.0, height: 33, alignItems: 'center',
  },
  summaryThParticulars: {
    width: 237.73, paddingLeft: 12, height: 33, justifyContent: 'center', borderRightWidth: 0.25, borderRightColor: '#ffffff',
  },
  summaryThBalance: {
    width: 142.64, paddingLeft: 12, height: 33, justifyContent: 'center', borderRightWidth: 0.25, borderRightColor: '#ffffff',
  },
  summaryThBalanceLast: {
    width: 142.63, paddingLeft: 12, height: 33, justifyContent: 'center',
  },
  summaryTr: {
    flexDirection: 'row', borderBottomWidth: 0.25, borderBottomColor: C.line, height: 13.68, alignItems: 'center',
  },
  summaryTdParticulars: {
    width: 237.73, paddingLeft: 3, fontSize: 7.68, color: C.ink,
  },
  summaryTdBalance: {
    width: 142.64, paddingRight: 28, textAlign: 'right', fontSize: 7.68, color: C.ink,
  },
  summaryTdBalanceLast: {
    width: 142.63, paddingRight: 28, textAlign: 'right', fontSize: 7.68, color: C.ink,
  },

  endBlock: {
    marginTop: 82, alignItems: 'center',
  },
  endTitle: {
    fontSize: 12.0, color: C.ink, marginBottom: 5,
  },
  endNotice1: {
    fontSize: 9.1, color: C.ink, textAlign: 'center', lineHeight: 1.35,
  },
  endNotice2: {
    fontSize: 9.1, color: C.ink, textAlign: 'center', marginTop: 3,
  },

  promoBanner: {
    marginTop: 24, width: 523, height: 86.3,
  },

  assistanceSec: {
    marginTop: 170,
  },
  assistanceBody: {
    flexDirection: 'row', paddingTop: 10, paddingBottom: 10,
  },
  assistCol1: {
    width: 116.22, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: C.line, paddingHorizontal: 6,
  },
  assistCol2: {
    width: 290.56, alignItems: 'center', borderRightWidth: 0.5, borderRightColor: C.line, paddingHorizontal: 12,
  },
  assistCol3: {
    width: 116.22, alignItems: 'center', paddingHorizontal: 6,
  },
  assistIcon: {
    width: 17, height: 17, marginBottom: 5,
  },
  assistLabel: {
    fontSize: 9.0, fontWeight: 'bold', color: C.ink,
  },
  assistVal: {
    fontSize: 9.0, fontWeight: 'bold', color: C.ink, marginTop: 1,
  },
  assistSub: {
    fontSize: 8.5, color: '#5f6b77', marginTop: 1,
  },
  assistAddress: {
    fontSize: 8.5, textAlign: 'center', marginTop: 2, lineHeight: 1.25, color: C.ink,
  },

  securityCard: {
    marginTop: 2, backgroundColor: '#eaebec', borderRadius: 4, height: 70,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  securityLeft: {
    width: 334,
  },
  securityTitle: {
    fontSize: 12.0, fontWeight: 'bold', color: C.red, marginBottom: 3,
  },
  securityText: {
    fontSize: 10.0, lineHeight: 1.35, color: C.ink,
  },
  securityRight: {
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 0.5, borderLeftColor: C.line,
    paddingLeft: 14, height: 50, gap: 8,
  },
  securityQr: {
    width: 42, height: 42,
  },
  securityScanText: {
    fontSize: 9.0, lineHeight: 1.15, color: C.ink,
  },

  regOfficeFooter: {
    marginTop: 15, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 6, alignItems: 'center',
  },
  regOfficeLine1: {
    fontSize: 9.1, color: C.ink, marginBottom: 3,
  },
  regOfficeLine2: {
    fontSize: 8.5, color: C.ink,
  },

  // Important Information & Narrations Page (Page N) Styles
  infoBox: {
    borderWidth: 0.5, borderColor: C.line, borderRadius: 6,
    paddingVertical: 14, paddingHorizontal: 12, marginTop: 25,
  },
  bulletRow: {
    flexDirection: 'row', marginBottom: 12.8,
  },
  bulletDot: {
    width: 12, fontSize: 8.0, color: '#9fa1a4', marginTop: -1,
  },
  bulletText: {
    flex: 1, fontSize: 6.8, lineHeight: 1.25, color: C.ink,
  },

  narrationsSec: {
    marginTop: 16,
  },
  narrationsTable: {
    borderWidth: 0.25, borderColor: C.line,
  },
  narrationsRow: {
    flexDirection: 'row', borderBottomWidth: 0.25, borderBottomColor: C.line, height: 13.68, alignItems: 'center',
  },
  narrationsRowLast: {
    flexDirection: 'row', height: 13.68, alignItems: 'center',
  },
  narrationCellLeft: {
    flex: 1, fontSize: 7.2, paddingLeft: 4, paddingRight: 4, borderRightWidth: 0.25, borderRightColor: C.line, color: C.ink,
  },
  narrationCellRight: {
    flex: 1, fontSize: 7.2, paddingLeft: 4, paddingRight: 4, color: C.ink,
  },
});

const join = (sep, ...parts) => parts.map(p => String(p || '').trim()).filter(Boolean).join(sep);

/** Rows of [label, value]; blank values are left off, and a group with nothing in it is not drawn at all. */
const Group = ({ rows }) => {
  const filled = rows.filter(([, v]) => String(v || '').trim());
  if (!filled.length) return null;
  return (
    <View style={s.group} wrap={false}>
      {filled.map(([k, v]) => (
        <Text key={k} style={s.row}>
          {k} <Text style={s.val}>{pdfText(v)}</Text>
        </Text>
      ))}
    </View>
  );
};

export default function StatementDocument({ statement, computed, generatedAt }) {
  const bank = statement?.account?.bank || statement?.bank || '';
  if (bank.toLowerCase().includes('hdfc')) {
    return <HdfcStatementDocument statement={statement} computed={computed} generatedAt={generatedAt} />;
  }

  const a = statement.account;
  const cur = a.currency;
  const m = p => money(p, cur);
  const period = `${fmtStatementDate(a.periodStart) || '—'} - ${fmtStatementDate(a.periodEnd) || '—'}`;
  const addressLines = [
    ...(a.address || '').split('\n').map(l => l.trim()).filter(Boolean),
    join(' - ', a.city, a.pinCode),
    join(' - ', a.state, a.country || 'India'),
  ].filter(Boolean);
  const generated = fmtGenerated(generatedAt);

  return (
    <Document
      title=""
      subject=""
      creator=""
      producer=""
      author=""
      keywords=""
    >
      <Page size="A4" style={s.page}>
        <View fixed style={s.contHeader} render={({ pageNumber }) => pageNumber > 1 ? (
          <View>
            <Text style={s.contName}>{pdfText(displayName(a))}</Text>
            <Text style={s.contRow}>Account No. <Text style={s.val}>{pdfText(a.accountNumber)}</Text></Text>
            <Text style={s.contPeriod}>Account Statement <Text style={s.val}>{period}</Text></Text>
          </View>
        ) : null} />

        <Image style={s.topBanner} src={LOGO_BANNER} />

        <View style={s.head}>
          <Text style={s.title}>Account Statement</Text>
          <Text style={s.period}>{period}</Text>
        </View>

        <View style={s.info} wrap={false}>
          <View style={s.cust}>
            <Text style={s.name}>{pdfText(displayName(a)) || '-'}</Text>
            {a.customerId.trim() && <Text style={s.crn}>CRN {pdfText(maskCRN(a.customerId))}</Text>}
            {addressLines.length > 0 && <Text style={s.address}>{pdfText(addressLines.join('\n'))}</Text>}
          </View>
          <View style={s.acct}>
            <Group rows={[['Account No.', a.accountNumber], ['Account Type', a.accountType], ['Branch', a.branch]]} />
            <Group rows={[['Account Status', a.accountStatus], ['Nominee Registered', a.nomination]]} />
            <Group rows={[['Currency', CURRENCY_NAMES[cur] || cur]]} />
          </View>
        </View>

        <View style={s.codes} wrap={false}>
          {[['MICR', a.micr], ['IFSC Code', a.ifsc]]
            .filter(([, v]) => v.trim())
            .map(([k, v]) => (
              <Text key={k} style={s.row}>
                {k} <Text style={s.val}>{pdfText(v.trim())}</Text>
              </Text>
            ))}
        </View>

        <View>
          {/* Repeating table header on every page */}
          <View fixed>
            <View style={s.band}>
              <Text style={s.bandText}>{pdfText(a.accountType.trim() || 'Savings')} Account Transactions</Text>
            </View>
            <View style={s.thead}>
              {COLS.map(([label, width, tight], i) => (
                <View key={label} style={[s.th, width ? { width } : { flex: 1 }, tight ? s.thTight : null, i === COLS.length - 1 ? s.thLast : null]}>
                  <Text>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.tr} wrap={false}>
            <Text style={[s.td, s.cNo]}>-</Text>
            <Text style={[s.td, s.cDate]}>-</Text>
            <Text style={[s.td, s.cDesc]}>Opening Balance</Text>
            <Text style={[s.td, s.cRef]}>-</Text>
            <Text style={[s.td, s.cAmt]}>-</Text>
            <Text style={[s.td, s.cAmt]}>-</Text>
            <Text style={[s.td, s.cBal]}>{m(computed.opening)}</Text>
          </View>

          {computed.lines.map((l, i) => (
            <View key={l.id} style={s.tr} wrap={false}>
              <Text style={[s.td, s.cNo]}>{i + 1}</Text>
              <Text style={[s.td, s.cDate]} hyphenationCallback={word => [word]}>{fmtStatementDate(l.date)}</Text>
              <Text style={[s.td, s.cDesc]} hyphenationCallback={descBreaks}>{pdfText(l.description)}</Text>
              <Text style={[s.td, s.cRef]} hyphenationCallback={word => [word]}>{pdfText(l.reference)}</Text>
              <Text style={[s.td, s.cAmt]}>{l.debit ? m(l.debit) : ''}</Text>
              <Text style={[s.td, s.cAmt]}>{l.credit ? m(l.credit) : ''}</Text>
              <Text style={[s.td, s.cBal]}>{m(l.balance)}</Text>
            </View>
          ))}

          {!computed.lines.length && (
            <View style={s.tr}>
              <Text style={s.empty}>No transactions in this statement period.</Text>
            </View>
          )}

        </View>

        <View style={s.footer} fixed>
          <Text>{generated ? `Statement Generated on ${generated}` : ''}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page N-1: Account Summary, End of Statement & Assistance */}
      <Page size="A4" style={s.page}>
        <View style={s.contHeader} fixed>
          <Text style={s.contName}>{pdfText(displayName(a))}</Text>
          <Text style={s.contRow}>Account No. <Text style={s.val}>{pdfText(a.accountNumber)}</Text></Text>
          <Text style={s.contPeriod}>Account Statement <Text style={s.val}>{period}</Text></Text>
        </View>

        {/* Account Summary Table */}
        <View style={s.band}>
          <Text style={s.bandText}>Account Summary</Text>
        </View>
        <View style={s.summaryThead}>
          <View style={s.summaryThParticulars}><Text>Particulars</Text></View>
          <View style={s.summaryThBalance}><Text>Opening Balance</Text></View>
          <View style={s.summaryThBalanceLast}><Text>Closing Balance</Text></View>
        </View>
        <View style={s.summaryTr}>
          <Text style={s.summaryTdParticulars}>{pdfText(a.accountType.trim() || 'Savings')} Account (SA):</Text>
          <Text style={s.summaryTdBalance}>{m(computed.opening)}</Text>
          <Text style={s.summaryTdBalanceLast}>{m(computed.closing)}</Text>
        </View>

        {/* End of Statement block */}
        <View style={s.endBlock}>
          <Text style={s.endTitle}>End of Statement</Text>
          <Text style={s.endNotice1}>
            Any discrepancy in the statement should be brought to the notice of Kotak Mahindra Bank Ltd. within{'\n'}one month from the date of receipt of the statement.
          </Text>
          <Text style={s.endNotice2}>This is a system generated report and does not require signature and stamp.</Text>
        </View>

        {/* Campaign Promo Banner */}
        <Image style={s.promoBanner} src={PROMO_BANNER} />

        {/* For assistance, reach out to us at */}
        <View style={s.assistanceSec}>
          <View style={s.band}>
            <Text style={s.bandText}>For assistance, reach out to us at:</Text>
          </View>
          <View style={s.assistanceBody}>
            <View style={s.assistCol1}>
              <Image style={s.assistIcon} src={ICON_PHONE} />
              <Text style={s.assistLabel}>Contact Us</Text>
              <Text style={s.assistVal}>1800 4100</Text>
              <Text style={s.assistSub}>(Toll-free number)</Text>
            </View>
            <View style={s.assistCol2}>
              <Image style={s.assistIcon} src={ICON_BRANCH} />
              <Text style={s.assistLabel}>Branch Address</Text>
              <Text style={s.assistAddress}>
                {pdfText(
                  a.branchAddress ||
                  (a.branch?.toLowerCase().includes('baner')
                    ? 'Signet Corner Survey No.134, Opp.orchid School,Baner Pune, Pune-411016, Maharashtra, India'
                    : a.branch
                    ? `${a.branch} Branch`
                    : 'Signet Corner Survey No.134, Opp.orchid School,Baner Pune, Pune-411016, Maharashtra, India')
                )}
              </Text>
            </View>
            <View style={s.assistCol3}>
              <Image style={s.assistIcon} src={ICON_PHONE} />
              <Text style={s.assistLabel}>Branch Phone Number</Text>
              <Text style={s.assistVal}>{pdfText(a.branchPhone || '9168614476')}</Text>
            </View>
          </View>
        </View>

        {/* Remember! Security Alert Box */}
        <View style={s.securityCard}>
          <View style={s.securityLeft}>
            <Text style={s.securityTitle}>Remember!</Text>
            <Text style={s.securityText}>
              Never share personal/sensitive information like PIN, CVV, OTP{'\n'}or passwords with anyone.
            </Text>
          </View>
          <View style={s.securityRight}>
            <Image style={s.securityQr} src={QR_SECURITY} />
            <Text style={s.securityScanText}>Scan for{'\n'}more safe{'\n'}banking tips</Text>
          </View>
        </View>

        {/* Bank CIN and Registered Office */}
        <View style={s.regOfficeFooter}>
          <Text style={s.regOfficeLine1}>Kotak Mahindra Bank Ltd. | CIN: L65110MH1985PLC038137</Text>
          <Text style={s.regOfficeLine2}>Registered Office: 27 BKC, C 27, G Block, Bandra Kurla Complex, Bandra (E), Mumbai - 400 051. www.kotak.bank.in</Text>
        </View>

        {/* Page Footer */}
        <View style={s.footer} fixed>
          <Text>{generated ? `Statement Generated on ${generated}` : ''}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page N: Important Information & Commonly Used Narrations */}
      <Page size="A4" style={s.page}>
        <View style={s.contHeader} fixed>
          <Text style={s.contName}>{pdfText(displayName(a))}</Text>
          <Text style={s.contRow}>Account No. <Text style={s.val}>{pdfText(a.accountNumber)}</Text></Text>
          <Text style={s.contPeriod}>Account Statement <Text style={s.val}>{period}</Text></Text>
        </View>

        {/* Important Information Box */}
        <View style={s.band}>
          <Text style={s.bandText}>Important Information</Text>
        </View>
        <View style={s.infoBox}>
          {IMPORTANT_BULLETS.map((bullet, idx) => (
            <View key={idx} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{pdfText(bullet)}</Text>
            </View>
          ))}
        </View>

        {/* Commonly Used Narrations Table */}
        <View style={s.narrationsSec}>
          <View style={s.band}>
            <Text style={s.bandText}>Commonly Used Narrations</Text>
          </View>
          <View style={s.narrationsTable}>
            {NARRATIONS.map(([left, right], idx) => (
              <View key={idx} style={idx === NARRATIONS.length - 1 ? s.narrationsRowLast : s.narrationsRow}>
                <Text style={s.narrationCellLeft}>{pdfText(left)}</Text>
                <Text style={s.narrationCellRight}>{pdfText(right)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Page Footer */}
        <View style={s.footer} fixed>
          <Text>{generated ? `Statement Generated on ${generated}` : ''}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
