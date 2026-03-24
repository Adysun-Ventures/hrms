"use client";

import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiTrendingUp, FiDownload, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { getEmployeeSelfEmployment } from "@/utils/firebaseUtils";
import { getEmployee } from "@/utils/documentFunctions";

import {
  Document,
  Page,
  Text,
  View,
  PDFViewer,
  Image,
  PDFDownloadLink,
  StyleSheet
} from "@react-pdf/renderer";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import { formatDateToDayMonYear } from "@/utils/documentUtils";
/* ---------------- TYPES ---------------- */
interface Employee {
  id: string;
  name: string;
  [key: string]: any;
}

interface Employment {
  salary: number;
  effectiveDate?: string | Date;
  [key: string]: any;
}

interface LetterData {
  employeeName: string;
  currentCTC: number;
  revisedCTC: number;
  effectiveDate: string;
  oldDesignation?: string;
  newDesignation?: string;
}

/* ---------------- HELPERS ---------------- */
const formatDate = (d: string | Date) => {
  const formatted = formatDateToDayMonYear(d ?? null);
  return formatted === "-" ? "" : formatted;
};
const COMPANY_DATA = {
  name: 'ADYSUN VENTURES PVT. LTD.',
  logo: '/assets/adysunventures_logo.png',
  hrName: 'Prachi Jadhav',
  hrDesignation: 'Head - HR Department',
  hrEmail: 'hr@adysunventures.com',
  signature: '/assets/hr-sign.png'
};
const toTitleCase = (str?: string) =>
  str
    ?.toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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

const Watermark = ({ logoSrc }: { logoSrc?: string }) => {
  if (!logoSrc) return null;
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};
/* ---------------- PDF STYLES ---------------- */
const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 12,
    lineHeight: 1.45
  },
  dateText: { marginBottom: 12, fontWeight: "bold" },
  heading: {
    fontSize: 14,
    fontWeight: "bold",
    textDecoration: "underline",
    textAlign: "center",
    marginBottom: 14
  },
  text: { marginBottom: 10 },
  bold: { fontWeight: "bold" },
  divider: { borderBottom: "1px solid #000", marginBottom: 16 }
});

/* ---------------- PDF COMPONENT ---------------- */
const EmployeeIncrementPDF: React.FC<{ letterData: LetterData }> = ({ letterData }) => {
  const shortName = letterData?.employeeName.split(" ")[0] || "";
  const today = formatDate(new Date());

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <Watermark logoSrc={COMPANY_DATA.logo} />
      <GlobalPDFHeader />

      <View style={styles.divider} />

      {/* DATE */}
      <Text style={styles.dateText}>
        <Text style={styles.bold}>Date: </Text>
        <Text style={styles.bold}>{today}</Text>
      </Text>

      {/* TITLE */}
      <Text style={styles.heading}>INCREMENT LETTER</Text>

      {/* GREETING */}
      <Text style={styles.text}>
        Dear <Text style={styles.bold}>{toTitleCase(shortName)}</Text>,
      </Text>

      {/* PARAGRAPH 1 */}
      <Text style={styles.text}>
        I am pleased to inform you that due to your consistent outstanding
        performance and dedication to your role, we are providing you with
        a salary increment effective from{" "}
        <Text style={styles.bold}>
          {formatDate(letterData.effectiveDate)}
        </Text>.
      </Text>

      {/* PARAGRAPH 2 */}
      <Text style={styles.text}>
        Your new annual CTC will be{" "}
        <Text style={styles.bold}>
          {Number(letterData.revisedCTC).toLocaleString("en-IN")}
        </Text>{" "}
        which is an increase from your previous annual CTC of{" "}
        <Text style={styles.bold}>
          {Number(letterData.currentCTC).toLocaleString("en-IN")}
        </Text>.
      </Text>

      {(letterData.oldDesignation || letterData.newDesignation) && (
        <Text style={styles.text}>
          Designation update:{" "}
          <Text style={styles.bold}>{letterData.oldDesignation || "-"}</Text> to{" "}
          <Text style={styles.bold}>{letterData.newDesignation || "-"}</Text>.
        </Text>
      )}

      {/* PARAGRAPH 3 */}
      <Text style={styles.text}>
        Your recent contributions across various responsibilities and
        deliverables have not gone unnoticed, and this increment reflects
        our recognition of your continued efforts and commitment towards
        the goals of the organization.
      </Text>

      {/* PARAGRAPH 4 */}
      <Text style={styles.text}>
        We appreciate your continuous hard work and commitment to{" "}
        <Text style={styles.bold}>{COMPANY_DATA.name}</Text>, and we believe
        you will continue to excel and contribute towards the company’s success.
      </Text>

      {/* PARAGRAPH 5 */}
      <Text style={styles.text}>
        Thank you for being an integral part of our team. We look forward
        to seeing your continued growth and success.
      </Text>

      {/* SIGNATURE SECTION */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 50
        }}
      >
        <View>
          <Text style={styles.text}>
            <Text style={styles.bold}>Effective: </Text>
            {formatDate(letterData.effectiveDate)}
          </Text>
        </View>

        <View style={{ width: "45%", textAlign: "right", alignItems: "flex-end" }}>
          <Image
            src={COMPANY_DATA.signature}
            style={{ width: 120, height: 50, marginBottom: 6 }}
          />
          <Text style={styles.bold}>{COMPANY_DATA.hrName}</Text>
          <Text>{COMPANY_DATA.hrDesignation}</Text>
          <Text>{COMPANY_DATA.hrEmail}</Text>
        </View>
      </View>

      <GlobalPDFFooter />
    </Page>
  </Document>
  
);

};

/* ---------------- MAIN COMPONENT ---------------- */
const EmployeeIncrementLetter: React.FC = () => {
  const { currentUserData } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employment, setEmployment] = useState<Employment | null>(null);
  const [loading, setLoading] = useState(true);

  const [percentageIncrease, setPercentageIncrease] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [revisedCTC, setRevisedCTC] = useState<number>(0);
  const [oldDesignation, setOldDesignation] = useState<string>("");
  const [newDesignation, setNewDesignation] = useState<string>("");

  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [showPDF, setShowPDF] = useState(false);

  const canGenerate = Boolean(letterData);

  const handleGenerate = () => {
    if (!percentageIncrease) return toast.error("Enter % increase");
    if (!effectiveDate) return toast.error("Select effective date");

    setShowPDF(true);
    requestAnimationFrame(() => {
      document.getElementById("increment-preview")?.scrollIntoView({
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
        const emp = await getEmployee(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);

        setEmployee(emp);
        if (empm?.[0]) {
          setEmployment(empm[0]);
          setOldDesignation(empm[0]?.designation || empm[0]?.jobTitle || "");
        }
      } catch {
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserData]);

  /* ---------------- Calculate revised CTC ---------------- */
  useEffect(() => {
    if (employment) {
      const revised = employment.salary + (employment.salary * percentageIncrease) / 100;
      setRevisedCTC(revised);
    }
  }, [percentageIncrease, employment]);

  /* ---------------- Prepare letter data for PDF ---------------- */
  useEffect(() => {
    if (employee && employment && effectiveDate) {
      setLetterData({
        employeeName: employee.name,
        currentCTC: employment.salary,
        revisedCTC: revisedCTC,
        effectiveDate: effectiveDate,
        oldDesignation,
        newDesignation
      });
    }
  }, [employee, employment, revisedCTC, effectiveDate, oldDesignation, newDesignation]);

  if (loading) return <div>Loading...</div>;

return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Increment Letter", isCurrent: true }
    ]}
  >
    <div className="mx-auto pt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center">
          <div className="w-1/3 flex justify-start">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
              aria-label="Back"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Increment Letter
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

        <div className="p-6 space-y-6">

          {employment ? (
            <>
              {/* Section Card */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 border-l-4 border-blue-500 pl-2">
                  Increment Details
                </h2>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    {/* Current CTC */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Current CTC <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={employment.salary}
                        disabled
                        className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    {/* % Increase */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        % Increase <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={percentageIncrease}
                        onChange={(e) =>
                          setPercentageIncrease(Number(e.target.value))
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Revised CTC */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Revised CTC <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={revisedCTC}
                        disabled
                        className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    {/* Effective Date */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <DateDropdown value={effectiveDate} onChange={setEffectiveDate} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Old Designation
                      </label>
                      <input
                        type="text"
                        value={oldDesignation}
                        onChange={(e) => setOldDesignation(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        New Designation
                      </label>
                      <input
                        type="text"
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="-mx-6 px-6 border-t border-gray-200 pt-4 flex items-center justify-between gap-2">
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
                    "inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm",
                    canGenerate
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
              </div>

              {/* PDF Preview */}
              {showPDF && letterData && (
                <div
                  id="increment-preview"
                  className="bg-white rounded-lg shadow-lg p-6 mt-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      PDF Preview
                    </h3>

                    <PDFDownloadLink
                      document={<EmployeeIncrementPDF letterData={letterData} />}
                      fileName={`Increment_${letterData.employeeName}.pdf`}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                      <FiDownload className="mr-2" />
                      <span className="hidden sm:inline">Download PDF</span>
                    </PDFDownloadLink>
                  </div>

                  <div
                    className="border rounded-lg"
                    style={{ height: "75vh" }}
                  >
                    <PDFViewer width="100%" height="100%">
                      <EmployeeIncrementPDF
                        letterData={letterData}
                      />
                    </PDFViewer>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <FiTrendingUp className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Employment Data
              </h3>
              <p className="text-gray-500">
                Your employment record is not available.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  </EmployeeLayout>
);


};

export default EmployeeIncrementLetter;
