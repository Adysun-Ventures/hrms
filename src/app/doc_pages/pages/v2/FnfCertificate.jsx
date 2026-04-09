"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";
import TableHeader from "@/components/ui/TableHeader";
import { Combobox } from "@headlessui/react";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { createAdysunDocx } from "@/utils/docxAdysun";
import { getEmployeeSalaries } from "@/utils/firebaseUtils";

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
const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDateDDMMYYYY = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const asNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value) => asNumber(value).toFixed(2);

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  heading: { fontSize: 16, textAlign: "center", fontWeight: "bold", marginBottom: 10 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#D9D9D9", marginVertical: 8 },
  row: { marginBottom: 3 },
  label: { fontWeight: "bold" },
  paragraph: { marginBottom: 8 },
  bullet: { marginLeft: 10, marginBottom: 3 },
  net: { fontSize: 12, fontWeight: "bold", marginVertical: 4 },
  signWrap: { marginTop: 24 },
});

const FnfCertificatePDF = ({ model }) => {
  const netAmount = asNumber(model.totalSalaryPaid);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>FULL & FINAL SETTLEMENT CERTIFICATE</Text>
        <View style={styles.divider} />

        <Text style={styles.row}>
          <Text style={styles.label}>Date: </Text>
          {formatDateDDMMYYYY(model.documentDate)}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Employee Name: </Text>
          {toTitleCase(model.employeeName)}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Employee ID: </Text>
          {model.employeeCode || "-"}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Designation: </Text>
          {model.designation || "-"}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Department: </Text>
          {model.department || "-"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          <Text style={styles.label}>Subject: </Text>
          Full & Final Settlement
        </Text>

        <Text style={styles.paragraph}>
          This is to certify that <Text style={styles.label}>{toTitleCase(model.employeeName)}</Text> was
          employed with <Text style={styles.label}>{model.companyName || COMPANY_DATA.name}</Text> from{" "}
          <Text style={styles.label}>{formatDateDDMMYYYY(model.joiningDate)}</Text> to{" "}
          <Text style={styles.label}>{formatDateDDMMYYYY(model.lastWorkingDate)}</Text>. The employee has
          completed all required formalities, and the company has processed their Full & Final Settlement.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          <Text style={styles.label}>Settlement Details:</Text>
        </Text>
        <Text style={styles.bullet}>- Salary up to last working day: Rs. {formatCurrency(model.salaryUpto)}</Text>
        <Text style={styles.bullet}>- Leave Encashment: Rs. {formatCurrency(model.leaveEncashment)}</Text>
        <Text style={styles.bullet}>- Bonus / Incentives: Rs. {formatCurrency(model.bonusIncentives)}</Text>
        <Text style={styles.bullet}>- Other Payables: Rs. {formatCurrency(model.otherPayables)}</Text>
        <Text style={styles.bullet}>- Deductions (if any): Rs. {formatCurrency(model.deductions)}</Text>

        <View style={styles.divider} />

        <Text style={styles.net}>Net Amount Paid: Rs. {formatCurrency(netAmount)}</Text>
        <Text style={styles.paragraph}>
          The above amount has been paid via <Text style={styles.label}>{model.paymentMode || "-"}</Text> on{" "}
          <Text style={styles.label}>{formatDateDDMMYYYY(model.paymentDate)}</Text>.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          We confirm that there are no pending dues from either side. The company has no further financial or
          legal obligations toward the employee.
        </Text>
        <Text style={styles.paragraph}>We wish them success in their future endeavors.</Text>

        <View style={styles.signWrap}>
          <Text style={styles.label}>Authorized Signatory</Text>
          <Text>{COMPANY_DATA.signatoryName}</Text>
          <Text>{COMPANY_DATA.signatoryDesignation}</Text>
          <Text>{model.companyName || COMPANY_DATA.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function FnfCertificate() {
  const { currentUserData } = useAuth();
  const selfEmployeeId = currentUserData?.userType === "employee" ? currentUserData.id : null;

  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPDF, setShowPDF] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [documentDate, setDocumentDate] = useState(today);
  const [paymentDate, setPaymentDate] = useState(today);
  const [joiningDateInput, setJoiningDateInput] = useState("");
  const [lastWorkingDateInput, setLastWorkingDateInput] = useState("");
  const [salaryUpto, setSalaryUpto] = useState("");
  const [leaveEncashment, setLeaveEncashment] = useState("");
  const [bonusIncentives, setBonusIncentives] = useState("");
  const [otherPayables, setOtherPayables] = useState("");
  const [deductions, setDeductions] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [designationOverride, setDesignationOverride] = useState("");
  const [departmentOverride, setDepartmentOverride] = useState("");
  const [salaryHistoryLines, setSalaryHistoryLines] = useState([]);
  const [totalSalaryPaid, setTotalSalaryPaid] = useState(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      const qs = await getDocs(collection(db, "employees"));
      const list = qs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const visible = selfEmployeeId ? list.filter((e) => e.id === selfEmployeeId) : list;
      setCandidates(visible);

      const map = {};
      for (const emp of visible) {
        const qSnap = await getDocs(query(collection(db, "employments"), where("employeeId", "==", emp.id)));
        if (!qSnap.empty) map[emp.id] = qSnap.docs[0].data();
      }
      setEmployments(map);

      if (selfEmployeeId && visible.length > 0) {
        const selfEmp = visible[0];
        const nextEmployment = map[selfEmp.id] || null;
        setEmployee(selfEmp);
        setEmployment(nextEmployment);
      }
    };

    fetchEmployees().catch((error) => {
      console.error("Error loading FNF data:", error);
      toast.error("Failed to load employee data");
    });
  }, [selfEmployeeId]);

  useEffect(() => {
    if (!employment) return;
    const designation = employment?.designation || employment?.jobTitle || "";
    const department = employment?.department || "";
    const joiningDate = employment?.joiningDate || employment?.startDate || "";
    const exitDate = employment?.lastWorkingDate || employment?.endDate || "";
    if (designation) setDesignationOverride(designation);
    if (department) setDepartmentOverride(department);
    if (joiningDate) setJoiningDateInput(String(joiningDate).slice(0, 10));
    if (exitDate) setLastWorkingDateInput(String(exitDate).slice(0, 10));
    if (exitDate) setPaymentDate(String(exitDate).slice(0, 10));
  }, [employment]);

  useEffect(() => {
    const loadLatestSalary = async () => {
      const employeeId = employee?.id;
      if (!employeeId) {
        setSalaryHistoryLines([]);
        setTotalSalaryPaid(0);
        return;
      }
      try {
        const salaries = await getEmployeeSalaries(employeeId);
        if (!Array.isArray(salaries) || salaries.length === 0) {
          setSalaryHistoryLines(["No salary record found"]);
          setTotalSalaryPaid(0);
          return;
        }

        const sorted = [...salaries].sort((a, b) => {
          const yearA = Number(a?.year) || 0;
          const yearB = Number(b?.year) || 0;
          if (yearB !== yearA) return yearB - yearA;
          const monthA = Number(a?.month) || 0;
          const monthB = Number(b?.month) || 0;
          return monthB - monthA;
        });

        let total = 0;
        const lines = sorted.map((item) => {
          const monthIndex = Math.max(0, Math.min(11, (Number(item?.month) || 1) - 1));
          const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
            monthIndex
          ];
          const year = String(item?.year || "");
          const amount = Number(item?.netSalary ?? item?.inhandSalary ?? 0) || 0;
          total += amount;
          return {
            year,
            period: `${monthShort} ${year}`,
            amount: `${amount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} Rs.`,
          };
        });
        setSalaryHistoryLines(lines);
        setTotalSalaryPaid(total);
      } catch {
        setSalaryHistoryLines(["Salary info unavailable"]);
        setTotalSalaryPaid(0);
      }
    };

    loadLatestSalary();
  }, [employee?.id]);

  const model = useMemo(() => {
    const employeeCode = String(
      employment?.employmentId || employee?.employeeId || employee?.id || ""
    ).trim();

    return {
      companyName: COMPANY_DATA.name,
      documentDate,
      employeeName: employee?.name || "",
      employeeCode,
      designation: designationOverride || employment?.designation || employment?.jobTitle || "",
      department: departmentOverride || employment?.department || "",
      joiningDate: joiningDateInput || employment?.joiningDate || employment?.startDate || "",
      lastWorkingDate: lastWorkingDateInput || employment?.lastWorkingDate || employment?.endDate || "",
      salaryUpto,
      leaveEncashment,
      bonusIncentives,
      otherPayables,
      deductions,
      paymentMode,
      paymentDate,
      totalSalaryPaid,
    };
  }, [
    documentDate,
    employee,
    employment,
    designationOverride,
    departmentOverride,
    joiningDateInput,
    lastWorkingDateInput,
    salaryUpto,
    leaveEncashment,
    bonusIncentives,
    otherPayables,
    deductions,
    paymentMode,
    paymentDate,
    totalSalaryPaid,
  ]);

  const canGenerate = true;

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <TableHeader
          title="FNF Certificate"
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
                if (!model.joiningDate) return toast.error("Select Joining Date");
                if (!model.lastWorkingDate) return toast.error("Select Last Working Date");
                setShowPDF(true);
              },
            },
          ]}
        />

        <div className="w-full border-t border-gray-200 my-4" />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              {!selfEmployeeId ? (
                <Combobox
                  value={employee}
                  onChange={(e) => {
                    const nextEmployee = e || null;
                    const nextEmployment = nextEmployee ? employments[nextEmployee.id] || null : null;
                    setEmployee(nextEmployee);
                    setEmployment(nextEmployment);
                  }}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-md"
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
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        title="Clear"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                    <Combobox.Options className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                      {candidates
                        .filter((c) => String(c.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((emp) => (
                          <Combobox.Option
                            key={emp.id}
                            value={emp}
                            className={({ active }) =>
                              `cursor-pointer px-3 py-2 ${
                                active ? "bg-blue-600 text-white" : "bg-white text-gray-900"
                              }`
                            }
                          >
                            {emp.name}
                          </Combobox.Option>
                        ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
              ) : (
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50"
                  value={employee?.name || ""}
                  readOnly
                />
              )}
            </div>
          </div>

          <div className="border border-gray-500 p-2 min-h-14 text-gray-900">
            {salaryHistoryLines.length > 0 ? (
              <div className="space-y-1">
                {typeof salaryHistoryLines[0] === "string" ? (
                  <p className="text-sm">{salaryHistoryLines[0]}</p>
                ) : (
                  (() => {
                    const grouped = salaryHistoryLines.reduce((acc, row) => {
                      const y = row.year || "-";
                      if (!acc[y]) acc[y] = [];
                      acc[y].push(row);
                      return acc;
                    }, {});
                    const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

                    return (
                      <div className="space-y-2">
                        {years.map((year) => (
                          <div key={year}>
                            <p className="text-xs font-semibold text-gray-600 mb-1">{year}</p>
                            <div className="grid grid-cols-12 gap-2">
                              {grouped[year].map((row, index) => (
                                <div
                                  key={`${row.period}-${index}`}
                                  className="col-span-1 border border-gray-300 rounded px-2 py-1 min-w-0"
                                >
                                  <p className="text-sm">{row.period.split(" ")[0]}</p>
                                  <p className="text-sm font-medium">{row.amount}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            ) : (
              "-"
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                <span className="text-red-500">*</span> Document Date
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                <span className="text-red-500">*</span> Joining Date
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={joiningDateInput}
                onChange={(e) => setJoiningDateInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                <span className="text-red-500">*</span> Last Working Date
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={lastWorkingDateInput}
                onChange={(e) => setLastWorkingDateInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Designation</label>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={designationOverride}
                onChange={(e) => setDesignationOverride(e.target.value)}
                placeholder="Designation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Department</label>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={departmentOverride}
                onChange={(e) => setDepartmentOverride(e.target.value)}
                placeholder="Department"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Salary up to last working day</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={salaryUpto}
                onChange={(e) => setSalaryUpto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Leave Encashment</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={leaveEncashment}
                onChange={(e) => setLeaveEncashment(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Bonus / Incentives</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={bonusIncentives}
                onChange={(e) => setBonusIncentives(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Other Payables</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={otherPayables}
                onChange={(e) => setOtherPayables(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Deductions (if any)</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Mode of Payment</label>
              <input
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                placeholder="Bank Transfer / UPI / Cheque"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                <span className="text-red-500">*</span> Payment Date
              </label>
              <input
                type="date"
                className="w-full p-2.5 border border-gray-300 rounded-md"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="p-2.5 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm text-gray-500">Net Amount Paid</p>
              <p className="text-lg font-semibold text-gray-900">
                Rs.{" "}
                {formatCurrency(totalSalaryPaid)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPDF && employee && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
            <PDFDownloadLink
              document={<FnfCertificatePDF model={model} />}
              fileName={`FNF_Certificate_${String(employee?.name || "Employee").replace(/\s+/g, "_")}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiDownload size={18} />
              Download PDF
            </PDFDownloadLink>
          </div>
          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              <FnfCertificatePDF model={model} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

