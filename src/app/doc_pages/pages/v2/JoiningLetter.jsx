"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiDownload, FiX } from "react-icons/fi";
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
import { collection, getDocs, query, where } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { Combobox } from "@headlessui/react";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDayMonYear } from "@/utils/documentUtils";

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
const normalizeDateForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Handle: DD-MM-YYYY or DD/MM/YYYY (common in HR entries)
    const dmyMatch = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1];
      const month = dmyMatch[2];
      const year = dmyMatch[3];
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle: YYYY/MM/DD
    const ymdSlashMatch = value.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (ymdSlashMatch) {
      const year = ymdSlashMatch[1];
      const month = ymdSlashMatch[2];
      const day = ymdSlashMatch[3];
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle: milliseconds timestamp as string
    if (/^\d{13}$/.test(value)) {
      const parsedMs = new Date(Number(value));
      if (!Number.isNaN(parsedMs.getTime())) return parsedMs.toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return "";
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
};

const formatDate = (d) => {
  if (!d) return "";
  try {
    return formatDateToDayMonYear(d);
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

/** Prefer employment reporting fields (string or reportingManagerRef.name). */
function reportingManagerFromEmployment(emp) {
  if (!emp) return "";
  const ref = emp.reportingManagerRef;
  const refName =
    ref && typeof ref === "object" && ref.name != null
      ? String(ref.name).trim()
      : "";
  return (
    String(emp.reportingManager || "").trim() ||
    String(emp.reportingAuthority || "").trim() ||
    refName
  );
}

const REPORTING_MANAGER_DROPDOWN_OPTIONS = [
  "Viraj Kadam",
  "Rohit Kore",
  "Vishal Konale",
  "Prachi Jadhav",
  "Deepak Kadam",
];

const Watermark = ({ logoSrc }) => null;

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

const DateDropdown = ({ value, onChange }) => {
  const [initialYear = "", initialMonth = "", initialDay = ""] =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-") : ["", "", ""];
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);

  const nowYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => String(nowYear - 10 + i));
  const getDaysInMonth = (y, m) => {
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

  const emitIfComplete = (nextYear, nextMonth, nextDay) => {
    if (nextYear && nextMonth && nextDay) onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className="w-full p-2 border rounded-md"
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
        className="w-full p-2 border rounded-md"
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
        className="w-full p-2 border rounded-md"
        value={year}
        onChange={(e) => {
          const nextYear = e.target.value;
          setYear(nextYear);
          setDay("");
          emitIfComplete(nextYear, month, day);
        }}
      >
        <option value="">YYYY</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

/* ---------------- DOCX BUILDER ---------------- */
async function buildJoiningLetterDocx(employee, designation, department, reportingManager, workLocation, joiningDate, annualCTC, probation, workingHours, signPlace, documentGenerateDate) {
  const name = employee?.name || "";
  const shortName = name.split(" ")[0] || name;
  const issueDate = formatDate(documentGenerateDate || todayISO());
  const formattedJoiningDate = formatDate(joiningDate);
  const formattedCTC = Number(annualCTC).toLocaleString("en-IN");
  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: issueDate })] }),
    new Paragraph({ children: [new TextRun({ text: toTitleCase(name), bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "APPOINTMENT LETTER", bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCase(shortName)},` })] }),
    new Paragraph({
      children: [
        new TextRun({ text: "We are pleased to confirm your joining with " }),
        new TextRun({ text: COMPANY_DATA.name, bold: true }),
        new TextRun({ text: ". You will be joining us as a " }),
        new TextRun({ text: designation || "", bold: true }),
        ...(department ? [new TextRun({ text: ` in the ${department} department` })] : []),
        new TextRun({ text: ` effective from ${formattedJoiningDate}.` }),
      ],
    }),
    new Paragraph({ children: [new TextRun({ text: `Your place of posting shall be ${workLocation || ""} and you will be reporting to ${reportingManager || ""}.` })] }),
    new Paragraph({ children: [new TextRun({ text: "Your annual Cost to Company (CTC) will be " }), new TextRun({ text: `₹${formattedCTC}`, bold: true }), new TextRun({ text: "." })] }),
    new Paragraph({ children: [new TextRun({ text: `You will be on probation for a period of ${probation || ""}, during which your performance will be assessed.` })] }),
    new Paragraph({ children: [new TextRun({ text: "Your working hours will be 10:00 AM - 7:00 PM, Monday to Friday." })] }),
    new Paragraph({ text: "We warmly welcome you to our organization and look forward to your valuable contribution." }),
    new Paragraph({ text: "Kindly acknowledge and accept this letter." }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Acknowledgement and Acceptance", bold: true, underline: {} })] }),
    new Paragraph({
      text:
        "I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter. I accept the offer of employment with Adysun Ventures Private Limited.",
    }),
    new Paragraph({ children: [new TextRun({ text: "Candidate Name: " }), new TextRun({ text: toTitleCase(name), bold: true })] }),
    new Paragraph({ text: "Signature: ________________________________" }),
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
  signPlace,
  documentGenerateDate
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const issueDate = formatDate(documentGenerateDate || todayISO());
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
        style={{ padding: 35, fontSize: 10, lineHeight: 1.45, position: "relative" }}
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
            fontSize: 12,
            fontWeight: "bold",
            textDecoration: "underline",
            textAlign: "center",
            marginBottom: 14
          }}
        >
          APPOINTMENT LETTER
        </Text>

        {/* BODY */}
        <Text style={{ marginBottom: 10 }}>Dear {toTitleCase(shortName)},</Text>

        <Text style={{ marginBottom: 10 }}>
          We are pleased to confirm your joining with{" "}
          <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>. You will be joining us
          as a <Text style={{ fontWeight: "bold" }}>{designation}</Text>
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
          <Text style={{ fontWeight: "bold" }}> ₹{formattedCTC}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          You will be on probation for a period of{" "}
          <Text style={{ fontWeight: "bold" }}>{probation}</Text>, during which your performance
          will be assessed.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your working hours will be{" "}
          <Text style={{ fontWeight: "bold" }}>10:00 AM - 7:00 PM</Text>, Monday to Friday.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We warmly welcome you to our organization and look forward to your valuable
          contribution.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Kindly acknowledge and accept this letter.
        </Text>

        <Text style={{ marginBottom: 10, fontWeight: "bold", textDecoration: "underline" }}>
          Acknowledgement and Acceptance
        </Text>
        <Text style={{ marginBottom: 10 }}>
          I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter. I accept the offer of employment with Adysun Ventures Private Limited.
        </Text>
        <Text style={{ marginBottom: 6 }}>
          Candidate Name: <Text style={{ fontWeight: "bold" }}>{toTitleCase(employeeName)}</Text>
        </Text>
        <Text style={{ marginBottom: 10 }}>Signature: ________________________________</Text>

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
  const { currentUserData } = useAuth();
  const selfEmployeeId = currentUserData?.userType === "employee" ? currentUserData?.id : null;

  const [candidates, setCandidates] = useState([]);
  const [employee, setEmployee] = useState(null);

  const departmentOptions = [
    "Development",
    "Engineering",
    "Operation",
    "HR",
    "Finance",
    "Support",
  ];
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [annualCTC, setAnnualCTC] = useState("");
  const [probation, setProbation] = useState("6 Months");
  const [workingHours, setWorkingHours] = useState("9:30 AM - 6:30 PM");
  const [signPlace, setSignPlace] = useState("Pune");
  const [documentGenerateDate, setDocumentGenerateDate] = useState(todayISO());
  const [searchTerm, setSearchTerm] = useState("");
  const [employment, setEmployment] = useState({});
  const [employments, setEmployments] = useState({});
  

  const [showPDF, setShowPDF] = useState(false);

  const reportingManagerSelectOptions = useMemo(() => {
    const base = [...REPORTING_MANAGER_DROPDOWN_OPTIONS];
    if (reportingManager && !base.includes(reportingManager)) {
      return [reportingManager, ...base];
    }
    return base;
  }, [reportingManager]);

  useEffect(() => {
    async function loadData() {
      const qs = await getDocs(collection(db, "employees"));
      const list = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      const visible = selfEmployeeId ? list.filter((e) => e.id === selfEmployeeId) : list;
      setCandidates(visible);

      if (selfEmployeeId && visible.length > 0) {
        const selfEmp = visible[0];
        setEmployee(selfEmp);
        const selfEmployment = await getEmploymentForEmployee(selfEmp.id);
        setEmployment(selfEmployment || {});
        autoFillDatesFromEmployment(selfEmployment);
      }
    }
    loadData();
  }, [selfEmployeeId]);

  const getEmploymentForEmployee = async (employeeId) => {
    if (!employeeId) return null;
    if (employments[employeeId]) return employments[employeeId];
    const qSnap = await getDocs(query(collection(db, "employments"), where("employeeId", "==", employeeId)));
    if (qSnap.empty) return null;
    const nextEmployment = qSnap.docs[0].data();
    setEmployments((prev) => ({ ...prev, [employeeId]: nextEmployment }));
    return nextEmployment;
  };

  const autoFillDatesFromEmployment = (empEmployment) => {
    if (!empEmployment) return;
    const joiningDateFromEmployment = normalizeDateForInput(
      empEmployment?.joiningDate ||
      empEmployment?.startDate ||
      ""
    );
    const departmentFromEmployment = empEmployment?.department || "";
    const designationFromEmployment =
      empEmployment?.designation ||
      empEmployment?.jobTitle ||
      "";
    const annualCtcFromEmployment = empEmployment?.joiningCtc || "";

    if (joiningDateFromEmployment) {
      setJoiningDate(joiningDateFromEmployment);
      setDocumentGenerateDate(joiningDateFromEmployment);
    }
    if (departmentFromEmployment) setDepartment(departmentFromEmployment);
    if (designationFromEmployment) setDesignation(designationFromEmployment);
    if (annualCtcFromEmployment) setAnnualCTC(String(annualCtcFromEmployment));

    const reportingManagerFromEmp = reportingManagerFromEmployment(empEmployment);
    if (reportingManagerFromEmp) setReportingManager(reportingManagerFromEmp);

    const locationFromEmployment = String(empEmployment?.location || "").trim();
    if (locationFromEmployment) setWorkLocation(locationFromEmployment);
  };

  const canGenerate = Boolean(
    employee &&
    designation &&
    department &&
    reportingManager &&
    joiningDate &&
    annualCTC &&
    probation &&
    signPlace
  );
  const validate = () => {
    if (!employee) return toast.error("Select employee");
    if (!designation) return toast.error("Enter designation");
    if (!department) return toast.error("Enter department");
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

  const useEmploymentJoiningDateFor = (targetSetter) => {
    const employmentJoiningDate = normalizeDateForInput(
      employment?.joiningDate ||
      employment?.startDate ||
      ""
    );
    if (!employmentJoiningDate) {
      toast.error("Joining date is not available for selected employee");
      return;
    }
    targetSetter(employmentJoiningDate);
  };

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-6">
        <TableHeader
          title="Appointment Letter"
          backButton={{
            href: selfEmployeeId ? "/employee/documents" : "/dashboard/documents",
            label: "Back",
          }}
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
              onClick: generate,
            },
          ]}
        />
<div className="w-full border-t border-gray-200 my-4"></div>
        <div className="px-6 py-6 space-y-6">
          {/* CARD */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Joining Information
            </h2> */}

            <div className="bg-white p-2 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {!selfEmployeeId && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                
                  <Combobox
                  value={employee}
                  onChange={async (e) => {
                    const nextEmployee = e || null;
                    setEmployee(nextEmployee);
                    if (!nextEmployee?.id) {
                      setEmployment(null);
                      setReportingManager("");
                      setWorkLocation("");
                      return;
                    }
                    const nextEmployment = await getEmploymentForEmployee(nextEmployee.id);
                    setEmployment(nextEmployment || null);
                    autoFillDatesFromEmployment(nextEmployment);
                  }}
                >
                  <div className="relative">
                
                    <Combobox.Input
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Select or Search employee..."
                      displayValue={(emp) => emp?.name ?? ""}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    {employee && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmployee(null);
                          setEmployment(null);
                          setSearchTerm("");
                          setReportingManager("");
                          setWorkLocation("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Clear selected employee"
                        title="Clear"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                
                    <Combobox.Options className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                      {candidates
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(emp => (
                          <Combobox.Option
                            key={emp.id}
                            value={emp}
                            className={({ active }) =>
                              `cursor-pointer px-3 py-2 ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`
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
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Department
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Designation
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Enter designation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Reporting Manager
                  </label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                  >
                    <option value="">Select Reporting Manager</option>
                    {reportingManagerSelectOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Document Generate Date
                  </label>
                  <DateDropdown value={documentGenerateDate} onChange={setDocumentGenerateDate} />
                  <button
                    type="button"
                    onClick={() => useEmploymentJoiningDateFor(setDocumentGenerateDate)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Joining Date
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Joining Date
                  </label>
                  <DateDropdown value={joiningDate} onChange={setJoiningDate} />
                  <button
                    type="button"
                    onClick={() => useEmploymentJoiningDateFor(setJoiningDate)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Joining Date
                  </button>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
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
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Annual CTC
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={annualCTC}
                    placeholder="Enter annual CTC"
                    onChange={(e) => setAnnualCTC(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Probation Period
                  </label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={probation}
                    onChange={(e) => setProbation(e.target.value)}
                  >
                    <option value="">Select Probation</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                  </select>
                </div>

                <div>
  <label className="block text-sm font-medium text-slate-800 mb-1">
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
          <div className="-mx-6 border-t border-gray-200 my-4"></div>
          <div className="px-0 pt-0 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FiX size={16} />
              Cancel
            </button>

            <button
              type="button"
              disabled={!canGenerate}
              onClick={generate}
              className={`flex items-center px-6 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                canGenerate
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FiDownload size={18} className="mr-2" />
              <span>Generate</span>
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
                    documentGenerateDate={documentGenerateDate}
                  />
                }
                fileName={`Joining_${employee.name}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiDownload size={18} className="shrink-0" aria-hidden />
                Download PDF
              </PDFDownloadLink>
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
                documentGenerateDate={documentGenerateDate}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}
