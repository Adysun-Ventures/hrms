'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import TableHeader from '@/components/ui/TableHeader';
import { Combobox } from '@headlessui/react'
import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  Image
} from '@react-pdf/renderer';

import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { offerLetterStyles } from '@/components/pdf/PDFStyles';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';

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
    <View style={[offerLetterStyles.tableCell, { flex: 3 }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellLast, { flex: 3 }]}>
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
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
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
    <View style={[offerLetterStyles.tableCellBold, { flex: 3 }]}>
      <Text>{m.toLocaleString('en-IN')}</Text>
    </View>
    <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3 }]}>
      <Text>{a.toLocaleString('en-IN')}</Text>
    </View>
  </View>
);

/* ---------------- PDF DOCUMENT COMPONENT ---------------- */
const OfferLetterPDF = ({ employee, employment, enablePF }) => {
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

  const designation = employment?.jobTitle || employment?.designation || '';
  const joiningDate = employment?.joiningDate || employment?.startDate || '';
  const annualCTC = Number(employment?.salary || 0);
  const letterDate = new Date().toLocaleDateString('en-IN');

  /* Salary Computation */
  const basic = Math.round(annualCTC * 0.5);
  const hra = Math.round(basic * 0.5);
  const medical = 13200;
  const convey = 15000;
  const other = 3000;
  const sumFixed = basic + hra + medical + convey + other;
  const epi = Math.max(annualCTC - sumFixed, 0);
  const gross = sumFixed + epi;

  const pt = 2500;
  const pf = enablePF ? Math.round(basic * 0.12) : 0;
  const net = gross - (pt + pf);
  const monthly = n => Math.round(n / 12);

 return (
  <Document>

    {/* ---------------- PAGE 1 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        fontFamily: "Helvetica",
        fontSize: 12,
        lineHeight: 1.45
      }}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader fontFamily="Helvetica" />

      <View style={{ borderBottom: "1px solid #000", marginBottom: 14 }} />

      <Text style={{ marginBottom: 14 }}>
        <Text style={{ fontWeight: "bold" }}>Date: </Text>{letterDate}
      </Text>

      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontWeight: "bold" }}>{name}</Text>
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
        Dear <Text style={{ fontWeight: "bold" }}>{firstName}</Text>,
      </Text>

      <Text style={{ marginBottom: 12 }}>
        We are pleased to extend an employment opportunity with{" "}
        <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. This appointment
        signifies the beginning of a professional engagement rooted in{" "}
        <Text style={{ fontWeight: "bold" }}>values, responsibility,
        and mutual growth</Text>. We take pride in fostering an environment that
        encourages <Text style={{ fontWeight: "bold" }}>discipline, structured learning,
        accountability</Text> and a{" "}
        <Text style={{ fontWeight: "bold" }}>results-driven work ethic</Text>.
      </Text>

      <Text style={{ marginBottom: 12 }}>
        You are hereby appointed to the position of{" "}
        <Text style={{ fontWeight: "bold" }}>{designation}</Text> effective from{" "}
        <Text style={{ fontWeight: "bold" }}>{joiningDate}</Text>. You are expected to
        demonstrate <Text style={{ fontWeight: "bold" }}>professional conduct,
        punctuality</Text> and adhere to organizational policies at all times. This
        appointment will be considered <Text style={{ fontWeight: "bold" }}>null and
        void</Text> should you fail to commence duties on or before the specified
        joining date.
      </Text>

      <Text>
        At <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>, we believe that{" "}
        <Text style={{ fontWeight: "bold" }}>structured operations, ethical practices,
        and transparent communication</Text> contribute to a high-performance culture.
        Your role will require alignment with organizational objectives and a
        commitment to producing measurable outcomes.
      </Text>
    </Page>

    {/* ---------------- PAGE 2 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        fontFamily: "Helvetica",
        fontSize: 12,
        lineHeight: 1.45
      }}
      wrap={false}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />

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
    </Page>

    {/* ---------------- PAGE 3 ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        fontFamily: "Helvetica",
        fontSize: 12
      }}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />

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
    </Page>

    {/* ---------------- PAGE 4 (CTC PAGE — UNTOUCHED LOGIC) ---------------- */}
    <Page
      size="A4"
      style={{
        ...offerLetterStyles.page,
        fontFamily: "Helvetica",
        fontSize: 11
      }}
      wrap={false}
    >
      <Watermark logoSrc={COMPANY_DATA.logo} />

      <Text style={[offerLetterStyles.sectionHeading, { fontSize: 14, fontWeight: "bold" }]}>
        CTC Breakdown (Annual & Monthly)
      </Text>

      <View style={{ marginTop: 10 }}>
        
        {/* TABLE HEADER */}
        <View style={offerLetterStyles.tableRow}>
          <View style={[offerLetterStyles.tableCellBold, { flex: 4, backgroundColor: "#e0e0e0" }]}>
            <Text>Component</Text>
          </View>
          <View style={[offerLetterStyles.tableCellBold, { flex: 3, backgroundColor: "#e0e0e0" }]}>
            <Text>Monthly (₹)</Text>
          </View>
          <View style={[offerLetterStyles.tableCellBoldLast, { flex: 3, backgroundColor: "#e0e0e0" }]}>
            <Text>Annual (₹)</Text>
          </View>
        </View>

        {/* ORIGINAL ROW LOGIC UNTOUCHED */}
        <Row label="Basic" m={monthly(basic)} a={basic} />
        <Row label="HRA" m={monthly(hra)} a={hra} />
        <Row label="Medical Allowance" m={monthly(medical)} a={medical} />
        <Row label="Conveyance" m={monthly(convey)} a={convey} />
        <Row label="Other Allowances" m={monthly(other)} a={other} />
        <Row label="EPI Allowance" m={monthly(epi)} a={epi} />
        <RowBold label="Gross Salary (A)" m={monthly(gross)} a={gross} />
        <Row label="Professional Tax (PT)" m={monthly(pt)} a={pt} />

        {enablePF && <Row label="Employee PF (12% Basic)" m={monthly(pf)} a={pf} />}

        <RowBoldGray label="Net Salary" m={monthly(net)} a={net} />
        <RowBoldGray label="Total CTC" m={monthly(annualCTC)} a={annualCTC} />

        <Text style={{ marginTop: 8, fontSize: 11 }}>
          {enablePF ? "PF deduction applied." : "No PF deduction applied."}
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
            Candidate Name: <Text style={{ fontWeight: "bold" }}>{name}</Text>
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 12 }}>
            Signature: ________________________________
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 12 }}>
            Date: ________________________________
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

/* ---------------- MAIN COMPONENT ---------------- */
function OfferLetterV2() {
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [enablePF, setEnablePF] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  


  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [pdfKey, setPdfKey] = useState(0);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const qs = await getDocs(collection(db, 'employees'));
    const list = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCandidates(list);

    const map = {};
    for (const emp of list) {
      const qSnap = await getDocs(query(collection(db, 'employments'), where('employeeId', '==', emp.id)));
      if (!qSnap.empty) map[emp.id] = qSnap.docs[0].data();
    }
    setEmployments(map);
  };

  const handleSelect = e => {
    const id = e.target.value;
    setEmployee(candidates.find(x => x.id === id) || null);
    setEmployment(employments[id] || null);
    setPdfKey(k => k + 1);
  };

  useEffect(() => { setPdfKey(k => k + 1); }, [enablePF]);

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-lg mb-8">
        <TableHeader
          title="Generate Offer Letter"
          backButton={{ href: '/dashboard/documents', label: 'Back' }}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-8 pt-8 mb-0"
        />

        <div className="px-8 pb-8 mt-6">
          <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">

            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              Employee Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg">

<div>
  <label className="block text-sm font-medium text-slate-800 mb-1">
    Employee <span className="text-red-500">*</span>
  </label>

  <Combobox
  value={employee}
  onChange={(e) => {
    setEmployee(e || null);
    setEmployment(employments[e?.id] || null);
  }}
>
  <div className="relative">

    <Combobox.Input
      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      placeholder="Select or Search employee..."
      displayValue={(emp) => emp?.name ?? ""}
      onChange={(event) => setSearchTerm(event.target.value)}
    />

    <Combobox.Options className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
      {candidates
        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(emp => (
          <Combobox.Option
            key={emp.id}
            value={emp}
            className={({ active }) =>
              `cursor-pointer px-3 py-2 ${active ? 'bg-blue-600 text-white' : 'bg-white'}`
            }
          >
            {emp.name}
          </Combobox.Option>
        ))}

      {candidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
        <div className="px-3 py-2 text-gray-500 italic">
          No results found
        </div>
      )}
    </Combobox.Options>
  </div>
</Combobox>

</div>


              <div className="flex items-center mt-8 gap-2">
                <input
                  type="checkbox"
                  checked={enablePF}
                  onChange={e => setEnablePF(e.target.checked)}
                />
                <label className="text-sm">Enable PF (12% of Basic)</label>
              </div>

              <div></div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                if (!employee) return toast.error('Employee is required');
                setShowPDF(true);
                setPdfKey(k => k + 1);
              }}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 shadow hover:shadow-md transition"
            >
              <FiDownload size={18} className="mr-2" />
              Generate Offer Letter
            </button>
          </div>
        </div>
      </div>

      {showPDF && employee && employment && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <PDFDownloadLink
              key={Date.now()}
              document={
                <OfferLetterPDF
                  employee={employee}
                  employment={employment}
                  enablePF={enablePF}
                />
              }
              fileName={`OfferLetter_${employee.name}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </PDFDownloadLink>
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
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferLetterV2;
