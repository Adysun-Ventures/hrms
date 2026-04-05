'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiDownload, FiX } from 'react-icons/fi';
import { PDFViewer, PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CompanyHeader, Watermark } from '@/components/pdf/PDFComponents';
import { formatIndianCurrency, numberToWords } from '@/components/pdf/SalaryUtils';
import toast, { Toaster } from 'react-hot-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import GlobalPDFFooter from "@/components/components/docComponents/docFooter";
import GlobalPDFHeader from "@/components/components/docComponents/docHeader";
import { Combobox } from "@headlessui/react";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDayMonYear } from "@/utils/documentUtils";

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
const formatDisplayDate = (d) => formatDateToDayMonYear(d);
const getSalarySlipMonthLabel = (d) => {
  const date = new Date(d);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
const getSalarySlipMonthUpper = (d) => formatDateToDayMonYear(d);

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

    {/* Bottom-left place and date */}
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Place:</Text> {f.location || "-"}
      </Text>
      <Text style={{ fontSize: 10, marginTop: 2 }}>
        <Text style={{ fontWeight: "bold" }}>Date:</Text> {formatDisplayDate(f.payDate)}
      </Text>
    </View>

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

export const SalarySlipPDF = ({ formData }) => {
  const Layout = layoutRegistry[resolveSalarySlipLayout(formData)] || DefaultSalarySlipLayout;
  return <Document><Layout formData={formData} /></Document>;
};

// === MAIN COMPONENT START ===
function SalarySlipGeneratorV2() {
  const { currentUserData } = useAuth();
  const selfEmployeeId = currentUserData?.userType === "employee" ? currentUserData?.id : null;

  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [showPDF, setShowPDF] = useState(false);
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
    ctc: 0,
    variablePay: 0,
    fixedPay: 0,
    otherAllowanceOverride: null,
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
      const visible = selfEmployeeId ? list.filter((e) => e.id === selfEmployeeId) : list;
      setCandidates(visible);

      const empMap = {};
      for (const emp of visible) {
        const q = query(collection(db, 'employments'), where('employeeId', '==', emp.id));
        const eSnap = await getDocs(q);
        if (!eSnap.empty) {
          const rows = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a,b)=> new Date(b.startDate)-new Date(a.startDate));
          empMap[emp.id] = rows[0];
        }
      }
      setEmployments(empMap);

      if (selfEmployeeId && visible.length > 0) {
        const selfEmp = visible[0];
        const selfEmployment = empMap[selfEmp.id] || null;
        setEmployee(selfEmp);
        setEmployment(selfEmployment);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching employees");
    }
  };

  useEffect(()=>{ fetchCandidates(); },[selfEmployeeId]);

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
        let sal=0,des="",dep="",loc="",bank="",acc="",ifsc="";

        if (row) {
          sal = row.salary||row.ctc||0;
          des=row.jobTitle||row.designation||"";
          dep=row.department||"";
          loc=row.location||"";
          bank=row.bankName||"";
          acc=row.accountNo||"";
          ifsc=row.ifscCode||"";
        }
        const pan = String(emp.panCard || row?.panNumber || emp.panNumber || emp.pan || "").trim();

        const ctc = sal?sal/100000:0;
        const variablePay = Number(row?.currentVariablePay ?? row?.variablePay ?? 0) || 0;
        const fixedPay = Number(sal || 0) - Number(variablePay || 0);
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
          ctc: sal,
          variablePay,
          fixedPay,
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

    if (name === "ctc" || name === "variablePay") {
      const nextValue = Number(value || 0) || 0;
      const nextCtc = name === "ctc" ? nextValue : (Number(formData.ctc || 0) || 0);
      const nextVariable = name === "variablePay" ? nextValue : (Number(formData.variablePay || 0) || 0);
      const parts = calculateSalary(nextCtc / 100000, formData.leaves, formData.month, formData.enablePF);
      setFormData(prev => ({
        ...prev,
        [name]: nextValue,
        fixedPay: nextCtc - nextVariable,
        otherAllowanceOverride: null,
        ...parts,
      }));
      return;
    }

    if (name === "otherAllowance") {
      const next = Number(value || 0) || 0;
      setFormData((prev) => ({ ...prev, otherAllowanceOverride: next, otherAllowance: next }));
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
        setFormData({ ...upd, ...parts, otherAllowanceOverride: null });
      } else setFormData(upd);
      return;
    }

    setFormData(prev=>({...prev, [name]:value}));
  };

  // Employee dashboard: auto-fill salary slip generator for self user
  useEffect(() => {
    if (!selfEmployeeId) return;
    if (!employee) return;

    const row = employments[employee.id] || {};
    const salary = row.salary || row.ctc || employee.salary || 0;
    const ctcInLpa = salary ? salary / 100000 : 0;
    const variablePay = Number(row?.currentVariablePay ?? row?.variablePay ?? 0) || 0;
    const fixedPay = Number(salary || 0) - Number(variablePay || 0);

    const calc = calculateSalary(ctcInLpa, formData.leaves, formData.month, formData.enablePF);

    const nextEmployeeId = row?.employmentId || employee.employeeId || employee.id;
    const alreadySet =
      formData.employeeId === nextEmployeeId &&
      Number(formData.ctc || 0) === Number(salary || 0) &&
      Number(formData.variablePay || 0) === Number(variablePay || 0);
    if (alreadySet) return;

    setFormData((prev) => ({
      ...prev,
      employeeName: [employee.name],
      employeeNameText: employee.name,
      employeeId: nextEmployeeId,
      designation: row.jobTitle || row.designation || '',
      department: row.department || '',
      location: row.location || '',
      panNumber: String(employee.panCard || row.panNumber || employee.panNumber || employee.pan || '').trim(),
      bankName: row.bankName || '',
      accountNo: row.accountNo || '',
      ifscCode: row.ifscCode || '',
      ctc: salary,
      variablePay,
      fixedPay,
      otherAllowanceOverride: null,
      ...calc,
    }));
  }, [selfEmployeeId, employee, employments, formData.leaves, formData.month, formData.enablePF]);

  const monthlyFixedCalc = (Number(formData.fixedPay || 0) || 0) / 12;
  const basicCalc = monthlyFixedCalc * 0.5;
  const hraCalc = basicCalc * 0.4;
  const conveyanceCalc = 2000;
  const otherAllowanceCalc = monthlyFixedCalc - (basicCalc + hraCalc + conveyanceCalc);
  const otherAllowanceValue =
    formData.otherAllowanceOverride == null
      ? otherAllowanceCalc
      : Number(formData.otherAllowanceOverride || 0) || 0;
  const grossSalaryCalc = basicCalc + hraCalc + conveyanceCalc + otherAllowanceValue;
  const ptCalc = 200;
  const payableDaysCalc =
    (getDaysInMonth(Number(formData.month)) - (Number(formData.leaves || 0) || 0));
  const pfCalc = formData.enablePF ? (Math.min(basicCalc, 15000) * 0.12) : 0;

  const effectiveFormData = React.useMemo(() => {
    const nextBasic = Number(basicCalc.toFixed(2));
    const nextHra = Number(hraCalc.toFixed(2));
    const nextConvey = Number(conveyanceCalc.toFixed(2));
    const nextOther = Number(otherAllowanceValue.toFixed(2));
    const nextPt = Number(ptCalc);
    const nextPf = Number(pfCalc.toFixed(2));
    const nextPayable = String(Math.max(0, Math.trunc(payableDaysCalc)));

    return {
      ...formData,
      basicSalary: nextBasic,
      da: nextHra,
      conveyanceAllowance: nextConvey,
      otherAllowance: nextOther,
      medicalAllowance: 0,
      cca: 0,
      professionalTax: nextPt,
      pfEmployee: formData.enablePF ? nextPf : 0,
      payableDays: nextPayable,
    };
  }, [
    formData,
    basicCalc,
    hraCalc,
    conveyanceCalc,
    otherAllowanceValue,
    ptCalc,
    pfCalc,
    payableDaysCalc,
  ]);

  const memoPDF = React.useMemo(() => <SalarySlipPDF formData={effectiveFormData} />, [effectiveFormData]);
  const handleGenerate = ()=> {
    setShowPDF(true);
  };

  // Keep PDF values in sync with the computed/override other allowance.
  useEffect(() => {
    const next = Number(otherAllowanceValue.toFixed(2));
    if (Number(formData.otherAllowance || 0) === next) return;
    setFormData((prev) => ({ ...prev, otherAllowance: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherAllowanceValue]);

  // Keep document/PDF earnings fields in sync with the visible calculations.
  useEffect(() => {
    const nextBasic = Number(basicCalc.toFixed(2));
    const nextHra = Number(hraCalc.toFixed(2));
    const nextConvey = Number(conveyanceCalc.toFixed(2));
    const nextOther = Number(otherAllowanceValue.toFixed(2));

    if (
      Number(formData.basicSalary || 0) === nextBasic &&
      Number(formData.da || 0) === nextHra &&
      Number(formData.conveyanceAllowance || 0) === nextConvey &&
      Number(formData.otherAllowance || 0) === nextOther
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      basicSalary: nextBasic,
      da: nextHra,
      conveyanceAllowance: nextConvey,
      otherAllowance: nextOther,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicCalc, hraCalc, conveyanceCalc, otherAllowanceValue]);

  // Keep deduction fields in sync with the formula values.
  useEffect(() => {
    const nextPt = ptCalc;
    if (
      Number(formData.professionalTax || 0) === Number(nextPt)
    ) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      professionalTax: nextPt,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptCalc]);

  useEffect(() => {
    const nextPf = Number(pfCalc.toFixed(2));
    if (!formData.enablePF && Number(formData.pfEmployee || 0) === 0) return;
    if (Number(formData.pfEmployee || 0) === nextPf) return;
    setFormData((prev) => ({ ...prev, pfEmployee: formData.enablePF ? nextPf : 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pfCalc, formData.enablePF]);

  useEffect(() => {
    const nextPayable = String(Math.max(0, Math.trunc(payableDaysCalc)));
    if (String(formData.payableDays || '') === nextPayable) return;
    setFormData((prev) => ({ ...prev, payableDays: nextPayable }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payableDaysCalc]);

return (
  <div className="w-full pt-6">
    <Toaster position="top-center" />

    <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft size={16} /> Back
        </Link>

        <h2 className="text-xl font-bold text-gray-800">
          Salary Slip
        </h2>

        <button
          type="button"
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

      {/* Form Grid */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

        {/* Employee Name */}
{/* Employee Name */}
{!selfEmployeeId && (
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
      const variablePay = Number(row?.currentVariablePay ?? row?.variablePay ?? 0) || 0;
      const fixedPay = Number(salary || 0) - Number(variablePay || 0);

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
        panNumber: String(emp.panCard || row.panNumber || emp.panNumber || emp.pan || "").trim(),
        bankName: row.bankName || "",
        accountNo: row.accountNo || "",
        ifscCode: row.ifscCode || "",
        ctc: salary,
        variablePay,
        fixedPay,
        ...calc
      }));
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
            setFormData(prev => ({
              ...prev,
              employeeName: [],
              employeeNameText: '',
              employeeId: '',
              designation: '',
              department: '',
              location: '',
              panNumber: '',
              bankName: '',
              accountNo: '',
              ifscCode: '',
              ctc: 0,
              variablePay: 0,
              fixedPay: 0,
            }));
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
                `cursor-pointer px-3 py-2 ${
                  active ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
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
)}


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

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            CTC
          </label>
          <input
            type="number"
            name="ctc"
            value={formData.ctc ?? 0}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-gray-300 rounded-md"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Variable
          </label>
          <input
            type="number"
            name="variablePay"
            value={formData.variablePay ?? 0}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-gray-300 rounded-md"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Fixed
          </label>
          <input
            readOnly
            value={formData.fixedPay ?? 0}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Monthly Fixed
          </label>
          <input
            readOnly
            value={monthlyFixedCalc.toFixed(2)}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Basic
          </label>
          <input
            readOnly
            value={basicCalc.toFixed(2)}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            HRA
          </label>
          <input
            readOnly
            value={hraCalc.toFixed(2)}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Conveyance Allowance
          </label>
          <input
            readOnly
            value={conveyanceCalc}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Other Allowance
          </label>
          <input
            type="number"
            name="otherAllowance"
            step="0.01"
            value={otherAllowanceValue.toFixed(2)}
            onChange={handleInputChange}
            onBlur={(e) => {
              const v = Number(e.target.value || 0) || 0;
              const vv = Number(v.toFixed(2));
              setFormData((prev) => ({ ...prev, otherAllowanceOverride: vv, otherAllowance: vv }));
            }}
            className="w-full p-2.5 border border-gray-300 rounded-md"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Gross Salary
          </label>
          <input
            readOnly
            value={grossSalaryCalc.toFixed(2)}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            PT (Deduct)
          </label>
          <input
            readOnly
            value={ptCalc}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
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

        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Payable Days
          </label>
          <input
            readOnly
            value={Math.max(0, Math.trunc(payableDaysCalc))}
            className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        {/* PF Field */}
        <div className="form-group">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            PF
          </label>
          <div className="w-full p-2.5 border border-gray-300 rounded-md bg-white flex items-center gap-2">
            <input
              id="apply-pf"
              type="checkbox"
              name="enablePF"
              checked={formData.enablePF}
              onChange={handleInputChange}
              className="h-5 w-5"
            />
            <label htmlFor="apply-pf" className="text-sm font-medium text-gray-700">
              Apply PF Deduction
            </label>
          </div>
        </div>

        {formData.enablePF && (
          <div className="form-group">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              PF Amount
            </label>
            <input
              readOnly
              value={Number(pfCalc || 0).toFixed(2)}
              className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        )}

      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <FiX size={16} />
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
            <PDFDownloadLink
              document={memoPDF}
              fileName={`SalarySlip_${formData.employeeNameText}_${formData.payDate}.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {({ loading }) => (
                <>
                  <FiDownload size={18} className="shrink-0" aria-hidden />
                  {loading ? 'Loading...' : 'Download PDF'}
                </>
              )}
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

        </div>
);


}

export default SalarySlipGeneratorV2;
