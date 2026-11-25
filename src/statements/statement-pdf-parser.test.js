import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanAmount,
  detectBankFromText,
  extractMetadataFromText,
  extractTransactionsFromLines,
  parseDateToISO,
  parseStatementText,
  reconstructLinesFromTextItems,
} from './lib/pdfParser.js';

test('detectBankFromText accurately identifies Kotak Mahindra Bank vs HDFC Bank', () => {
  const kotakText = `
    KOTAK MAHINDRA BANK LIMITED
    Account Statement
    CRN : 104582731
    Savings Account Transactions
    KKBK0001767
  `;
  assert.equal(detectBankFromText(kotakText), 'Kotak Mahindra Bank');

  const hdfcText = `
    HDFC BANK LIMITED
    Statement of account
    We understand your world
    Cust ID : 987654321
    HDFC0000123
  `;
  assert.equal(detectBankFromText(hdfcText), 'HDFC Bank');
});

test('parseDateToISO converts common Indian bank statement date formats to ISO', () => {
  assert.equal(parseDateToISO('01/11/2026'), '2026-11-01');
  assert.equal(parseDateToISO('15-Nov-2026'), '2026-11-15');
  assert.equal(parseDateToISO('05-04-2026'), '2026-04-05');
  assert.equal(parseDateToISO('2026-12-31'), '2026-12-31');
  assert.equal(parseDateToISO('02/01/26'), '2026-01-02');
});

test('cleanAmount cleans numbers, commas, and currency symbols', () => {
  assert.equal(cleanAmount('1,25,000.50'), '125000.50');
  assert.equal(cleanAmount('₹ 450.00'), '450.00');
  assert.equal(cleanAmount('-'), '0.00');
  assert.equal(cleanAmount(''), '0.00');
});

test('reconstructLinesFromTextItems groups and sorts PDF items by position', () => {
  const items = [
    { str: '01/11/2026', transform: [1, 0, 0, 1, 50, 700] },
    { str: 'UPI-Payment', transform: [1, 0, 0, 1, 150, 700] },
    { str: '500.00', transform: [1, 0, 0, 1, 350, 700] },
    { str: 'Kotak Mahindra Bank', transform: [1, 0, 0, 1, 50, 750] },
  ];
  const lines = reconstructLinesFromTextItems(items);
  assert.equal(lines.length, 2);
  assert.equal(lines[0], 'Kotak Mahindra Bank');
  assert.equal(lines[1], '01/11/2026 UPI-Payment 500.00');
});

test('parseStatementText extracts Kotak statement metadata and transactions', () => {
  const sampleKotakText = `
    Kotak Mahindra Bank
    Account Statement
    Customer Name : Mahadev Sharma
    CRN : 12496418
    Account Number : 1249641801
    Branch : Baner, Pune
    IFSC code : KKBK0001767
    MICR : 411485002
    Statement Period : 01-Nov-2026 to 05-Nov-2026
    Opening Balance : 50,000.00

    # Date Description Chq/Ref. No. Withdrawal (Dr.) Deposit (Cr.) Balance
    1 01-Nov-2026 UPI-Grocery Store UPI-987654321098 500.00 - 49,500.00
    2 02-Nov-2026 NEFT Salary Credit NEFT-KKBK1234 - 85,000.00 134,500.00
    3 03-Nov-2026 Swiggy Food Order UPI-112233445566 350.00 - 134,150.00
  `;

  const parsed = parseStatementText(sampleKotakText);

  assert.equal(parsed.detectedBank, 'Kotak Mahindra Bank');
  assert.equal(parsed.account.bank, 'Kotak Mahindra Bank');
  assert.equal(parsed.account.holderName, 'Mahadev Sharma');
  assert.equal(parsed.account.customerId, '12496418');
  assert.equal(parsed.account.accountNumber, '1249641801');
  assert.equal(parsed.account.branch, 'Baner, Pune');
  assert.equal(parsed.account.ifsc, 'KKBK0001767');
  assert.equal(parsed.account.micr, '411485002');
  assert.equal(parsed.account.periodStart, '2026-11-01');
  assert.equal(parsed.account.periodEnd, '2026-11-05');
  assert.equal(parsed.account.openingBalance, '50000.00');

  assert.equal(parsed.transactions.length, 3);
  assert.equal(parsed.transactions[0].date, '2026-11-01');
  assert.equal(parsed.transactions[0].type, 'debit');
  assert.equal(parsed.transactions[0].amount, '500.00');
  assert.equal(parsed.transactions[0].reference, 'UPI-987654321098');

  assert.equal(parsed.transactions[1].date, '2026-11-02');
  assert.equal(parsed.transactions[1].type, 'credit');
  assert.equal(parsed.transactions[1].amount, '85000.00');
  assert.equal(parsed.transactions[1].reference, 'NEFT-KKBK1234');
});

test('parseStatementText extracts HDFC statement metadata with title and transactions', () => {
  const sampleHdfcText = `
    HDFC BANK LIMITED
    Statement of account
    We understand your world
    Customer Name : MR. VIRAJ KADAM
    Cust ID : 44556677
    Account No : 50100012345678
    Branch : Senapati Bapat Road, Pune
    RTGS/NEFT IFSC : HDFC0000123
    MICR Code : 411240002
    Period : 01/10/2026 to 31/10/2026
    Opening Balance : 25,000.00

    Date Narration Chq./Ref.No. Value Dt Withdrawal Amt. Deposit Amt. Closing Balance
    05/10/2026 UPI-CAFE COFFEE DAY UPI-998877665544 05/10/2026 250.00 0.00 24,750.00
    10/10/2026 SALARY CREDIT FROM ACME CORP NEFT-HDFC9876 10/10/2026 0.00 95,000.00 119,750.00
  `;

  const parsed = parseStatementText(sampleHdfcText);

  assert.equal(parsed.detectedBank, 'HDFC Bank');
  assert.equal(parsed.account.bank, 'HDFC Bank');
  assert.equal(parsed.account.title, 'Mr');
  assert.equal(parsed.account.holderName, 'VIRAJ KADAM');
  assert.equal(parsed.account.customerId, '44556677');
  assert.equal(parsed.account.accountNumber, '50100012345678');
  assert.equal(parsed.account.ifsc, 'HDFC0000123');
  assert.equal(parsed.account.micr, '411240002');
  assert.equal(parsed.account.periodStart, '2026-10-01');
  assert.equal(parsed.account.periodEnd, '2026-10-31');
  assert.equal(parsed.account.openingBalance, '25000.00');

  assert.equal(parsed.transactions.length, 2);
  assert.equal(parsed.transactions[0].date, '2026-10-05');
  assert.equal(parsed.transactions[0].type, 'debit');
  assert.equal(parsed.transactions[0].amount, '250.00');

  assert.equal(parsed.transactions[1].date, '2026-10-10');
  assert.equal(parsed.transactions[1].type, 'credit');
  assert.equal(parsed.transactions[1].amount, '95000.00');
});

test('parseStatementText infers opening balance if missing in metadata', () => {
  const textWithoutOpBal = `
    Kotak Mahindra Bank
    Account Number : 1249641801
    1 01-Nov-2026 UPI-Store UPI-123 500.00 - 49,500.00
    2 02-Nov-2026 Refund UPI-456 - 1,000.00 50,500.00
  `;
  const parsed = parseStatementText(textWithoutOpBal);
  // Opening balance before 500.00 debit resulting in 49,500.00 was 50,000.00
  assert.equal(parsed.account.openingBalance, '50000.00');
  assert.equal(parsed.account.periodStart, '2026-11-01');
  assert.equal(parsed.account.periodEnd, '2026-11-02');
});
