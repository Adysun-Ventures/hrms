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
import { Combobox } from "@headlessui/react";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";

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

const Watermark = ({ logoSrc }) => (
  <View style={offerLetterStyles.watermark}>
    <Image src={logoSrc} style={offerLetterStyles.watermarkImage} />
  </View>
);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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
async function buildAppraisalLetterDocx(employee, currentCTC, percentIncrease, revisedCTC, effectiveDate) {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0] || employeeName;
  const formattedCurrent = Number(currentCTC).toLocaleString("en-IN");
  const formattedRevised = Number(revisedCTC).toLocaleString("en-IN");
  const formattedEffective = formatDate(effectiveDate);
  const today = formatDate(new Date());
  const children = [
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.name, bold: true })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: today })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "INCREMENT LETTER", bold: true, underline: {} })], alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${toTitleCase(shortName)},` })] }),
    new Paragraph({
      children: [
        new TextRun({ text: "I am pleased to inform you that due to your consistent outstanding performance and dedication to your role, we are providing you with a salary increment effective from " }),
        new TextRun({ text: formattedEffective, bold: true }),
        new TextRun({ text: "." }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Your new annual CTC will be " }),
        new TextRun({ text: formattedRevised, bold: true }),
        new TextRun({ text: " which is an increase from your previous annual CTC of " }),
        new TextRun({ text: formattedCurrent, bold: true }),
        new TextRun({ text: "." }),
      ],
    }),
    new Paragraph({ text: "We appreciate your continuous hard work and commitment and we believe you will continue to excel and contribute towards the company's success." }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Effective: " }), new TextRun({ text: formattedEffective })] }),
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.hrName, bold: true })] }),
    new Paragraph({ text: COMPANY_DATA.hrDesignation }),
    new Paragraph({ text: COMPANY_DATA.hrEmail }),
  ];
  return await createAdysunDocx({ children });
}

/* ---------------- PDF COMPONENT ---------------- */
const AppraisalLetterPDF = ({
  employee,
  currentCTC,
  percentIncrease,
  revisedCTC,
  effectiveDate
}) => {
  const employeeName = employee?.name || "";
  const shortName = employeeName.split(" ")[0];
  const formattedCurrent = Number(currentCTC).toLocaleString("en-IN");
  const formattedRevised = Number(revisedCTC).toLocaleString("en-IN");
  const formattedEffective = formatDate(effectiveDate);
  const today = formatDate(new Date());
  

  return (
    <Document>
      <Page
        size="A4"
        style={{ padding: 35, fontSize: 12, lineHeight: 1.45, position: "relative" }}
      >
        <Watermark logoSrc={COMPANY_DATA.logo} />

        {/* HEADER */}
        {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View>
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
        <GlobalPDFHeader/>

        <View style={{ borderBottom: "1px solid #000", marginBottom: 16 }} />

        {/* DATE + NAME */}
        <Text style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold" }}>Date:</Text> {today}
        </Text>

        

        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            textDecoration: "underline",
            textAlign: "center",
            marginBottom: 14
          }}
        >
          INCREMENT LETTER
        </Text>

        {/* BODY */}
        <Text style={{ marginBottom: 10 }}>Dear {toTitleCase(shortName)},</Text>

        <Text style={{ marginBottom: 10 }}>
          I am pleased to inform you that due to your consistent outstanding performance and dedication to your role, we are providing you with a salary increment effective from <Text style={{ fontWeight: "bold" }}>{formattedEffective}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your new annual CTC will be <Text style={{ fontWeight: "bold" }}> {formattedRevised}</Text> which is an increase from your previous annual CTC of <Text style={{ fontWeight: "bold" }}> {formattedCurrent}</Text>.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Your recent contributions across various responsibilities and deliverables have not gone unnoticed, and this increment reflects our recognition of your continued efforts and commitment towards the goals of the organization.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          We appreciate your continuous hard work and commitment to <Text style={{ fontWeight: "bold" }}>{COMPANY_DATA.name}</Text>, and we believe you will continue to excel and contribute towards the company’s success.
        </Text>

        <Text style={{ marginBottom: 10 }}>
          Thank you for being an integral part of our team. We look forward to seeing your continued growth and success.
        </Text>

        {/* SIGN */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40 }}>
          <View>
            {/* <Text><Text style={{ fontWeight: "bold" }}>Place:</Text> Pune</Text> */}
            <Text style={{ marginTop: 4 }}><Text style={{ fontWeight: "bold" }}>Effective:</Text> {formattedEffective}</Text>
          </View>

          <View style={{ width: "45%", textAlign: "right" }}>
            <Image
              src={COMPANY_DATA.signature}
              style={{ width: 120, height: 50, marginBottom: 4, alignSelf: "flex-end" }}
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
export default function AppraisalLetterV2() {
  const [candidates, setCandidates] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [currentCTC, setCurrentCTC] = useState("");
  const [percentIncrease, setPercentIncrease] = useState("");
  const [revisedCTC, setRevisedCTC] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [showPDF, setShowPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employments, setEmployments] = useState({});
  const [employment,setEmployment] = useState({})

  useEffect(() => {
    async function load() {
      const qs = await getDocs(collection(db, "employees"));
      setCandidates(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  const canGenerate = Boolean(
    employee &&
    currentCTC &&
    percentIncrease &&
    revisedCTC &&
    effectiveDate
  );

  const calcRevised = (current, percent) => {
    if (!current || !percent) return "";
    return (Number(current) + Number(current) * (percent / 100)).toFixed(0);
  };

  const calcPercent = (current, revised) => {
    if (!current || !revised) return "";
    return (((revised - current) / current) * 100).toFixed(2);
  };

  const onPercentChange = (v) => {
    setPercentIncrease(v);
    setRevisedCTC(calcRevised(currentCTC, v));
  };

  const onRevisedChange = (v) => {
    setRevisedCTC(v);
    setPercentIncrease(calcPercent(currentCTC, v));
  };

  const generate = () => {
    if (!employee) return toast.error("Select employee");
    if (!currentCTC) return toast.error("Enter current CTC");
    if (!percentIncrease) return toast.error("Enter % increase");
    if (!revisedCTC) return toast.error("Revised CTC missing");
    if (!effectiveDate) return toast.error("Select effective date");
    setShowPDF(true);
  };

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Increment Letter"
          backButton={{ href: "/dashboard/documents", label: "Back" }}
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
        <div className="p-6 space-y-6">

          {/* SECTION CARD */}
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Increment Information
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
                    Current CTC (Annual) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={currentCTC}
                    onChange={(e) => setCurrentCTC(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    % Increase <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={percentIncrease}
                    onChange={(e) => onPercentChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Revised CTC (Annual) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={revisedCTC}
                    onChange={(e) => onRevisedChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Effective Date <span className="text-red-500">*</span>
                  </label>
                  <DateDropdown value={effectiveDate} onChange={setEffectiveDate} />
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
        <div className="bg-white rounded-lg shadow-lg p-4 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">PDF Preview</h3>

            <div className="flex items-center gap-2">
              <PDFDownloadLink
                document={
                  <AppraisalLetterPDF
                    employee={employee}
                    currentCTC={currentCTC}
                    percentIncrease={percentIncrease}
                    revisedCTC={revisedCTC}
                    effectiveDate={effectiveDate}
                  />
                }
                fileName={`Appraisal_${employee.name}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Download PDF
              </PDFDownloadLink>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const doc = await buildAppraisalLetterDocx(
                      employee,
                      currentCTC,
                      percentIncrease,
                      revisedCTC,
                      effectiveDate
                    );
                    const blob = await Packer.toBlob(doc);
                    saveAs(blob, `IncrementLetter_${(employee.name || "").replace(/\s+/g, "_")}.docx`);
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
            <PDFViewer width="100%" height="100%">
              <AppraisalLetterPDF
                employee={employee}
                currentCTC={currentCTC}
                percentIncrease={percentIncrease}
                revisedCTC={revisedCTC}
                effectiveDate={effectiveDate}
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}