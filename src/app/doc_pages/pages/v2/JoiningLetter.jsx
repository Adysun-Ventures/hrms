"use client";

import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import TableHeader from "@/components/ui/TableHeader";

import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import {
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import { createAdysunDocx } from "@/utils/docxAdysun";

import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { Combobox } from "@headlessui/react";

/* ---------------- COMPANY DATA ---------------- */
const COMPANY_DATA = {
  name: "ADYSUN VENTURES PVT. LTD.",
  contact: "9579537523 | hr@adysunventures.com | AdysunVentures.com",
  address:
    "S no 47, Workplex, Pune-Satara Rd, Opp City Pride Theater, Near Bhapkar petrol pump, Pune, Maharashtra - 411009",
  hrName: "Prachi Jadhav",
  hrDesignation: "Head - HR Department",
  hrEmail: "hr@adysunventures.com",
  logo: "/assets/adysunventures_logo.png",
  signature: "/assets/hr-sign.png"
};

/* ---------------- UTIL ---------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);

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
const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Watermark = ({ logoSrc }) => (
  <View style={offerLetterStyles.watermark}>
    <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
  </View>
);

/* ---------------- DOCX BUILDER ---------------- */
async function buildJoiningLetterDocx(employee, designation, department, reportingManager, workLocation, joiningDate, annualCTC, probation, workingHours, signPlace) {
  const name = employee?.name || "";
  const shortName = name.split(" ")[0] || name;
  const issueDate = formatDate(todayISO());
  const formattedJoiningDate = formatDate(joiningDate);
  const formattedCTC = Number(annualCTC).toLocaleString("en-IN");
  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: issueDate })] }),
    new Paragraph({ children: [new TextRun({ text: toTitleCase(name), bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "JOINING LETTER", bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCase(shortName)},` })] }),
    new Paragraph({
      children: [
        new TextRun({ text: "We are pleased to confirm your joining with " }),
        new TextRun({ text: COMPANY_DATA.name, bold: true }),
        new TextRun({ text: ". You will be joining us as " }),
        new TextRun({ text: designation || "", bold: true }),
        ...(department ? [new TextRun({ text: ` in the ${department} department` })] : []),
        new TextRun({ text: ` effective from ${formattedJoiningDate}.` }),
      ],
    }),
    new Paragraph({ children: [new TextRun({ text: `Your place of posting shall be ${workLocation || ""} and you will be reporting to ${reportingManager || ""}.` })] }),
    new Paragraph({ children: [new TextRun({ text: "Your annual Cost to Company (CTC) will be " }), new TextRun({ text: formattedCTC, bold: true }), new TextRun({ text: "." })] }),
    new Paragraph({ children: [new TextRun({ text: `You will be on probation for a period of ${probation || ""}, during which your performance will be assessed.` })] }),
    new Paragraph({ children: [new TextRun({ text: `Your working hours will be ${workingHours || ""}, Monday to Friday.` })] }),
    new Paragraph({ text: "We warmly welcome you to our organization and look forward to your valuable contribution." }),
    new Paragraph({ text: "Kindly acknowledge and accept this letter." }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Place: " }), new TextRun({ text: signPlace || "" })] }),
    new Paragraph({ children: [new TextRun({ text: "Date: " }), new TextRun({ text: issueDate })] }),
    new Paragraph({ children: [new TextRun({ text: toTitleCase(name), bold: true })] }),
  ];
  return await createAdysunDocx({ children });
}

/* ---------------- PDF TEMPLATE ---------------- */

const JoiningLetterPDF = ({
  employee,
  designation,
  department,
  reportingManager,
  workLocation,
  joiningDate,
  annualCTC,
  probation,
  workingHours,
  signPlace
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const issueDate = formatDate(todayISO());
  const formattedJoiningDate = formatDate(joiningDate);
  const formattedCTC = Number(annualCTC).toLocaleString("en-IN");
  const rawAddress = employee?.currentAddress || employee?.permanentAddress || "";
  const fullAddress = rawAddress
    ? rawAddress.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean)
    : [];
  const shortAddress = fullAddress.slice(-2);

  return (
    <Document>
      <Page
        size="A4"
        style={{ padding: 35, fontSize: 12, lineHeight: 1.45, position: "relative" }}
      >
        <Watermark logoSrc={COMPANY_DATA.logo} />

        {/* HEADER */}
        <GlobalPDFHeader />
        

        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        {/* DATE + EMPLOYEE */}
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {issueDate}
        </Text>

        <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontWeight: "bold" }}></Text>
                  <Text style={{ fontWeight: "bold" }}>{toTitleCase(employeeName)}</Text>
                  {shortAddress.map((line, i) => (
                    <Text key={i}>{line}</Text>
                  ))}
                </View>
        

        {/* TITLE */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            textDecoration: "underline",
            textAlign: "center",
            marginBottom: 14
          }}
        >
          JOINING LETTER
        </Text>

        {/* BODY */}
        <Text style={{ marginBottom: 10 }}>Dear {toTitleCase(shortName)},</Text>

        <Text style={{ marginBottom: 10 }}>
          We are pleased to confirm your joining with{" "}
          <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. You will be joining us
          as <Text style={{ fontWeight: "bold" }}>{designation}</Text>
          {department ? <> in the <Text style={{ fontWeight: "bold" }}>{department}</Text> department</> : null}
          {" "}effective from <Text style={{ fontWeight: "bold" }}>{formattedJoiningDate}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your place of posting shall be{" "}
          <Text style={{ fontWeight: "" }}>{workLocation}</Text> and you will be reporting to{" "}
          <Text style={{ fontWeight: "" }}>{reportingManager}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your annual Cost to Company (CTC) will be{" "}
          <Text style={{ fontWeight: "bold" }}> {formattedCTC}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          You will be on probation for a period of{" "}
          <Text style={{ fontWeight: "bold" }}>{probation}</Text>, during which your performance
          will be assessed.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your working hours will be{" "}
          <Text style={{ fontWeight: "bold" }}>{workingHours}</Text>, Monday to Friday.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We warmly welcome you to our organization and look forward to your valuable
          contribution.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Kindly acknowledge and accept this letter.
        </Text>

        {/* SIGN SECTION */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40 }}>
          <View style={{ width: "45%" }}>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: "bold" }}>Place:</Text> {signPlace}
            </Text>
            <Text style={{ marginBottom: 40 }}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text> {issueDate}
            </Text>
            <Text style={{ fontWeight: "bold" }}>{toTitleCase(employeeName)}</Text>
          </View>

          <View style={{ width: "45%", alignItems: "flex-end" }}>
            <Image
              src={COMPANY_DATA.signature}
              style={{ width: 120, height: 45, marginBottom: 4 }}
            />
            <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.hrName}</Text>
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

export default function JoiningLetterV2() {
  const [candidates, setCandidates] = useState([]);
  const [employee, setEmployee] = useState(null);

  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [annualCTC, setAnnualCTC] = useState("");
  const [probation, setProbation] = useState("6 Months");
  const [workingHours, setWorkingHours] = useState("9:30 AM - 6:30 PM");
  const [signPlace, setSignPlace] = useState("Pune");
  const [searchTerm, setSearchTerm] = useState("");
  const [employment, setEmployment] = useState({});
  const [employments,setEmployments] = useState({});
  

  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    async function loadData() {
      const qs = await getDocs(collection(db, "employees"));
      setCandidates(qs.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadData();
  }, []);

  const validate = () => {
    if (!employee) return toast.error("Select employee");
    if (!designation) return toast.error("Enter designation");
    if (!reportingManager) return toast.error("Enter reporting manager");
    
    if (!joiningDate) return toast.error("Select joining date");
    if (!annualCTC) return toast.error("Enter annual CTC");
    if (!probation) return toast.error("Enter probation");
    if (!signPlace) return toast.error("Enter sign place");
    return true;
  };

  const generate = () => {
    if (!validate()) return;
    setShowPDF(true);
  };

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-6">
        <TableHeader
          title="Generate Joining Letter"
          backButton={{ href: "/dashboard/documents", label: "Back" }}
          searchValue=""
          onSearchChange={() => {}}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          actionButtons={[
            {
              label: "Generate Letter",
              icon: <FiDownload size={18} />,
              variant: "success",
              onClick: generate,
            },
          ]}
        />

        <div className="px-6 py-6 space-y-6">

          {/* CARD */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Joining Information
            </h2> */}

            <div className="bg-white p-4 rounded-lg">
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
                    <span className="text-red-500">*</span> Designation
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Reporting Manager
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Joining Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Work Location
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Annual CTC
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={annualCTC}
                    onChange={(e) => setAnnualCTC(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Probation Period
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={probation}
                    onChange={(e) => setProbation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                  />
                </div>

                <div>
  <label className="block text-sm font-medium mb-1">
    <span className="text-red-500">*</span> Place
  </label>
  <select
    className="w-full p-3 border rounded-md"
    value={signPlace}
    onChange={(e) => setSignPlace(e.target.value)}
  >
    <option value="">Select Place</option>
    <option value="Pune">Pune</option>
    <option value="Mumbai">Mumbai</option>
  </select>
</div>


              </div>
            </div>
          </div>

          <div className="px-0 pt-4 border-t border-gray-200 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={generate}
              className="flex items-center px-6 py-2 rounded-lg shadow-sm transition-all duration-200 bg-green-600 text-white hover:bg-green-700"
            >
              <FiDownload size={18} className="mr-2" />
              <span>Generate Letter</span>
            </button>
          </div>

        </div>
      </div>

      {/* PREVIEW */}
      {showPDF && employee && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
            <div className="flex items-center gap-3">
              <PDFDownloadLink
                document={
                  <JoiningLetterPDF
                    employee={employee}
                    designation={designation}
                    department={department}
                    reportingManager={reportingManager}
                    workLocation={workLocation}
                    joiningDate={joiningDate}
                    annualCTC={annualCTC}
                    probation={probation}
                    workingHours={workingHours}
                    signPlace={signPlace}
                  />
                }
                fileName={`Joining_${employee.name}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download PDF
              </PDFDownloadLink>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const doc = await buildJoiningLetterDocx(
                      employee,
                      designation,
                      department,
                      reportingManager,
                      workLocation,
                      joiningDate,
                      annualCTC,
                      probation,
                      workingHours,
                      signPlace
                    );
                    const blob = await Packer.toBlob(doc);
                    saveAs(blob, `JoiningLetter_${(employee.name || "").replace(/\s+/g, "_")}.docx`);
                    toast.success("DOCX downloaded");
                  } catch (err) {
                    console.error("DOCX download error:", err);
                    toast.error("Failed to generate DOCX");
                  }
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800"
              >
                Download DOCX
              </button>
            </div>
          </div>

          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              <JoiningLetterPDF
                employee={employee}
                designation={designation}
                department={department}
                reportingManager={reportingManager}
                workLocation={workLocation}
                joiningDate={joiningDate}
                annualCTC={annualCTC}
                probation={probation}
                workingHours={workingHours}
                signPlace={signPlace}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}
