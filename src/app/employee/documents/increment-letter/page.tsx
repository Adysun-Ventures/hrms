"use client";

import React, { useEffect, useState } from "react";
import { FiTrendingUp, FiDownload } from "react-icons/fi";
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
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

import EmployeeLayout from "@/components/layout/EmployeeLayout";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import { offerLetterStyles } from "@/components/pdf/PDFStyles";
import CommonIncrementLetterPDF from "@/components/components/docComponents/incrementLetter";
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

async function buildIncrementLetterDocx(letterData: LetterData | null) {
  if (!letterData) return new DocxDocument({ sections: [{ properties: {}, children: [new Paragraph({ text: "No data" })] }] });
  const shortName = letterData.employeeName.split(" ")[0] || letterData.employeeName;
  const today = formatDate(new Date());
  const formattedCurrent = Number(letterData.currentCTC).toLocaleString("en-IN");
  const formattedRevised = Number(letterData.revisedCTC).toLocaleString("en-IN");
  const formattedEffective = formatDate(letterData.effectiveDate);
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
    new Paragraph({ text: "We appreciate your continuous hard work and commitment and we believe you will continue to excel." }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Effective: " }), new TextRun({ text: formattedEffective })] }),
    new Paragraph({ children: [new TextRun({ text: COMPANY_DATA.hrName, bold: true })] }),
    new Paragraph({ text: COMPANY_DATA.hrDesignation }),
    new Paragraph({ text: COMPANY_DATA.hrEmail }),
  ];
  return new DocxDocument({ sections: [{ properties: {}, children }] });
}

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

  const [letterData, setLetterData] = useState<LetterData | null>(null);

  /* ---------------- Load employee + employment ---------------- */
  useEffect(() => {
    const load = async () => {
      if (!currentUserData?.id) return;
      try {
        const emp = await getEmployee(currentUserData.id);
        const empm = await getEmployeeSelfEmployment(currentUserData.id);

        setEmployee(emp);
        if (empm?.[0]) setEmployment(empm[0]);
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
        effectiveDate: effectiveDate
      });
    }
  }, [employee, employment, revisedCTC, effectiveDate]);

  if (loading) return <div>Loading...</div>;

return (
  <EmployeeLayout
    breadcrumbItems={[
      { label: "Dashboard", href: "/employee-dashboard" },
      { label: "Documents", href: "/employee/documents" },
      { label: "Increment Letter", isCurrent: true }
    ]}
  >
    <div className="container mx-auto p-4">

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Increment Letter
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              View and download your increment letter
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            ← Back
          </button>
        </div>

        <div className="p-6 space-y-6">

          {employment ? (
            <>
              {/* Section Card */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 border-l-4 border-blue-500 pl-2">
                  Increment Details
                </h2>

                <div className="bg-white p-4 rounded-lg">
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
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Download Button */}
              {letterData && (
                <div className="flex justify-end gap-2">
                  <PDFDownloadLink
                    document={
                      <EmployeeIncrementPDF letterData={letterData} />
                    }
                    fileName={`Increment_${letterData.employeeName}.pdf`}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <FiDownload className="mr-2" />
                    Download PDF
                  </PDFDownloadLink>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const doc = await buildIncrementLetterDocx(letterData);
                        const blob = await Packer.toBlob(doc);
                        saveAs(blob, `IncrementLetter_${(letterData.employeeName || "").replace(/\s+/g, "_")}.docx`);
                        toast.success("DOCX downloaded");
                      } catch (err) {
                        console.error("DOCX download error:", err);
                        toast.error("Failed to generate DOCX");
                      }
                    }}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <FiDownload className="mr-2" />
                    Download DOCX
                  </button>
                </div>
              )}

              {/* PDF Preview */}
              {letterData && (
                <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    PDF Preview
                  </h3>

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
