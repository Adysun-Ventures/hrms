"use client";

import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiDownload, FiX } from "react-icons/fi";
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
  designationOverride?: string;
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
    "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black";

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

/* ---------------- PDF COMPONENT ---------------- */
const EmployeeExperiencePDF: React.FC<PDFProps> = ({
  employee,
  employment,
  todaysDate,
  employeeSignDate,
  employeeSignPlace,
  designationOverride
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const designation = designationOverride || employment?.jobTitle || "";
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
  const [designationOverride, setDesignationOverride] = useState<string>("");
  const [showPDF, setShowPDF] = useState(false);

  const canGenerate = Boolean(todaysDate && employeeSignDate && employeeSignPlace);

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex items-center">
        <div className="w-1/3 flex justify-start">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            aria-label="Back"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Experience Letter
          </h1>
        </div>

        <div className="w-1/3 flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={[
              "px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm inline-flex items-center gap-2",
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

      {/* FORM SECTION */}
      <div className="p-6">

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">
            Experience Letter Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Generate Date <span className="text-red-500">*</span>
              </label>
              <DateDropdown value={todaysDate} onChange={setTodaysDate} />
            </div>

            {/* Sign Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Exit <span className="text-red-500">*</span>
              </label>
              <DateDropdown value={employeeSignDate} onChange={setEmployeeSignDate} />
            </div>

            {/* Place */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={designationOverride}
                onChange={(e) => setDesignationOverride(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter designation"
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

        {/* FOOTER ACTIONS */}
        <div className="-mx-6 px-6 border-t border-gray-200 pt-4 flex items-center justify-between mt-6">
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
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={[
              "flex items-center gap-2 px-6 py-2 rounded-lg transition shadow-sm",
              canGenerate
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed",
            ].join(" ")}
          >
            <FiDownload className="w-5 h-5" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>

      </div>
    </div>

    {/* PDF PREVIEW CARD */}
    {showPDF && employee && employment && todaysDate && employeeSignDate && employeeSignPlace && (
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
                  designationOverride={designationOverride}
                />
              }
              fileName={`Experience_${employee.name}.pdf`}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              aria-label="Download PDF"
            >
              <span className="inline-flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </span>
            </PDFDownloadLink>
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
              designationOverride={designationOverride}
            />
          </PDFViewer>
        </div>

      </div>
    )}

  </EmployeeLayout>
);


};

export default EmployeeExperienceLetter;
