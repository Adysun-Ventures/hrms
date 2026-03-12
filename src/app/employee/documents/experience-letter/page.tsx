"use client";

import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { getEmployeeSelf, getEmployeeSelfEmployment } from "@/utils/firebaseUtils";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDayMonYear } from "@/utils/documentUtils";

import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  Image
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

/* ---------------- TYPES ---------------- */
interface Employee {
  name: string;
}

interface Employment {
  jobTitle?: string;
  joiningDate?: string;
  lastWorkingDate?: string;
}

interface PDFProps {
  employee: Employee;
  employment: Employment;
  todaysDate: string;
  employeeSignDate: string;
  employeeSignPlace: string;
}

/* ---------------- COMPANY DATA ---------------- */
const COMPANY_DATA = {
  name: "ADYSUN VENTURES PVT. LTD.",
  hrName: "Prachi Jadhav",
  hrDesignation: "Head - HR Department",
  hrEmail: "hr@adysunventures.com",
  logo: "/assets/adysunventures_logo.png",
  signature: "/assets/hr-sign.png"
};

/* ---------------- HELPERS ---------------- */
const formatDate = (d?: string): string => {
  const formatted = formatDateToDayMonYear(d ?? null);
  return formatted === "-" ? "" : formatted;
};

const toTitleCase = (str?: string): string =>
  str
    ?.toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "";

async function buildExperienceLetterDocx(emp: Employee | null, empJob: Employment | null, todaysDate: string, employeeSignDate: string, employeeSignPlace: string) {
  if (!emp || !empJob) return new DocxDocument({ sections: [{ properties: {}, children: [new Paragraph({ text: "No data" })] }] });
  const employeeName = emp?.name || "";
  const designation = empJob?.jobTitle || "";
  const joiningDate = empJob?.joiningDate || "";
  const relievingDate = empJob?.lastWorkingDate || "";
  const shortName = employeeName.split(" ")[0] || employeeName;
  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
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
    new Paragraph({ text: `We found ${shortName} to be sincere, reliable, and responsible.` }),
    new Paragraph({ text: `We wish ${shortName} all the best for future career opportunities.` }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Place: " }), new TextRun({ text: employeeSignPlace || "" })] }),
    new Paragraph({ children: [new TextRun({ text: "Date: " }), new TextRun({ text: formatDate(employeeSignDate) })] }),
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.hrName, bold: true })] }),
    new Paragraph({ text: COMPANY_DATA.hrDesignation }),
    new Paragraph({ text: COMPANY_DATA.hrEmail }),
  ];
  return new DocxDocument({ sections: [{ properties: {}, children }] });
}

/* ---------------- PDF COMPONENT ---------------- */
const EmployeeExperiencePDF: React.FC<PDFProps> = ({
  employee,
  employment,
  todaysDate,
  employeeSignDate,
  employeeSignPlace
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const designation = employment?.jobTitle || "";
  const joiningDate = employment?.joiningDate || "";
  const relievingDate = employment?.lastWorkingDate || "";

  return (
    <Document>
      <Page size="A4" style={{ padding: 35, fontSize: 12, lineHeight: 1.45 }}>
        <GlobalPDFHeader />

        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {formatDate(todaysDate)}
        </Text>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            marginBottom: 16,
            textAlign: "center",
            textDecoration: "underline"
          }}
        >
          EXPERIENCE LETTER
        </Text>

        <Text style={{ marginBottom: 10 }}>Dear {toTitleCase(shortName)},</Text>

        <Text style={{ marginBottom: 10 }}>
          This is to certify that{" "}
          <Text style={{ fontWeight: "bold" }}>{toTitleCase(employeeName)}</Text>{" "}
          was employed with{" "}
          <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>{" "}
          as a <Text style={{ fontWeight: "bold" }}>{designation}</Text>{" "}
          from <Text style={{ fontWeight: "bold" }}>{formatDate(joiningDate)}</Text> to{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatDate(relievingDate) || formatDate(employeeSignDate)}
          </Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          During the tenure, {shortName} performed duties with dedication and professionalism.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We found {shortName} to be sincere, reliable, and responsible.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We wish {shortName} all the best for future career opportunities.
        </Text>

        <View style={{ marginTop: 40, flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text>Place: {employeeSignPlace}</Text>
            <Text>Date: {formatDate(employeeSignDate)}</Text>
          </View>

          <View style={{ width: "45%", flexDirection: "column", alignItems: "flex-end" }}>
  <Image
    src={COMPANY_DATA.signature}
    style={{ width: 120, height: 55 }}
  />
  <Text style={{ fontWeight: "bold", marginTop: 2 }}>{COMPANY_DATA.hrName}</Text>
  <Text style={{ marginTop: 1 }}>{COMPANY_DATA.hrDesignation}</Text>
  <Text style={{ marginTop: 1 }}>{COMPANY_DATA.hrEmail}</Text>
</View>

        </View>

        <GlobalPDFFooter />
      </Page>
    </Document>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const EmployeeExperienceLetter: React.FC = () => {
  const { currentUserData } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employment, setEmployment] = useState<Employment | null>(null);
  const [loading, setLoading] = useState(true);

  const [todaysDate, setTodaysDate] = useState<string>("");
  const [employeeSignDate, setEmployeeSignDate] = useState<string>("");
  const [employeeSignPlace, setEmployeeSignPlace] = useState<string>("");
  const [showPDF, setShowPDF] = useState(false);

  /* ---------------- Load employment and employee data ---------------- */
  useEffect(() => {
    const load = async () => {
      if (!currentUserData?.id) return;
      try {
        setEmployee({ name: currentUserData?.name || "" }); // use auth context for name
        const empm = await getEmployeeSelfEmployment(currentUserData.id);
        const emp = await getEmployeeSelf(currentUserData.id);
        if (empm?.[0]) setEmployment(empm[0]);
      } catch (error) {
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserData]);

  const handleGenerate = () => {
    if (!todaysDate) return toast.error("Select date");
    if (!employeeSignDate) return toast.error("Select sign date");
    if (!employeeSignPlace) return toast.error("Select place");

    setShowPDF(true);
  };

  if (loading) return <div>Loading...</div>;

return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Experience Letter", isCurrent: true }
    ]}
  >
    <Toaster position="top-center" />

    {/* MAIN CARD */}
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">

      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Experience Letter
          </h1>
          <p className="text-gray-600 mt-2">
            Fill the required details to generate your experience letter
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      {/* FORM SECTION */}
      <div className="p-6">

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">
            Experience Letter Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={todaysDate}
                onChange={(e) => setTodaysDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sign Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sign Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={employeeSignDate}
                onChange={(e) => setEmployeeSignDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Place */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Place <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeSignPlace}
                onChange={(e) => setEmployeeSignPlace(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Place</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>

          </div>
        </div>

      </div>
    </div>

    {/* PDF PREVIEW CARD */}
    {employee && employment && todaysDate && employeeSignDate && employeeSignPlace && (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            PDF Preview
          </h3>

          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={
                <EmployeeExperiencePDF
                  employee={employee}
                  employment={employment}
                  todaysDate={todaysDate}
                  employeeSignDate={employeeSignDate}
                  employeeSignPlace={employeeSignPlace}
                />
              }
              fileName={`Experience_${employee.name}.pdf`}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Download PDF
            </PDFDownloadLink>
            <button
              type="button"
              onClick={async () => {
                try {
                  const doc = await buildExperienceLetterDocx(employee, employment, todaysDate, employeeSignDate, employeeSignPlace);
                  const blob = await Packer.toBlob(doc);
                  saveAs(blob, `ExperienceLetter_${(employee?.name || "").replace(/\s+/g, "_")}.docx`);
                  toast.success("DOCX downloaded");
                } catch (err) {
                  console.error("DOCX download error:", err);
                  toast.error("Failed to generate DOCX");
                }
              }}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              Download DOCX
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden" style={{ height: "80vh" }}>
          <PDFViewer width="100%" height="100%">
            <EmployeeExperiencePDF
              employee={employee}
              employment={employment}
              todaysDate={todaysDate}
              employeeSignDate={employeeSignDate}
              employeeSignPlace={employeeSignPlace}
            />
          </PDFViewer>
        </div>

      </div>
    )}

  </EmployeeLayout>
);


};

export default EmployeeExperienceLetter;
