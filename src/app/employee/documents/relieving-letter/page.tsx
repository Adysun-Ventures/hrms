"use client";

import React, { useState, useEffect } from "react";
import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { Toaster, toast } from "react-hot-toast";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { getEmployeeSelfEmployment } from "@/utils/firebaseUtils";
import { getEmployee } from "@/utils/documentFunctions";
import { useAuth } from "@/context/AuthContext";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import { formatDateToDayMonYear } from "@/utils/documentUtils";

/* ---------------- TYPES ---------------- */
interface Employee {
  id: string;
  name?: string;
  currentAddress?: string;
  permanentAddress?: string;
}

interface Employment {
  jobTitle?: string;
  joiningDate?: string;
  lastWorkingDate?: string;
}

interface PDFProps {
  employee: Employee;
  employment: Employment;
  employeeSignDate: string;
  employeeSignPlace: string;
  employeeResignDate: string;
  employeeRelievingDate: string;
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
const toTitleCase = (s?: string) => s?.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "";

const formatDate = (d?: string): string => {
  const formatted = formatDateToDayMonYear(d ?? null);
  return formatted === "-" ? "" : formatted;
};

    const Watermark = ({ logoSrc }: { logoSrc?: string }) => {
      if (!logoSrc) return null;
      return (
        <View style={offerLetterStyles.watermark}>
          <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
        </View>
      );
    };
/* ---------------- PDF COMPONENT ---------------- */
const RelievingLetterPDF: React.FC<PDFProps> = ({
  employee,
  employment,
  employeeSignDate,
  employeeSignPlace,
  employeeResignDate,
  employeeRelievingDate
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const designation = employment?.jobTitle || "";
  const resignDate = formatDate(employeeResignDate);
  const relievingDate = formatDate(employeeRelievingDate);
  const signDate = formatDate(employeeSignDate);

  // Use employee fetched address
  const rawAddress = employee?.currentAddress || employee?.permanentAddress || "";
  const fullAddress = rawAddress
    ? rawAddress.split(/[,;\n]+/).map((v) => v.trim()).filter(Boolean)
    : [];

  return (
    <Document>
      <Page size="A4" style={{ padding: 35, fontSize: 12, lineHeight: 1.45 }}>

        <Watermark logoSrc={COMPANY_DATA.logo} />
        <GlobalPDFHeader />
        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        {/* DATE + ADDRESS */}
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {signDate}
        </Text>

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontWeight: "bold" }}>{toTitleCase(employeeName)}</Text>
          {fullAddress.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>

        {/* TITLE */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            marginBottom: 14,
            textDecoration: "underline",
            textAlign: "center"
          }}
        >
          RELIEVING LETTER
        </Text>

        {/* BODY */}
        <Text style={{ marginBottom: 10 }}>Dear {toTitleCase(shortName)},</Text>

        <Text style={{ marginBottom: 10 }}>
          This is with reference to your resignation dated{" "}
          <Text style={{ fontWeight: "bold" }}>{resignDate}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          During your tenure with the company, you performed your duties responsibly and professionally, 
          and maintained a positive attitude towards work and colleagues.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We hereby confirm that you have been formally relieved from your services effective end of day{" "}
          <Text style={{ fontWeight: "bold" }}>{relievingDate}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Further, you have completed all required exit formalities including handover of company assets, documentation, access rights and clearance.
        </Text>

        {/* SIGN SECTION */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 30 }}>
          <View>
            <Text><Text style={{ fontWeight: "bold" }}>Place:</Text> {employeeSignPlace}</Text>
            <Text style={{ marginTop: 4 }}><Text style={{ fontWeight: "bold" }}>Date:</Text> {signDate}</Text>
          </View>

          <View style={{ width: "45%", alignItems: "flex-end" }}>
            <Image src={COMPANY_DATA.signature} style={{ width: 120, height: 55, marginBottom: 2 }} />
            <Text style={{ fontWeight: "bold", textAlign: "right" }}>{COMPANY_DATA.hrName}</Text>
            <Text style={{ textAlign: "right" }}>{COMPANY_DATA.hrDesignation}</Text>
            <Text style={{ textAlign: "right" }}>{COMPANY_DATA.hrEmail}</Text>
          </View>
        </View>

        <View style={{ flexGrow: 1 }} />
        <GlobalPDFFooter />
      </Page>
    </Document>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const EmployeeRelievingLetter: React.FC = () => {
  const { currentUserData } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employment, setEmployment] = useState<Employment | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeSignDate, setEmployeeSignDate] = useState<string>("");
  const [employeeSignPlace, setEmployeeSignPlace] = useState<string>("");
  const [employeeRelievingDate, setEmployeeRelievingDate] = useState<string>("");
  const [employeeResignDate, setEmployeeResignDate] = useState<string>("");

  const canGenerate = Boolean(
    employee &&
      employment &&
      employeeSignDate &&
      employeeSignPlace &&
      employeeRelievingDate &&
      employeeResignDate
  );

  const handleGenerate = () => {
    if (!employeeSignDate) return toast.error("Select sign date");
    if (!employeeRelievingDate) return toast.error("Select relieving date");
    if (!employeeResignDate) return toast.error("Select resignation date");
    if (!employeeSignPlace) return toast.error("Select place");

    requestAnimationFrame(() => {
      document.getElementById("relieving-preview")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  /* ---------------- Load employee + employment ---------------- */
  useEffect(() => {
    const load = async () => {
      if (!currentUserData?.id) return;

      try {
        // Fetch full employee data including address
        const emp = await getEmployee(currentUserData.id);
        setEmployee(emp);

        const empm = await getEmployeeSelfEmployment(currentUserData.id);
        if (empm?.[0]) setEmployment(empm[0]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserData]);

  if (loading) return <div>Loading...</div>;

  return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Relieving Letter", isCurrent: true }
    ]}
  >
    <Toaster position="top-center" />

    <div className="mx-auto pt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center">
          <div className="w-1/3 flex justify-start">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              ← Back
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Reliving Letter
            </h1>
          </div>

          <div className="w-1/3 flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={[
                "px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm",
                canGenerate
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              Generate
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Section Card */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-l-4 border-blue-500 pl-2">
              Relieving Information
            </h2>

            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Sign Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Sign Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    value={employeeSignDate}
                    onChange={(e) => setEmployeeSignDate(e.target.value)}
                  />
                </div>

                {/* Relieving Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Relieving Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    value={employeeRelievingDate}
                    onChange={(e) => setEmployeeRelievingDate(e.target.value)}
                  />
                </div>

                {/* Resignation Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Resignation Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    value={employeeResignDate}
                    onChange={(e) => setEmployeeResignDate(e.target.value)}
                  />
                </div>

                {/* Place */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Place
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

          {/* FOOTER ACTIONS */}
          <div className="-mx-6 px-6 border-t border-gray-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>

      {/* PDF Preview */}
      {employee &&
        employment &&
        employeeSignDate &&
        employeeSignPlace &&
        employeeRelievingDate &&
        employeeResignDate && (
          <div
            id="relieving-preview"
            className="bg-white rounded-lg shadow-lg p-6 mt-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                PDF Preview
              </h3>

              <div className="flex items-center gap-2">
                <PDFDownloadLink
                  document={
                    <RelievingLetterPDF
                      employee={employee}
                      employment={employment}
                      employeeSignDate={employeeSignDate}
                      employeeSignPlace={employeeSignPlace}
                      employeeRelievingDate={employeeRelievingDate}
                      employeeResignDate={employeeResignDate}
                    />
                  }
                  fileName={`Relieving_${employee.name}.pdf`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Download PDF
                </PDFDownloadLink>
              </div>
            </div>

            <div className="border rounded-lg" style={{ height: "80vh" }}>
              <PDFViewer width="100%" height="100%">
                <RelievingLetterPDF
                  employee={employee}
                  employment={employment}
                  employeeSignDate={employeeSignDate}
                  employeeSignPlace={employeeSignPlace}
                  employeeRelievingDate={employeeRelievingDate}
                  employeeResignDate={employeeResignDate}
                />
              </PDFViewer>
            </div>
          </div>
        )}

    </div>
  </EmployeeLayout>
);

};

export default EmployeeRelievingLetter;
