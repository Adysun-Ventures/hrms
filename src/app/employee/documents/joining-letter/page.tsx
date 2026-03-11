"use client";

import React, { useState, useEffect } from "react";
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
import { offerLetterStyles } from "@/components/pdf/PDFStyles";

/* ---------------- TYPES ---------------- */

interface Employee {
  name: string;
  currentAddress?: string;
  permanentAddress?: string;
}

interface Employment {
  jobTitle?: string;
  joiningDate?: string;
  location?: string;
  reportingManager?: string;
  salary?: string;
  department?: string;
}

/* ---------------- COMPANY DATA ---------------- */

const COMPANY_DATA = {
  name: "ADYSUN VENTURES PVT. LTD.",
  hrName: "Prachi Jadhav",
  hrDesignation: "Head - HR Department",
  hrEmail: "hr@adysunventures.com",
  signature: "/assets/hr-sign.png"
};

/* ---------------- HELPERS ---------------- */

const formatDate = (d?: string) => {
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

/* ---------------- PDF ---------------- */

const JoiningLetterPDF = ({
  employee,
  designation,
  department,
  joiningDate,
  workLocation,
  reportingManager,
  salary,
  probation,
  workingHours,
  issueDate,
  signPlace
}: any) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];

  const address =
    employee.currentAddress || employee.permanentAddress || "";

  const shortAddress = address
    .split(/[,;\n]+/)
    .map((v: string) => v.trim())
    .filter(Boolean);

  const formattedCTC = Number(salary || 0).toLocaleString("en-IN");
  const COMPANY_DATA = {
  name: 'ADYSUN VENTURES PVT. LTD.',
  logo: '/assets/adysunventures_logo.png',
  hrName: 'Prachi Jadhav',
  hrDesignation: 'Head - HR Department',
  hrEmail: 'hr@adysunventures.com',
  signature: '/assets/hr-sign.png'
};

  return (
    <Document>
      <Page
        size="A4"
        style={{ padding: 35, fontSize: 12, lineHeight: 1.45 }}
      >
        <Watermark logoSrc={COMPANY_DATA.logo} />
        <GlobalPDFHeader />

        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {formatDate(issueDate)}
        </Text>

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontWeight: "bold" }}>{employeeName}</Text>
          {shortAddress.map((line: string, i: number) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>

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

        <Text style={{ marginBottom: 10 }}>Dear {shortName},</Text>

        <Text style={{ marginBottom: 10 }}>
          We are pleased to confirm your joining with{" "}
          <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. You will
          be joining us as{" "}
          <Text style={{ fontWeight: "bold" }}>{designation}</Text>
          {department && (
            <>
              {" "}in the{" "}
              <Text style={{ fontWeight: "bold" }}>{department}</Text> department
            </>
          )}{" "}
          effective from{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatDate(joiningDate)}
          </Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your place of posting shall be {workLocation} and you will be
          reporting to {reportingManager}.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your annual Cost to Company (CTC) will be{" "}
          <Text style={{ fontWeight: "bold" }}>₹ {formattedCTC}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          You will be on probation for a period of{" "}
          <Text style={{ fontWeight: "bold" }}>{probation}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your working hours will be{" "}
          <Text style={{ fontWeight: "bold" }}>{workingHours}</Text>, Monday to Friday.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We warmly welcome you to our organization.
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 40
          }}
        >
          <View style={{ width: "45%" }}>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Place:</Text> {signPlace}
            </Text>
            <Text style={{ marginBottom: 40 }}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text> {formatDate(issueDate)}
            </Text>
            <Text style={{ fontWeight: "bold" }}>{employeeName}</Text>
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

        <GlobalPDFFooter />
      </Page>
    </Document>
  );
};

/* ---------------- PAGE ---------------- */

export default function EmployeeJoiningLetter() {
  const { currentUserData } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [annualCTC, setAnnualCTC] = useState("");

  const [probation, setProbation] = useState("6 Months");
  const [workingHours, setWorkingHours] = useState("9:30 AM to 6:30 PM");

  const [issueDate, setIssueDate] = useState("");
  const [signPlace, setSignPlace] = useState("");
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    if (!currentUserData?.id) return;

    (async () => {
      try {
        const emp = await getEmployeeSelf(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);

        setEmployee(emp || { name: currentUserData.name || "" });

        if (empm?.[0]) {
          setDesignation(empm[0].jobTitle || "");
          setJoiningDate(empm[0].joiningDate || "");
          setWorkLocation(empm[0].location || "");
          setReportingManager(empm[0].reportingManager || "");
          setAnnualCTC(String(empm[0].salary || ""));
          setDepartment(empm[0].department || "");
        }
      } catch {
        toast.error("Failed to load data");
      }
    })();
  }, [currentUserData]);


return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Joining Letter", isCurrent: true }
    ]}
  >
    <Toaster position="top-center" />

    <div className="container mx-auto p-4">

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">

  <div>
    <h2 className="text-xl font-semibold text-gray-800">
      Generate Joining Letter
    </h2>
    <p className="text-sm text-gray-500 mt-1">
      Fill the details below to generate your joining letter
    </p>
  </div>

  <button
    type="button"
    onClick={() => window.history.back()}
    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-white hover:shadow-sm transition"
  >
    ← Back
  </button>

</div>



        <div className="p-6 space-y-6">

          {/* SECTION CARD */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Joining Information
            </h2>

             

            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Issue Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Designation
                  </label>
                  <input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Joining Date
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Work Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Work Location
                  </label>
                  <input
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reporting Manager */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Reporting Manager
                  </label>
                  <input
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Annual CTC */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Annual CTC
                  </label>
                  <input
                    type="number"
                    value={annualCTC}
                    onChange={(e) => setAnnualCTC(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Probation */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Probation Period
                  </label>
                  <input
                    value={probation}
                    onChange={(e) => setProbation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Working Hours */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Working Hours
                  </label>
                  <input
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Place */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Place
                  </label>
                  <select
                    value={signPlace}
                    onChange={(e) => setSignPlace(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Place</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowPDF(true)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Generate Letter
            </button>
          </div>

        </div>
      </div>

      {/* PDF PREVIEW */}
      {showPDF && employee && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <PDFDownloadLink
              document={
                <JoiningLetterPDF
                  employee={employee}
                  designation={designation}
                  department={department}
                  joiningDate={joiningDate}
                  workLocation={workLocation}
                  reportingManager={reportingManager}
                  salary={annualCTC}
                  probation={probation}
                  workingHours={workingHours}
                  issueDate={issueDate}
                  signPlace={signPlace}
                />
              }
              fileName={`Joining_${employee.name}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Download PDF
            </PDFDownloadLink>
          </div>

          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%">
              <JoiningLetterPDF
                employee={employee}
                designation={designation}
                department={department}
                joiningDate={joiningDate}
                workLocation={workLocation}
                reportingManager={reportingManager}
                salary={annualCTC}
                probation={probation}
                workingHours={workingHours}
                issueDate={issueDate}
                signPlace={signPlace}
              />
            </PDFViewer>
          </div>
        </div>
      )}

    </div>
  </EmployeeLayout>
);


}
