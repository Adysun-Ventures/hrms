'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { PDFViewer, PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CompanyHeader, FormattedDate, Paragraph, Signature, Footer, Watermark } from '@/components/pdf/PDFComponents';
import { commonStyles } from '@/components/pdf/PDFStyles';
import { formatIndianCurrency, numberToWords } from '@/components/pdf/SalaryUtils';
import toast, { Toaster } from 'react-hot-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

const DEFAULT_COMPANY_NAME = 'Adysun Ventures Pvt. Ltd.';

// Define styles for the default Salary Slip layout
const defaultSalarySlipStyles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Calibri',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Calibri',
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  cell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
    fontFamily: 'Calibri',
  },
  headerCell: {
    flex: 1,
    padding: 5,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    backgroundColor: '#f0f0f0',
  },
  bold: {
    fontWeight: 'bold',
  },
  employeeInfoContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    marginVertical: 10,
  },
  employeeInfoSection: {
    flex: 1,
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  infoValue: {
    flex: 2,
    fontSize: 10,
    fontFamily: 'Calibri',
  },
  earningsDeductionsContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 15,
  },
  earningsSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  deductionsSection: {
    flex: 1,
  },
  columnHeader: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 5,
  },
  columnHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  amountColumnHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    textAlign: 'right',
  },
  item: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Calibri',
  },
  itemAmount: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Calibri',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000',
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  totalLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  totalAmount: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    textAlign: 'right',
  },
  netPayContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  netPayRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#e6e6e6',
  },
  netPayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  netPayAmount: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Calibri',
    textAlign: 'right',
  },
  netPayWords: {
    padding: 8,
    fontSize: 11,
    fontFamily: 'Calibri',
    fontStyle: 'italic',
  },
  signature: {
    marginTop: 50,
    flexDirection: 'row',
  },
  signatureSection: {
    flex: 1,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 11,
    fontFamily: 'Calibri',
    marginTop: 20,
  },
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: 'Calibri',
    fontSize: 11,
    backgroundColor: 'white',
  },
});

// Adysun Ventures layout styles
const adysunSalarySlipStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontFamily: 'Calibri',
    fontSize: 10,
    backgroundColor: '#fff',
    color: '#111',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoWrapper: {
    marginRight: 16,
  },
  logo: {
    width: 66,
    height: 66,
  },
  headerTextBlock: {
    alignItems: 'center',
  },
  headerCompany: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    fontSize: 9,
    color: '#333',
  },
  horizontalRule: {
    marginTop: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  dateText: {
    fontSize: 10,
    marginBottom: 4,
  },
  slipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailTable: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  detailLastRow: {
    borderBottomWidth: 0,
  },
  detailCellLabel: {
    width: '40%',
    padding: 6,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
  },
  detailCellValue: {
    width: '60%',
    padding: 6,
  },
  dualTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginBottom: 8,
  },
  dualColumn: {
    flex: 1,
  },
  dualColumnDivider: {
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
  },
  dualHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  dualHeaderCell: {
    flex: 1,
    padding: 6,
    fontWeight: 'bold',
  },
  dualRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#b5b5b5',
    borderBottomStyle: 'solid',
  },
  dualRowLast: {
    borderBottomWidth: 0,
  },
  dualCell: {
    flex: 1,
    padding: 6,
  },
  dualAmountCell: {
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
  },
  totalsLabel: {
    flex: 1,
    padding: 6,
    fontWeight: 'bold',
  },
  totalsAmount: {
    textAlign: 'right',
  },
  netTable: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginBottom: 6,
  },
  netRow: {
    flexDirection: 'row',
  },
  netLabel: {
    width: '40%',
    padding: 6,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
  },
  netValue: {
    width: '60%',
    padding: 6,
    textAlign: 'right',
  },
  note: {
    fontSize: 9,
    textAlign: 'center',
    marginVertical: 4,
  },
  footerSeparator: {
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  footer: {
    alignItems: 'center',
  },
  footerLine: {
    fontSize: 9,
    textAlign: 'center',
  },
});

const getEmployeeNameText = (employeeName, employeeNameText) => {
  if (employeeNameText) return employeeNameText;
  if (Array.isArray(employeeName)) {
    if (employeeName.length === 0) return 'Employee Name';
    return employeeName.join(', ');
  }
  return employeeName || 'Employee Name';
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return "";
  }
};

const getSalarySlipMonthLabel = (dateString) => {
  const payDate = dateString ? new Date(dateString) : new Date();
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric'
  }).format(payDate);
};

const getSalarySlipMonthUpper = (dateString) => {
  const payDate = dateString ? new Date(dateString) : new Date();
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(payDate).toUpperCase();
};

const getTotalEarnings = (formData) => {
  return (
    (formData.basicSalary || 0) +
    (formData.da || 0) +
    (formData.conveyanceAllowance || 0) +
    (formData.otherAllowance || 0) +
    (formData.medicalAllowance || 0) +
    (formData.cca || 0)
  );
};

const getTotalDeductions = (formData) => {
  return (formData.professionalTax || 0) + (formData.otherDeductions || 0);
};

const getNetSalary = (formData) => {
  return getTotalEarnings(formData) - getTotalDeductions(formData);
};

const DefaultSalarySlipLayout = ({ formData }) => {
  const safeFormData = formData || {};

  return (
    <Page size="A4" style={defaultSalarySlipStyles.page}>
      <Watermark logoSrc={safeFormData.companyLogo} />
      <CompanyHeader
        companyName={safeFormData.companyName || 'COMPANY NAME'}
        companyAddress={safeFormData.companyAddressLine1 || 'COMPANY ADDRESS'}
        companyLogo={safeFormData.companyLogo}
        companyPhone={safeFormData.companyPhone || 'PHONE NUMBER'}
        companyWebsite={safeFormData.companyWebsite || 'WEBSITE'}
        companyColor={safeFormData.companyColor || '#FF0000'}
      />

      <Text style={defaultSalarySlipStyles.title}>
        SALARY SLIP FOR THE MONTH OF {getSalarySlipMonthUpper(safeFormData.payDate)}
      </Text>

      <View style={defaultSalarySlipStyles.employeeInfoContainer}>
        <View style={{ ...defaultSalarySlipStyles.employeeInfoSection, flexDirection: 'column' }}>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>EMP Code</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.employeeId || 'EMP001'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Name</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{getEmployeeNameText(safeFormData.employeeName, safeFormData.employeeNameText)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Designation</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.designation || 'Designation'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>PAN</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.pan || 'XXXXXXXXXX'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Location</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.location || 'Location'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>DOJ</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{formatDisplayDate(safeFormData.payDate) || 'DD/MM/YYYY'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Department</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.department || 'Department'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Payable Days</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.payableDays || '30'}</Text>
          </View>
        </View>

        <View style={defaultSalarySlipStyles.employeeInfoSection}>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Bank Name:</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.bankName || 'Bank Name'}</Text>
          </View>
          <View style={defaultSalarySlipStyles.infoRow}>
            <Text style={defaultSalarySlipStyles.infoLabel}>Bank A/C No:</Text>
            <Text style={defaultSalarySlipStyles.infoValue}>{safeFormData.accountNumber || 'XXXXXXXXXXXX'}</Text>
          </View>
        </View>
      </View>

      <View style={defaultSalarySlipStyles.earningsDeductionsContainer}>
        <View style={defaultSalarySlipStyles.earningsSection}>
          <View style={defaultSalarySlipStyles.columnHeader}>
            <Text style={defaultSalarySlipStyles.columnHeaderText}>Earnings</Text>
            <Text style={defaultSalarySlipStyles.amountColumnHeader}>Amount (₹)</Text>
          </View>

          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Basic</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.basicSalary || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>DA</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.da || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Conveyance Allowance</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.conveyanceAllowance || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Other Allowance</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.otherAllowance || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Medical Allowance</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.medicalAllowance || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>CCA</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.cca || 0)}</Text>
          </View>

          <View style={defaultSalarySlipStyles.totalRow}>
            <Text style={defaultSalarySlipStyles.totalLabel}>Gross Salary</Text>
            <Text style={defaultSalarySlipStyles.totalAmount}>
              Rs. {formatIndianCurrency(getTotalEarnings(safeFormData))}
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
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.professionalTax || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}>Other Deductions</Text>
            <Text style={defaultSalarySlipStyles.itemAmount}>Rs. {formatIndianCurrency(safeFormData.otherDeductions || 0)}</Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}></Text>
            <Text style={defaultSalarySlipStyles.itemAmount}></Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}></Text>
            <Text style={defaultSalarySlipStyles.itemAmount}></Text>
          </View>
          <View style={defaultSalarySlipStyles.item}>
            <Text style={defaultSalarySlipStyles.itemName}></Text>
            <Text style={defaultSalarySlipStyles.itemAmount}></Text>
          </View>

          <View style={defaultSalarySlipStyles.totalRow}>
            <Text style={defaultSalarySlipStyles.totalLabel}>Total Deductions</Text>
            <Text style={defaultSalarySlipStyles.totalAmount}>
              Rs. {formatIndianCurrency(getTotalDeductions(safeFormData))}
            </Text>
          </View>
        </View>
      </View>

      <View style={defaultSalarySlipStyles.netPayContainer}>
        <View style={defaultSalarySlipStyles.netPayRow}>
          <Text style={defaultSalarySlipStyles.netPayLabel}>Net Pay</Text>
          <Text style={defaultSalarySlipStyles.netPayAmount}>
            Rs. {formatIndianCurrency(getNetSalary(safeFormData))}
          </Text>
        </View>
        <Text style={defaultSalarySlipStyles.netPayWords}>
          Amount in words: {safeFormData.amountInWords || 'Rupees only'}
        </Text>
      </View>

      <View style={defaultSalarySlipStyles.signature}>
        <View style={defaultSalarySlipStyles.signatureSection}>
          <Text style={defaultSalarySlipStyles.signatureText}>Employee Signature</Text>
        </View>
        <View style={defaultSalarySlipStyles.signatureSection}>
          <Text style={defaultSalarySlipStyles.signatureText}>Authorised Signatory</Text>
        </View>
      </View>

      <Text style={{ fontSize: 9, marginTop: 30, textAlign: 'center', fontFamily: 'Calibri' }}>
        This is a computer-generated Salary slip. No Signature is required.
      </Text>

      <Footer
        companyName={safeFormData.companyName || 'COMPANY NAME'}
        companyAddress={safeFormData.companyAddressLine1 || 'COMPANY ADDRESS'}
        companyPhone={safeFormData.companyPhone || 'PHONE NUMBER'}
        companyWebsite={safeFormData.companyWebsite || 'WEBSITE'}
        companyColor={safeFormData.companyColor || '#FF0000'}
      />
    </Page>
  );
};

const AdysunSalarySlipLayout = ({ formData }) => {
  const safeFormData = formData || {};

  const earningsData = [
    { label: 'Basic', amount: safeFormData.basicSalary || 0 },
    { label: 'HRA', amount: safeFormData.da || 0 },
    { label: 'Conveyance Allowance', amount: safeFormData.conveyanceAllowance || 0 },
    {
      label: 'Other Allowance',
      amount: (safeFormData.otherAllowance || 0) + (safeFormData.medicalAllowance || 0) + (safeFormData.cca || 0),
    },
  ];

  const deductionsData = [
    { label: 'PT', amount: safeFormData.professionalTax || 0 },
    { label: 'Other Deductions', amount: safeFormData.otherDeductions || 0 },
  ];

  const footerLines = [
    'Adysun Ventures Pvt. Ltd.',
    'Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump, Pune - Satara Rd, Taware Colony, Bibwewadi, Pune, Maharashtra 411009, Pune, Maharashtra 411009',
    'www.AdysunVentures.com  |  info@adysunventures.com  |  hr@adysunventures.com'
  ].filter(Boolean);

  const detailRows = [
    { label: 'Employee Name', value: getEmployeeNameText(safeFormData.employeeName, safeFormData.employeeNameText) || 'Arnab Kumar Baishya' },
    { label: 'Employee Code', value: safeFormData.employeeId || 'ADV061' },
    { label: 'Designation', value: safeFormData.designation || 'Software Engineer' },
    { label: 'Department', value: safeFormData.department || 'ADV-DEV' },
    { label: 'Bank Name', value: safeFormData.bankName || 'State Bank of India (SBI)' },
    { label: 'Bank Account No', value: safeFormData.accountNumber || '38609967034' },
    { label: 'Pan No', value: safeFormData.pan || 'EHNPB1737H' },
    { label: 'Leaves', value: safeFormData.leaves || '0' },
    { label: 'Effective Work Days', value: `${safeFormData.payableDays || '23'} Days` },
  ];

  return (
    <Page size="A4" style={adysunSalarySlipStyles.page}>
      <View style={adysunSalarySlipStyles.headerRow}>
        <View style={adysunSalarySlipStyles.logoWrapper}>
          {safeFormData.companyLogo ? (
            <Image source={safeFormData.companyLogo} style={adysunSalarySlipStyles.logo} />
          ) : (
            <Image source="/assets/images/logos/logo.png" style={adysunSalarySlipStyles.logo} />
          )}
        </View>
        <View style={adysunSalarySlipStyles.headerTextBlock}>
          <Text style={adysunSalarySlipStyles.headerCompany}>Adysun Ventures Pvt. Ltd.</Text>
          <Text style={adysunSalarySlipStyles.headerInfo}>
            www.AdysunVentures.com | info@adysunventures.com | hr@adysunventures.com
          </Text>
        </View>
      </View>

      <View style={adysunSalarySlipStyles.horizontalRule} />

      <View>
        <Text style={adysunSalarySlipStyles.dateText}>{formatDisplayDate(safeFormData.payDate)}</Text>
        <Text style={adysunSalarySlipStyles.slipTitle}>
          Salary Slip {getSalarySlipMonthLabel(safeFormData.payDate)}
        </Text>
      </View>

      <View style={adysunSalarySlipStyles.detailTable}>
        {detailRows.map((row, index) => (
          <View
            key={row.label}
            style={[
              adysunSalarySlipStyles.detailRow,
              index === detailRows.length - 1 && adysunSalarySlipStyles.detailLastRow
            ]}
          >
            <Text style={adysunSalarySlipStyles.detailCellLabel}>{row.label}</Text>
            <Text style={adysunSalarySlipStyles.detailCellValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={adysunSalarySlipStyles.dualTable}>
        <View style={[adysunSalarySlipStyles.dualColumn, adysunSalarySlipStyles.dualColumnDivider]}>
          <View style={adysunSalarySlipStyles.dualHeader}>
            <Text style={adysunSalarySlipStyles.dualHeaderCell}>Earnings (A)</Text>
            <Text style={adysunSalarySlipStyles.dualHeaderCell}>Amount</Text>
          </View>
          {earningsData.map((item, index) => (
            <View
              key={item.label}
              style={[
                adysunSalarySlipStyles.dualRow,
                index === earningsData.length - 1 && adysunSalarySlipStyles.dualRowLast
              ]}
            >
              <Text style={adysunSalarySlipStyles.dualCell}>{item.label}</Text>
              <Text style={[adysunSalarySlipStyles.dualCell, adysunSalarySlipStyles.dualAmountCell]}>
                {formatIndianCurrency(item.amount)}
              </Text>
            </View>
          ))}
          <View style={adysunSalarySlipStyles.totalsRow}>
            <Text style={adysunSalarySlipStyles.totalsLabel}>Gross Salary</Text>
            <Text style={[adysunSalarySlipStyles.totalsLabel, adysunSalarySlipStyles.dualAmountCell]}>
              {formatIndianCurrency(getTotalEarnings(safeFormData))}
            </Text>
          </View>
        </View>

        <View style={adysunSalarySlipStyles.dualColumn}>
          <View style={adysunSalarySlipStyles.dualHeader}>
            <Text style={adysunSalarySlipStyles.dualHeaderCell}>Deductions (B)</Text>
            <Text style={adysunSalarySlipStyles.dualHeaderCell}>Amount</Text>
          </View>
          {deductionsData.map((item, index) => (
            <View
              key={item.label}
              style={[
                adysunSalarySlipStyles.dualRow,
                index === deductionsData.length - 1 && adysunSalarySlipStyles.dualRowLast
              ]}
            >
              <Text style={adysunSalarySlipStyles.dualCell}>{item.label}</Text>
              <Text style={[adysunSalarySlipStyles.dualCell, adysunSalarySlipStyles.dualAmountCell]}>
                {formatIndianCurrency(item.amount)}
              </Text>
            </View>
          ))}
          <View style={adysunSalarySlipStyles.totalsRow}>
            <Text style={adysunSalarySlipStyles.totalsLabel}>Total</Text>
            <Text style={[adysunSalarySlipStyles.totalsLabel, adysunSalarySlipStyles.dualAmountCell]}>
              {formatIndianCurrency(getTotalDeductions(safeFormData))}
            </Text>
          </View>
        </View>
      </View>

      <View style={adysunSalarySlipStyles.netTable}>
        <View style={adysunSalarySlipStyles.netRow}>
          <Text style={adysunSalarySlipStyles.netLabel}>Net Salary ( A - B )</Text>
          <Text style={adysunSalarySlipStyles.netValue}>
            {formatIndianCurrency(getNetSalary(safeFormData))}
          </Text>
        </View>
      </View>

      <Text style={adysunSalarySlipStyles.note}>
        This is a system generated payslip and does not require signature.
      </Text>

      <View style={adysunSalarySlipStyles.footerSeparator} />

      <View style={adysunSalarySlipStyles.footer}>
        {footerLines.map((line, idx) => (
          <Text key={idx} style={adysunSalarySlipStyles.footerLine}>{line}</Text>
        ))}
      </View>
    </Page>
  );
};

const layoutRegistry = {
  default: DefaultSalarySlipLayout,
  adysun: AdysunSalarySlipLayout,
};

const resolveSalarySlipLayout = (formData) => {
  const companyName = (formData.companyName || '').toLowerCase();
  if (companyName.includes('adysun')) {
    return 'adysun';
  }
  return 'default';
};

// Salary Slip PDF Document Component
const SalarySlipPDF = ({ formData }) => {
  const safeFormData = formData || {};
  const layoutKey = resolveSalarySlipLayout(safeFormData);
  const LayoutComponent = layoutRegistry[layoutKey] || DefaultSalarySlipLayout;

  return (
    <Document>
      <LayoutComponent formData={safeFormData} />
    </Document>
  );
};

// Main Component
function SalarySlipGeneratorV2() {
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employments, setEmployments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPDF, setShowPDF] = useState(false);
  const [formData, setFormData] = useState({
    company: DEFAULT_COMPANY_NAME,
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
    pan: "",
    basicSalary: 0,
    da: 0,
    conveyanceAllowance: 0,
    otherAllowance: 0,
    medicalAllowance: 0,
    cca: 0,
    professionalTax: 0,
    otherDeductions: 0,
    companyName: DEFAULT_COMPANY_NAME,
    companyAddressLine1: "",
    companyColor: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    companyLogo: "",
    companyHR: ""
  });

  const normalizeEmployeeNames = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    return value ? [value] : [];
  };

  const getPrimaryEmployeeName = (value) => {
    const names = normalizeEmployeeNames(value);
    if (names.length === 0) return '';
    return names[names.length - 1];
  };

  const formatEmployeeNamesForFile = (value) => {
    const names = normalizeEmployeeNames(value);
    if (names.length === 0) return 'Employee';
    return names.join('_');
  };

  // Use React.useMemo to memoize the PDF document to prevent unnecessary re-renders
  const memoizedPdfDocument = React.useMemo(() => (
    <SalarySlipPDF formData={formData} />
  ), [formData]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchCompanies();
        await fetchCandidates();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error('Failed to load data');
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (companies.length === 0) return;

    setFormData(prev => {
      const desiredName = prev.company || DEFAULT_COMPANY_NAME;
      const selectedCompany =
        companies.find(company => company.name === desiredName) || companies[0];

      if (!selectedCompany) return prev;

      const alreadySynced =
        prev.companyName === selectedCompany.name &&
        prev.companyAddressLine1 === selectedCompany.address &&
        prev.companyLogo === selectedCompany.logo;

      if (alreadySynced) return prev;

      return {
        ...prev,
        company: selectedCompany.name,
        companyName: selectedCompany.name,
        companyAddressLine1: selectedCompany.address || prev.companyAddressLine1,
        companyColor: selectedCompany.serverColor || prev.companyColor,
        companyEmail: selectedCompany.email || prev.companyEmail,
        companyPhone: selectedCompany.mobile || prev.companyPhone,
        companyWebsite: selectedCompany.website || prev.companyWebsite,
        companyLogo: selectedCompany.logo || prev.companyLogo,
        companyHR: selectedCompany.hrName || prev.companyHR
      };
    });
  }, [companies]);

  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, "companies"));
    const companyList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCompanies(companyList);
  };

  const fetchCandidates = async () => {
    try {
      // Try fetching from 'employees' collection
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Employees:", employeesList);
      setCandidates(employeesList);

      // Now fetch all employments for these employees
      const employmentData = {};
      for (const employee of employeesList) {
        try {
          // Query employments for this employee
          const q = query(collection(db, 'employments'), where('employeeId', '==', employee.id));
          const empSnapshot = await getDocs(q);

          if (!empSnapshot.empty) {
            // Get the most recent employment (usually there will be just one)
            const employmentsList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by startDate (descending) to get the most recent employment first
            const sortedEmployments = employmentsList.sort((a, b) => {
              return new Date(b.startDate) - new Date(a.startDate);
            });

            employmentData[employee.id] = sortedEmployments[0];
            console.log(`Found employment for ${employee.name}:`, sortedEmployments[0]);
          } else {
            console.log(`No employment found for employee: ${employee.name}`);
          }
        } catch (err) {
          console.error(`Error fetching employment for employee ${employee.id}:`, err);
        }
      }

      setEmployments(employmentData);

      if (employeesList.length === 0) {
        console.warn("No employees found in the database. Please add employees in the admin dashboard first.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Add this function to calculate days in month
  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month + 1, 0).getDate();
  };

  // Calculate salary components
  const calculateSalary = (lpa, leaves = 0, selectedMonth) => {
    // Convert inputs to numbers and provide defaults
    const lpaNum = Number(lpa) || 0;
    const leavesNum = Number(leaves) || 0;
    const monthNum = Number(selectedMonth) || new Date().getMonth();

    // Get total days in selected month
    const daysInMonth = getDaysInMonth(monthNum);

    // Calculate payable days
    const payableDays = Math.max(0, daysInMonth - leavesNum);

    // Calculate base annual salary
    const annualSalary = lpaNum * 100000;

    // Calculate per day salary
    const perDaySalary = (annualSalary / 12) / daysInMonth;

    // Calculate effective monthly salary after leave deductions
    const effectiveSalary = Math.max(0, (annualSalary / 12) - (perDaySalary * leavesNum));

    // Calculate components with null checks and Math.max to prevent negative values
    const monthlyBasic = Math.max(0, Math.round(effectiveSalary * 0.5));
    const da = Math.max(0, Math.round(monthlyBasic * 0.2));
    const conveyanceAllowance = Math.max(0, Math.round(1600));
    const medicalAllowance = Math.max(0, Math.round(1250));
    const cca = Math.max(0, Math.round(500));
    const otherAllowance = Math.max(0, Math.round(effectiveSalary - monthlyBasic - da - conveyanceAllowance - medicalAllowance - cca));

    // Professional tax varies by state, using standard 200 for example
    const professionalTax = 200;

    // Calculate net amount
    const totalEarnings = monthlyBasic + da + conveyanceAllowance + otherAllowance + medicalAllowance + cca;
    const totalDeductions = professionalTax;
    const netAmount = totalEarnings - totalDeductions;

    // Convert to Indian words
    const amountInWords = `Rupees ${numberToWords(netAmount)} Only`;

    return {
      basicSalary: monthlyBasic,
      da,
      conveyanceAllowance,
      otherAllowance,
      medicalAllowance,
      cca,
      professionalTax,
      otherDeductions: 0,
      amountInWords,
      payableDays
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "company") {
      const selectedCompany = companies.find(company => company.name === value);
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          company: selectedCompany.name,
          companyName: selectedCompany.name,
          companyAddressLine1: selectedCompany.address,
          companyColor: selectedCompany.serverColor,
          companyEmail: selectedCompany.email,
          companyPhone: selectedCompany.mobile,
          companyWebsite: selectedCompany.website,
          companyLogo: selectedCompany.logo,
          companyHR: selectedCompany.hrName
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          company: value
        }));
      }
    } else if (name === "employeeName") {
      const selectedNames = normalizeEmployeeNames(value);
      const primaryEmployeeName = getPrimaryEmployeeName(selectedNames);
      const selectedEmployee = candidates.find(employee => employee.name === primaryEmployeeName);

      if (selectedEmployee) {
        console.log("Selected Employee:", selectedEmployee);

        // Get the employment details for this employee
        const employmentDetails = employments[selectedEmployee.id];
        console.log("Employment details:", employmentDetails);

        let employeeSalary;
        let employeeDesignation;
        let employeeDepartment;
        let employeeLocation;
        let employeePAN;

        if (employmentDetails) {
          // If we have employment details, use those
          employeeSalary = employmentDetails.salary || employmentDetails.ctc || 0;
          employeeDesignation = employmentDetails.jobTitle || employmentDetails.designation;
          employeeDepartment = employmentDetails.department;
          employeeLocation = employmentDetails.location;
          employeePAN = selectedEmployee.pan; // Usually PAN is in employee record
        } else {
          // Fallback to employee record if no employment details
          employeeSalary = selectedEmployee.salary || 0;
          employeeDesignation = selectedEmployee.position || selectedEmployee.jobTitle;
          employeeDepartment = selectedEmployee.department;
          employeeLocation = selectedEmployee.location;
          employeePAN = selectedEmployee.pan;
        }

        // Calculate CTC in LPA
        const ctcValue = employeeSalary ? (employeeSalary / 100000) : 0;

        // Get current month and leaves
        const currentMonth = formData.month;
        const leaves = formData.leaves;

        // Calculate salary components
        const salaryComponents = calculateSalary(ctcValue, leaves, currentMonth);

        setFormData(prev => ({
          ...prev,
          employeeName: selectedNames,
          employeeNameText: primaryEmployeeName || selectedNames.join(', '),
          employeeId: selectedEmployee.employeeId || selectedEmployee.id,
          designation: employeeDesignation || "",
          department: employeeDepartment || "",
          location: employeeLocation || "",
          pan: employeePAN || "",
          ...salaryComponents
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          employeeName: selectedNames,
          employeeNameText: selectedNames.join(', '),
          employeeId: "",
          designation: "",
          department: "",
          location: "",
          pan: ""
        }));
      }
    } else if (name === "leaves" || name === "month") {
      // Recalculate salary when leaves or month changes
      const updatedFormData = { ...formData, [name]: value };

      // Find the selected employee to get LPA
      const primaryEmployee = getPrimaryEmployeeName(formData.employeeName);
      const selectedEmployee = candidates.find(employee => employee.name === primaryEmployee);
      if (selectedEmployee) {
        // Get the employment details
        const employmentDetails = employments[selectedEmployee.id];
        let employeeSalary;

        if (employmentDetails) {
          employeeSalary = employmentDetails.salary || employmentDetails.ctc || 0;
        } else {
          employeeSalary = selectedEmployee.salary || 0;
        }

        // Calculate CTC in LPA
        const ctcValue = employeeSalary ? (employeeSalary / 100000) : 0;

        // Calculate updated salary
        const salaryComponents = calculateSalary(
          ctcValue,
          updatedFormData.leaves,
          updatedFormData.month
        );

        setFormData({
          ...updatedFormData,
          ...salaryComponents
        });
      } else {
        setFormData(updatedFormData);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGenerateSalarySlip = () => {
    setShowPDF(true);
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft size={16} /> Back
        </Link>

        {/* Form Section */}
        <h2 className="text-2xl font-bold text-gray-800 flex-1 text-center">Salary Slip Generator</h2>

        {/* Generate button in header */}
        <button
          onClick={handleGenerateSalarySlip}
          disabled={normalizeEmployeeNames(formData.employeeName).length === 0}
          className={`flex items-center px-6 py-3 rounded-lg shadow-lg hover:shadow-md transition-all duration-200 ${
            normalizeEmployeeNames(formData.employeeName).length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
          }`}
        >
          <FiDownload size={18} className="mr-2" />
          <span>Generate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="form-group md:col-span-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Company</label>
          <input
            type="text"
            value={formData.companyName || DEFAULT_COMPANY_NAME}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>

        <div className="form-group md:col-span-6">
          <SearchableDropdown
            label="Employee Name"
            name="employeeName"
            value={formData.employeeName}
            onChange={handleInputChange}
            options={candidates}
            placeholder="Select Employee(s)"
            searchFields={['name', 'employeeId', 'id']}
            multiSelect={true}
          />
        </div>

        <div className="form-group md:col-span-3">
          <label className="block mb-2 text-sm font-medium text-gray-700">Month</label>
          <select
            name="month"
            value={formData.month}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
        </div>

        <div className="form-group md:col-span-3">
          <label className="block mb-2 text-sm font-medium text-gray-700">Leaves</label>
          <input
            type="number"
            name="leaves"
            value={formData.leaves}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            max={getDaysInMonth(Number(formData.month))}
          />
        </div>

        <div className="form-group md:col-span-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Payable Days</label>
          <input
            type="text"
            value={formData.payableDays || getDaysInMonth(Number(formData.month))}
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            readOnly
          />

        </div>

        <div className="form-group md:col-span-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Pay Date</label>
          <input
            type="date"
            name="payDate"
            value={formData.payDate}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleGenerateSalarySlip}
          disabled={normalizeEmployeeNames(formData.employeeName).length === 0}
          className={`flex items-center px-6 py-3 rounded-lg shadow-lg hover:shadow-md transition-all duration-200 ${
            normalizeEmployeeNames(formData.employeeName).length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
          }`}
        >
          <FiDownload size={18} className="mr-2" />
          <span>Generate</span>
        </button>
      </div>

      {/* PDF Preview Section - only show when Generate button is clicked */}
      {showPDF && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">PDF Preview</h3>

            <PDFDownloadLink
              document={memoizedPdfDocument}
              fileName={`SalarySlip_${formatEmployeeNamesForFile(formData.employeeName)}_${formData.payDate}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>

          <div className="border rounded-lg" style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              {memoizedPdfDocument}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalarySlipGeneratorV2;
