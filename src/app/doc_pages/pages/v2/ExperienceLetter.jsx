"use client";

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import TableHeader from '@/components/ui/TableHeader';

import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  Image
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import { createAdysunDocx } from '@/utils/docxAdysun';

import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { Combobox } from '@headlessui/react';

// ⬇️ GLOBAL HEADER IMPORT
import GlobalPDFHeader from '@/components/components/docComponents/docHeader.jsx';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';

/* ---------------- COMPANY DATA ---------------- */
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
    <View
      style={{
        position: 'absolute',
        top: '35%',
        left: '20%',
        opacity: 0.08,
        transform: 'rotate(-15deg)'
      }}
    >
      <Image src={logoSrc} style={{ width: 350, height: 350 }} />
    </View>
  );
};
const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (e) {
    return d;
  }
};

/* ---------------- DOCX BUILDER ---------------- */
async function buildExperienceLetterDocx(employee, employment, employeeSignDate, employeeSignPlace, todaysDate) {
  const employeeName = employee?.name || "";
  const designation = employment?.jobTitle || "";
  const joiningDate = employment?.joiningDate || "";
  const relievingDate = employment?.lastWorkingDate || "";
  const shortName = employeeName.split(" ")[0] || employeeName;
  const children = [
    new Paragraph({ children: [new TextRun({ text: 'ADYSUN VENTURES PVT. LTD.', bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: formatDate(todaysDate) })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "EXPERIENCE LETTER", bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCase(shortName)},` })] }),
    new Paragraph({
      children: [
        new TextRun({ text: "This is to certify that " }),
        new TextRun({ text: toTitleCase(employeeName), bold: true }),
        new TextRun({ text: " was employed with " }),
        new TextRun({ text: COMPANY_DATA.name, bold: true }),
        new TextRun({ text: " as a " }),
        new TextRun({ text: designation, bold: true }),
        new TextRun({ text: ` from ${formatDate(joiningDate)} to ${formatDate(relievingDate) || formatDate(employeeSignDate)}.` }),
      ],
    }),
    new Paragraph({ text: `During the tenure, ${shortName} performed duties with dedication and professionalism.` }),
    new Paragraph({ text: `Based on overall performance, we found ${shortName} to be sincere, reliable, and responsible.` }),
    new Paragraph({ text: `We wish ${shortName} all the best for future career opportunities.` }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Place: " }), new TextRun({ text: employeeSignPlace || "" })] }),
    new Paragraph({ children: [new TextRun({ text: "Date: " }), new TextRun({ text: formatDate(employeeSignDate) })] }),
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.hrName, bold: true })] }),
    new Paragraph({ text: COMPANY_DATA.hrDesignation }),
    new Paragraph({ text: COMPANY_DATA.hrEmail }),
  ];
  return await createAdysunDocx({ children });
}

/* ---------------- PDF COMPONENT ---------------- */
const ExperienceLetterPDF = ({ employee, employment, employeeSignDate, employeeSignPlace,todaysDate }) => {
  const employeeName = employee?.name || "";
  const designation = employment?.jobTitle || "";
  const joiningDate = employment?.joiningDate || "";
  const relievingDate = employment?.lastWorkingDate || "";
  const shortName = employeeName.split(" ")[0];
  const date = Date.now();
  
  return (
    <Document>
      <Page size="A4" style={{ padding: 35, fontSize: 12, lineHeight: 1.45, position: 'relative' }}>

        {/* WATERMARK */}
        <Watermark logoSrc={COMPANY_DATA.logo} />

        {/* 🔹 GLOBAL HEADER */}
        <GlobalPDFHeader />
        <View style={{ borderBottom: '1px solid #000', marginBottom: 16 }} />

        {/* DATE + ADDRESS */}
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Date:</Text> {formatDate(todaysDate)}
        </Text>

        {/* <Text style={{ marginBottom: 14 }}>
          To,{'\n'}
          <Text style={{ fontWeight: 'bold' }}>{toTitleCase(employeeName)}</Text>{'\n'}
        </Text> */}

        {/* TITLE */}
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 16, textAlign: "center", textDecoration: "underline" }}>
          EXPERIENCE LETTER
        </Text>

        {/* BODY */}
        <Text style={{ marginBottom: 10 }}>
          Dear {toTitleCase(shortName)},
        </Text>

        <Text style={{ marginBottom: 10 }}>
          This is to certify that <Text style={{ fontWeight: 'bold' }}>{toTitleCase(employeeName)}</Text> was employed with <Text style={{ fontWeight: 'bold' }}>{COMPANY_DATA.name}</Text> as a <Text style={{ fontWeight: 'bold' }}>{designation}</Text> from <Text style={{ fontWeight: 'bold' }}>{formatDate(joiningDate)}</Text> to <Text style={{ fontWeight: 'bold' }}>{formatDate(relievingDate) || formatDate(employeeSignDate)}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          During the tenure, {shortName} performed duties with dedication and professionalism.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Based on overall performance, we found {shortName} to be sincere, reliable, and responsible.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We wish {shortName} all the best for future career opportunities.
        </Text>

        {/* FOOTER SIGN */}
        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text>Place: {employeeSignPlace}</Text>
            <Text>Date: {formatDate(employeeSignDate)}</Text>
          </View>

          <View style={{ width: '45%', textAlign: 'right' }}>
            {COMPANY_DATA.signature && (
              <Image src={COMPANY_DATA.signature} style={{ width: 120, height: 55, marginBottom: 4, alignSelf: 'flex-end' }} />
            )}
            <Text style={{ fontWeight: 'bold' }}>{COMPANY_DATA.hrName}</Text>
            <Text>{COMPANY_DATA.hrDesignation}</Text>
            <Text>{COMPANY_DATA.hrEmail}</Text>
          </View>
        </View>
        <GlobalPDFFooter/>
      </Page>
    </Document>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
function expLetterV2() {
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

  const [employeeSignDate, setEmployeeSignDate] = useState('');
  const [employeeSignPlace, setEmployeeSignPlace] = useState('');
  const[todaysDate,setTodaysDate]=useState('');
const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const qs = await getDocs(collection(db, "employees"));
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
  };

  const canGenerate = Boolean(
    employee &&
    employeeSignDate &&
    employeeSignPlace
  );

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <TableHeader
          title="Experience Letter"
          backButton={{ href: '/dashboard/documents', label: 'Back' }}
          searchValue=""
          onSearchChange={() => {}}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          actionButtons={[
            {
              label: "Generate",
              icon: <FiDownload size={18} />,
              variant: "success",
              disabled: !canGenerate,
              onClick: () => {
                if (!employee) return toast.error('Select employee');
                if (!employeeSignDate) return toast.error('Select sign date');
                if (!employeeSignPlace) return toast.error('Enter sign place');
                setShowPDF(true);
              },
            },
          ]}
        />
<div className="w-full border-t border-gray-200 my-4"></div>
        <div className="p-6 space-y-6">

          {/* CARD */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Experience Letter Details
            </h2> */}

            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded-md"
                    value={todaysDate}
                    onChange={e => setTodaysDate(e.target.value)}
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Sign Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded-md"
                    value={employeeSignDate}
                    onChange={e => setEmployeeSignDate(e.target.value)}
                  />
                </div>
                
                <div>
  <label className="block text-sm font-medium mb-1">
    <span className="text-red-500">*</span> Place
  </label>
  <select
    className="w-full p-3 border rounded-md"
    value={employeeSignPlace}
    onChange={(e) => setEmployeeSignPlace(e.target.value)}
  >
    <option value="">Select Place</option>
    <option value="Pune">Pune</option>
    <option value="Mumbai">Mumbai</option>
  </select>
</div>

                

              </div>
            </div>
          </div>
          <div className="-mx-6 border-t border-gray-200 my-4"></div>
          {/* BUTTONS */}
          <div className="px-0 pt-4 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canGenerate}
              onClick={() => {
                if (!employee) return toast.error('Select employee');
                if (!employeeSignDate) return toast.error('Select sign date');
                if (!employeeSignPlace) return toast.error('Enter sign place');
                setShowPDF(true);
              }}
              className={`flex items-center px-6 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                canGenerate
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiDownload size={18} className="mr-2" />
              <span>Generate</span>
            </button>
          </div>

        </div>
      </div>

      {/* PDF Preview */}
      {showPDF && employee && employment && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <div className="flex items-center gap-2">
              <PDFDownloadLink
                document={
                  <ExperienceLetterPDF
                    employee={employee}
                    employment={employment}
                    employeeSignDate={employeeSignDate}
                    employeeSignPlace={employeeSignPlace}
                    todaysDate={todaysDate}
                  />
                }
                fileName={`Experience_${employee.name}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                key={Date.now()}
              >
                Download PDF
              </PDFDownloadLink>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const doc = await buildExperienceLetterDocx(
                      employee,
                      employment,
                      employeeSignDate,
                      employeeSignPlace,
                      todaysDate
                    );
                    const blob = await Packer.toBlob(doc);
                    saveAs(blob, `ExperienceLetter_${(employee.name || "").replace(/\s+/g, "_")}.docx`);
                    toast.success("DOCX downloaded");
                  } catch (err) {
                    console.error("DOCX download error:", err);
                    toast.error("Failed to generate DOCX");
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Download DOCX
              </button>
            </div>
          </div>

          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              <ExperienceLetterPDF
                employee={employee}
                employment={employment}
                employeeSignDate={employeeSignDate}
                employeeSignPlace={employeeSignPlace}
                todaysDate={todaysDate}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default expLetterV2;
