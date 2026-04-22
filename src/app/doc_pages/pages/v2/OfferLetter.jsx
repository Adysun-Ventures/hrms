'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FiChevronDown, FiDownload, FiX } from 'react-icons/fi';
import TableHeader from '@/components/ui/TableHeader';
import MissingSalaryModal from '@/components/ui/MissingSalaryModal';
import { Combobox } from '@headlessui/react'
import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
} from 'docx';
import { createAdysunDocx } from '@/utils/docxAdysun';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { offerLetterStyles } from '@/components/pdf/PDFStyles';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';
import { BODY_FONT_FAMILY, ensureDocumentFonts } from '@/components/pdf/documentFont';

/* ---------------- HARD-CODED COMPANY & HR ---------------- */
const COMPANY_DATA = {
  name: 'ADYSUN VENTURES PVT. LTD.',
  contact: '9579537523 | hr@adysunventures.com | AdysunVentures.com',
  address:
    'S no 47, Workplex, Pune-Satara Rd, Opp City Pride Theater, Near Bhapkar petrol pump, Pune, Maharashtra - 411009',
  hrName: 'Prachi Jadhav',
  hrDesignation: 'Head - HR Department',
  hrEmail: 'hr@adysunventures.com',
  logo: '/assets/adysunventures_logo.png',
  signature: '/assets/hr-sign.png'
};
ensureDocumentFonts();

/* ---------------- WATERMARK COMPONENT ---------------- */
const Watermark = ({ logoSrc }) => {
  if (!logoSrc) return null;
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};

const balancedStyles = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textDecoration: 'underline',
  },
  bulletList: {
    marginLeft: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 2,
  }
};

function normalizeJoiningToIso(value) {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const DateDropdown = ({ value, onChange }) => {
  const [initialYear = "", initialMonth = "", initialDay = ""] =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-") : ["", "", ""];
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);

  const nowYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => String(nowYear - 10 + i));
  const getDaysInMonth = (y, m) => {
    if (!y || !m) return 31;
    return new Date(Number(y), Number(m), 0).getDate();
  };
  const maxDays = getDaysInMonth(year, month);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0"));

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  useEffect(() => {
    if (day && Number(day) > maxDays) setDay("");
  }, [day, maxDays, month, year]);

  const emitIfComplete = (nextYear, nextMonth, nextDay) => {
    if (nextYear && nextMonth && nextDay) onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        value={day}
        disabled={!month || !year}
        onChange={(e) => {
          const nextDay = e.target.value;
          setDay(nextDay);
          emitIfComplete(year, month, nextDay);
        }}
      >
        <option value="">{!month || !year ? "Select Mon/Year" : "DD"}</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        value={month}
        onChange={(e) => {
          const nextMonth = e.target.value;
          setMonth(nextMonth);
          setDay("");
          emitIfComplete(year, nextMonth, day);
        }}
      >
        <option value="">Mon</option>
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        value={year}
        onChange={(e) => {
          const nextYear = e.target.value;
          setYear(nextYear);
          setDay("");
          emitIfComplete(nextYear, month, day);
        }}
      >
        <option value="">YYYY</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

const compactStyles = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    textDecoration: 'underline',
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 2,
  }
};

/* ---------------- TABLE ROW HELPERS ---------------- */
const Row = ({ label, m, a }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCell, { flex: 3, textAlign: 'right' }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellLast, { flex: 3, textAlign: 'right' }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

/* Bold Row WITHOUT BG (for Gross & Net originally) */
const RowBold = ({ label, m, a }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3, textAlign: 'right' }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3, textAlign: 'right' }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

/* Bold Row WITH GRAY BG (for Net Salary and Total CTC) */
const RowBoldGray = ({ label, m, a }) => (
  <View style={[offerLetterStyles.tableRow, { backgroundColor: '#e0e0e0' }]}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3, textAlign: 'right' }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3, textAlign: 'right' }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

const RowSectionHeader = ({ label }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
      <Text> </Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
      <Text> </Text>
    </View>
  </View>
);

const RowVariableAnnual = ({ label, annual }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCell, { flex: 4 }]}>
      <Text>{label}</Text>
    </View>
    <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
      <Text> </Text>
    </View>
    <View style={[offerLetterStyles.tableCellLast, { flex: 3, textAlign: 'right' }]}>
      <Text>{annual.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

/**
 * CTC table from employment joining package (joiningCtc, joiningFixed/variable split).
 * Matches Add Employment: fixed = joiningCtc − joiningVariable (annual), Basic/HRA/Conv/Other from monthly fixed.
 */
function computeOfferLetterCtcBreakdown(employment, enablePF) {
  const annualCTC = Number(employment?.joiningCtc ?? employment?.salary ?? 0);
  const variableAnnual = Math.round(Number(employment?.joiningVariablePay ?? 0));
  const fixedStored = Number(employment?.joiningFixedPay ?? 0);
  const fixedAnnual =
    fixedStored > 0 ? fixedStored : Math.max(0, annualCTC - variableAnnual);

  const monthlyFixed = fixedAnnual / 12;
  const basicM = Math.round(monthlyFixed * 0.5);
  const hraM = Math.round(basicM * 0.4);
  const conveyM = 2000;
  const otherOverride = employment?.joiningOtherAllowance;
  const otherM =
    otherOverride != null && otherOverride !== ''
      ? Math.round(Number(otherOverride))
      : Math.round(monthlyFixed - basicM - hraM - conveyM);

  const basicA = basicM * 12;
  const hraA = hraM * 12;
  const conveyA = conveyM * 12;
  const otherA = Math.max(0, fixedAnnual - basicA - hraA - conveyA);

  const grossM = basicM + hraM + conveyM + otherM;
  const grossA = basicA + hraA + conveyA + otherA;

  const ptM = 200;
  const ptA = 2400;
  const pfBasisM = Math.min(basicM, 15000);
  const pfM = enablePF ? Math.round(pfBasisM * 0.12) : 0;
  const pfA = pfM * 12;

  const totalDedM = ptM + pfM;
  const totalDedA = ptA + pfA;

  const netM = grossM - totalDedM;
  const netA = grossA - totalDedA;

  const totalCtcM = Math.round(annualCTC / 12);
  const totalCtcA = annualCTC;

  return {
    basicM,
    basicA,
    hraM,
    hraA,
    conveyM,
    conveyA,
    otherM,
    otherA,
    grossM,
    grossA,
    ptM,
    ptA,
    pfM,
    pfA,
    totalDedM,
    totalDedA,
    netM,
    netA,
    variableAnnual,
    totalCtcM,
    totalCtcA,
  };
}

/* ---------------- PDF DOCUMENT COMPONENT ---------------- */
const OfferLetterPDF = ({
  employee,
  employment,
  enablePF,
  designationOverride,
  documentGenerateDate,
  effectiveDate,
  employeeSignPlace,
}) => {
  if (!employee || !employment) {
    return (
      <Document>
        <Page><Text>No Data Available</Text></Page>
      </Document>
    );
  }

  const name = employee?.name || '';
  const firstName = name.split(' ')[0] || '';
  const rawAddress = employee?.currentAddress || employee?.permanentAddress || '';
  const fullAddress = rawAddress ? rawAddress.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean) : [];
  const shortAddress = fullAddress.slice(-2);

  const designation =
    (designationOverride || '').trim() ||
    employment?.jobTitle ||
    employment?.designation ||
    '';
  const joiningRaw = employment?.joiningDate || employment?.startDate || '';
  const joiningIso = normalizeJoiningToIso(joiningRaw);
  const joiningDateFormatted = joiningIso
    ? formatDateToDayMonYear(joiningIso)
    : joiningRaw || '—';
  const effectiveIso =
    effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(String(effectiveDate).trim())
      ? String(effectiveDate).trim()
      : joiningIso;
  const effectiveDateFormatted = effectiveIso
    ? formatDateToDayMonYear(effectiveIso)
    : joiningDateFormatted;
  const letterDate = (documentGenerateDate && /^\d{4}-\d{2}-\d{2}$/.test(documentGenerateDate))
    ? formatDateToDayMonYear(documentGenerateDate)
    : formatDateToDayMonYear(new Date());

  const signPlace = employeeSignPlace || employment?.location || '';

  const ctc = computeOfferLetterCtcBreakdown(employment, enablePF);

  const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


 return (
  <Document>

    {/* ---------------- PAGE 1 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        paddingTop: 35,
        paddingRight: 35,
        paddingBottom: 35,
        paddingLeft: 35,
        fontFamily: BODY_FONT_FAMILY,
        fontSize: 12,
        lineHeight: 1.45
      }}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />

      <Text style={{ marginBottom: 14 }}>
        <Text style={{ fontWeight: "bold" }}>Date: </Text>{letterDate}
      </Text>

      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontWeight: "bold" }}>{toTitleCase(name)}</Text>
        {shortAddress.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "bold",
          marginBottom: 16,
          textDecoration: "underline",
          textAlign: "center"
        }}
      >
        LETTER OF APPOINTMENT
      </Text>

      <Text style={{ marginBottom: 12 }}>
        Dear <Text style={{ fontWeight: "bold" }}>{toTitleCase(name)}</Text>,
      </Text>

      <Text style={{ marginBottom: 12 }}>
        We are pleased to extend an employment opportunity with{" "}
        <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. This appointment
        signifies the beginning of a professional engagement rooted in{" "}
        <Text >values, responsibility,
        and mutual growth</Text>. We take pride in fostering an environment that
        encourages <Text >discipline, structured learning,
        accountability</Text> and a{" "}
        <Text >results-driven work ethic</Text>.
      </Text>

      <Text style={{ marginBottom: 12 }}>
        You are hereby appointed to the position of{' '}
        <Text style={{ fontWeight: 'bold' }}>{designation}</Text> effective from{' '}
        <Text style={{ fontWeight: 'bold' }}>{effectiveDateFormatted}</Text>. You are expected to
        demonstrate professional conduct, punctuality and adhere to organizational policies at all
        times. This appointment will be considered null and void if you fail to commence duties
        on or before your joining date.
        {/* <Text style={{ fontWeight: 'bold' }}>{joiningDateFormatted}</Text>. */}
      </Text>

      <Text>
        At <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>, we believe that{" "}
        <Text >structured operations, ethical practices,
        and transparent communication</Text> contribute to a high-performance culture.
        Your role will require alignment with organizational objectives and a
        commitment to producing measurable outcomes.
      </Text>
    <GlobalPDFFooter />
    </Page>

    {/* ---------------- PAGE 2 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        paddingTop: 35,
        paddingRight: 35,
        paddingLeft: 35,
        fontFamily: BODY_FONT_FAMILY,
        fontSize: 12,
        // lineHeight: 1.45
      }}
      wrap={false}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />
      

      <Text style={compactStyles.sectionTitle}>Role & Performance Expectations</Text>
      <Text style={compactStyles.paragraph}>
        Your role will require consistent delivery of assigned responsibilities within
        stipulated timelines, collaboration with internal teams, adaptability to
        operational requirements, and maintenance of professional conduct within the
        workplace. Performance evaluations may be conducted periodically to review
        progress and contribution to the organization.
      </Text>

      <Text style={compactStyles.sectionTitle}>Company Conduct & Compliance</Text>
      <Text style={compactStyles.paragraph}>
        The organization expects all employees to comply with corporate policies,
        regulatory guidelines, and statutory norms. Misconduct, violation of policies,
        or breach of confidentiality may lead to disciplinary action or termination
        of employment.
      </Text>

      <Text style={compactStyles.sectionTitle}>Confidentiality & Data Protection</Text>
      <View style={compactStyles.bulletList}>
        <Text style={compactStyles.bullet}>• All company data and intellectual assets must be safeguarded.</Text>
        <Text style={compactStyles.bullet}>• No confidential information may be disclosed without approval.</Text>
        <Text style={compactStyles.bullet}>• All records are considered property of the organization.</Text>
      </View>

      <Text style={compactStyles.sectionTitle}>Code of Conduct</Text>
      <View style={compactStyles.bulletList}>
        <Text style={compactStyles.bullet}>• Maintain respectful communication with peers and management.</Text>
        <Text style={compactStyles.bullet}>• Adhere to attendance and leave requirements.</Text>
        <Text style={compactStyles.bullet}>• Use company resources responsibly and professionally.</Text>
      </View>
      <View style={{ marginBottom: 20 }} />
    <GlobalPDFFooter />
    </Page>

    {/* ---------------- PAGE 3 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        paddingTop: 35,
        paddingRight: 35,
        paddingLeft: 35,
        fontFamily: BODY_FONT_FAMILY,
        fontSize: 12
      }}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />

      <Text style={balancedStyles.sectionTitle}>General Terms</Text>
      <View style={balancedStyles.bulletList}>
        <Text style={balancedStyles.bullet}>• Official communication shall occur via registered email or written correspondence.</Text>
        <Text style={balancedStyles.bullet}>• Leaves shall be governed under HR policy and statutory norms where applicable.</Text>
        <Text style={balancedStyles.bullet}>• Gross misconduct may lead to immediate termination without prior notice.</Text>
        <Text style={balancedStyles.bullet}>• The company may revise policies, structure, or compensation based on operational requirements.</Text>
      </View>

      <Text style={balancedStyles.sectionTitle}>Probation & Confirmation</Text>
      <View style={balancedStyles.bulletList}>
        <Text style={balancedStyles.bullet}>• Employment shall initially be under a probation period of 3 months.</Text>
        <Text style={balancedStyles.bullet}>• Successful completion of probation shall be followed by confirmation in writing.</Text>
        <Text style={balancedStyles.bullet}>• Lack of performance or misconduct may lead to extension or termination.</Text>
      </View>

      <Text style={balancedStyles.sectionTitle}>Jurisdiction</Text>
      <View style={balancedStyles.bulletList}>
        <Text style={balancedStyles.bullet}>• This employment shall be governed under the laws applicable within India.</Text>
        <Text style={balancedStyles.bullet}>• Any dispute shall be addressed under competent court jurisdiction.</Text>
      </View>
    <GlobalPDFFooter />
    </Page>

    {/* ---------------- PAGE 4 (CTC PAGE — UNTOUCHED LOGIC) ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        paddingTop: 35,
        paddingRight: 35,
        paddingLeft: 35,
        fontFamily: BODY_FONT_FAMILY,
        fontSize: 11
      }}
      wrap={false}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 8 }} />

      <Text style={[balancedStyles.sectionTitle, { fontSize: 14, fontWeight: "bold" }]}>
        CTC Breakdown – Annual and Monthly
      </Text>

      <View style={{ marginTop: 10 }}>
        <View style={offerLetterStyles.tableRow}>
          <View style={[offerLetterStyles.tableCellBold, { flex: 4, backgroundColor: "#e0e0e0" }]}>
            <Text>Component</Text>
          </View>
          <View style={[offerLetterStyles.tableCellBold, { flex: 3, backgroundColor: "#e0e0e0", textAlign: 'center' }]}>
            <Text>Monthly (₹)</Text>
          </View>
          <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3, backgroundColor: "#e0e0e0", textAlign: 'center' }]}>
            <Text>Annual (₹)</Text>
          </View>
        </View>

        <Row label="Basic Salary" m={ctc.basicM} a={ctc.basicA} />
        <Row label="HRA" m={ctc.hraM} a={ctc.hraA} />
        <Row label="Conveyance Allowance" m={ctc.conveyM} a={ctc.conveyA} />
        <Row label="Other Allowances" m={ctc.otherM} a={ctc.otherA} />
        <RowBold label="Gross Salary" m={ctc.grossM} a={ctc.grossA} />
        <RowSectionHeader label="Deductions" />
        <Row label="Professional Tax" m={ctc.ptM} a={ctc.ptA} />
        {enablePF && (
          <Row label="Employee PF (12% of MIN(Basic, ₹15,000))" m={ctc.pfM} a={ctc.pfA} />
        )}
        <RowBold label="Total Deductions" m={ctc.totalDedM} a={ctc.totalDedA} />
        <RowBoldGray label="Net In-Hand Salary" m={ctc.netM} a={ctc.netA} />
        <RowSectionHeader label="Additional Benefits" />
        <RowVariableAnnual label="Ann. Perfr. Incentive (Variable)" annual={ctc.variableAnnual} />
        <RowBoldGray label="Total CTC" m={ctc.totalCtcM} a={ctc.totalCtcA} />

        <Text style={{ marginTop: 8, fontSize: 11 }}>
          {enablePF ? (
            'Note: Provident Fund (PF) is included in deductions as shown above.'
          ) : (
            <>
              Note: There is currently{' '}
              <Text style={{ fontWeight: 'bold' }}>no deduction for Provident Fund (PF)</Text>
              .
            </>
          )}
        </Text>

        <View style={{ borderBottom: "1px solid #000", marginVertical: 8 }} />

        <Text style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6, textDecoration: "underline" }}>
          Acknowledgement and Acceptance
        </Text>

        <Text style={{ fontSize: 11, lineHeight: 1.4, marginBottom: 10 }}>
          I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter.
          I accept the offer of employment with Adysun Ventures Private Limited.
        </Text>

        <View style={{ marginTop: 4 }}>
          <Text style={{ fontSize: 11, marginBottom: 4 }}>
            Candidate Name: <Text style={{ fontWeight: "bold" }}>{toTitleCase(name)}</Text>
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 12 }}>
            Signature: ________________________________
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 12 }}>
            Date: {letterDate}
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 12 }}>
            Place: {signPlace || '-'}
          </Text>
        </View>

        <View style={{ marginTop: 18, alignItems: "flex-end" }}>
          {COMPANY_DATA.signature && (
            <Image src={COMPANY_DATA.signature} style={{ width: 120, height: 60, marginBottom: 2 }} />
          )}
          <Text style={{ fontSize: 11, fontWeight: "bold" }}>{COMPANY_DATA.hrName}</Text>
          <Text style={{ fontSize: 10 }}>{COMPANY_DATA.hrDesignation}</Text>
          <Text style={{ fontSize: 10 }}>{COMPANY_DATA.hrEmail}</Text>
        </View>
      </View>
      <GlobalPDFFooter />
    </Page>

  </Document>
);

};

/* ---------------- DOCX BUILDER ---------------- */
const toTitleCaseDocx = (str) => {
  return str?.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '';
};

async function buildOfferLetterDocx(
  employee,
  employment,
  enablePF,
  designationOverride,
  documentGenerateDate,
  effectiveDate,
  employeeSignPlace
) {
  const name = employee?.name || '';
  const rawAddress = employee?.currentAddress || employee?.permanentAddress || '';
  const fullAddress = rawAddress ? rawAddress.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean) : [];
  const shortAddress = fullAddress.slice(-2).join(', ') || '';
  const designation =
    (designationOverride || '').trim() ||
    employment?.jobTitle ||
    employment?.designation ||
    '';
  const joiningRaw = employment?.joiningDate || employment?.startDate || '';
  const joiningIso = normalizeJoiningToIso(joiningRaw);
  const joiningDateFormatted = joiningIso
    ? formatDateToDayMonYear(joiningIso)
    : joiningRaw || '—';
  const effectiveIso =
    effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(String(effectiveDate).trim())
      ? String(effectiveDate).trim()
      : joiningIso;
  const effectiveDateFormatted = effectiveIso
    ? formatDateToDayMonYear(effectiveIso)
    : joiningDateFormatted;
  const letterDate =
    documentGenerateDate && /^\d{4}-\d{2}-\d{2}$/.test(documentGenerateDate)
      ? formatDateToDayMonYear(documentGenerateDate)
      : formatDateToDayMonYear(new Date());
  const signPlace = employeeSignPlace || employee?.location || employment?.location || '';
  const ctc = computeOfferLetterCtcBreakdown(employment, enablePF);
  const fmt = (n) => n.toLocaleString('en-IN');

  const tableRow = (label, m, a, bold = false) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label, bold })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(m), bold })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(a), bold })] })] }),
      ],
    });

  const tableRowSection = (label) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: '' })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: '' })] }),
      ],
    });

  const tableRowVariableAnnual = (label, annual) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: '' })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(annual) })] })] }),
      ],
    });

  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: COMPANY_DATA.address, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: COMPANY_DATA.contact, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'Date: ', bold: true }), new TextRun({ text: letterDate })] }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: toTitleCaseDocx(name), bold: true })] }),
    new Paragraph({ text: shortAddress }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'LETTER OF APPOINTMENT', bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCaseDocx(name)},` })] }),
    new Paragraph({
      children: [
        new TextRun({ text: 'We are pleased to extend an employment opportunity with ' }),
        new TextRun({ text: COMPANY_DATA.name, bold: true }),
        new TextRun({ text: '. You are hereby appointed to the position of ' }),
        new TextRun({ text: designation, bold: true }),
        new TextRun({ text: ' effective from ' }),
        new TextRun({ text: effectiveDateFormatted, bold: true }),
        new TextRun({ text: '. Your joining date is ' }),
        new TextRun({ text: joiningDateFormatted, bold: true }),
        new TextRun({ text: '.' }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'CTC Breakdown – Annual and Monthly', bold: true, underline: {} })] }),
    new Paragraph({ text: '' }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ shading: { fill: 'E0E0E0' }, children: [new Paragraph({ children: [new TextRun({ text: 'Component', bold: true })] })] }),
            new TableCell({ shading: { fill: 'E0E0E0' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Monthly (₹)', bold: true })] })] }),
            new TableCell({ shading: { fill: 'E0E0E0' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Annual (₹)', bold: true })] })] }),
          ],
        }),
        tableRow('Basic Salary', ctc.basicM, ctc.basicA),
        tableRow('HRA', ctc.hraM, ctc.hraA),
        tableRow('Conveyance Allowance', ctc.conveyM, ctc.conveyA),
        tableRow('Other Allowances', ctc.otherM, ctc.otherA),
        tableRow('Gross Salary', ctc.grossM, ctc.grossA, true),
        tableRowSection('Deductions'),
        tableRow('Professional Tax (est.)', ctc.ptM, ctc.ptA),
        ...(enablePF
          ? [tableRow('Employee PF (12% of MIN(Basic, ₹15,000))', ctc.pfM, ctc.pfA)]
          : []),
        tableRow('Total Deductions', ctc.totalDedM, ctc.totalDedA, true),
        tableRow('Net In-Hand Salary', ctc.netM, ctc.netA, true),
        tableRowSection('Additional Benefits'),
        tableRowVariableAnnual('Ann. Perfr. Incentive (Variable)', ctc.variableAnnual),
        tableRow('Total CTC', ctc.totalCtcM, ctc.totalCtcA, true),
      ],
    }),
    new Paragraph({
      children: enablePF
        ? [new TextRun({ text: 'Note: Provident Fund (PF) is included in deductions as shown above.', italics: true })]
        : [
            new TextRun({ text: 'Note: There is currently ', italics: true }),
            new TextRun({ text: 'no deduction for Provident Fund (PF)', bold: true, italics: true }),
            new TextRun({ text: '.', italics: true }),
          ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'Acknowledgement and Acceptance', bold: true, underline: {} })] }),
    new Paragraph({ text: 'I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter. I accept the offer of employment with Adysun Ventures Private Limited.' }),
    new Paragraph({ text: '' }),
    new Paragraph({ children: [new TextRun({ text: 'Candidate Name: ' }), new TextRun({ text: toTitleCaseDocx(name), bold: true })] }),
    new Paragraph({ text: 'Signature: ________________________________' }),
    new Paragraph({ children: [new TextRun({ text: 'Date: ' }), new TextRun({ text: letterDate })] }),
    new Paragraph({ children: [new TextRun({ text: 'Place: ', bold: true }), new TextRun({ text: signPlace || '' })] }),
  ];

  return await createAdysunDocx({ children });
}

/* ---------------- MAIN COMPONENT ---------------- */
function OfferLetterV2({ isForm16 = false }) {
  const { currentUserData } = useAuth();
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const selfEmployeeId = isEmployeeUser ? currentUserData?.id : null;

  const employeePickerInputRef = useRef(null);

  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employment, setEmployment] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [enablePF, setEnablePF] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [designationOverride, setDesignationOverride] = useState("");
  const [documentGenerateDate, setDocumentGenerateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [effectiveDate, setEffectiveDate] = useState('');
  const [employeeSignPlace, setEmployeeSignPlace] = useState("");
  const [financialYearStart, setFinancialYearStart] = useState(() => {
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  });
  const [missingSalaryPopupOpen, setMissingSalaryPopupOpen] = useState(false);
  const [missingSalaryDetails, setMissingSalaryDetails] = useState([]);
  const [isCheckingMissingSalary, setIsCheckingMissingSalary] = useState(false);
  


  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [pdfKey, setPdfKey] = useState(0);

  useEffect(() => { fetchEmployees(); }, [selfEmployeeId]);

  const fetchEmployees = async () => {
    const qs = await getDocs(collection(db, 'employees'));
    // Ensure Firestore doc.id always wins over any stored `id` field.
    const list = qs.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const restrictToSelf = Boolean(selfEmployeeId) && !isForm16;
    const visibleList = restrictToSelf ? list.filter((e) => e.id === selfEmployeeId) : list;
    setCandidates(visibleList);

    const map = {};
    for (const emp of visibleList) {
      const qSnap = await getDocs(query(collection(db, 'employments'), where('employeeId', '==', emp.id)));
      if (!qSnap.empty) map[emp.id] = qSnap.docs[0].data();
    }
    setEmployments(map);

    if (selfEmployeeId && visibleList.length > 0) {
      const selfEmp = visibleList[0];
      const nextEmployment = map[selfEmp.id] || null;
      setEmployee(selfEmp);
      setSelectedEmployees([selfEmp]);
      setEmployment(nextEmployment);
      setDesignationOverride(nextEmployment?.jobTitle || nextEmployment?.designation || '');
      setEmployeeSignPlace(nextEmployment?.location || '');
      const joiningDateForDoc = normalizeDateForInput(
        nextEmployment?.joiningDate || nextEmployment?.startDate || ''
      );
      if (joiningDateForDoc) {
        setDocumentGenerateDate(joiningDateForDoc);
        setEffectiveDate(joiningDateForDoc);
      } else {
        setEffectiveDate('');
      }
      setPdfKey((k) => k + 1);
    }
  };

  const closeEmployeePicker = () => {
    const el = employeePickerInputRef.current;
    if (!el) return;
    try {
      // HeadlessUI Combobox closes reliably on Escape.
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    } catch {
      // fallback
      el.blur?.();
    }
  };

  const normalizeDateForInput = (value) => {
    if (!value) return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const handleSelect = e => {
    const id = e.target.value;
    setEmployee(candidates.find(x => x.id === id) || null);
    const nextEmployment = employments[id] || null;
    setEmployment(nextEmployment);
    setDesignationOverride(nextEmployment?.jobTitle || nextEmployment?.designation || "");
    setEmployeeSignPlace(nextEmployment?.location || "");
    const joiningForEffective = normalizeDateForInput(
      nextEmployment?.joiningDate || nextEmployment?.startDate || ''
    );
    setEffectiveDate(joiningForEffective || '');
    setPdfKey(k => k + 1);
  };

  useEffect(() => { setPdfKey(k => k + 1); }, [enablePF]);

  const hasMissingSalary = isForm16 && missingSalaryDetails.length > 0;
  const canGenerate = isForm16
    ? selectedEmployees.length > 0 && !hasMissingSalary && !isCheckingMissingSalary
    : Boolean(employee);

  const toDateSafe = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    const seconds = value?.seconds ?? value?._seconds;
    if (typeof seconds === 'number') {
      const d = new Date(seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const toMonthKey = (year, monthIndex0) => `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
  const monthNameShort = (monthIndex0) =>
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex0] || '';

  const buildFinancialYearOptions = () => {
    const now = new Date();
    const currentStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 8 }, (_, i) => {
      const start = currentStart - i;
      return {
        value: start,
        label: `FY ${start}-${String(start + 1).slice(-2)}`,
      };
    });
  };

  const financialYearOptions = buildFinancialYearOptions();
  const getForm16MonthColumns = (fyStart) => [
    { key: `${fyStart}-04`, label: `Apr-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-05`, label: `May-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-06`, label: `Jun-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-07`, label: `Jul-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-08`, label: `Aug-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-09`, label: `Sep-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-10`, label: `Oct-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-11`, label: `Nov-${String(fyStart).slice(-2)}` },
    { key: `${fyStart}-12`, label: `Dec-${String(fyStart).slice(-2)}` },
    { key: `${fyStart + 1}-01`, label: `Jan-${String(fyStart + 1).slice(-2)}` },
    { key: `${fyStart + 1}-02`, label: `Feb-${String(fyStart + 1).slice(-2)}` },
    { key: `${fyStart + 1}-03`, label: `Mar-${String(fyStart + 1).slice(-2)}` },
  ];

  const toCurrency2 = (n) => Number((Number(n || 0)).toFixed(2));

  const formatDob = (value) => {
    if (!value) return '';
    const parsed = toDateSafe(value);
    if (!parsed) return String(value);
    const day = parsed.getDate();
    const month = monthNameShort(parsed.getMonth());
    const yearShort = String(parsed.getFullYear()).slice(-2);
    return `${day}-${month}-${yearShort}`;
  };

  const pickSalaryAmount = (salaryRow) => {
    const raw =
      salaryRow?.netSalary ??
      salaryRow?.inhandSalary ??
      salaryRow?.totalSalary ??
      salaryRow?.perMonth ??
      (Number(salaryRow?.ctc || 0) / 12);
    return toCurrency2(raw);
  };

  const generateForm16Excel = async () => {
    if (!selectedEmployees.length) {
      toast.error('At least one employee is required');
      return;
    }

    try {
      toast.loading('Generating Form 16 Excel...', { id: 'form16-excel' });
      const monthColumns = getForm16MonthColumns(financialYearStart);
      const rows = [];
      const monthTotals = new Array(monthColumns.length).fill(0);
      let grandTotal = 0;

      for (let i = 0; i < selectedEmployees.length; i += 1) {
        const emp = selectedEmployees[i];
        const employeeId = emp?.id;
        if (!employeeId) continue;

        const salarySnap = await getDocs(
          query(collection(db, 'salaries'), where('employeeId', '==', employeeId))
        );
        const salaryMap = new Map();
        salarySnap.docs.forEach((d) => {
          const s = d.data();
          const year = Number(s?.year);
          const month = Number(s?.month);
          if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return;
          const monthKey = `${year}-${String(month).padStart(2, '0')}`;
          salaryMap.set(monthKey, pickSalaryAmount(s));
        });

        const rowEmployment = employments[employeeId] || null;
        const monthValues = monthColumns.map((col) => toCurrency2(salaryMap.get(col.key) || 0));
        const total = toCurrency2(monthValues.reduce((sum, val) => sum + val, 0));
        monthValues.forEach((v, idx) => {
          monthTotals[idx] += v;
        });
        grandTotal += total;

        rows.push([
          i + 1,
          String(emp?.name || ''),
          String(emp?.panCard || emp?.panNumber || emp?.pan || ''),
          formatDob(emp?.dob || emp?.dateOfBirth),
          String(rowEmployment?.jobTitle || rowEmployment?.designation || ''),
          ...monthValues,
          total,
        ]);
      }

      const headers = [
        'Sr No',
        'Name of Employee',
        'Pan Number',
        'DOB',
        'Designation',
        ...monthColumns.map((m) => m.label),
        'Total',
      ];
      const totalRow = [
        '',
        '',
        '',
        '',
        'Total',
        ...monthTotals.map((n) => toCurrency2(n)),
        toCurrency2(grandTotal),
      ];
      const aoa = [['Form 16'], [], headers, ...rows, [], totalRow];

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 16 },
        { wch: 12 },
        { wch: 22 },
        ...new Array(12).fill({ wch: 11 }),
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Form 16');

      const wbArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Form16_FY${financialYearStart}-${String(financialYearStart + 1).slice(-2)}.xlsx`);
      toast.success('Form 16 Excel generated.', { id: 'form16-excel' });
    } catch (error) {
      console.error('Failed to generate Form 16 Excel:', error);
      toast.error('Failed to generate Form 16 Excel.', { id: 'form16-excel' });
    }
  };

  useEffect(() => {
    if (!isForm16) return;
    if (!selectedEmployees.length) {
      setMissingSalaryDetails([]);
      return;
    }

    const checkMissingForFY = async () => {
      setIsCheckingMissingSalary(true);
      try {
        const fyStartDate = new Date(financialYearStart, 3, 1); // 1 Apr
        const fyEndDate = new Date(financialYearStart + 1, 2, 31); // 31 Mar
        const nextMissing = [];

        for (const emp of selectedEmployees) {
          const employeeId = emp?.id;
          if (!employeeId) continue;

          const empName = emp?.name || 'Unknown';
          const employmentsSnap = await getDocs(
            query(collection(db, 'employments'), where('employeeId', '==', employeeId))
          );
          const firstEmploymentDocId = employmentsSnap.docs[0]?.id || '';
          const salarySnap = await getDocs(
            query(collection(db, 'salaries'), where('employeeId', '==', employeeId))
          );

          const salaryMonthSet = new Set(
            salarySnap.docs
              .map((d) => d.data())
              .map((s) => {
                const y = Number(s?.year);
                const m1 = Number(s?.month);
                if (!Number.isFinite(y) || !Number.isFinite(m1) || m1 < 1 || m1 > 12) return null;
                const date = new Date(y, m1 - 1, 1);
                if (date < new Date(financialYearStart, 3, 1) || date > new Date(financialYearStart + 1, 2, 1)) return null;
                return toMonthKey(y, m1 - 1);
              })
              .filter(Boolean)
          );

          const expectedSet = new Set();
          for (const docItem of employmentsSnap.docs) {
            const row = docItem.data();
            const startRaw = row?.joiningDate || row?.startDate;
            const endRaw = row?.lastWorkingDate || row?.endDate || null;
            const startDate = toDateSafe(startRaw);
            const endDate = toDateSafe(endRaw) || new Date();
            if (!startDate) continue;

            const effectiveStart = startDate > fyStartDate ? startDate : fyStartDate;
            const effectiveEnd = endDate < fyEndDate ? endDate : fyEndDate;
            if (effectiveStart > effectiveEnd) continue;

            let cursor = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1);
            const cap = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
            while (cursor <= cap) {
              expectedSet.add(toMonthKey(cursor.getFullYear(), cursor.getMonth()));
              cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            }
          }

          const missingKeys = Array.from(expectedSet).filter((k) => !salaryMonthSet.has(k));
          if (missingKeys.length > 0) {
            const monthLabels = missingKeys
              .map((k) => {
                const [y, m] = String(k).split('-');
                const year = Number(y);
                const monthIndex0 = Number(m) - 1;
                return `${monthNameShort(monthIndex0)} ${year}`;
              })
              .sort((a, b) => new Date(`01 ${a}`).getTime() - new Date(`01 ${b}`).getTime());
            nextMissing.push({
              employeeId,
              employmentId: firstEmploymentDocId,
              employeeName: empName,
              months: monthLabels,
            });
          }
        }

        setMissingSalaryDetails(nextMissing);
        if (nextMissing.length > 0) {
          setMissingSalaryPopupOpen(true);
        }
      } catch (err) {
        console.error('Failed to check missing salary for Form 16:', err);
      } finally {
        setIsCheckingMissingSalary(false);
      }
    };

    checkMissingForFY();
  }, [isForm16, selectedEmployees, financialYearStart]);

  const placeOptions = Array.from(
    new Set(["Pune", "Mumbai", employment?.location].filter(Boolean))
  );

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-lg mb-8">
        <TableHeader
          title={isForm16 ? "Form 16" : "Offer Letter"}
          backButton={{
            href: isEmployeeUser ? '/employee/documents' : '/dashboard/documents',
            label: 'Back',
          }}
          searchValue=""
          onSearchChange={() => {}}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-8 pt-8 mb-0"
          actionButtons={[
            {
              label: isCheckingMissingSalary ? 'Checking...' : 'Generate',
              icon: <FiDownload size={18} />,
              variant: 'success',
              disabled: !canGenerate,
              onClick: () => {
                if (isForm16) {
                  generateForm16Excel();
                  return;
                } else {
                  if (!employee) return toast.error('Employee is required');
                }
                setShowPDF(true);
                setPdfKey((k) => k + 1);
              },
            },
          ]}
        />
<div className="-mx-8 border-t border-gray-200 my-4"></div>
        <div className="px-8 pb-4 mt-6">
          <div>
          
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"> */}
              {/* <span className="w-1 h-6 bg-blue-600 rounded"></span> */}
            {/* </h2> */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

{(!isEmployeeUser || isForm16) && (
<div>
  <label className="block text-sm font-medium text-slate-800 mb-1">
    {isForm16 ? 'Employees' : 'Employee'} <span className="text-red-500">*</span>
    {isForm16 && (
      <span className="ml-2 text-xs font-normal text-gray-500">(multi-select)</span>
    )}
  </label>

  <Combobox
  multiple={isForm16}
  value={isForm16 ? selectedEmployees : employee}
  by="id"
  onChange={(next) => {
    if (isForm16) {
      const nextList = Array.isArray(next) ? next.filter(Boolean) : [];
      setSelectedEmployees(nextList);
      const active = nextList.length ? nextList[nextList.length - 1] : null;
      const activeEmployment = employments[active?.id] || null;
      setEmployee(active);
      setEmployment(activeEmployment);
      setSearchTerm('');
      setDesignationOverride(activeEmployment?.jobTitle || activeEmployment?.designation || '');
      setEmployeeSignPlace(activeEmployment?.location || '');
      const joiningDateForDoc = normalizeDateForInput(
        activeEmployment?.joiningDate || activeEmployment?.startDate || ''
      );
      setDocumentGenerateDate(joiningDateForDoc || new Date().toISOString().slice(0, 10));
      setEffectiveDate(joiningDateForDoc || '');
      // For multi-select UX, keep field focused so next selection is immediate.
      setTimeout(() => {
        employeePickerInputRef.current?.focus?.();
      }, 0);
      return;
    }
    const emp = next || null;
    setEmployee(emp);
    setSelectedEmployees(emp ? [emp] : []);
    const activeEmployment = employments[emp?.id] || null;
    setEmployment(activeEmployment);
    setSearchTerm('');
    setDesignationOverride(activeEmployment?.jobTitle || activeEmployment?.designation || '');
    setEmployeeSignPlace(activeEmployment?.location || '');
    const joiningDateForDoc = normalizeDateForInput(
      activeEmployment?.joiningDate || activeEmployment?.startDate || ''
    );
    setDocumentGenerateDate(joiningDateForDoc || new Date().toISOString().slice(0, 10));
    setEffectiveDate(joiningDateForDoc || '');
  }}
>
  {({ open }) => {
    const selectedNames = isForm16
      ? (Array.isArray(selectedEmployees) ? selectedEmployees : [])
          .map((e) => e?.name)
          .filter(Boolean)
          .join(', ')
      : (employee?.name || '');

    return (
      <div className="relative">
        <div className="relative">
          <Combobox.Input
            ref={employeePickerInputRef}
            className="w-full p-2.5 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder={isForm16 ? "Select employees..." : "Select employee..."}
            value={open ? searchTerm : selectedNames}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => {
              setSearchTerm('');
            }}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Combobox.Button
              type="button"
              className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Toggle employee dropdown"
              title="Toggle"
            >
              <FiChevronDown className="w-4 h-4" />
            </Combobox.Button>
          </div>
        </div>
    {((isForm16 ? selectedEmployees?.length > 0 : Boolean(employee)) || searchTerm) && (
      <button
        type="button"
        onClick={() => {
          setEmployee(null);
          setSelectedEmployees([]);
          setEmployment(null);
          setSearchTerm('');
          setShowPDF(false);
          setDesignationOverride('');
          setEmployeeSignPlace('');
          setDocumentGenerateDate(new Date().toISOString().slice(0, 10));
          setEffectiveDate('');
        }}
        className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        aria-label="Clear employee selection"
        title="Clear"
      >
        <FiX className="w-4 h-4" />
      </button>
    )}

    <Combobox.Options className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
      {candidates
        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(emp => (
          <Combobox.Option
            key={emp.id}
            value={emp}
            className={({ focus, selected }) =>
              `cursor-pointer px-3 py-2 flex items-center justify-between gap-2 ${
                focus ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
              } ${isForm16 && selected && !focus ? 'bg-blue-50' : ''}`
            }
          >
            {({ selected }) => (
              <>
                <span className="flex-1 truncate">{emp.name}</span>
                {isForm16 && selected && (
                  <span className={`shrink-0 text-xs font-semibold ${selected ? 'text-blue-700' : ''}`}>✓</span>
                )}
              </>
            )}
          </Combobox.Option>
        ))}

      {candidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
        <div className="px-3 py-2 text-gray-500 italic">
          No results found
        </div>
      )}
    </Combobox.Options>
      </div>
    );
  }}
</Combobox>
</div>
)}

              {isForm16 && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={financialYearStart}
                    onChange={(e) => setFinancialYearStart(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {financialYearOptions.map((fy) => (
                      <option key={fy.value} value={fy.value}>
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isForm16 && <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  value={designationOverride}
                  onChange={(e) => setDesignationOverride(e.target.value)}
                  placeholder="Enter designation"
                />
              </div>}

              {!isForm16 && <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Document Generate Date
                </label>
                <DateDropdown value={documentGenerateDate} onChange={setDocumentGenerateDate} />
                <button
                  type="button"
                  onClick={() => {
                    const joiningDateForDoc = normalizeDateForInput(
                      employment?.joiningDate || employment?.startDate || ''
                    );
                    if (!joiningDateForDoc) {
                      toast.error('Joining date is not available for selected employee');
                      return;
                    }
                    setDocumentGenerateDate(joiningDateForDoc);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Joining Date
                </button>
              </div>}

              {!isForm16 && <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Effective date
                </label>
                <DateDropdown value={effectiveDate} onChange={setEffectiveDate} />
                <button
                  type="button"
                  onClick={() => {
                    const joiningDateForDoc = normalizeDateForInput(
                      employment?.joiningDate || employment?.startDate || ''
                    );
                    if (!joiningDateForDoc) {
                      toast.error('Joining date is not available for selected employee');
                      return;
                    }
                    setEffectiveDate(joiningDateForDoc);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Same as joining date
                </button>
                {/* <p className="mt-1 text-xs text-slate-500">
                  In the PDF, the joining date is a hyperlink (opens Google Calendar with that date).
                </p> */}
              </div>}

              {!isForm16 && <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Place
                </label>
                <select
                  value={employeeSignPlace}
                  onChange={(e) => setEmployeeSignPlace(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Place</option>
                  {placeOptions
                    .filter(Boolean)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>}

              {!isForm16 && <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  PF
                </label>
                <div className="w-full p-2.5 border border-gray-300 rounded-md bg-white flex items-center gap-2">
                  <input
                    id="enable-pf"
                    type="checkbox"
                    checked={enablePF}
                    onChange={(e) => setEnablePF(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="enable-pf" className="text-sm text-gray-700">
                    Enable PF (12% of Basic)
                  </label>
                </div>
              </div>}

              <div></div>
            </div>
          </div>
          <div className="-mx-8 border-t border-gray-200 my-4"></div>
         

          <div className="px-0 pt-0 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FiX size={16} />
              Cancel
            </button>

            <button
              type="button"
              disabled={!canGenerate}
              onClick={() => {
                if (isForm16) {
                  generateForm16Excel();
                  return;
                } else {
                  if (!employee) return toast.error('Employee is required');
                }
                setShowPDF(true);
                setPdfKey(k => k + 1);
              }}
              className={`flex items-center px-6 py-2.5 rounded-md shadow hover:shadow-md transition ${
                canGenerate
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiDownload size={18} className="mr-2" />
              {isCheckingMissingSalary ? 'Checking...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      <MissingSalaryModal
        isOpen={Boolean(isForm16 && missingSalaryPopupOpen)}
        onClose={() => setMissingSalaryPopupOpen(false)}
        title="Missing Salaries"
        summary={`Missing salary found in FY ${financialYearStart}-${String(financialYearStart + 1).slice(-2)}. Please complete salaries before generating Form 16.`}
        rows={missingSalaryDetails.map((row) => ({
          id: String(row.employeeId),
          label: String(row.employeeName || 'Unknown'),
          value: Array.isArray(row.months) ? row.months.join(', ') : '',
          employmentHref: row.employmentId
            ? `/employments/${String(row.employmentId)}`
            : `/employments/add?employeeId=${String(row.employeeId)}`,
          salaryHref: `/salaries?employeeId=${String(row.employeeId)}`,
        }))}
        cancelText="Cancel"
        primaryAction={{
          label: 'Generate Missing Salary',
          onClick: () => {
            const employeeIds = (Array.isArray(missingSalaryDetails) ? missingSalaryDetails : [])
              .map((row) => String(row?.employeeId || '').trim())
              .filter(Boolean);
            if (!employeeIds.length) {
              window.location.href = '/salaries';
              return;
            }
            const params = new URLSearchParams();
            params.set('autoGenerateMissing', '1');
            params.set('employeeIds', employeeIds.join(','));
            params.set('fyStart', String(financialYearStart));
            params.set('aiMode', '1');
            window.location.href = `/salaries?${params.toString()}`;
          },
          className: 'px-4 py-2 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50',
        }}
      />

      {showPDF && employee && employment && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <div className="flex items-center gap-2">
              <PDFDownloadLink
                key={Date.now()}
                document={
                  <OfferLetterPDF
                    employee={employee}
                    employment={employment}
                    enablePF={enablePF}
                    designationOverride={designationOverride}
                    documentGenerateDate={documentGenerateDate}
                    effectiveDate={effectiveDate}
                    employeeSignPlace={employeeSignPlace}
                  />
                }
                fileName={`OfferLetter_${employee.name}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiDownload size={18} className="shrink-0" aria-hidden />
                Download PDF
              </PDFDownloadLink>
            </div>
          </div>

          <div className="border rounded-lg" style={{ height: '80vh' }}>
            <PDFViewer
              key={Date.now()}
              width="100%"
              height="100%"
            >
              <OfferLetterPDF
                employee={employee}
                employment={employment}
                enablePF={enablePF}
                designationOverride={designationOverride}
                documentGenerateDate={documentGenerateDate}
                effectiveDate={effectiveDate}
                employeeSignPlace={employeeSignPlace}
              />
            </PDFViewer>
            <div className="-mx-4 sm:-mx-6 md:-mx-8 border-t border-gray-200 my-4"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferLetterV2;
