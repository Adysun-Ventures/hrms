"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "react-hot-toast";
import EmployeeLayout from "@/components/layout/EmployeeLayout";
import { useAuth } from "@/context/AuthContext";
import { getEmployeeSelf, getEmployeeSelfEmployment } from "@/utils/firebaseUtils";
import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View
} from "@react-pdf/renderer";
import { formatIndianCurrency, numberToWords } from "@/components/pdf/SalaryUtils";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

/* ================= TYPES ================= */

interface Employee {
  id: string;
  name: string;
  employeeId?: string;
}

interface Employment {
  salary?: number;
  jobTitle?: string;
  department?: string;
  location?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  panNumber?: string;
}

interface FormDataType {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  location: string;
  month: number;
  year: number;
  leaves: number;
  payableDays: number;
  enablePF: boolean;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  panNumber: string;
  basicSalary: number;
  da: number;
  conveyanceAllowance: number;
  otherAllowance: number;
  professionalTax: number;
  pfEmployee: number;
  leavesDeduction: number;
}

/* ================= HELPERS ================= */

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month + 1, 0).getDate();

const getTotalEarnings = (f: FormDataType) =>
  f.basicSalary + f.da + f.conveyanceAllowance + f.otherAllowance;

const getTotalDeductions = (f: FormDataType) =>
  f.professionalTax + f.pfEmployee + f.leavesDeduction;

const getNetSalary = (f: FormDataType) =>
  getTotalEarnings(f) - getTotalDeductions(f);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ================= SALARY CALC ================= */

const calculateSalary = (
  annualCTC: number,
  leaves: number,
  month: number,
  year: number,
  enablePF: boolean
): Partial<FormDataType> => {

  const monthly = annualCTC / 12;
  const days = getDaysInMonth(month, year);

  const basic = Math.round(monthly * 0.5);
  const da = Math.round(basic * 0.2);
  const convey = 1600;
  const other = Math.max(0, monthly - basic - da - convey);

  const perDay = monthly / days;
  const leavesDeduction = Math.round(perDay * leaves);

  const pt = 200;
  const pf = enablePF ? Math.round(basic * 0.12) : 0;

  return {
    basicSalary: basic,
    da,
    conveyanceAllowance: convey,
    otherAllowance: other,
    professionalTax: pt,
    pfEmployee: pf,
    leavesDeduction,
    payableDays: days - leaves,
  };
};



/* ================= PDF ================= */

const SalarySlipPDF: React.FC<{ formData: FormDataType }> = ({ formData }) => {

  const totalEarnings = getTotalEarnings(formData);
  const totalDeductions = getTotalDeductions(formData);
  const net = getNetSalary(formData);

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <Document>
      <Page size="A4" style={{ padding: 35, fontSize: 10 }}>

        <GlobalPDFHeader />
        <View style={{ borderBottomWidth: 1, marginBottom: 10 }} />

        <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, marginBottom: 8 }}>
          Salary Slip - {MONTH_NAMES[formData.month]} {formData.year}
        </Text>

        {/* EMPLOYEE DETAILS TABLE */}
        <View style={{ borderWidth: 1, marginBottom: 10 }}>
          {[
            { label: "Employee Name", value: formData.employeeName },
            { label: "Employee Code", value: formData.employeeId },
            { label: "Designation", value: formData.designation },
            { label: "Department", value: formData.department },
            { label: "Location", value: formData.location },
            { label: "PAN Number", value: formData.panNumber },
            { label: "Bank Name", value: formData.bankName },
            { label: "Account Number", value: formData.accountNo },
            { label: "IFSC Code", value: formData.ifscCode },
            { label: "Payable Days", value: formData.payableDays },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                borderBottomWidth: i === arr.length - 1 ? 0 : 0.5
              }}
            >
              <Text style={{ width: "40%", padding: 4, borderRightWidth: 0.5, fontWeight: "bold" }}>
                {row.label}
              </Text>
              <Text style={{ width: "60%", padding: 4 }}>
                {row.value || "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* EARNINGS & DEDUCTIONS */}
        <View style={{ flexDirection: "row", borderWidth: 1 }}>

          {/* Earnings */}
          <View style={{ width: "50%", borderRightWidth: 0.5 }}>
            <View style={{ flexDirection: "row", backgroundColor: "#eee", borderBottomWidth: 0.5 }}>
              <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Earnings (A)</Text>
              <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>Amount</Text>
            </View>

            {[
              { label: "Basic", value: formData.basicSalary },
              { label: "DA", value: formData.da },
              { label: "Conveyance", value: formData.conveyanceAllowance },
              { label: "Other Allowance", value: formData.otherAllowance },
            ].map(item => (
              <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.5 }}>
                <Text style={{ width: "60%", padding: 4 }}>{item.label}</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right" }}>
                  {formatIndianCurrency(item.value)}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", backgroundColor: "#eee" }}>
              <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Gross Salary</Text>
              <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
                {formatIndianCurrency(totalEarnings)}
              </Text>
            </View>
          </View>

          {/* Deductions */}
          <View style={{ width: "50%" }}>
            <View style={{ flexDirection: "row", backgroundColor: "#eee", borderBottomWidth: 0.5 }}>
              <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Deductions (B)</Text>
              <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>Amount</Text>
            </View>

            {[
              { label: "Professional Tax", value: formData.professionalTax },
              ...(formData.enablePF
                ? [{ label: "PF (Employee)", value: formData.pfEmployee }]
                : []),
              { label: "Leave Deduction", value: formData.leavesDeduction },
            ].map(item => (
              <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.5 }}>
                <Text style={{ width: "60%", padding: 4 }}>{item.label}</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right" }}>
                  {formatIndianCurrency(item.value)}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", backgroundColor: "#eee" }}>
              <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Total Deductions</Text>
              <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
                {formatIndianCurrency(totalDeductions)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ borderWidth: 1, marginTop: 8, backgroundColor: "#eee" }}>
          <View style={{ flexDirection: "row" }}>
            <Text style={{ width: "50%", padding: 5, fontWeight: "bold", borderRightWidth: 0.5 }}>
              Net Salary (A - B)
            </Text>
            <Text style={{ width: "50%", padding: 5, textAlign: "right", fontWeight: "bold" }}>
               {formatIndianCurrency(net)}
            </Text>
          </View>
        </View>

        

        <Text style={{ marginTop: 12, textAlign: "center", fontSize: 8 }}>
          This is a system generated salary slip and does not require signature.
        </Text>

        <GlobalPDFFooter />
      </Page>
    </Document>
  );
};

/* ================= MAIN ================= */

const EmployeeSalarySlip: React.FC = () => {

  const { currentUserData } = useAuth();
  const [employment, setEmployment] = useState<Employment | null>(null);
  const [showPDF, setShowPDF] = useState(false);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<FormDataType>({
    employeeName: "",
    employeeId: "",
    designation: "",
    department: "",
    location: "",
    month: new Date().getMonth(),
    year: currentYear,
    leaves: 0,
    payableDays: 30,
    enablePF: false,
    bankName: "",
    accountNo: "",
    ifscCode: "",
    panNumber: "",
    basicSalary: 0,
    da: 0,
    conveyanceAllowance: 0,
    otherAllowance: 0,
    professionalTax: 0,
    pfEmployee: 0,
    leavesDeduction: 0,
  });

  const canGenerate = Boolean(
    formData.employeeName && Number.isFinite(formData.month) && formData.year
  );

  useEffect(() => {
    if (!currentUserData?.id) return;

    (async () => {
      try {
        const emp = await getEmployeeSelf(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);

        if (!emp || !empm?.[0]) return;

        setEmployment(empm[0]);

        const parts = calculateSalary(
          empm[0].salary || 0,
          0,
          formData.month,
          formData.year,
          false
        );

        setFormData(prev => ({
          ...prev,
          employeeName: emp.name,
          employeeId: String(emp.employeeId || emp.id),
          designation: empm[0].jobTitle || "",
          department: empm[0].department || "",
          location: empm[0].location || "",
          bankName: empm[0].bankName || "",
          accountNo: empm[0].accountNo || "",
          ifscCode: empm[0].ifscCode || "",
          panNumber: empm[0].panNumber || "",
          ...parts
        }));

      } catch {
        toast.error("Failed to load employee data");
      }
    })();
  }, [currentUserData]);

  useEffect(() => {
    if (!employment?.salary) return;

    const parts = calculateSalary(
      employment.salary,
      formData.leaves,
      formData.month,
      formData.year,
      formData.enablePF
    );

    setFormData(prev => ({ ...prev, ...parts }));

  }, [formData.leaves, formData.month, formData.enablePF]);

  const memoPDF = useMemo(
    () => <SalarySlipPDF formData={formData} />,
    [formData]
  );

return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Salary Slip", isCurrent: true }
    ]}
  >
    <Toaster position="top-center" />

    {/* ================= MAIN CARD ================= */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex items-center">
        <div className="w-1/3 flex justify-start">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition bg-white"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Salary Slip
          </h1>
        </div>

        <div className="w-1/3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowPDF(true)}
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

      {/* FORM BODY */}
      <div className="p-8 space-y-8">

        {/* ================= DETAILS CARD ================= */}
        <div>

          <h3 className="text-lg font-semibold text-gray-800 mb-6 border-l-4 border-blue-600 pl-3">
            Salary Slip Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                readOnly
                value={formData.employeeName}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.month}
                onChange={(e) =>
                  setFormData(p => ({ ...p, month: Number(e.target.value) }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) =>
                  setFormData(p => ({ ...p, year: Number(e.target.value) }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from(
                  { length: (currentYear + 2) - 2020 + 1 },
                  (_, i) => 2020 + i
                ).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Leaves */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaves <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaves}
                onChange={(e) =>
                  setFormData(p => ({ ...p, leaves: Number(e.target.value) }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {/* PF Toggle */}
            <div className="flex items-center gap-3 mt-8">
              <input
                type="checkbox"
                checked={formData.enablePF}
                onChange={(e) =>
                  setFormData(p => ({ ...p, enablePF: e.target.checked }))
                }
                className="h-5 w-5 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Apply PF Deduction
              </span>
            </div>

          </div>
        </div>

        {/* ================= FOOTER ACTIONS ================= */}
        <div className="-mx-8 px-8 border-t border-gray-200 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowPDF(true)}
            className="bg-green-600 hover:bg-green-700 transition-all duration-200 text-white px-8 py-3 rounded-xl shadow-md font-medium"
          >
            Generate
          </button>
        </div>

      </div>
    </div>

    {/* ================= PDF CARD ================= */}
    {showPDF && (
      <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

        {/* PDF HEADER */}
        <div className="flex justify-between items-center px-8 py-5 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Salary Slip Preview
          </h3>

          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={memoPDF}
              fileName={`SalarySlip_${formData.employeeName}_${formData.month + 1}.pdf`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Download PDF
            </PDFDownloadLink>
          </div>
        </div>

        {/* PDF VIEWER */}
        <div className="h-[80vh] p-6 bg-gray-100">
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
            <PDFViewer width="100%" height="100%">
              {memoPDF}
            </PDFViewer>
          </div>
        </div>

      </div>
    )}

  </EmployeeLayout>
);


};

export default EmployeeSalarySlip;
