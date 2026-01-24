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

import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import { Combobox } from "@headlessui/react";

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
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch (err) {
    return d;
  }
};

/* ---------------- RELIEVING PDF ---------------- */
const RelievingLetterPDF = ({
  employee,
  employment,
  employeeSignDate,
  employeeSignPlace,
  employeeRelievingDate,
  employeeResignDate
}) => {

  const employeeName = employee?.name || "";
  const designation = employment?.jobTitle || employment?.designation || "";
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
          <Text style={{ fontWeight: "bold" }}>To,</Text>
          <Text style={{ fontWeight: "bold" }}>{employeeName}</Text>
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
        <Text style={{ marginBottom: 10 }}>Dear {shortName},</Text>

        <Text style={{ marginBottom: 10 }}>
          This is with reference to your resignation dated{" "}
          <Text style={{ fontWeight: "bold" }}>{resignDate}</Text>. 
          
        </Text>

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
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

  const [employeeSignDate, setEmployeeSignDate] = useState("");
  const [employeeSignPlace, setEmployeeSignPlace] = useState("");
  const [employeeRelievingDate, setEmployeeRelievingDate] = useState("");
  const [employeeResignDate, setEmployeeResignDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const qs = await getDocs(collection(db, "employees"));
    const list = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCandidates(list);

    const map = {};
    const es = await getDocs(collection(db, "employments"));
    es.forEach(d => map[d.data().employeeId] = d.data());
    setEmployments(map);
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setEmployee(candidates.find(x => x.id === id) || null);
    setEmployment(employments[id] || null);
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <TableHeader
          title="Generate Relieving Letter"
          backButton={{ href: "/dashboard/documents", label: "Back" }}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
        />

        <div className="p-6 space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
              Relieving Information
            </h2>

            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Employee */}
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
                

                {/* Sign Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Sign Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={employeeSignDate}
                    onChange={(e) => setEmployeeSignDate(e.target.value)}
                  />
                </div>

                {/* Effective Relieving Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Effective Relieving Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={employeeRelievingDate}
                    onChange={(e) => setEmployeeRelievingDate(e.target.value)}
                  />
                </div>

                {/* Resignation Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-red-500">*</span> Employee Resign Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={employeeResignDate}
                    onChange={(e) => setEmployeeResignDate(e.target.value)}
                  />
                </div>

                {/* Place */}
               <div>
  <label className="block text-sm font-medium mb-1">
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

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!employee) return toast.error("Select employee");
                if (!employeeSignDate) return toast.error("Select sign date");
                if (!employeeRelievingDate) return toast.error("Select relieving date");
                if (!employeeResignDate) return toast.error("Select resign date");
                if (!employeeSignPlace) return toast.error("Enter sign place");
                setShowPDF(true);
              }}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiDownload size={18} className="mr-2" />
              Generate Letter
            </button>
          </div>
        </div>
      </div>

      {/* PDF PREVIEW */}
      {showPDF && employee && employment && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <PDFDownloadLink
              document={
                <RelievingLetterPDF
                  employee={employee}
                  employment={employment}
                  employeeSignDate={employeeSignDate}
                  employeeSignPlace={employeeSignPlace}
                  employeeRelievingDate={employeeRelievingDate}
                  employeeResignDate={employeeResignDate}
                />
              }
              fileName={`Relieving_${employee.name}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              key={Date.now()}
            >
              Download PDF
            </PDFDownloadLink>
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
              />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelievingLetterV2;
