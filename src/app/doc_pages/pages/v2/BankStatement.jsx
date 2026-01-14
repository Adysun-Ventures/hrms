'use client';

import React, { useState, useEffect } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { commonStyles } from "@/components/pdf/PDFStyles";
import { formatIndianCurrency } from '@/components/pdf/SalaryUtils';

// Add utility functions for generating random data
// These would normally come from faker.js, but we'll implement them here
const fakeFinance = {
  // Generate a random transaction description
  transactionDescription: () => {
    const types = [
      "UPI/DR/",
      "UPI/CR/",
      "NEFT/",
      "IMPS/",
      "ATM/WDL/",
      "POS/",
      "SALARY/",
      "CHQ/",
      "RTGS/",
      "INTERNET BANKING/",
      "MOBILE BANKING/"
    ];
    
    const merchants = [
      "AMAZON PAY",
      "FLIPKART",
      "SWIGGY",
      "ZOMATO",
      "UBER",
      "OLA",
      "AIRTEL",
      "JIO",
      "VODAFONE",
      "NETFLIX",
      "HOTSTAR",
      "BIGBASKET",
      "DOMINOS",
      "KFC",
      "MCDONALDS",
      "FOOD DELIVERY",
      "ELECTRICITY BILL",
      "WATER BILL",
      "GAS BILL",
      "RENT PAYMENT",
      "SHOPPING"
    ];
    
    const banks = [
      "HDFC",
      "ICICI",
      "SBI",
      "AXIS",
      "KOTAK",
      "YESB",
      "UBI",
      "BOB",
      "PNB",
      "CANARA"
    ];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const randomBank = banks[Math.floor(Math.random() * banks.length)];
    const randomRef = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    
    return `${randomType}${randomRef}/${randomMerchant}/${randomBank}/${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
  },
  
  // Generate a random reference number
  referenceNumber: () => {
    const prefixes = ["AUS", "REF", "TXN", "CHQ", "NEFT", "UTR", "PAY"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const date = new Date();
    const year = date.getFullYear();
    
    // Generate a random alphanumeric string
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    
    return `${prefix}${year}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${result}`;
  },
  
  // Generate a random amount between 10 and max
  amount: (max = 10000) => {
    // Generate random amount with 2 decimal places
    return Math.floor(Math.random() * max * 100) / 100;
  },
  
  // Format number with commas and 2 decimal places
  formatCurrency: (number) => {
    return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};

// Add a function to generate random transactions for a date range
const generateRandomTransactions = (startDate, endDate, startingBalance = 50000) => {
  const transactions = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  let runningBalance = startingBalance;
  
  while (currentDate <= end) {
    // Generate 5-8 transactions per day
    const transactionsPerDay = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < transactionsPerDay; i++) {
      // 70% chance of debit, 30% chance of credit
      const isDebit = Math.random() < 0.7;
      
      // Generate a random amount (higher range for credits)
      const amount = isDebit ? 
        fakeFinance.amount(5000) : 
        fakeFinance.amount(15000);
      
      // Update running balance
      runningBalance = isDebit ? 
        runningBalance - amount : 
        runningBalance + amount;
      
      // Format the date
      const formattedDate = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      // Create the transaction
      transactions.push({
        transactionDate: formattedDate,
        valueDate: formattedDate,
        description: fakeFinance.transactionDescription(),
        chequeRefNo: isDebit ? fakeFinance.referenceNumber() : "",
        debit: isDebit ? fakeFinance.formatCurrency(amount) : "-",
        credit: isDebit ? "-" : fakeFinance.formatCurrency(amount),
        balance: fakeFinance.formatCurrency(runningBalance)
      });
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    transactions,
    openingBalance: fakeFinance.formatCurrency(startingBalance),
    closingBalance: fakeFinance.formatCurrency(runningBalance)
  };
};

// Register Quicksand font for AU statement
Font.register({
  family: "Quicksand",
  fonts: [
    {
      src: "https://github.com/google/fonts/raw/main/ofl/quicksand/Quicksand-Regular.ttf",
    },
    {
      src: "https://github.com/google/fonts/raw/main/ofl/quicksand/Quicksand-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

// Use built-in fonts that are guaranteed to work with React-PDF
// Helvetica, Helvetica-Bold, etc. are built-in and don't need registration

// AU Statement Header Component
const AUStatementHeader = ({ auLogo, purple }) => (
  <View
    style={{
      backgroundColor: purple,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 68,
      width: "100%",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    }}
  >
    <Text
      style={{
        color: "white",
        fontSize: 27,
        fontWeight: 700,
        letterSpacing: 0.5,
        fontFamily: "Calibri",
        marginLeft: 36,
      }}
    >
      ACCOUNT STATEMENT
    </Text>
    <Image
      src={auLogo}
      style={{ width: 110, height: 90, objectFit: "contain", marginRight: 36 }}
    />
  </View>
);

// AU Statement Footer Component
const AUStatementFooter = ({ purple }) => (
  <View
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      marginTop: 30,
    }}
  >
    {/* Border line at the top of footer */}
    
    {/* Auto-generated statement text and page number on the same line */}
    <View style={{ 
      flexDirection: "row", 
      width: "100%", 
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 24
    }}>
     
      
      <Text
        style={{
          fontSize: 10,
          color: "#000",
          textAlign: "center",
          fontFamily: "Calibri",
          fontWeight: 400,
          flex: 1
        }}
      >
        This is an auto generated statement and requires no signature
      </Text>
      
      <Text
        style={{
          fontSize: 9,
          color: "#444",
          textAlign: "right",
          fontFamily: "Calibri",
          fontWeight: 400,
          width: 70,
        }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
    
    <View style={{ borderTopWidth: 1,
        borderTopColor: "#b043ac",
        borderTopStyle: "solid",
        width: "100%",
        marginBottom: 5, }}>


    </View>

    {/* Review information text - purple and centered */}
    <Text
      style={{
        fontSize: 10,
        color: "#6d3078",
        textAlign: "center",
        marginBottom: 10,
        fontFamily: "Calibri",
        fontWeight: 400,
        paddingHorizontal: 20,
      }}
    >
      Please review the information provided in the statement. In case of any
      discrepancy, please inform the Bank immediately
    </Text>
    
    {/* Contact information with labels at top, values at bottom */}
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 36,
        paddingRight: 36,
        marginBottom: 15,
      }}
    >
      <View style={{ alignItems: "flex-start" }}>
        <Text style={styles.footerText}>Call us at</Text>
        <Text style={styles.footerText}>1800 1200 1200</Text>
      </View>
      
      <View style={{ alignItems: "center" }}>
        <Text style={styles.footerText}>Website</Text>
        <Text style={styles.footerText}>www.aubank.in</Text>
      </View>
      
      <View style={{ alignItems: "center" }}>
        <Text style={styles.footerText}>Email</Text>
        <Text style={styles.footerText}>customercare@aubank.in</Text>
      </View>
      
      <View style={{ alignItems: "center" }}>
        <Text style={styles.footerText}>Write to us at</Text>
        <Text style={styles.footerText}>Reg. office address</Text>
      </View>
      
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.footerText}>Follow us on</Text>
        <Text style={styles.footerText}>Facebook/Twitter</Text>
      </View>
    </View>
    
    {/* Bottom purple address bar */}
    <View style={{ backgroundColor: purple, padding: 8, width: "100%" }}>
      <Text style={styles.addressText}>
        19A, DHULESHWAR GARDEN, AJMER ROAD, JAIPUR - 302001, RAJASTHAN (INDIA)
        Ph.: +91 141 4110060/61, TOLL-FREE: 1800 1200 1200
      </Text>
    </View>
  </View>
);

// Helper: AU Small Finance Bank PDF Template
const AUBankStatementPDF = ({ statementData, logo }) => {
  // Format transaction data for display
  const formatTransactions = (transactions = []) => {
    return transactions.map((transaction) => {
      return {
        ...transaction,
        // No special formatting - let React-PDF handle wrapping
        description: transaction.description || "",
        chequeRefNo: transaction.chequeRefNo || "",
      };
    });
  };

  const {
    name,
    customerId,
    customerType,
    address,
    accountNumber,
    accountType,
    branch,
    nominee,
    statementDate,
    statementPeriod,
    openingBalance,
    closingBalance,
    transactions = [],
  } = statementData;

  // Process transactions for display
  const formattedTransactions = formatTransactions(transactions);

  // Calculate totals for debit and credit
  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    formattedTransactions.forEach(transaction => {
      // Convert string amounts to numbers, removing commas and handling "-" values
      const debitAmount = transaction.debit && transaction.debit !== "-" 
        ? parseFloat(transaction.debit.replace(/,/g, '')) 
        : 0;
        
      const creditAmount = transaction.credit && transaction.credit !== "-" 
        ? parseFloat(transaction.credit.replace(/,/g, '')) 
        : 0;
        
      totalDebit += debitAmount;
      totalCredit += creditAmount;
    });
    
    // Format back to string with commas
    const formatNumber = (num) => {
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    return {
      totalDebit: formatNumber(totalDebit),
      totalCredit: formatNumber(totalCredit)
    };
  };
  
  const { totalDebit, totalCredit } = calculateTotals();

  // Use logo from bank db, fallback to AU static logo
  const auLogo =
    logo || "https://www.aubank.in/themes/custom/au/images/logo.svg";
  const purple = "#6d3076";
  const lightGray = "#f7f6fa";
  const borderGray = "#d1d5db";

  return (
    <Document>
      <Page
        size="A4"
        style={{
          padding: "10mm 8mm 20mm 8mm",
          backgroundColor: "white",
          width: "210mm",
          height: "297mm",
          position: "relative",
          fontFamily: "Calibri",
        }}
      >
        <AUStatementHeader auLogo={auLogo} purple={purple} />
        {/* Info Section: Two columns, grid-like flexbox for pixel-perfect alignment */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            width: "100%",
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 12,
            marginTop: 56,
            marginBottom: 0,
            alignItems: "flex-start",
          }}
        >
          {/* Left Column - explicit rows for each field */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Name
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {name}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Customer ID
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {customerId}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Customer Type
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {customerType}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Statement Date
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {statementDate}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Statement Period
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {statementPeriod}
              </Text>
            </View>
          </View>
          {/* Right Column - explicit rows for each field */}
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Account Number
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {accountNumber}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Account Type
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {accountType}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Branch
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {branch}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 0,
                minHeight: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 70,
                  textAlign: "left",
                }}
              >
                Nominee
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Calibri",
                  color: "#2d3a5a",
                  width: 18,
                  textAlign: "center",
                }}
              >
                {" "}
                :{" "}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: "#000000",
                  width: 180,
                  textAlign: "left",
                }}
              >
                {nominee}
              </Text>
            </View>
          </View>
        </View>
        {/* Horizontal border line separating account info and table */}
        <View
          style={
            {
              // borderBottomWidth: 1,
              // borderBottomColor: "#d1d5db",
              // borderBottomStyle: "solid",
              // width: "100%",
              // marginBottom: 30,
              marginTop: 10,
            }
          }
        />
        {/* Table Section: pixel-perfect header/row alignment and styling */}
        <View
          style={[
            styles.tableContainer,
          ]}
        >
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Transaction Date</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Value Date</Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.2, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Description/Narration</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1.2, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Cheque/Reference No.</Text>
            </View>
            <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Debit</Text>
            </View>
            <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
              <Text style={styles.tableHeaderText}>Credit</Text>
            </View>
            <View
              style={[
                styles.tableCell,
                { flex: 1, borderRightWidth: 0, padding: 0 },
              ]}
            >
              <Text style={styles.tableHeaderText}>Balance</Text>
            </View>
          </View>

          {/* Generate transaction rows */}
          {formattedTransactions.map((transaction, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
                <Text style={styles.tableCellCenter}>
                  {transaction.transactionDate}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
                <Text style={styles.tableCellCenter}>
                  {transaction.valueDate}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 2.2, padding: 0 }]}>
                <View style={styles.cellWrapper}>
                  <Text style={styles.wrapTextDescription}>
                    {transaction.description}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1.2, padding: 0 }]}>
                <View style={styles.cellWrapper}>
                  <Text style={styles.wrapTextReference}>
                    {transaction.chequeRefNo}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
                <Text style={styles.tableCellRight}>{transaction.debit}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
                <Text style={styles.tableCellRight}>{transaction.credit}</Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { flex: 1, borderRightWidth: 0, padding: 0 },
                ]}
              >
                <Text style={styles.tableCellRight}>{transaction.balance}</Text>
              </View>
            </View>
          ))}

          {/* Total row */}
          <View style={[styles.tableRow, { backgroundColor: "#f9f9f9" }]}>
            <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
              <Text style={styles.tableCellCenter}></Text>
            </View>
            <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
              <Text style={styles.tableCellCenter}></Text>
            </View>
            <View style={[styles.tableCell, { flex: 2.2, padding: 0 }]}>
              <Text style={[styles.tableCellCenter, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
                Total
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1.2, padding: 0 }]}>
              <Text style={styles.tableCellCenter}></Text>
            </View>
            <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
              <Text style={[styles.tableCellRight, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
                {totalDebit}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
              <Text style={[styles.tableCellRight, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
                {totalCredit}
              </Text>
            </View>
            <View
              style={[
                styles.tableCell,
                { flex: 1, borderRightWidth: 0, padding: 0 },
              ]}
            >
              <Text style={[styles.tableCellRight, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
                {/* {statementData.closingBalance} */}
              </Text>
            </View>
          </View>

          {/* Only show sample row if no transactions */}
          {(!formattedTransactions || formattedTransactions.length === 0) && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
                <Text style={styles.tableCellCenter}>01 Apr 2025</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1, padding: 0 }]}>
                <Text style={styles.tableCellCenter}>01 Apr 2025</Text>
              </View>
              <View style={[styles.tableCell, { flex: 2.2, padding: 0 }]}>
                <View style={styles.cellWrapper}>
                  <Text style={styles.wrapTextDescription}>
                    UPI/DR/509157008024/K HOSMAHAMMAD/YESB/00226100000025/UPI AU
                    JAGATPURA
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1.2, padding: 0 }]}>
                <View style={styles.cellWrapper}>
                  <Text style={styles.wrapTextReference}>
                    AUS20250401TS0TED6451FABCAE4289873
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
                <Text style={styles.tableCellRight}>10.00</Text>
              </View>
              <View style={[styles.tableCell, { flex: 0.9, padding: 0 }]}>
                <Text style={styles.tableCellRight}>-</Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { flex: 1, borderRightWidth: 0, padding: 0 },
                ]}
              >
                <Text style={styles.tableCellRight}>17,195.00</Text>
              </View>
            </View>
          )}
        </View>
        {/* Footer: updated to match exact design from reference image */}
        <AUStatementFooter purple={purple} />
      </Page>
    </Document>
  );
};

// Update styles to add footer-specific styles
const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5", // Lighter gray matching reference image
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "solid",
    borderBottomWidth: 0,
    minHeight: 30, // Exact height from reference
    fontFamily: "Calibri",
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#000000",
    textAlign: "center",
    padding: 4, // Exact padding from reference
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderLeftColor: "#d1d5db",
    borderLeftStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
    minHeight: 30, // Reduced from 50 to make rows more compact
    fontSize: 9,
    fontFamily: "Calibri",
  },
  tableCell: {
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    fontFamily: "Calibri",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Critical for preventing text overflow
  },
  cellWrapper: {
    width: "100%",
    height: "60px",
    padding: 0, // Reduced from 4 to make content fit better
    justifyContent: "center",
  },
  wrapTextDescription: {
    width: "95%",
    fontSize: 9, 
    lineHeight: 1.2, // Reduced from 1.3 for tighter text
    textAlign: "left",
    hyphens: "auto",
    wordBreak: "break-word",
    color: "#000",
    padding: 2, // Reduced from 3
  },
  wrapTextReference: {
    width: "95%",
    fontSize: 9,
    lineHeight: 1.2, // Reduced from 1.3
    textAlign: "center",
    hyphens: "auto",
    wordBreak: "break-word",
    color: "#000",
    padding: 2, // Reduced from 3
  },
  tableCellCenter: {
    padding: 2, // Reduced from 4
    width: "95%",
    textAlign: "center",
    fontSize: 9,
    color: "#000",
  },
  tableCellRight: {
    padding: 2, // Reduced from 4
    width: "95%",
    textAlign: "right",
    fontSize: 9,
    color: "#000",
  },
  tableCellNarration: {
    flex: 2.2,
    padding: 0, // Remove padding from container
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    fontFamily: "Calibri",
    overflow: "hidden",
  },
  tableCellAmount: {
    flex: 0.9,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    fontFamily: "Calibri",
    textAlign: "right",
  },
  tableCellDateValue: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    fontFamily: "Calibri",
    textAlign: "center",
  },
  tableCellBalance: {
    flex: 1,
    padding: 8,
    fontFamily: "Calibri",
    textAlign: "right",
  },
  footerText: {
    fontSize: 9,
    color: "#6d3078",
    fontFamily: "Calibri",
    lineHeight: 1.3,
  },
  addressText: {
    fontSize: 9,
    color: "white",
    textAlign: "center",
    fontFamily: "Calibri",
    lineHeight: 1.3,
  },
  tableContainer: {
    marginBottom: 50, // Keep space after table before footer
  },
});

// Main BankStatement component
const BankStatement = () => {
  const [candidates, setCandidates] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
  });

  useEffect(() => {
    fetchCandidates();
    fetchBanks();
  }, []);

  const fetchCandidates = async () => {
    try {
      // Fetch from 'employees' collection instead of 'candidates'
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCandidates(employeesList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees data");
    }
  };

  const fetchBanks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "banks"));
      const bankList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setBanks(bankList);
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error("Failed to load banks data");
    }
  };

  // Replace or modify the useEffect for generating statement data
  useEffect(() => {
    if (selectedCandidate && selectedBank) {
      setIsLoading(true);
      try {
        // Format statement period
        const formatDate = (dateStr) => {
          const d = new Date(dateStr);
          return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        };
        const period = `${formatDate(startDate)} to ${formatDate(endDate)}`;
        
        // Generate random transactions for the date range
        const initialBalance = 50000; // Starting balance of 50,000
        const { transactions, openingBalance, closingBalance } = 
          generateRandomTransactions(new Date(startDate), new Date(endDate), initialBalance);
        
        setStatementData({
          bankName: selectedBank.bankName || "Unknown Bank",
          name: selectedCandidate.name || "Unknown Employee", 
          customerId: selectedCandidate.employeeCode || "12345678",
          customerType: "Individual - Full KYC",
          address: selectedCandidate.address || "N/A",
          accountNumber: selectedCandidate.accountNumber || "XXXXXXXXXXXX",
          accountType: selectedBank.accountType || "Salary Account",
          branch: selectedBank.branch || "Main Branch",
          nominee: "Not Registered",
          statementDate: new Date(endDate).toLocaleDateString("en-GB"),
          statementPeriod: period,
          openingBalance: openingBalance,
          closingBalance: closingBalance,
          transactions: transactions,
        });
        
        // Show success toast when statement data is successfully generated
        toast.success("Bank statement generated successfully");
      } catch (error) {
        console.error("Error generating statement data:", error);
        toast.error("Failed to generate bank statement");
      } finally {
        setIsLoading(false);
      }
    } else {
      setStatementData(null);
    }
  }, [selectedCandidate, selectedBank, startDate, endDate]);

  const handleDownloadSuccess = () => {
    toast.success("Bank statement downloaded successfully");
  };

  // Make the template work for any bank name until we have multiple templates
  const pdfDocument = statementData ? (
    <AUBankStatementPDF
      statementData={statementData}
      logo={selectedBank?.logo || "https://www.aubank.in/themes/custom/au/images/logo.svg"}
    />
  ) : (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        <Text>
          Please select an employee and a bank to generate a statement.
        </Text>
      </Page>
    </Document>
  );

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-center" />
      <div className="mb-4">
        <Link href="/dashboard/documents" className="text-blue-600 hover:underline flex items-center gap-1">
          <FiArrowLeft size={16} /> Back to Documents
        </Link>
      </div>
      <div className="max-w-[210mm] mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-12 mt-4 md:mt-6">
          <div className="ml-2 md:ml-4">
            <Link
              href="/"
              className="back-link flex items-center text-slate-700 hover:text-gray-900"
            >
              <FiArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="text-sm md:text-base">Back to Home</span>
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Generate Bank Statement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Dropdown */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-800">
                Employee
              </label>
              <select
                value={selectedCandidate ? selectedCandidate.id : ""}
                onChange={(e) => {
                  const cand = candidates.find((c) => c.id === e.target.value);
                  setSelectedCandidate(cand || null);
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Select Employee</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Bank Dropdown */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-800">
                Bank
              </label>
              <select
                value={selectedBank ? selectedBank.id : ""}
                onChange={(e) => {
                  const bank = banks.find((b) => b.id === e.target.value);
                  setSelectedBank(bank || null);
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Date Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-800">
                Statement Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-800">
                Statement End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-700 font-medium">Generating bank statement...</p>
          </div>
        )}
        
        {/* PDF Preview and Download */}
        {!isLoading && statementData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Preview
            </h3>
            <div className="mb-4" style={{ height: "80vh", minHeight: 500 }}>
              <PDFViewer width="100%" height="100%">
                {pdfDocument}
              </PDFViewer>
            </div>
            <PDFDownloadLink
              document={pdfDocument}
              fileName="bank-statement.pdf"
              onClick={handleDownloadSuccess}
            >
              {({ loading }) => (
                <button 
                  className="bg-blue-600 text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  <FiDownload className="w-5 h-5" />
                  {loading ? "Preparing document..." : "Download PDF"}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankStatement;
