"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, Link } from "@react-pdf/renderer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FiDownload } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { db } from "@/firebase/config";
import TableHeader from "@/components/ui/TableHeader";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import { ensureDocumentFonts } from "@/components/pdf/documentFont";
import { Combobox } from "@headlessui/react";
import { FiX } from "react-icons/fi";

ensureDocumentFonts();

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const MERIDIEM_OPTIONS = ["AM", "PM"];

const to24HourTime = (hour12, minute, meridiem) => {
  const h = Number(hour12);
  const m = String(minute || "").padStart(2, "0");
  const mer = String(meridiem || "").toUpperCase();
  if (!h || !m || (mer !== "AM" && mer !== "PM")) return "";

  let hh = h % 12;
  if (mer === "PM") hh += 12;
  return `${String(hh).padStart(2, "0")}:${m}`;
};

const buildOfficialEmailCandidate = (name, suffix) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = (parts[parts.length - 1] || parts[0] || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const lastInitial = (last[0] || first[0] || "x").toLowerCase();
  const core = `${first}.${lastInitial}${suffix > 0 ? String(suffix) : ""}`;
  return `${core}@adysunventures.com`;
};

const resolveOfficialEmailForEmployee = async (employee, employeeId) => {
  const existing = String(employee?.officialEmail || "").trim();
  if (existing) return existing;

  const name = String(employee?.name || "").trim();
  if (!name) return "";

  for (let suffix = 0; suffix <= 20; suffix += 1) {
    const candidate = buildOfficialEmailCandidate(name, suffix);
    const qs = await getDocs(query(collection(db, "employees"), where("officialEmail", "==", candidate)));
    const isTakenByOther = !qs.empty && qs.docs.some((d) => d.id !== employeeId);
    if (!isTakenByOther) return candidate;
  }

  return buildOfficialEmailCandidate(name, Date.now() % 1000);
};

const pickLatestEmployment = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    const aDate = new Date(a?.updatedAt || a?.joiningDate || a?.startDate || 0).getTime();
    const bDate = new Date(b?.updatedAt || b?.joiningDate || b?.startDate || 0).getTime();
    return bDate - aDate;
  });
  return sorted[0];
};

const formatMailDate = (dateValue, useShortYear = true) => {
  if (!dateValue) return "-";
  const dt = new Date(dateValue);
  if (Number.isNaN(dt.getTime())) return String(dateValue);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dt.getFullYear());
  const yy = yyyy.slice(-2);
  return `${dd}/${mm}/${useShortYear ? yy : yyyy}`;
};

const formatMailTime = (timeValue, uppercase = false) => {
  if (!timeValue) return "-";
  const [hRaw, mRaw] = String(timeValue).split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return String(timeValue);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${uppercase ? suffix.toUpperCase() : suffix}`;
};

const formatLongDateWithOrdinal = (dateValue) => {
  if (!dateValue) return "-";
  const dt = new Date(dateValue);
  if (Number.isNaN(dt.getTime())) return String(dateValue);
  const day = dt.getDate();
  const mod10 = day % 10;
  const mod100 = day % 100;
  let suffix = "th";
  if (mod10 === 1 && mod100 !== 11) suffix = "st";
  else if (mod10 === 2 && mod100 !== 12) suffix = "nd";
  else if (mod10 === 3 && mod100 !== 13) suffix = "rd";
  const month = dt.toLocaleString("en-US", { month: "long" });
  return `${day}${suffix} ${month} ${dt.getFullYear()}`;
};

const ReResignationPDF = ({ data }) => {
  const {
    employeeName,
    officialMail,
    sentMailDate,
    sentMailTime,
    designation,
    hrRepliesDate,
    hrRepliesTime,
    lastWorkingDay,
  } = data;

  const splitNameParts = String(employeeName || "").trim().split(/\s+/).filter(Boolean);
  const firstNameOnly = splitNameParts[0] || "";
  const firstLastName =
    splitNameParts.length >= 2 ? `${splitNameParts[0]} ${splitNameParts[splitNameParts.length - 1]}` : (splitNameParts[0] || "");

  const toLine = `${employeeName || "-"} <${officialMail || "-"}>`;
  const wroteLineName = firstLastName || employeeName || "-";
  const hrReplyDateTime = `${formatMailDate(hrRepliesDate, true)}, ${formatMailTime(hrRepliesTime, false)}`;
  const sentDateTime = `${formatMailDate(sentMailDate, false)} ${formatMailTime(sentMailTime, true)}`;
  const generatedAt = new Date();
  const generatedDate = formatMailDate(generatedAt.toISOString(), true);
  const generatedTime = formatMailTime(`${String(generatedAt.getHours()).padStart(2, "0")}:${String(generatedAt.getMinutes()).padStart(2, "0")}`, false);

  return (
    <Document>
      <Page
        size="A4"
        style={{
          ...offerLetterStyles.page,
          paddingTop: 5,
          paddingLeft: 28,
          paddingRight: 28,
          paddingBottom: 28,
          fontSize: 10,
          lineHeight: 1.45,
        }}
      >
        {/* <View style={{ borderBottomWidth: 3, borderBottomColor: "#1a73e8", marginBottom: 10 }} /> */}

        <Text
          style={{
            fontSize: 10,
            // fontWeight: "bold",
            textAlign: "center",
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Re: Resignation
        </Text>

        <View style={{ gap: 4, marginBottom: 12 }}>
          <Text><Text style={{ fontWeight: "bold" }}>Subject:</Text> Re: Resignation</Text>
          <Text><Text style={{ fontWeight: "bold" }}>From:</Text> HR Adysun Ventures {"<hr@adysunventures.com>"}</Text>
          <Text><Text style={{ fontWeight: "bold" }}>Date:</Text> {hrReplyDateTime}</Text>
          <Text><Text style={{ fontWeight: "bold" }}>To:</Text> {toLine}</Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text>Dear {firstNameOnly || "Employee"},</Text>
          <Text>We acknowledge receipt of your resignation and will initiate the formal exit process.</Text>
          <Text>
            Your last working day is <Text style={{ fontWeight: "bold" }}>{formatLongDateWithOrdinal(lastWorkingDay)}</Text>.
          </Text>
          <Text>Further details of exit process will be shared with you shortly.</Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <View style={{ width: 1, backgroundColor: "#87CEEB", marginRight: 8, borderRadius: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text>
                On {sentDateTime} IST {wroteLineName} {"<"}{officialMail || "-"}{">"} wrote:
              </Text>
              <Text>{"\n"}</Text>
              <Text>Dear HR,</Text>
              <Text>
                Please accept this email as my formal resignation from my position as{" "}
                <Text style={{ fontWeight: "bold" }}>{designation || "-"}</Text> at Adysun Ventures.
              </Text>
              <Text>Let me know my last working day as per our discussion.</Text>
              <Text>{"\n"}</Text>
              <Text>Regards,</Text>
              <Text>{employeeName || "-"}</Text>
            </View>
          </View>
          <Text style={{ marginTop: 10 }}>--</Text>

          <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 6 }}>
            <View style={{ width: 160 }}>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>Prachi Jadhav</Text>
              <Text style={{ fontSize: 10, fontWeight: "semibold", marginTop: 4, letterSpacing: 0.5 }}>
                HR HEAD
              </Text>
            </View>

            <View style={{ width: 2, height: 58, backgroundColor: "#87CEEB", marginHorizontal: 5 }} />

            <View style={{ flex: 1, gap: 6, paddingTop: 2 }}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>M:</Text>{" "}
                <Link src="tel:+919579537523" style={{ color: "#1a73e8", textDecoration: "underline" }}>
                  +91 9579537523
                </Link>
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>E:</Text>{" "}
                <Link src="mailto:hr@adysunventures.com" style={{ color: "#1a73e8", textDecoration: "underline" }}>
                  hr@adysunventures.com
                </Link>
              </Text>
              <Text>
                <Text style={{ fontWeight: "bold" }}>W:</Text>{" "}
                <Link src="https://adysunventures.com" style={{ color: "#1a73e8", textDecoration: "underline" }}>
                  AdysunVentures.com
                </Link>
              </Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 18 }}>
          {/* <View style={{ borderTopWidth: 1, borderTopColor: "#87CEEB", marginBottom: 10 }} /> */}
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Confidentiality Information and Disclaimer:</Text>
          <Text >
            This communication sent from <Text style={{ fontWeight: "bold" }}>Adysun Ventures</Text> is confidential and
            intended solely for the use of the addressee. Any retransmission, dissemination, or use of this information
            by anyone other than the intended recipient is strictly prohibited. If you have received this message in
            error, please notify the sender immediately and delete it from your system.
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 28,
            right: 28,
            // borderTopWidth: 1,
            // borderTopColor: "#D1D5DB",
            paddingTop: 4,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {/* <Text style={{ fontSize: 9 }}>Resignation Mail</Text> */}
          <Text style={{ fontSize: 9 }}>1 of 1 </Text>
        </View>
      </Page>
    </Document>
  );
};

export default function ReResignationV2() {
  const [employees, setEmployees] = useState([]);
  const [employmentsByEmployeeId, setEmploymentsByEmployeeId] = useState({});
  const [employee, setEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [officialMail, setOfficialMail] = useState("");
  const [resignationDate, setResignationDate] = useState("");
  const [sentMailDate, setSentMailDate] = useState("");
  const [sentMailHour, setSentMailHour] = useState("");
  const [sentMailMinute, setSentMailMinute] = useState("");
  const [sentMailMeridiem, setSentMailMeridiem] = useState("");
  const [designation, setDesignation] = useState("");
  const [hrRepliesDate, setHrRepliesDate] = useState("");
  const [hrRepliesHour, setHrRepliesHour] = useState("");
  const [hrRepliesMinute, setHrRepliesMinute] = useState("");
  const [hrRepliesMeridiem, setHrRepliesMeridiem] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const qs = await getDocs(collection(db, "employees"));
        const list = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEmployees(list);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load employees");
      }
    };
    load();
  }, []);

  const loadEmploymentForEmployee = async (id) => {
    if (!id || employmentsByEmployeeId[id]) return employmentsByEmployeeId[id] || null;
    const qs = await getDocs(query(collection(db, "employments"), where("employeeId", "==", id)));
    const rows = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const latest = pickLatestEmployment(rows);
    setEmploymentsByEmployeeId((prev) => ({ ...prev, [id]: latest }));
    return latest;
  };

  const normalizeDateForInput = (dateLike) => {
    if (!dateLike) return "";
    try {
      const d = new Date(String(dateLike));
      if (Number.isNaN(d.getTime())) return "";
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const subtractDays = (yyyyMmDd, days) => {
    const normalized = normalizeDateForInput(yyyyMmDd);
    if (!normalized) return "";
    const d = new Date(`${normalized}T00:00:00`);
    d.setDate(d.getDate() - Number(days || 0));
    return normalizeDateForInput(d.toISOString());
  };

  const addDays = (yyyyMmDd, days) => {
    const normalized = normalizeDateForInput(yyyyMmDd);
    if (!normalized) return "";
    const d = new Date(`${normalized}T00:00:00`);
    d.setDate(d.getDate() + Number(days || 0));
    return normalizeDateForInput(d.toISOString());
  };

  const toMinutesFrom12Hour = (hourStr, minuteStr, meridiem) => {
    const h = Number(hourStr);
    const m = Number(minuteStr);
    if (!h || Number.isNaN(m) || !meridiem) return null;
    const hour12 = Math.min(Math.max(h, 1), 12);
    const minute = Math.min(Math.max(m, 0), 59);
    const isPM = String(meridiem).toUpperCase() === "PM";
    const hour24 = (hour12 % 12) + (isPM ? 12 : 0);
    return hour24 * 60 + minute;
  };

  const fromMinutesTo12Hour = (totalMinutes) => {
    const t = Math.min(Math.max(Number(totalMinutes) || 0, 0), 23 * 60 + 59);
    const hour24 = Math.floor(t / 60);
    const minute = t % 60;
    const meridiem = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return {
      hour: String(hour12),
      minute: String(minute).padStart(2, "0"),
      meridiem,
    };
  };

  const setRandomSentMailTime = () => {
    // Random time between 10:00 AM and 07:00 PM
    const startMinutes = 10 * 60; // 10:00
    const endMinutes = 19 * 60; // 19:00 (7 PM)
    const totalMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes + 1));

    const hour24 = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const meridiem = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    setSentMailHour(String(hour12));
    setSentMailMinute(String(minute).padStart(2, "0"));
    setSentMailMeridiem(meridiem);
  };

  const setRandomHrRepliesTimeAfterSentMail = () => {
    const sent = toMinutesFrom12Hour(sentMailHour, sentMailMinute, sentMailMeridiem);
    if (sent == null) return toast.error("Select Sent Mail Time first");

    // Random time strictly after sent mail time. Keep within same business window (<= 7 PM) if possible.
    const min = sent + 1;
    const max = Math.max(min, Math.min(sent + 240, 19 * 60)); // up to +4h but not after 7 PM

    const picked = min >= max ? min : min + Math.floor(Math.random() * (max - min + 1));
    const next = fromMinutesTo12Hour(picked);

    setHrRepliesHour(next.hour);
    setHrRepliesMinute(next.minute);
    setHrRepliesMeridiem(next.meridiem);
  };

  const handleEmployeeChange = async (nextEmployee) => {
    setEmployee(nextEmployee || null);
    setShowPDF(false);
    if (!nextEmployee?.id) {
      setEmployeeName("");
      setOfficialMail("");
      setResignationDate("");
      setDesignation("");
      setLastWorkingDay("");
      return;
    }

    setEmployeeName(String(nextEmployee?.name || ""));

    try {
      const resolvedOfficial = await resolveOfficialEmailForEmployee(nextEmployee, nextEmployee.id);
      setOfficialMail(resolvedOfficial);
      const latestEmployment = await loadEmploymentForEmployee(nextEmployee.id);
      setDesignation(String(latestEmployment?.jobTitle || latestEmployment?.designation || ""));
      setLastWorkingDay(normalizeDateForInput(latestEmployment?.lastWorkingDate || latestEmployment?.endDate || ""));

      const resign = normalizeDateForInput(latestEmployment?.resignationDate || "");
      setResignationDate(resign);

      // default: Sent Mail Date = Resignation Date - 1 day
      const resignMinusOne = subtractDays(resign, 1);
      if (resignMinusOne) setSentMailDate(resignMinusOne);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load employment details");
    }
  };

  const formData = useMemo(
    () => ({
      employeeName,
      officialMail,
      sentMailDate,
      sentMailTime: to24HourTime(sentMailHour, sentMailMinute, sentMailMeridiem),
      designation,
      hrRepliesDate,
      hrRepliesTime: to24HourTime(hrRepliesHour, hrRepliesMinute, hrRepliesMeridiem),
      lastWorkingDay,
    }),
    [
      employeeName,
      officialMail,
      sentMailDate,
      sentMailHour,
      sentMailMinute,
      sentMailMeridiem,
      designation,
      hrRepliesDate,
      hrRepliesHour,
      hrRepliesMinute,
      hrRepliesMeridiem,
      lastWorkingDay,
    ]
  );

  const pdfDocument = useMemo(() => <ReResignationPDF data={formData} />, [formData]);
  const canGenerate = Boolean(
    employee?.id &&
      officialMail &&
      sentMailDate &&
      sentMailHour &&
      sentMailMinute &&
      sentMailMeridiem &&
      designation &&
      hrRepliesDate &&
      hrRepliesHour &&
      hrRepliesMinute &&
      hrRepliesMeridiem &&
      lastWorkingDay
  );

  const validate = () => {
    if (!employee?.id) return toast.error("Select employee");
    if (!officialMail) return toast.error("Official mail is missing for selected employee");
    if (!sentMailDate) return toast.error("Select sent mail date");
    if (!sentMailHour || !sentMailMinute || !sentMailMeridiem) return toast.error("Select sent mail time");
    if (!designation) return toast.error("Designation is missing for selected employee");
    if (!hrRepliesDate) return toast.error("Select HR replies date");
    if (!hrRepliesHour || !hrRepliesMinute || !hrRepliesMeridiem) return toast.error("Select HR replies time");
    if (!lastWorkingDay) return toast.error("Last working day not found for selected employee");
    return true;
  };

  const generate = () => {
    if (!validate()) return;
    setShowPDF(true);
  };

  return (
    <div className="w-full pt-6">
      <Toaster position="top-center" />
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-6">
        <TableHeader
          title="Resignation Mail"
          backButton={{
            href: "/dashboard/documents/v2",
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

        <div className="w-full border-t border-gray-200" />
        <div className="px-6 py-6">
          <div className="bg-white p-2 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Name</label>
                <Combobox value={employee} onChange={handleEmployeeChange}>
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
                          setSearchTerm("");
                          setEmployeeName("");
                          setOfficialMail("");
                          setDesignation("");
                          setLastWorkingDay("");
                          setShowPDF(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Clear selected employee"
                        title="Clear"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                    <Combobox.Options className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                      {employees
                        .filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
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

                      {employees.filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 italic">No results found</div>
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Official Mail</label>
                <input
                  type="text"
                  value={officialMail}
                  onChange={(e) => setOfficialMail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Auto from employee details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Sent Mail Date</label>
                <input
                  type="date"
                  value={sentMailDate}
                  onChange={(e) => setSentMailDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => resignationDate && setSentMailDate(resignationDate)}
                    disabled={!resignationDate}
                    className="text-xs text-blue-700 hover:underline disabled:text-gray-400"
                    title={resignationDate ? "Use resignation date" : "Resignation date not found"}
                  >
                    Resign Date
                  </button>
                  <button
                    type="button"
                    onClick={() => resignationDate && setSentMailDate(subtractDays(resignationDate, 1))}
                    disabled={!resignationDate}
                    className="text-xs text-blue-700 hover:underline disabled:text-gray-400"
                    title={resignationDate ? "Use resignation date - 1 day" : "Resignation date not found"}
                  >
                    Resign Date - 1
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Sent Mail Time</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={sentMailHour}
                    onChange={(e) => setSentMailHour(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Hour</option>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sentMailMinute}
                    onChange={(e) => setSentMailMinute(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Min</option>
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sentMailMeridiem}
                    onChange={(e) => setSentMailMeridiem(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">AM/PM</option>
                    {MERIDIEM_OPTIONS.map((ap) => (
                      <option key={ap} value={ap}>
                        {ap}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={setRandomSentMailTime}
                  className="mt-1 text-xs text-blue-700 hover:underline"
                  title="Fill random time (10 AM - 7 PM)"
                >
                  Random
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Auto from employment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">HR Replies Date</label>
                <input
                  type="date"
                  value={hrRepliesDate}
                  onChange={(e) => setHrRepliesDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => resignationDate && setHrRepliesDate(resignationDate)}
                    disabled={!resignationDate}
                    className="text-xs text-blue-700 hover:underline disabled:text-gray-400"
                    title={resignationDate ? "Use resignation date" : "Resignation date not found"}
                  >
                    Resign Date
                  </button>
                  <button
                    type="button"
                    onClick={() => resignationDate && setHrRepliesDate(addDays(resignationDate, 1))}
                    disabled={!resignationDate}
                    className="text-xs text-blue-700 hover:underline disabled:text-gray-400"
                    title={resignationDate ? "Use resignation date + 1 day" : "Resignation date not found"}
                  >
                    Resign Date + 1
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">HR Replies Time</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={hrRepliesHour}
                    onChange={(e) => setHrRepliesHour(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Hour</option>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={hrRepliesMinute}
                    onChange={(e) => setHrRepliesMinute(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Min</option>
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={hrRepliesMeridiem}
                    onChange={(e) => setHrRepliesMeridiem(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">AM/PM</option>
                    {MERIDIEM_OPTIONS.map((ap) => (
                      <option key={ap} value={ap}>
                        {ap}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={setRandomHrRepliesTimeAfterSentMail}
                  className="mt-1 text-xs text-blue-700 hover:underline"
                  title="Fill random time after Sent Mail Time"
                >
                  Random
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Last Working date</label>
                <input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Auto from employment"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowPDF(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiX size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              <FiDownload size={18} />
              Generate
            </button>
          </div>
        </div>
      </div>

      {showPDF && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
            <PDFDownloadLink
              document={pdfDocument}
              fileName={`Resignation_Mail_${(employeeName || "Employee").replace(/\s+/g, "_")}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {({ loading }) => (
                <>
                  <FiDownload size={18} className="shrink-0" aria-hidden />
                  {loading ? "Loading..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
          </div>
          <div className="border rounded-lg" style={{ height: "80vh" }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              {pdfDocument}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

