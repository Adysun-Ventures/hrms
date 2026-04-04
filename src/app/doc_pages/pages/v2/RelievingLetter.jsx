"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiX } from "react-icons/fi";
import TableHeader from "@/components/ui/TableHeader";

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
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
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

const Watermark = ({ logoSrc }) => {
  if (!logoSrc) return null;
  return (
    <View style={offerLetterStyles.watermark}>
      <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
    </View>
  );
};

const formatDate = (d) => {
  if (!d) return "";
  try {
    return formatDateToDayMonYear(d);
  } catch (err) {
    return d;
  }
};

const toTitleCaseRelief = (str) =>
  str?.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "";

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
    // Sync only when parent has a complete ISO date string.
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  useEffect(() => {
    // If selected day becomes invalid after month/year change, clear it.
    if (day && Number(day) > maxDays) {
      setDay("");
    }
  }, [month, year, maxDays, day]);

  const emitIfComplete = (nextYear, nextMonth, nextDay) => {
    if (nextYear && nextMonth && nextDay) {
      onChange(`${nextYear}-${nextMonth}-${nextDay}`);
    }
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
async function buildRelievingLetterDocx(employee, employment, employeeSignDate, employeeSignPlace, employeeRelievingDate, employeeResignDate, designationOverride) {
  const employeeName = employee?.name || "";
  const designation = designationOverride || employment?.jobTitle || employment?.designation || "";
  const joiningDate = employment?.joiningDate || employment?.startDate || "";
  const shortName = employeeName.split(" ")[0] || employeeName;
  const resignDate = formatDate(employeeResignDate);
  const relievingDate = formatDate(employeeRelievingDate);
  const signDate = formatDate(employeeSignDate);
  const joinDate = formatDate(joiningDate);
  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: signDate })] }),
    new Paragraph({ children: [new TextRun({ text: toTitleCaseRelief(employeeName), bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "RELIEVING LETTER", bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCaseRelief(shortName)},` })] }),
    new Paragraph({ children: [new TextRun({ text: "This is with reference to your resignation dated " }), new TextRun({ text: resignDate, bold: true }), new TextRun({ text: "." })] }),
    ...(designation
      ? [new Paragraph({ children: [new TextRun({ text: "You served in the role of " }), new TextRun({ text: designation, bold: true }), new TextRun({ text: "." })] })]
      : []),
    new Paragraph({ text: "During your tenure with the company, you performed your duties responsibly and professionally, and maintained a positive attitude towards work and colleagues." }),
    new Paragraph({ children: [new TextRun({ text: "We hereby confirm that you have been formally relieved from your services effective end of day " }), new TextRun({ text: relievingDate, bold: true }), new TextRun({ text: "." })] }),
    new Paragraph({ text: "Further, you have completed all required exit formalities including handover of company assets, documentation, access rights and clearance." }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Acknowledgement and Acceptance", bold: true, underline: {} })] }),
    new Paragraph({
      text:
        "I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this appointment letter. I accept the offer of employment with Adysun Ventures Private Limited.",
    }),
    new Paragraph({ children: [new TextRun({ text: "Candidate Name: " }), new TextRun({ text: toTitleCaseRelief(employeeName), bold: true })] }),
    new Paragraph({ text: "Signature: ________________________________" }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Place: " }), new TextRun({ text: employeeSignPlace || "" })] }),
    new Paragraph({ children: [new TextRun({ text: "Date: " }), new TextRun({ text: signDate })] }),
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.hrName, bold: true })] }),
    new Paragraph({ text: COMPANY_DATA.hrDesignation }),
    new Paragraph({ text: COMPANY_DATA.hrEmail }),
  ];
  return await createAdysunDocx({ children });
}

/* ---------------- RELIEVING PDF ---------------- */
const RelievingLetterPDF = ({
  employee,
  employment,
  employeeSignDate,
  employeeSignPlace,
  employeeRelievingDate,
  employeeResignDate,
  designationOverride
}) => {

  const employeeName = employee?.name || "";
  const designation = designationOverride || employment?.jobTitle || employment?.designation || "";
  const joiningDate = employment?.joiningDate || employment?.startDate || "";

  const shortName = employeeName.split(" ")[0];

  const resignDate = formatDate(employeeResignDate);
  const relievingDate = formatDate(employeeRelievingDate);
  const signDate = formatDate(employeeSignDate);
  const joinDate = formatDate(joiningDate);

  const rawAddress = employee?.currentAddress || employee?.permanentAddress || "";
  const fullAddress = rawAddress
    ? rawAddress.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean)
    : [];
  const shortAddress = fullAddress.slice(-2);
   const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

  return (
    <Document>
      <Page
        size="A4"
        style={{ padding: 35, fontSize: 12, lineHeight: 1.45, position: "relative" }}
      >
        <Watermark logoSrc={COMPANY_DATA.logo} />

        {/* HEADER */}
        {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#d42626" }}>
              {COMPANY_DATA.name}
            </Text>
            <Text style={{ fontSize: 11, marginTop: 4 }}>{COMPANY_DATA.contact}</Text>
            {(() => {
              const parts = COMPANY_DATA.address.split(/[,;\n]+/).map(v => v.trim());
              const mid = Math.ceil(parts.length / 2);
              return (
                <>
                  <Text style={{ fontSize: 11, marginTop: 4 }}>{parts.slice(0, mid).join(", ")}</Text>
                  <Text style={{ fontSize: 11 }}>{parts.slice(mid).join(", ")}</Text>
                </>
              );
            })()}
          </View>
          <Image src={COMPANY_DATA.logo} style={{ width: 55, height: 55 }} />
        </View> */}
        <GlobalPDFHeader />

        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        {/* DATE + ADDRESS */}
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {signDate}
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

        {designation && (
          <Text style={{ marginBottom: 10 }}>
            You served in the role of <Text style={{ fontWeight: "bold" }}>{designation}</Text>.
          </Text>
        )}

        <Text style={{ marginBottom: 10 }}>
          During your tenure with the company, you performed your duties responsibly and professionally, and maintained a positive attitude towards work and colleagues.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We hereby confirm that you have been formally relieved from your services effective end of day{" "}
          <Text style={{ fontWeight: "bold" }}>{relievingDate}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Further, you have completed all required exit formalities including handover of company assets, documentation, access rights and clearance.
        </Text>

        <Text style={{ marginBottom: 10, fontWeight: "bold", textDecoration: "underline" }}>
          Acknowledgement and Acceptance
        </Text>
        <Text style={{ marginBottom: 10 }}>
          I hereby acknowledge that I have read, understood, and agreed to the terms and conditions outlined in this Relieving Letter. I accept the relieving of employment with Adysun Ventures Private Limited.
        </Text>
        <Text style={{ marginBottom: 6 }}>
          Candidate Name: <Text style={{ fontWeight: "bold" }}>{toTitleCaseRelief(employeeName)}</Text>
        </Text>
        <Text style={{ marginBottom: 10 }}>Signature: ________________________________</Text>


        {/* SIGN SECTION */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 30 }}>
          <View>
            <Text><Text style={{ fontWeight: "bold" }}>Place:</Text> {employeeSignPlace}</Text>
            <Text style={{ marginTop: 4 }}><Text style={{ fontWeight: "bold" }}>Date:</Text> {signDate}</Text>
          </View>

          <View style={{ width: "45%", alignItems: "flex-end" }}>
  <Image
    src={COMPANY_DATA.signature}
    style={{ width: 120, height: 55, marginBottom: 2 }}
  />
  
  <Text style={{ fontWeight: "bold", textAlign: "right" }}>
    {COMPANY_DATA.hrName}
  </Text>
  <Text style={{ textAlign: "right" }}>
    {COMPANY_DATA.hrDesignation}
  </Text>
  <Text style={{ textAlign: "right" }}>
    {COMPANY_DATA.hrEmail}
  </Text>
</View>

        </View>
         <View style={{ flexGrow: 1 }} />

        <GlobalPDFFooter />
      </Page>
    </Document>
  );
};

/* ---------------- MAIN UI COMPONENT ---------------- */
function RelievingLetterV2() {
  const { currentUserData } = useAuth();
  const selfEmployeeId = currentUserData?.userType === "employee" ? currentUserData?.id : null;

  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

  const [employeeSignDate, setEmployeeSignDate] = useState("");
  const [employeeSignPlace, setEmployeeSignPlace] = useState("");
  const [employeeRelievingDate, setEmployeeRelievingDate] = useState("");
  const [employeeResignDate, setEmployeeResignDate] = useState("");
  const [designationOverride, setDesignationOverride] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, [selfEmployeeId]);

  const normalizeDateForInput = (value) => {
    if (!value) return "";
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const fetchEmployees = async () => {
    const qs = await getDocs(collection(db, "employees"));
    const list = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const visible = selfEmployeeId ? list.filter((e) => e.id === selfEmployeeId) : list;
    setCandidates(visible);

    const map = {};
    const es = await getDocs(collection(db, "employments"));
    es.forEach(d => map[d.data().employeeId] = d.data());
    setEmployments(map);

    if (selfEmployeeId && visible.length > 0) {
      const selfEmp = visible[0];
      setEmployee(selfEmp);
      setEmployment(map[selfEmp.id] || null);
    }
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setEmployee(candidates.find(x => x.id === id) || null);
    setEmployment(employments[id] || null);
  };

  const canGenerate = Boolean(
    employee &&
    employeeSignDate &&
    employeeRelievingDate &&
    employeeResignDate &&
    employeeSignPlace
  );
   

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <TableHeader
          title="Relieving Letter"
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
              onClick: () => {
                if (!employee) return toast.error("Select employee");
                if (!employeeSignDate) return toast.error("Select sign date");
                if (!employeeRelievingDate) return toast.error("Select relieving date");
                if (!employeeResignDate) return toast.error("Select resign date");
                if (!employeeSignPlace) return toast.error("Enter sign place");
                setShowPDF(true);
              },
            },
          ]}
        />
    <div className="-mx-6 border-t border-gray-200 my-4"></div>
        <div className="p-6 space-y-6">
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Relieving Information
            </h2> */}

            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Employee */}
                {!selfEmployeeId && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                
                  <Combobox
                  value={employee}
                  onChange={(e) => {
                    const selectedEmployee = e || null;
                    const selectedEmployment = employments[selectedEmployee?.id] || null;
                    setEmployee(selectedEmployee);
                    setEmployment(selectedEmployment);
                    setSearchTerm("");

                    // Auto-fill from employment
                    const joiningDateForDoc = normalizeDateForInput(
                      selectedEmployment?.joiningDate || selectedEmployment?.startDate || ""
                    );
                    const resignDate = normalizeDateForInput(
                      selectedEmployment?.resignationDate ||
                      selectedEmployment?.resignedDate ||
                      selectedEmployment?.lastWorkingDate ||
                      ""
                    );

                    setEmployeeSignDate(joiningDateForDoc || "");
                    setEmployeeResignDate(resignDate || "");
                    setEmployeeRelievingDate(resignDate || "");
                    setDesignationOverride(
                      selectedEmployment?.jobTitle || selectedEmployment?.designation || ""
                    );
                    setEmployeeSignPlace(selectedEmployment?.location || "");
                  }}
                >
                  <div className="relative">
                
                    <Combobox.Input
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Select or Search employee..."
                      displayValue={(emp) => emp?.name ?? ""}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    {(employee || searchTerm) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmployee(null);
                          setEmployment(null);
                          setSearchTerm("");
                          setShowPDF(false);
                          setEmployeeSignDate("");
                          setEmployeeSignPlace("");
                          setEmployeeRelievingDate("");
                          setEmployeeResignDate("");
                          setDesignationOverride("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Clear employee selection"
                        title="Clear"
                      >
                        <FiX className="w-4 h-4" />
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
                

                {/* Sign Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Document Generate Date
                  </label>
                  <DateDropdown
                    value={employeeSignDate}
                    onChange={setEmployeeSignDate}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const joiningDateForDoc = normalizeDateForInput(
                        employment?.joiningDate || employment?.startDate || ""
                      );
                      if (!joiningDateForDoc) {
                        toast.error("Joining date is not available for selected employee");
                        return;
                      }
                      setEmployeeSignDate(joiningDateForDoc);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Use Joining Date
                  </button>
                </div>

                {/* Effective Relieving Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Effective Relieving Date
                  </label>
                  <DateDropdown
                    value={employeeRelievingDate}
                    onChange={setEmployeeRelievingDate}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const resignDate = normalizeDateForInput(
                        employment?.resignationDate ||
                        employment?.resignedDate ||
                        employment?.lastWorkingDate ||
                        ""
                      );
                      if (!resignDate) {
                        toast.error("Resign date is not available for selected employee");
                        return;
                      }
                      setEmployeeRelievingDate(resignDate);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Use Resign Date
                  </button>
                </div>

                {/* Resignation Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    <span className="text-red-500">*</span> Employee Resign Date
                  </label>
                  <DateDropdown
                    value={employeeResignDate}
                    onChange={setEmployeeResignDate}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const resignDate = normalizeDateForInput(
                        employment?.resignationDate ||
                        employment?.resignedDate ||
                        employment?.lastWorkingDate ||
                        ""
                      );
                      if (!resignDate) {
                        toast.error("Resign date is not available for selected employee");
                        return;
                      }
                      setEmployeeResignDate(resignDate);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Use Resign Date
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-md"
                    value={designationOverride}
                    onChange={(e) => setDesignationOverride(e.target.value)}
                    placeholder="Enter designation"
                  />
                </div>

                {/* Place */}
               <div>
  <label className="block text-sm font-medium text-slate-800 mb-1">
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
          <div className="pt-4 flex items-center justify-between mt-4">
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
              onClick={() => {
                if (!employee) return toast.error("Select employee");
                if (!employeeSignDate) return toast.error("Select sign date");
                if (!employeeRelievingDate) return toast.error("Select relieving date");
                if (!employeeResignDate) return toast.error("Select resign date");
                if (!employeeSignPlace) return toast.error("Enter sign place");
                setShowPDF(true);
              }}
              className={`flex items-center px-6 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                canGenerate
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <FiDownload size={18} className="mr-2" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* PDF PREVIEW */}
      {showPDF && employee && employment && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

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
                    designationOverride={designationOverride}
                  />
                }
                fileName={`Relieving_${employee.name}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                key={Date.now()}
              >
                <FiDownload size={18} className="shrink-0" aria-hidden />
                Download PDF
              </PDFDownloadLink>
            </div>
          </div>

          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg" key={Date.now()}>
              <RelievingLetterPDF
                employee={employee}
                employment={employment}
                employeeSignDate={employeeSignDate}
                employeeSignPlace={employeeSignPlace}
                employeeRelievingDate={employeeRelievingDate}
                employeeResignDate={employeeResignDate}
                designationOverride={designationOverride}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelievingLetterV2;
