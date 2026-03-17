'use client';

import React, { useEffect, useState } from 'react';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { getEmployee } from '@/utils/documentFunctions';
import toast, { Toaster } from 'react-hot-toast';
import { FiDownload, FiFileText } from 'react-icons/fi';

import {
  Document,
  Page,
  Text,
  View,
  Image,
  PDFViewer,
  PDFDownloadLink
} from '@react-pdf/renderer';

import { offerLetterStyles } from '@/components/pdf/PDFStyles';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';
import  {Style } from '@react-pdf/types';
import { formatDateToDayMonYear } from '@/utils/documentUtils';

/* ===================== TYPES ===================== */
interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  currentAddress?: string;
  permanentAddress?: string;
}

interface Employment {
  joiningDate?: string;
  jobTitle?: string;
  designation?: string;
  department?: string;
  salary?: number;
}

interface OfferLetterData {
  id: string;
  employeeId: string;
  salary: number;
  joiningDate: string;
  name: string;
  address: string;
}

/* ===================== CONSTANTS ===================== */
const COMPANY_DATA = {
  name: 'ADYSUN VENTURES PVT. LTD.',
  logo: '/assets/adysunventures_logo.png',
  hrName: 'Prachi Jadhav',
  hrDesignation: 'Head - HR Department',
  hrEmail: 'hr@adysunventures.com',
  signature: '/assets/hr-sign.png'
};
const balancedStyles: { [key: string]: Style } = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold', // "bold" | "normal"
    marginTop: 8,
    marginBottom: 4,
    textDecoration: 'underline', // ✅ correctly typed
  },
  bulletList: {
    marginLeft: 22,
    marginBottom: 8,
  } as unknown as Style, // for View-like objects
  bullet: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 2,
  }
};

const compactStyles: { [key: string]: Style } = {
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
  } as unknown as Style,
  bullet: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 2,
  }
};

/* ===================== HELPERS ===================== */
const Watermark = ({ logoSrc }: { logoSrc?: string }) => {
  if (!logoSrc) return null;
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};

const formatDate = (date?: string | number | Date): string => {
  const safeDate: string | Date | null =
    typeof date === "number" ? new Date(date) : (date ?? null);
  const formatted = formatDateToDayMonYear(safeDate);
  return formatted === "-" ? "" : formatted;
};

const monthly = (n: number): number => Math.round(n / 12);

const toTitleCase = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/* ===================== TABLE ROWS ===================== */
const Row = ({ label, m, a }: { label: string; m: number; a: number }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCell, { flex: 4 }]}><Text>{label}</Text></View>
    <View style={[offerLetterStyles.tableCell, { flex: 3 }]}><Text>{m.toLocaleString('en-IN')}</Text></View>
    <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}><Text>{a.toLocaleString('en-IN')}</Text></View>
  </View>
);

const RowBold = ({ label, m, a }: { label: string; m: number; a: number }) => (
  <View style={offerLetterStyles.tableRow}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}><Text>{label}</Text></View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}><Text>{m.toLocaleString('en-IN')}</Text></View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}><Text>{a.toLocaleString('en-IN')}</Text></View>
  </View>
);

const RowBoldGray = ({ label, m, a }: { label: string; m: number; a: number }) => (
  <View style={[offerLetterStyles.tableRow, { backgroundColor: '#e0e0e0' }]}>
    <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}><Text>{label}</Text></View>
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}><Text>{m.toLocaleString('en-IN')}</Text></View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}><Text>{a.toLocaleString('en-IN')}</Text></View>
  </View>
);

/* ===================== PDF ===================== */
const OfferLetterPDF = ({
  employee,
  employment,
  enablePF
}: {
  employee: Employee;
  employment: Employment;
  enablePF: boolean;
}) => {
  if (!employee || !employment) {
    return (
      <Document>
        <Page><Text>No Data Available</Text></Page>
      </Document>
    );
  }

  const name =
    employee.name ||
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  const rawAddress =
    employee.currentAddress ||
    employee.permanentAddress ||
    '';

  const shortAddress = rawAddress
    .split(/[,;\n]+/)
    .map(v => v.trim())
    .filter(Boolean)
    .slice(-2);

  const designation =
    employment.jobTitle || employment.designation || '';

  const joiningDate = employment.joiningDate || '';
  const annualCTC = Number(employment.salary || 0);

  const letterDate = formatDate(new Date());

  /* ===== Salary Computation (UNCHANGED) ===== */
  const basic = Math.round(annualCTC * 0.5);
  const hra = Math.round(basic * 0.5);
  const medical = 13200;
  const convey = 15000;
  const other = 3000;
  const fixed = basic + hra + medical + convey + other;
  const epi = Math.max(annualCTC - fixed, 0);
  const gross = fixed + epi;

  const pt = 2500;
  const pf = enablePF ? Math.round(basic * 0.12) : 0;
  const net = gross - (pt + pf);

  return (
  <Document>

    {/* ================= PAGE 1 ================= */}
    <Page size="A4" style={{ ...offerLetterStyles.page, fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.6 }}>
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 18 }} />

      <Text style={{ marginBottom: 18 }}>
        <Text style={{ fontWeight: "bold" }}>Date: </Text>
        <Text style={{ fontWeight: "bold" }}>{letterDate}</Text>
      </Text>

      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontWeight: "bold", fontSize: 13 }}>
          {toTitleCase(name)}
        </Text>
        {shortAddress.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          textDecoration: "underline",
          textAlign: "center",
          marginBottom: 20
        }}
      >
        LETTER OF APPOINTMENT
      </Text>

      <Text style={{ marginBottom: 14 }}>
        Dear <Text style={{ fontWeight: "bold" }}>{toTitleCase(name)}</Text>,
      </Text>

      <Text style={{ marginBottom: 14 }}>
        We are pleased to extend an employment opportunity with{" "}
        <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. This appointment
        signifies the beginning of a professional engagement rooted in values,
        responsibility, and mutual growth. We take pride in fostering an environment
        that encourages discipline, structured learning, accountability, and a
        results-driven work ethic.
      </Text>

      <Text style={{ marginBottom: 14 }}>
        You are hereby appointed to the position of{" "}
        <Text style={{ fontWeight: "bold" }}>{designation}</Text> effective from{" "}
        <Text style={{ fontWeight: "bold" }}>{formatDate(joiningDate)}</Text>.
        You are expected to demonstrate professional conduct, punctuality,
        and adhere to organizational policies at all times.
      </Text>

      <Text style={{ marginBottom: 14 }}>
        This appointment shall be considered null and void should you fail to
        commence duties on or before the specified joining date.
      </Text>

      <Text>
        At <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>, we believe that
        structured operations, ethical practices, and transparent communication
        contribute to a high-performance culture. Your role will require alignment
        with organizational objectives and commitment to measurable outcomes.
      </Text>
    </Page>

    {/* ================= PAGE 2 ================= */}
    <Page size="A4" style={{ ...offerLetterStyles.page, fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.6 }}>
      <Watermark logoSrc={COMPANY_DATA.logo} />

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>
        Role & Performance Expectations
      </Text>

      <Text style={{ marginBottom: 14 }}>
        Your role will require consistent delivery of assigned responsibilities
        within stipulated timelines, collaboration with internal teams,
        adaptability to operational requirements, and maintenance of
        professional conduct within the workplace.
      </Text>

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Company Conduct & Compliance
      </Text>

      <Text style={{ marginBottom: 14 }}>
        All employees are expected to comply with corporate policies,
        regulatory guidelines, and statutory norms. Violation of policies,
        breach of confidentiality, or misconduct may result in disciplinary
        action or termination.
      </Text>

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Confidentiality & Data Protection
      </Text>

      <Text style={{ marginBottom: 8 }}>• All company data must be safeguarded.</Text>
      <Text style={{ marginBottom: 8 }}>• Confidential information shall not be disclosed.</Text>
      <Text style={{ marginBottom: 14 }}>• Records remain property of the organization.</Text>

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Code of Conduct
      </Text>

      <Text style={{ marginBottom: 8 }}>• Maintain respectful communication.</Text>
      <Text style={{ marginBottom: 8 }}>• Adhere to attendance policies.</Text>
      <Text>• Use company resources responsibly.</Text>
    </Page>

    {/* ================= PAGE 3 ================= */}
    <Page size="A4" style={{ ...offerLetterStyles.page, fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.6 }}>
      <Watermark logoSrc={COMPANY_DATA.logo} />

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>
        General Terms
      </Text>

      <Text style={{ marginBottom: 8 }}>• Official communication shall occur via registered email.</Text>
      <Text style={{ marginBottom: 8 }}>• Leave policy governed under HR rules.</Text>
      <Text style={{ marginBottom: 8 }}>• Gross misconduct may lead to termination.</Text>
      <Text style={{ marginBottom: 14 }}>• Company policies may be revised based on operational requirements.</Text>

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>
        Probation & Confirmation
      </Text>

      <Text style={{ marginBottom: 8 }}>• Initial probation period: 3 months.</Text>
      <Text style={{ marginBottom: 8 }}>• Confirmation subject to performance review.</Text>
      <Text style={{ marginBottom: 14 }}>• Extension or termination possible if performance is unsatisfactory.</Text>

      <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 12 }}>
        Jurisdiction
      </Text>

      <Text style={{ marginBottom: 8 }}>• Governed under laws applicable within India.</Text>
      <Text>• Disputes shall fall under competent court jurisdiction.</Text>
    </Page>

    {/* ================= PAGE 4 — CTC BREAKDOWN ================= */}
    <Page size="A4" style={{ ...offerLetterStyles.page, fontFamily: "Helvetica", fontSize: 11 }}>
      <Watermark logoSrc={COMPANY_DATA.logo} />

      <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 14 }}>
        CTC Breakdown (Annual & Monthly)
      </Text>

      {/* Table Header */}
      <View style={offerLetterStyles.tableRow}>
        <View style={[offerLetterStyles.tableCellBold, { flex: 4 }]}>
          <Text>Component</Text>
        </View>
        <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
          <Text>Monthly (₹)</Text>
        </View>
        <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
          <Text>Annual (₹)</Text>
        </View>
      </View>

      {/* Salary Rows */}
      <Row label="Basic" m={monthly(basic)} a={basic} />
      <Row label="HRA" m={monthly(hra)} a={hra} />
      <Row label="Medical Allowance" m={monthly(medical)} a={medical} />
      <Row label="Conveyance" m={monthly(convey)} a={convey} />
      <Row label="Other Allowances" m={monthly(other)} a={other} />
      <RowBold label="Gross Salary" m={monthly(gross)} a={gross} />
      <Row label="Professional Tax (PT)" m={monthly(pt)} a={pt} />
      {enablePF && <Row label="Employee PF (12% Basic)" m={monthly(pf)} a={pf} />}
      <RowBoldGray label="Net Salary" m={monthly(net)} a={net} />
      <RowBoldGray label="Total CTC" m={monthly(annualCTC)} a={annualCTC} />

      <View style={{ borderBottom: "1px solid #000", marginVertical: 16 }} />

      <Text style={{ fontSize: 13, fontWeight: "bold", marginBottom: 10 }}>
        Acknowledgement and Acceptance
      </Text>

      <Text style={{ marginBottom: 14 }}>
        I, <Text style={{ fontWeight: "bold" }}>{toTitleCase(name)}</Text>,
        hereby accept the offer of employment with{" "}
        <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>.
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Signature: ________________________________
      </Text>

      <Text style={{ marginBottom: 18 }}>
        Date: <Text style={{ fontWeight: "bold" }}>{letterDate}</Text>
      </Text>

      <View style={{ alignItems: "flex-end" }}>
        {COMPANY_DATA.signature && (
          <Image src={COMPANY_DATA.signature} style={{ width: 120, height: 60 }} />
        )}
        <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.hrName}</Text>
        <Text>{COMPANY_DATA.hrDesignation}</Text>
        <Text>{COMPANY_DATA.hrEmail}</Text>
      </View>

      <GlobalPDFFooter />
    </Page>

  </Document>
);

};


/* ===================== MAIN ===================== */
export default function EmployeeOfferLetterPage() {
  const { currentUserData } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employment, setEmployment] = useState<Employment | null>(null);
  const [enablePF, setEnablePF] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUserData?.id) return;
      try {
        const emp = await getEmployee(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);
        setEmployee(emp);
        setEmployment(empm?.[0]);
      } catch {
        toast.error('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserData]);
  console.log('Employee:', employee);

  if (loading) {
    return (
      <EmployeeLayout breadcrumbItems={[{ label: 'Offer Letter', isCurrent: true }]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </EmployeeLayout>
    );
  }

  // if (!showPDF) {
  //   return (
  //     <EmployeeLayout breadcrumbItems={[{ label: 'Offer Letter', isCurrent: true }]}>
  //       <Toaster />
  //       <div className="bg-white p-8 rounded shadow text-center">
  //         <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
  //         <button
  //           onClick={() => setShowPDF(true)}
  //           className="px-6 py-2 bg-blue-600 text-white rounded"
  //         >
  //           Generate Offer Letter
  //         </button>
  //       </div>
  //     </EmployeeLayout>
  //   );
  // }

 return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Offer Letter", isCurrent: true }
    ]}
  >
    <Toaster position="top-center" />

    {/* MAIN CARD */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex items-center">
        <div className="w-1/3 flex justify-start">
          {/* BACK BUTTON */}
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Offer Letter
          </h1>
        </div>

        <div className="w-1/3 flex justify-end">
          <PDFDownloadLink
            document={
              <OfferLetterPDF
                employee={employee!}
                employment={employment!}
                enablePF={enablePF}
              />
            }
            fileName="OfferLetter.pdf"
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <FiDownload className="mr-2" size={18} />
            Generate
          </PDFDownloadLink>
        </div>
      </div>

      {/* FORM SECTION (PF toggle like screenshot) */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label
              htmlFor="includePF"
              className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-gray-300 rounded-xl cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="includePF"
                checked={enablePF}
                onChange={(e) => setEnablePF(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">Include PF</span>
            </label>
          </div>
        </div>
      </div>

      {/* DOWNLOAD SECTION */}
      <div className="-mx-6 px-6 border-t border-gray-200 pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        <PDFDownloadLink
          document={
            <OfferLetterPDF
              employee={employee!}
              employment={employment!}
              enablePF={enablePF}
            />
          }
          fileName="OfferLetter.pdf"
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <FiDownload className="mr-2" size={18} />
          Generate
        </PDFDownloadLink>
      </div>
    </div>

    {/* PDF PREVIEW */}
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        PDF Preview
      </h3>

      <div className="border rounded-lg overflow-hidden" style={{ height: "80vh" }}>
        <PDFViewer width="100%" height="100%">
          <OfferLetterPDF
            employee={employee!}
            employment={employment!}
            enablePF={enablePF}
          />
        </PDFViewer>
      </div>
    </div>

  </EmployeeLayout>
);



}
