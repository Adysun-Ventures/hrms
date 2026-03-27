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
import { FiArrowLeft, FiDownload, FiX } from "react-icons/fi";
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

const normalizeToISODate = (d?: string): string => {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

    const Watermark = ({ logoSrc }: { logoSrc?: string }) => {
      if (!logoSrc) return null;
      return (
        <View style={offerLetterStyles.watermark}>
          <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
        </View>
      );
    };

const toTitleCase = (s?: string) =>
  s
    ?.toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "";

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

const DateDropdown: React.FC<{ value: string; onChange: (v: string) => void }> = ({
  value,
  onChange,
}) => {
  const [initialYear = "", initialMonth = "", initialDay = ""] =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-") : ["", "", ""];

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);

  const nowYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => String(nowYear - 10 + i));
  const getDaysInMonth = (y: string, m: string) => {
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

  const emitIfComplete = (nextYear: string, nextMonth: string, nextDay: string) => {
    if (nextYear && nextMonth && nextDay) onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  const selectClass =
    "w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black";

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className={selectClass}
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
        className={selectClass}
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
        className={selectClass}
        value={year}
        onChange={(e) => {
          const nextYear = e.target.value;
          setYear(nextYear);
          setDay("");
          emitIfComplete(nextYear, month, day);
        }}
      >
        <option value="">Year</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
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
          <Text style={{ fontWeight: "bold" }}>10:00 AM to 7:00 PM</Text>, Monday to Friday.
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

  const designationOptionsByDepartment: Record<string, string[]> = {
    Development: ["Software Developer", "Senior Software Developer", "Lead Developer"],
    Engineering: ["Engineer", "Senior Engineer", "Lead Engineer"],
    Operation: ["Operations Executive", "Senior Operations Executive", "Operations Manager"],
    HR: ["HR Executive", "HR Manager", "Talent Acquisition Specialist"],
    Finance: ["Accountant", "Senior Accountant", "Finance Manager"],
    Support: ["Support Executive", "Senior Support Executive", "Support Manager"],
  };

  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentJoiningDate, setEmploymentJoiningDate] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [annualCTC, setAnnualCTC] = useState("");

  const [probation, setProbation] = useState("");

  const [issueDate, setIssueDate] = useState("");
  const [signPlace, setSignPlace] = useState("");
  const [showPDF, setShowPDF] = useState(false);

  const canGenerate = Boolean(
    employee &&
      issueDate &&
      department &&
      designation &&
      joiningDate &&
      reportingManager &&
      annualCTC &&
      probation &&
      signPlace
  );

  useEffect(() => {
    if (!currentUserData?.id) return;

    (async () => {
      try {
        const emp = await getEmployeeSelf(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);

        setEmployee(emp || { name: currentUserData.name || "" });

        if (empm?.[0]) {
          setDesignation(empm[0].jobTitle || "");
          const normalizedJoining = normalizeToISODate(empm[0].joiningDate);
          setEmploymentJoiningDate(normalizedJoining);
          setJoiningDate(normalizedJoining);
          // Auto-fill Document Generate Date with Joining Date
          setIssueDate(normalizedJoining);
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

    <div className="mx-auto pt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center">
          <div className="w-1/3 flex justify-start">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-white hover:shadow-sm transition"
              aria-label="Back"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Joining Letter
            </h2>
          </div>

          <div className="w-1/3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowPDF(true)}
              disabled={!canGenerate}
              className={[
                "flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm min-h-[48px] min-w-[190px]",
                canGenerate
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>
        </div>



        <div className="p-6 space-y-6">

          {/* SECTION CARD */}
          <div >
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Issue Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Document Generate Date
                  </label>
                  <DateDropdown value={issueDate} onChange={setIssueDate} />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!employmentJoiningDate) {
                        toast.error("Joining Date not available");
                        return;
                      }
                      setIssueDate(employmentJoiningDate);
                    }}
                    className={[
                      "mt-2 block text-sm hover:underline",
                      employmentJoiningDate ? "text-blue-600" : "text-gray-400",
                    ].join(" ")}
                  >
                    Use Joining Date
                  </a>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setDesignation("");
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {Object.keys(designationOptionsByDepartment).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={!department}
                  >
                    <option value="">
                      {department ? "Select Designation" : "Select Department first"}
                    </option>
                    {designationOptionsByDepartment[department]?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Joining Date
                  </label>
                  <DateDropdown value={joiningDate} onChange={setJoiningDate} />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!employmentJoiningDate) {
                        toast.error("Joining Date not available");
                        return;
                      }
                      setJoiningDate(employmentJoiningDate);
                    }}
                    className={[
                      "mt-2 block text-sm hover:underline",
                      employmentJoiningDate ? "text-blue-600" : "text-gray-400",
                    ].join(" ")}
                  >
                    Use Joining Date
                  </a>
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
                  <select
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Reporting Manager</option>
                    <option value="Viraj Kadam">Viraj Kadam</option>
                    <option value="Rohit Kore">Rohit Kore</option>
                    <option value="Vishal Konale">Vishal Konale</option>
                    <option value="Prachi Jadhav">Prachi Jadhav</option>
                    <option value="Deepak Kadam">Deepak Kadam</option>
                  </select>
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
                    <span className="text-red-500">*</span> Probation Period
                  </label>
                  <select
                    value={probation}
                    onChange={(e) => setProbation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Probation Period</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                  </select>
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

          <div className="-mx-6 px-6 border-t border-gray-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              aria-label="Cancel"
            >
              <FiX className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>

            <button
              onClick={() => setShowPDF(true)}
              disabled={!canGenerate}
              className={[
                "flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition min-h-[48px] min-w-[190px]",
                canGenerate
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed",
              ].join(" ")}
              aria-label="Generate"
            >
              <FiDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>

        </div>
      </div>

      {/* PDF PREVIEW */}
      {showPDF && employee && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <div className="flex items-center gap-2">
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
                    issueDate={issueDate}
                    signPlace={signPlace}
                  />
                }
                fileName={`Joining_${employee.name}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                aria-label="Download PDF"
              >
                <span className="inline-flex items-center gap-2">
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </span>
              </PDFDownloadLink>
            </div>
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
