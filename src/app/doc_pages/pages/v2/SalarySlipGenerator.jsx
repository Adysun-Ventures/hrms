'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { PDFViewer, PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  AlignmentType,
  Document as DocxDocument,
  BorderStyle,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CompanyHeader, Watermark } from '@/components/pdf/PDFComponents';
import { formatIndianCurrency, numberToWords } from '@/components/pdf/SalaryUtils';
import toast, { Toaster } from 'react-hot-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import { Combobox } from "@headlessui/react";

const DEFAULT_COMPANY_NAME = 'Adysun Ventures Pvt. Ltd.';

// === DEFAULT LAYOUT STYLES ===
const defaultSalarySlipStyles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontFamily: 'Calibri' },
  subtitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, fontFamily: 'Calibri' },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingVertical: 5 },
  cell: { flex: 1, padding: 5, fontSize: 10, fontFamily: 'Calibri' },
  headerCell: { flex: 1, padding: 5, fontSize: 11, fontWeight: 'bold', backgroundColor: '#f0f0f0', fontFamily: 'Calibri' },
  bold: { fontWeight: 'bold' },
  employeeInfoContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginVertical: 10 },
  employeeInfoSection: { flex: 1, padding: 8 },
  infoRow: { flexDirection: 'row', marginBottom: 5 },
  infoLabel: { flex: 1, fontSize: 10, fontWeight: 'bold', fontFamily: 'Calibri' },
  infoValue: { flex: 2, fontSize: 10, fontFamily: 'Calibri' },
  earningsDeductionsContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginTop: 15 },
  earningsSection: { flex: 1, borderRightWidth: 1, borderRightColor: '#000' },
  deductionsSection: { flex: 1 },
  columnHeader: { backgroundColor: '#f0f0f0', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', padding: 5 },
  columnHeaderText: { flex: 1, fontSize: 11, fontWeight: 'bold', fontFamily: 'Calibri' },
  amountColumnHeader: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', fontFamily: 'Calibri' },
  item: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 5 },
  itemName: { flex: 1, fontSize: 10, fontFamily: 'Calibri' },
  itemAmount: { flex: 1, fontSize: 10, textAlign: 'right', fontFamily: 'Calibri' },
  totalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000', padding: 5, backgroundColor: '#f0f0f0' },
  totalLabel: { flex: 1, fontSize: 11, fontWeight: 'bold', fontFamily: 'Calibri' },
  totalAmount: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', fontFamily: 'Calibri' },
  netPayContainer: { marginTop: 15, borderWidth: 1, borderColor: '#000' },
  netPayRow: { flexDirection: 'row', padding: 8, backgroundColor: '#e6e6e6' },
  netPayLabel: { flex: 1, fontSize: 12, fontWeight: 'bold', fontFamily: 'Calibri' },
  netPayAmount: { flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'right', fontFamily: 'Calibri' },
  netPayWords: { padding: 8, fontSize: 11, fontFamily: 'Calibri', fontStyle: 'italic' },
  signature: { marginTop: 50, flexDirection: 'row' },
  signatureSection: { flex: 1, alignItems: 'center' },
  signatureText: { fontSize: 11, marginTop: 20, fontFamily: 'Calibri' },
  page: { padding: 40, paddingBottom: 60, fontFamily: 'Calibri', fontSize: 11, backgroundColor: 'white' },
});

// === ADYSUN LAYOUT STYLES ===
const adysunSalarySlipStyles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 32, paddingHorizontal: 32, fontFamily: 'Calibri', fontSize: 10, backgroundColor: '#fff', color: '#111' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoWrapper: { marginRight: 16 },
  logo: { width: 66, height: 66 },
  headerTextBlock: { alignItems: 'center' },
  headerCompany: { fontSize: 16, fontWeight: 'bold' },
  headerInfo: { fontSize: 9, color: '#333' },
  horizontalRule: { marginTop: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid' },
  dateText: { fontSize: 10, marginBottom: 4 },
  slipTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  detailTable: { borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginBottom: 12 },
  detailRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid' },
  detailLastRow: { borderBottomWidth: 0 },
  detailCellLabel: { width: '40%', padding: 6, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#000', borderRightStyle: 'solid' },
  detailCellValue: { width: '60%', padding: 6 },
  dualTable: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginBottom: 8 },
  dualColumn: { flex: 1 },
  dualColumnDivider: { borderRightWidth: 1, borderRightColor: '#000', borderRightStyle: 'solid' },
  dualHeader: { flexDirection: 'row', backgroundColor: '#f4f4f4', borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid' },
  dualHeaderCell: { flex: 1, padding: 6, fontWeight: 'bold' },
  dualRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#b5b5b5', borderBottomStyle: 'solid' },
  dualRowLast: { borderBottomWidth: 0 },
  dualCell: { flex: 1, padding: 6 },
  dualAmountCell: { textAlign: 'right' },
  totalsRow: { flexDirection: 'row', backgroundColor: '#f4f4f4', borderTopWidth: 1, borderTopColor: '#000', borderTopStyle: 'solid' },
  totalsLabel: { flex: 1, padding: 6, fontWeight: 'bold' },
  totalsAmount: { textAlign: 'right' },
  netTable: { borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginBottom: 6 },
  netRow: { flexDirection: 'row' },
  netLabel: { width: '40%', padding: 6, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#000', borderRightStyle: 'solid' },
  netValue: { width: '60%', padding: 6, textAlign: 'right' },
  note: { fontSize: 9, textAlign: 'center', marginVertical: 4 },
  footerSeparator: { marginTop: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid' },
  footer: { alignItems: 'center' },
  footerLine: { fontSize: 9, textAlign: 'center' },
});

// === HELPER FUNCTIONS ===
const normalize = (v) => Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];
const primaryName = (v) => {
  const n = normalize(v);
  return n.length === 0 ? '' : n[n.length - 1];
};

const getEmployeeNameText = (names, txt) => txt || normalize(names).join(', ') || 'Employee Name';
const formatDisplayDate = (d) => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
const getSalarySlipMonthLabel = (d) => {
  const date = new Date(d);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
const getSalarySlipMonthUpper = (d) => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();

const getTotalEarnings = (f) =>
  (f.basicSalary||0)+(f.da||0)+(f.conveyanceAllowance||0)+(f.otherAllowance||0)+(f.medicalAllowance||0)+(f.cca||0);

const getTotalDeductions = (f) =>
  (f.professionalTax||0)+(f.otherDeductions||0)+(f.pfEmployee||0)+(f.leavesDeduction||0);

const getNetSalary = (f)=>
  getTotalEarnings(f)-getTotalDeductions(f);

// === SYSTEM PDF COMPONENTS (DEFAULT + ADYSUN) WILL COME IN CHUNK 2 ===
// === DEFAULT PDF LAYOUT WITH PF CONDITIONAL ROW ===
const DefaultSalarySlipLayout = ({ formData }) => {
  const f = formData || {};

  return (
    <Page size="A4" style={defaultSalarySlipStyles.page}>
      <Watermark logoSrc={f.companyLogo} />
      <CompanyHeader
        companyName={f.companyName}
        companyAddress={f.companyAddressLine1}
        companyLogo={f.companyLogo}
        companyPhone={f.companyPhone}
        companyWebsite={f.companyWebsite}
        companyColor={f.companyColor}
      />

      <Text style={defaultSalarySlipStyles.title}>
        SALARY SLIP FOR THE MONTH OF {getSalarySlipMonthUpper(f.payDate)}
      </Text>

      <View style={defaultSalarySlipStyles.employeeInfoContainer}>
        <View style={{ ...defaultSalarySlipStyles.employeeInfoSection, flexDirection: 'column' }}>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>EMP Code</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.employeeId || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Name</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{getEmployeeNameText(f.employeeName, f.employeeNameText)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Designation</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.designation || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>PAN</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.panNumber || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Location</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.location || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Department</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.department || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Payable Days</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.payableDays || '-'}</Text>
          </View>
        </View>

        <View style={defaultSalarySlipStyles.employeeInfoSection}>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Bank Name:</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.bankName || '-'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Bank A/C No:</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{f.accountNo || '-'}</Text>
          </View>
        </View>
      </View>

      <View style={defaultSalarySlipStyles.earningsDeductionsContainer}>
        <View style={defaultSalarySlipStyles.earningsSection}>
          <View style={defaultSalarySlipStyles.columnHeader}>
            <Text style={defaultSalarySlipStyles.columnHeaderText}>Earnings</Text>
            <Text style={defaultSalarySlipStyles.amountColumnHeader}>Amount (₹)</Text>
          </View>

          {[
            { label: "Basic", value: f.basicSalary },
            { label: "HRA/DA", value: f.da },
            { label: "Conveyance Allowance", value: f.conveyanceAllowance },
            { label: "Other Allowance", value: f.otherAllowance },
            { label: "Medical Allowance", value: f.medicalAllowance },
            { label: "CCA", value: f.cca },
          ].map(item => (
            <View style={defaultSalarySlipStyles.item} key={item.label}>
              <Text style={defaultSalarySlipStyles.itemName}>{item.label}</Text>
              <Text style={defaultSalarySlipStyles.itemAmount}>
                Rs. {formatIndianCurrency(item.value || 0)}
              </Text>
            </View>
          ))}

          <View style={defaultSalarySlipStyles.totalRow}>
            <Text style={defaultSalarySlipStyles.totalLabel}>Gross Salary</Text>
            <Text style={defaultSalarySlipStyles.totalAmount}>
              Rs. {formatIndianCurrency(getTotalEarnings(f))}
            </Text>
          </View>
        </View>

        <View style={defaultSalarySlipStyles.deductionsSection}>
          <View style={defaultSalarySlipStyles.columnHeader}>
            <Text style={defaultSalarySlipStyles.columnHeaderText}>Deductions</Text>
            <Text style={defaultSalarySlipStyles.amountColumnHeader}>Amount (₹)</Text>
          </View>

          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Professional Tax</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(f.professionalTax || 0)}</Text>
          </View>

          {f.enablePF && (
            <View style={defaultSalarySlipStyles.item}>
              <Text style={defaultSalarySlipStyles.itemName}>PF (Employee)</Text>
              <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(f.pfEmployee || 0)}</Text>
            </View>
          )}

          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Other Deductions</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(f.otherDeductions || 0)}</Text>
          </View>

          <View style={defaultSalarySlipStyles.item}>
  <Text style={defaultSalarySlipStyles.itemName}>Leave Deduction</Text>
  <Text style={defaultSalarySlipStyles.itemAmount}>
    Rs. {formatIndianCurrency(f.leavesDeduction || 0)}
  </Text>
</View>


          <View style={defaultSalarySlipStyles.totalRow}>
            <Text style={defaultSalarySlipStyles.totalLabel}>Total Deductions</Text>
            <Text style={defaultSalarySlipStyles.totalAmount}>
              Rs. {formatIndianCurrency(getTotalDeductions(f))}
            </Text>
          </View>
        </View>
      </View>

      <View style={defaultSalarySlipStyles.netPayContainer}>
        <View style={defaultSalarySlipStyles.netPayRow}>
          <Text style={defaultSalarySlipStyles.netPayLabel}>Net Pay</Text>
          <Text style={defaultSalarySlipStyles.netPayAmount}>
            Rs. {formatIndianCurrency(getNetSalary(f))}
          </Text>
        </View>
        <Text style={defaultSalarySlipStyles.netPayWords}>
          Amount in words: {f.amountInWords || 'Rupees only'}
        </Text>
      </View>

      <Text style={{ fontSize: 9, marginTop: 20, textAlign: 'center' }}>
        This is a computer-generated Salary slip. No Signature is required.
      </Text>
    </Page>
  );
};

// === ADYSUN PDF LAYOUT ===
const AdysunSalarySlipLayout = ({ formData }) => {
  const f = formData || {};

  const earningsData = [
    { label: 'Basic', amount: f.basicSalary || 0 },
    { label: 'HRA', amount: f.da || 0 },
    { label: 'Conveyance Allowance', amount: f.conveyanceAllowance || 0 },
    { label: 'Other Allowance', amount: (f.otherAllowance||0)+(f.medicalAllowance||0)+(f.cca||0) },
  ];

  const deductionsData = [
    { label: 'PT', amount: f.professionalTax || 0 },

    ...(f.enablePF ? [{ label: 'PF (Employee)', amount: f.pfEmployee || 0 }] : []),
    { label: 'Leave Deduction', amount: f.leavesDeduction || 0 },
    { label: 'Other Deductions', amount: f.otherDeductions || 0 },
  ];

  const footerLines = [
    'Adysun Ventures Pvt. Ltd.',
    'Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump, Pune - Satara Rd, Taware Colony, Bibwewadi, Pune, Maharashtra 411009',
    'www.AdysunVentures.com  |  info@adysunventures.com  |  hr@adysunventures.com'
  ];
   const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
const years = Array.from(
  { length: (new Date().getFullYear() + 2) - 2020 + 1 },
  (_, i) => 2020 + i
);


  const detailRows = [
{ 
  label: 'Employee Name', 
  value: toTitleCase(getEmployeeNameText(f.employeeName, f.employeeNameText)) 
},
    { label: 'Employee Code', value: f.employeeId },
    { label: 'Designation', value: toTitleCase(f.designation) },
    { label: 'Department', value: f.department },
    { label: 'Bank Name', value: f.bankName },
    { label: 'Bank Account No', value: f.accountNo },
    // { label: 'IFSC Code', value: f.ifscCode },
    { label: 'Pan No', value: f.panNumber },
    { label: 'Leaves', value: f.leaves || 0},
    { label: 'Effective Work Days', value: `${f.payableDays} Days` },
  ];
   const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

return (
  <Page
    size="A4"
    style={{
      paddingTop: 18 * 2.83,
      paddingBottom: 18 * 2.83,
      paddingLeft: 10 * 2.83,
      paddingRight: 10 * 2.83,
      fontFamily: "Helvetica",
      fontSize: 9,
      display: "flex",
      flexDirection: "column"
    }}
  >

    {/* HEADER */}
    {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#d42626" }}>
          Adysun Ventures Pvt. Ltd.
        </Text>
        <Text style={{ fontSize: 11, marginTop: 4 }}>
          info@adysunventures.com | hr@adysunventures.com | www.AdysunVentures.com
        </Text>
        <Text style={{ fontSize: 11, marginTop: 4 }}>
          Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump
        </Text>
        <Text style={{ fontSize: 11 }}>
          Pune - Satara Rd, Bibwewadi, Pune, Maharashtra 411009
        </Text>
      </View>

      <Image
        src={f.companyLogo}
        style={{ width: 60, height: 60, marginLeft: 12 }}
      />
    </View> */}
    <GlobalPDFHeader/>

    {/* SEPARATOR */}
    <View style={{ borderBottomWidth: 1, borderBottomColor: "#000", marginBottom: 10 }} />

    {/* TITLE */}
    <Text
      style={{
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 8
      }}
    >
      Salary Slip  {MONTH_NAMES[Number(f.month)]} {formData.year}

    </Text>

    {/* DETAIL TABLE */}
    <View style={{ borderWidth: 0.75, borderColor: "#000", marginBottom: 10 }}>
      {detailRows.map((row, idx) => {

        // Bank + IFSC in one row
        if (row.label === "Bank Name") {
          return (
            <View key="bank-ifsc" style={{ flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: "#000" }}>
              <Text
                style={{
                  width: "38%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000",
                  fontWeight: "bold"
                }}
              >
                Bank Name
              </Text>
              <Text
                style={{
                  width: "25%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000"
                }}
              >
                {f.bankName}
              </Text>

              <Text
                style={{
                  width: "19%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000",
                  fontWeight: "bold"
                }}
              >
                IFSC
              </Text>
              <Text style={{ width: "18%", padding: 4 }}>
                {f.ifscCode}
              </Text>
            </View>
          );
        }

        // Work Days + Leaves in one row
        if (row.label === "Work Days") {
          return (
            <View
              key="work-leaves"
              style={{
                flexDirection: "row",
                borderBottomWidth: 0.6,
                borderBottomColor: "#000"
              }}
            >
              <Text
                style={{
                  width: "35%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000",
                  fontWeight: "bold"
                }}
              >
                Work Days
              </Text>

              <Text
                style={{
                  width: "15%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000"
                }}
              >
                {f.payableDays}
              </Text>

              <Text
                style={{
                  width: "25%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  borderRightColor: "#000",
                  fontWeight: "bold"
                }}
              >
                Leaves
              </Text>

              <Text style={{ width: "25%", padding: 4 }}>
                {f.leaves}
              </Text>
            </View>
          );
        }

        // Default rows
        return (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              borderBottomWidth: idx === detailRows.length - 1 ? 0 : 0.6,
              borderBottomColor: "#000"
            }}
          >
            <Text
              style={{
                width: "38%",
                padding: 4,
                borderRightWidth: 0.6,
                borderRightColor: "#000",
                fontWeight: "bold"
              }}
            >
              {row.label}
            </Text>
            <Text style={{ width: "62%", padding: 4 }}>{row.value || "-"}</Text>
          </View>
        );
      })}
    </View>

    {/* EARNINGS & DEDUCTIONS */}
    <View style={{ flexDirection: "row", borderWidth: 0.75, borderColor: "#000", marginBottom: 10 }}>

      {/* Earnings */}
      <View style={{ width: "50%", borderRightWidth: 0.75, borderRightColor: "#000" }}>
        <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderBottomWidth: 0.75, borderBottomColor: "#000" }}>
          <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Earnings (A)</Text>
          <Text style={{ width: "40%", padding: 4, fontWeight: "bold", textAlign: "right" }}>Amount</Text>
        </View>

        {earningsData.map(item => (
          <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: "#bfbfbf" }}>
            <Text style={{ width: "60%", padding: 4 ,borderRightWidth: 0.6, borderRightColor: "#000" }}>{item.label}</Text>
            <Text style={{ width: "40%", padding: 4, textAlign: "right" }}>
              {formatIndianCurrency(item.amount)}
            </Text>
          </View>
        ))}

        <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderTopWidth: 0.75, borderTopColor: "#000" }}>
          <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Gross Salary</Text>
          <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
            {formatIndianCurrency(getTotalEarnings(f))}
          </Text>
        </View>
      </View>

      {/* Deductions */}
      <View style={{ width: "50%" }}>
        <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderBottomWidth: 0.75, borderBottomColor: "#000" }}>
          <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Deductions (B)</Text>
          <Text style={{ width: "40%", padding: 4, fontWeight: "bold", textAlign: "right" }}>Amount</Text>
        </View>

        {deductionsData.map(item => (
          <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: "#bfbfbf" }}>
            <Text style={{ width: "60%", padding: 4, borderRightWidth: 0.6, borderRightColor: "#000" }}>{item.label}</Text>
            <Text style={{ width: "40%", padding: 4, textAlign: "right" }}>
              {formatIndianCurrency(item.amount)}
            </Text>
          </View>
        ))}

        <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderTopWidth: 0.75, borderTopColor: "#000", marginTop: f.enablePF ? 0 : 18.5 }}>
          
          <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Total Deductions</Text>
          <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
            {formatIndianCurrency(getTotalDeductions(f))}
          </Text>
        </View>
      </View>
    </View>

    {/* NET SALARY */}
    <View style={{ borderWidth: 0.75, borderColor: "#000", backgroundColor: "#e8e8e8" }}>
      <View style={{ flexDirection: "row" }}>
        <Text
          style={{
            width: "50%",
            padding: 4,
            fontWeight: "bold",
            borderRightWidth: 0.75,
            borderRightColor: "#000"
          }}
        >
          Net Salary (A - B)
        </Text>
        <Text style={{ width: "50%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
          {formatIndianCurrency(getNetSalary(f))}
        </Text>
      </View>
    </View>

    {/* DIGITAL NOTICE CENTERED */}
    <Text style={{ fontSize: 10, textAlign: "center", marginTop: 10, fontWeight: "bold" }}>
      This document is digitally generated and does not require signature.
    </Text>

    {/* PUSH FOOTER TO BOTTOM */}
    <View style={{ flexGrow: 1 }} />

    {/* FOOTER SEPARATOR */}
    <View style={{ borderBottomWidth: 1, borderBottomColor: "#000", marginBottom: 8 }} />

    {/* FOOTER */}
    <GlobalPDFFooter/>

  </Page>
);




};

// === PDF REGISTRY ===
const layoutRegistry = { default: DefaultSalarySlipLayout, adysun: AdysunSalarySlipLayout };

const resolveSalarySlipLayout = (f) => {
  const name = (f.companyName || '').toLowerCase();
  return name.includes('adysun') ? 'adysun' : 'default';
};

const SalarySlipPDF = ({ formData }) => {
  const Layout = layoutRegistry[resolveSalarySlipLayout(formData)] || DefaultSalarySlipLayout;
  return <Document><Layout formData={formData} /></Document>;
};

// === MAIN COMPONENT START ===
function SalarySlipGeneratorV2() {
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [showPDF, setShowPDF] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employee, setEmployee] = useState(null);
  const [employment, setEmployment] = useState(null);

  const [formData, setFormData] = useState({
    companyName: DEFAULT_COMPANY_NAME,
    employeeName: [],
    employeeNameText: '',
    employeeId: "",
    designation: "",
    department: "",
    payDate: new Date().toISOString().split('T')[0],
    location: "",
    payableDays: "30",
    leaves: "0",
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
    panNumber: "",
    basicSalary: 0,
    da: 0,
    conveyanceAllowance: 0,
    otherAllowance: 0,
    medicalAllowance: 0,
    cca: 0,
    professionalTax: 0,
    otherDeductions: 0,
    pfEmployee: 0,
    enablePF: false,
    companyAddressLine1: "Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump, Pune - Satara Rd, Taware Colony, Bibwewadi, Pune",
    companyPhone: "9579537523",
    companyWebsite: "AdysunVentures.com",
    companyLogo: "/assets/adysunventures_logo.png",
  });

  const formatNames = (v) => {
    const n = normalize(v);
    return n.length === 0 ? 'Employee' : n.join('_');
  };
  const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];


  const getDaysInMonth = (m) => {
    const year = new Date().getFullYear();
    return new Date(year, Number(m) + 1, 0).getDate();
  };
  const year = new Date().getFullYear();

  // === FETCH EMPLOYEES & EMPLOYMENT ===
  const fetchCandidates = async () => {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCandidates(list);

      const empMap = {};
      for (const emp of list) {
        const q = query(collection(db, 'employments'), where('employeeId', '==', emp.id));
        const eSnap = await getDocs(q);
        if (!eSnap.empty) {
          const rows = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a,b)=> new Date(b.startDate)-new Date(a.startDate));
          empMap[emp.id] = rows[0];
        }
      }
      setEmployments(empMap);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching employees");
    }
  };

  useEffect(()=>{ fetchCandidates(); },[]);

  // === SALARY CALC WITH PF TICK LOGIC LIKE OFFERLETTER ===
  const calculateSalary = (lpa, leaves = 0, month, enablePF = false) => {
  const l = Number(lpa) || 0;
  const lv = Number(leaves) || 0;
  const m = Number(month) || new Date().getMonth();
  const days = getDaysInMonth(m);

  const annual = l * 100000;
  const monthly = annual / 12;

  // Basic unchanged by leaves
  const basic = Math.round(monthly * 0.5);
  const da = Math.round(basic * 0.2);
  const convey = 1600;
  const medical = 1250;
  const cca = 500;

  // Other allowance = remainder after fixed allowances
  const other = Math.max(0, monthly - basic - da - convey - medical - cca);

  // Leaves deduction calculation
  const perDay = monthly / days;
  const leavesDeduction = Math.round(perDay * lv);

  const pt = 200;
  const pf = enablePF ? Math.round(basic * 0.12) : 0;

  const totalEarnings = basic + da + convey + other + medical + cca;
  const totalDeductions = pt + pf + leavesDeduction;
  const net = totalEarnings - totalDeductions;

  return {
    basicSalary: basic,
    da,
    conveyanceAllowance: convey,
    otherAllowance: other,
    medicalAllowance: medical,
    cca,
    professionalTax: pt,
    pfEmployee: pf,
    leavesDeduction,
    otherDeductions: 0,
    payableDays: days - lv,
    amountInWords: `Rupees ${numberToWords(net)} Only`,
  };
};


  // === HANDLE INPUT CHANGES ===
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "enablePF") {
      const newVal = checked;
      const p = primaryName(formData.employeeName);
      const emp = candidates.find(x => x.name === p);

      if (emp) {
        const row = employments[emp.id];
        const sal = row ? (row.salary || row.ctc || 0) : (emp.salary || 0);
        const ctc = sal ? sal/100000 : 0;
        const parts = calculateSalary(ctc, formData.leaves, formData.month, newVal);
        setFormData(prev => ({ ...prev, enablePF: newVal, ...parts }));
      } else {
        setFormData(prev => ({ ...prev, enablePF: newVal }));
      }
      return;
    }

    if (name === "employeeName") {
      const names = normalize(value);
      const p = primaryName(names);
      const emp = candidates.find(x => x.name === p);

      if (emp) {
        const row = employments[emp.id];
        let sal=0,des="",dep="",loc="",pan="",bank="",acc="",ifsc="";

        if (row) {
          sal = row.salary||row.ctc||0;
          des=row.jobTitle||row.designation||"";
          dep=row.department||"";
          loc=row.location||"";
          pan=row.panNumber||"";
          bank=row.bankName||"";
          acc=row.accountNo||"";
          ifsc=row.ifscCode||"";
        }

        const ctc = sal?sal/100000:0;
        const parts = calculateSalary(ctc, formData.leaves, formData.month, formData.enablePF);

        setFormData(prev=>({
          ...prev,
          employeeName:names,
          employeeNameText:p,
          employeeId: row?.employmentId || emp.employeeId || emp.id,
          designation:des,
          department:dep,
          location:loc,
          panNumber:pan,
          bankName:bank,
          accountNo:acc,
          ifscCode:ifsc,
          ...parts
        }));
      } else {
        setFormData(prev=>({
          ...prev,
          employeeName:names,
          employeeNameText:names.join(', ')
        }));
      }
      return;
    }

    if (name === "leaves" || name === "month") {
      const upd = { ...formData, [name]:value };
      const p = primaryName(formData.employeeName);
      const emp = candidates.find(x=>x.name===p);
      if (emp) {
        const row = employments[emp.id];
        const sal = row?(row.salary||row.ctc||0):(emp.salary||0);
        const ctc=sal?sal/100000:0;
        const parts = calculateSalary(ctc, upd.leaves, upd.month, formData.enablePF);
        setFormData({...upd,...parts});
      } else setFormData(upd);
      return;
    }

    setFormData(prev=>({...prev, [name]:value}));
  };

  const memoPDF = React.useMemo(()=> <SalarySlipPDF formData={formData}/>, [formData]);
  const handleGenerate = ()=> {
    setShowPDF(true);
    setShowDocPreview(true);
  };

  const formatMoney2 = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchLogoArrayBuffer = async (src) => {
    if (!src) return null;
    try {
      const res = await fetch(src);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  };

  const buildSalarySlipDocx = async (f) => {
    const safe = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

    const monthLabel = MONTH_NAMES[Number(f.month)] || '';
    const title = `Salary Slip  ${monthLabel} ${safe(f.year)}`.trim();

    const companyLine1 = safe(f.companyName) || DEFAULT_COMPANY_NAME;
    const companyLine2 = `info@adysunventures.com | hr@adysunventures.com | www.AdysunVentures.com`;
    const companyLine3 = `Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump`;
    const companyLine4 = `Pune - Satara Rd, Bibwewadi, Pune, Maharashtra 411009`;

    const logoBuf = await fetchLogoArrayBuffer(f.companyLogo);

    const employeeName = safe(getEmployeeNameText(f.employeeName, f.employeeNameText));
    const empCode = safe(f.employeeId);
    const designation = safe(f.designation);
    const department = safe(f.department);
    const bankName = safe(f.bankName);
    const ifsc = safe(f.ifscCode);
    const accountNo = safe(f.accountNo);
    const panNo = safe(f.panNumber);
    const leaves = safe(f.leaves || 0);
    const effectiveDays = `${safe(f.payableDays)} Days`;

    const earningsRows = [
      ['Basic', formatMoney2(f.basicSalary)],
      ['HRA', formatMoney2(f.da)],
      ['Conveyance Allowance', formatMoney2(f.conveyanceAllowance)],
      ['Other Allowance', formatMoney2(f.otherAllowance)],
    ];

    const deductionsRows = [
      ['PT', formatMoney2(f.professionalTax)],
      ...(f.enablePF ? [['PF (Employee)', formatMoney2(f.pfEmployee)]] : []),
      ['Leave Deduction', formatMoney2(f.leavesDeduction)],
      ['Other Deductions', formatMoney2(f.otherDeductions)],
    ];

    const bordersBlack = {
      top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '7A7A7A' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '7A7A7A' },
    };

    const cellLabel = (text, opts = {}) =>
      new TableCell({
        ...opts,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
      });

    const cellValue = (text, opts = {}) =>
      new TableCell({
        ...opts,
        children: [new Paragraph(String(text))],
      });

    const makeDetailsTable = () => {
      const rows = [];

      const rowSpanValue = (label, value) =>
        new TableRow({
          children: [
            cellLabel(label),
            cellValue(value, { columnSpan: 3 }),
          ],
        });

      rows.push(rowSpanValue('Employee Name', employeeName));
      rows.push(rowSpanValue('Employee Code', empCode));
      rows.push(rowSpanValue('Designation', designation));
      rows.push(rowSpanValue('Department', department));
      rows.push(
        new TableRow({
          children: [
            cellLabel('Bank Name'),
            cellValue(bankName),
            cellLabel('IFSC'),
            cellValue(ifsc),
          ],
        })
      );
      rows.push(rowSpanValue('Bank Account No', accountNo));
      rows.push(rowSpanValue('Pan No', panNo));
      rows.push(rowSpanValue('Leaves', leaves));
      rows.push(rowSpanValue('Effective Work Days', effectiveDays));

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: bordersBlack,
        rows,
      });
    };

    const headerCell = (text, align = AlignmentType.LEFT) =>
      new TableCell({
        shading: { fill: 'EDEDED' },
        children: [
          new Paragraph({
            alignment: align,
            children: [new TextRun({ text, bold: true })],
          }),
        ],
      });

    const amountCell = (text, bold = false) =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: String(text), bold })],
          }),
        ],
      });

    const textCell = (text, bold = false) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(text), bold })] })],
      });

    const makeEarningsDeductionsTable = () => {
      const max = Math.max(earningsRows.length, deductionsRows.length);
      const rows = [];

      rows.push(
        new TableRow({
          children: [
            headerCell('Earnings (A)'),
            headerCell('Amount', AlignmentType.RIGHT),
            headerCell('Deductions (B)'),
            headerCell('Amount', AlignmentType.RIGHT),
          ],
        })
      );

      for (let i = 0; i < max; i++) {
        const e = earningsRows[i] || ['', ''];
        const d = deductionsRows[i] || ['', ''];
        rows.push(
          new TableRow({
            children: [
              textCell(e[0]),
              amountCell(e[1]),
              textCell(d[0]),
              amountCell(d[1]),
            ],
          })
        );
      }

      rows.push(
        new TableRow({
          children: [
            textCell('Gross Salary', true),
            amountCell(formatMoney2(getTotalEarnings(f)), true),
            textCell('Total Deductions', true),
            amountCell(formatMoney2(getTotalDeductions(f)), true),
          ],
        })
      );

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: bordersBlack,
        rows,
      });
    };

    const makeNetSalaryRow = () =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: bordersBlack,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: 'EDEDED' },
                children: [new Paragraph({ children: [new TextRun({ text: 'Net Salary (A - B)', bold: true })] })],
              }),
              new TableCell({
                shading: { fill: 'EDEDED' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: formatMoney2(getNetSalary(f)), bold: true })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

    return new DocxDocument({
      sections: [
        {
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: companyLine1, bold: true })],
                        }),
                        new Paragraph(companyLine2),
                        new Paragraph(companyLine3),
                        new Paragraph(companyLine4),
                      ],
                    }),
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: logoBuf
                            ? [
                                new ImageRun({
                                  data: logoBuf,
                                  transformation: { width: 72, height: 72 },
                                }),
                              ]
                            : [],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: ' ', })],
            }),
            new Paragraph({
              children: [new TextRun({ text: '________________________________________________________________________________', })],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: title, bold: true })],
            }),
            new Paragraph({ text: '' }),
            makeDetailsTable(),
            new Paragraph({ text: '' }),
            makeEarningsDeductionsTable(),
            new Paragraph({ text: '' }),
            makeNetSalaryRow(),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'This document is digitally generated and does not require signature.',
                  bold: true,
                }),
              ],
            }),
          ],
        },
      ],
    });
  };

  const handleDownloadDocx = async () => {
    try {
      const doc = await buildSalarySlipDocx(formData);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SalarySlip_${formData.employeeNameText}_${formData.payDate}.docx`);
    } catch (err) {
      console.error('DOCX download error:', err);
      toast.error('Failed to generate DOCX');
    }
  };
return (
  <div className="w-full p-4">
    <Toaster position="top-center" />

    <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center gap-124 px-6 py-4 border-b border-gray-200">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft size={16} /> Back
        </Link>

        <h2 className="text-xl font-bold text-gray-800">
          Salary Slip Generator
        </h2>
      </div>

      {/* Form Grid */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

        {/* Employee Name */}
{/* Employee Name */}
<div>
  <label className="block text-sm font-medium text-slate-800 mb-1">
    Employee <span className="text-red-500">*</span>
  </label>

  <Combobox
    value={employee}
    onChange={(emp) => {
      setEmployee(emp || null);
      setSearchTerm("");

      if (!emp) return;

      const row = employments[emp.id] || {};
      const salary = row.salary || row.ctc || emp.salary || 0;
      const ctcInLpa = salary ? salary / 100000 : 0;

      const calc = calculateSalary(
        ctcInLpa,
        formData.leaves,
        formData.month,
        formData.enablePF
      );

      setFormData(prev => ({
        ...prev,
        employeeName: [emp.name],
        employeeNameText: emp.name,
        employeeId: row?.employmentId || emp.employeeId || emp.id,
        designation: row.jobTitle || row.designation || "",
        department: row.department || "",
        location: row.location || "",
        panNumber: row.panNumber || "",
        bankName: row.bankName || "",
        accountNo: row.accountNo || "",
        ifscCode: row.ifscCode || "",
        ...calc
      }));
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
                `cursor-pointer px-3 py-2 ${
                  active ? 'bg-blue-600 text-white' : 'bg-white'
                }`
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


        {/* Month */}
        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            name="month"
            value={formData.month}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-gray-300 rounded-md"
          >
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December",
            ].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
  <label className="block mb-2 text-sm font-medium text-gray-700">
    Year <span className="text-red-500">*</span>
  </label>

  <select
    name="year"
    value={formData.year}
    onChange={handleInputChange}
    className="w-full p-2.5 border border-gray-300 rounded-md"
  >
    {Array.from(
      { length: (new Date().getFullYear() + 2) - 2020 + 1 },
      (_, i) => {
        const year = 2020 + i;
        return (
          <option key={year} value={year}>
            {year}
          </option>
        );
      }
    )}
  </select>
</div>

        

        {/* Leaves */}
        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Leaves
          </label>
          <input
            type="number"
            name="leaves"
            value={formData.leaves}
            onChange={handleInputChange}
            min="0"
            max={getDaysInMonth(Number(formData.month))}
            className="w-full p-2.5 border border-gray-300 rounded-md"
          />
        </div>

        {/* Payable Days */}
        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Payable Days
          </label>
          <input
            readOnly
            value={formData.payableDays}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        {/* PF Checkbox */}
        <div className="form-group flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="enablePF"
            checked={formData.enablePF}
            onChange={handleInputChange}
            className="h-5 w-5"
          />
          <label className="text-sm font-medium text-gray-700">
            Apply PF Deduction
          </label>
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleGenerate}
          disabled={formData.employeeName.length === 0}
          className={`flex items-center px-6 py-2 rounded-lg shadow-sm transition-all duration-200 ${
            formData.employeeName.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <FiDownload size={18} className="mr-2" />
          Generate
        </button>
      </div>
    </div>

    {/* PDF SECTION */}
    {showPDF && (
      <div className="bg-white rounded-lg shadow-lg p-4 mb-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800"
            >
              Download DOCX
            </button>
            <PDFDownloadLink
              document={memoPDF}
              fileName={`SalarySlip_${formData.employeeNameText}_${formData.payDate}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {({ loading }) => loading ? 'Loading...' : 'Download PDF'}
            </PDFDownloadLink>
          </div>
        </div>
        <div className="border rounded-lg" style={{ height: '80vh' }}>
          <PDFViewer width="100%" height="100%">
            {memoPDF}
          </PDFViewer>
        </div>
      </div>
    )}

    {/* DOCX PREVIEW (HTML) */}
    {showDocPreview && (
      <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">DOCX Preview</h3>
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800"
          >
            Download DOCX
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-orange-600 text-2xl font-bold">ADYSUN VENTURES PVT. LTD.</div>
              <div className="text-sm mt-1">info@adysunventures.com | hr@adysunventures.com | www.AdysunVentures.com</div>
              <div className="text-sm">Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump</div>
              <div className="text-sm">Pune - Satara Rd, Bibwewadi, Pune, Maharashtra 411009</div>
            </div>
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formData.companyLogo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
          </div>

          <div className="mt-4 border-t border-black" />

          <div className="mt-4 text-center font-semibold">
            Salary Slip&nbsp;&nbsp;{MONTH_NAMES[Number(formData.month)]} {formData.year}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-black text-sm">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-[35%] font-semibold p-2 border-r border-black">Employee Name</td>
                  <td className="p-2" colSpan={3}>{getEmployeeNameText(formData.employeeName, formData.employeeNameText) || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Employee Code</td>
                  <td className="p-2" colSpan={3}>{formData.employeeId || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Designation</td>
                  <td className="p-2" colSpan={3}>{formData.designation || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Department</td>
                  <td className="p-2" colSpan={3}>{formData.department || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Bank Name</td>
                  <td className="p-2">{formData.bankName || '-'}</td>
                  <td className="font-semibold p-2 border-x border-black">IFSC</td>
                  <td className="p-2">{formData.ifscCode || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Bank Account No</td>
                  <td className="p-2" colSpan={3}>{formData.accountNo || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Pan No</td>
                  <td className="p-2" colSpan={3}>{formData.panNumber || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="font-semibold p-2 border-r border-black">Leaves</td>
                  <td className="p-2" colSpan={3}>{formData.leaves || 0}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2 border-r border-black">Effective Work Days</td>
                  <td className="p-2" colSpan={3}>{formData.payableDays ? `${formData.payableDays} Days` : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-black text-sm">
              <thead className="bg-gray-100">
                <tr className="border-b border-black">
                  <th className="p-2 text-left border-r border-black">Earnings</th>
                  <th className="p-2 text-right border-r border-black">Amount (₹)</th>
                  <th className="p-2 text-left border-r border-black">Deductions</th>
                  <th className="p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const earn = [
                    ['Basic', formatMoney2(formData.basicSalary || 0)],
                    ['HRA', formatMoney2(formData.da || 0)],
                    ['Conveyance Allowance', formatMoney2(formData.conveyanceAllowance || 0)],
                    ['Other Allowance', formatMoney2(formData.otherAllowance || 0)],
                  ];

                  const ded = [
                    ['PT', formatMoney2(formData.professionalTax || 0)],
                    ...(formData.enablePF ? [['PF (Employee)', formatMoney2(formData.pfEmployee || 0)]] : []),
                    ['Leave Deduction', formatMoney2(formData.leavesDeduction || 0)],
                    ['Other Deductions', formatMoney2(formData.otherDeductions || 0)],
                  ];

                  const max = Math.max(earn.length, ded.length);
                  const rows = [];
                  for (let i = 0; i < max; i++) {
                    const e = earn[i] || ['', ''];
                    const d = ded[i] || ['', ''];
                    rows.push(
                      <tr key={i} className="border-b border-gray-300 last:border-b-0">
                        <td className="p-2 border-r border-gray-300">{e[0]}</td>
                        <td className="p-2 text-right border-r border-gray-300">{e[1]}</td>
                        <td className="p-2 border-r border-gray-300">{d[0]}</td>
                        <td className="p-2 text-right">{d[1]}</td>
                      </tr>
                    );
                  }
                  return rows;
                })()}

                <tr className="bg-gray-100 border-t border-black">
                  <td className="p-2 font-semibold border-r border-black">Gross Salary</td>
                  <td className="p-2 text-right font-semibold border-r border-black">{formatMoney2(getTotalEarnings(formData))}</td>
                  <td className="p-2 font-semibold border-r border-black">Total Deductions</td>
                  <td className="p-2 text-right font-semibold">{formatMoney2(getTotalDeductions(formData))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-black text-sm bg-gray-100">
              <tbody>
                <tr>
                  <td className="p-2 font-semibold border-r border-black">Net Salary (A - B)</td>
                  <td className="p-2 text-right font-semibold">{formatMoney2(getNetSalary(formData))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center font-semibold">
            This document is digitally generated and does not require signature.
          </div>
        </div>
      </div>
    )}
  </div>
);


}

export default SalarySlipGeneratorV2;
