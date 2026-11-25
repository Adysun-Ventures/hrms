import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compute } from './lib/calc.js';
import { exportTransactionsCSV, importTransactionsCSV, parseCSV } from './lib/csv.js';
import { demoStatement } from './lib/demo.js';
import { fmtDashDate, fmtDate, fmtGenerated, fmtHdfcDate, fmtHdfcFullDate, fmtHdfcTimestamp, isISODate, money, nowStamp, parseFlexibleDate, toPaise } from './lib/format.js';
import { blankStatement, maskAccount } from './lib/model.js';
import { validateAccount, validateTransaction } from './lib/validate.js';

const tx = (date, type, amount, extra = {}) => ({ id: `${date}-${type}-${amount}-${Math.random()}`, date, valueDate: '', description: 'Test', reference: '', type, amount, ...extra });
const st = (opening, txns, start = '2026-01-01', end = '2026-01-31') => {
  const s = blankStatement();
  Object.assign(s.account, { holderName: 'Test', accountNumber: '1234567890', periodStart: start, periodEnd: end, openingBalance: opening });
  s.transactions = txns;
  return s;
};

test('amount parsing is exact (integer paise)', () => {
  assert.equal(toPaise('1250.5'), 125050);
  assert.equal(toPaise('1,23,456.78'), 12345678);
  assert.equal(toPaise('0.1'), 10);
  assert.ok(Number.isNaN(toPaise('12.345')));
  assert.ok(Number.isNaN(toPaise('-5')));
  assert.equal(toPaise('-5', { allowNegative: true }), -500);
  assert.ok(Number.isNaN(toPaise('abc')));
});

test('money formatting: Indian grouping for INR, western otherwise', () => {
  assert.equal(money(12345678, 'INR'), '1,23,456.78');
  assert.equal(money(12345678, 'USD'), '123,456.78');
  assert.equal(money(-50, 'INR'), '-0.50');
});

test('dates', () => {
  assert.ok(isISODate('2024-02-29'));
  assert.ok(!isISODate('2026-02-29'));
  assert.equal(fmtDate('2026-11-05'), '05/11/2026');
  assert.equal(parseFlexibleDate('05/11/2026'), '2026-11-05');
  assert.equal(fmtDashDate('2026-11-05'), '05-Nov-2026');
  assert.equal(parseFlexibleDate(fmtDashDate('2026-11-05')), '2026-11-05');
  assert.equal(fmtDashDate('bad'), '');
  assert.equal(parseFlexibleDate('5-11-26'), '2026-11-05');
  assert.equal(parseFlexibleDate('5 Nov 2026'), '2026-11-05');
  assert.equal(parseFlexibleDate('31/02/2026'), '');
});

test('PDF footer timestamp: "Statement Generated on 12 Nov 2026, 15:48"', () => {
  assert.equal(nowStamp(new Date(2026, 10, 2, 9, 5)), '2026-11-02T09:05');
  assert.equal(fmtGenerated('2026-11-12T15:48'), '12 Nov 2026, 15:48');
  assert.equal(fmtGenerated('2026-11-12'), '12 Nov 2026'); // date only: no time printed
  assert.equal(fmtGenerated(''), '');
  assert.equal(fmtGenerated(undefined), '');
});

test('HDFC date & uppercase timestamp formatting', () => {
  assert.equal(fmtHdfcDate('2026-11-05'), '05/11/26');
  assert.equal(fmtHdfcDate('2024-12-02'), '02/12/24');
  assert.equal(fmtHdfcFullDate('2026-11-05'), '05/11/2026');
  assert.equal(fmtHdfcTimestamp('2025-05-15T04:24:15'), '15-MAY-2025 04:24:15');
  assert.equal(fmtHdfcTimestamp('2026-11-12T15:48'), '12-NOV-2026 15:48:00');
  assert.match(fmtHdfcTimestamp(), /^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}:\d{2}$/);
});

test('running balance, totals and closing = opening + credits - debits', () => {
  const c = compute(st('1000.00', [tx('2026-01-05', 'debit', '200.10'), tx('2026-01-02', 'credit', '500'), tx('2026-01-05', 'debit', '0.90')]));
  assert.deepEqual(c.lines.map(l => l.balance), [150000, 129990, 129900]); // sorted by date, same-day order kept
  assert.equal(c.credit, 50000);
  assert.equal(c.debit, 20100);
  assert.equal(c.closing, 100000 + 50000 - 20100);
  assert.equal(c.closing, c.lines.at(-1).balance);
  assert.equal(c.creditCount, 1);
  assert.equal(c.debitCount, 2);
});

test('out-of-period and invalid transactions are excluded and reported', () => {
  const c = compute(st('0', [tx('2025-12-31', 'credit', '10'), tx('2026-01-10', 'credit', '10'), tx('2026-02-01', 'debit', '5'), tx('2026-01-11', 'debit', 'abc')]));
  assert.equal(c.count, 1);
  assert.equal(c.outOfPeriodIds.size, 2);
  assert.equal(c.invalidIds.size, 1);
  assert.equal(c.closing, 1000);
});

test('negative balances are counted', () => {
  const c = compute(st('100', [tx('2026-01-02', 'debit', '150'), tx('2026-01-03', 'credit', '10')]));
  assert.equal(c.negativeCount, 2);
  assert.equal(c.closing, -4000);
});

test('account validation', () => {
  const s = st('100', []);
  assert.deepEqual(validateAccount(s.account), {});
  const bad = { ...s.account, holderName: '', accountNumber: '12ab', periodEnd: '2025-12-01', openingBalance: '1.234', ifsc: 'demo123', pinCode: '4110#7' };
  assert.deepEqual(Object.keys(validateAccount(bad)).sort(), ['accountNumber', 'holderName', 'ifsc', 'openingBalance', 'periodEnd', 'pinCode']);
});

test('transaction validation', () => {
  assert.deepEqual(validateTransaction(tx('2026-01-01', 'debit', '10')), {});
  assert.deepEqual(Object.keys(validateTransaction(tx('2026-13-01', 'debit', '0', { description: ' ' }))).sort(), ['amount', 'date', 'description']);
  assert.ok(validateTransaction(tx('2026-01-01', 'debit', '-10')).amount);
});

test('CSV parser handles quotes, commas, newlines and BOM', () => {
  assert.deepEqual(parseCSV('﻿a,"b, c","d ""q"""\r\n1,"x\ny",3'), [['a', 'b, c', 'd "q"'], ['1', 'x\ny', '3']]);
  assert.deepEqual(parseCSV('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
});

test('CSV import: Amount+Type format, Debit/Credit format, and error rows', () => {
  const a = importTransactionsCSV('Date,Description,Type,Amount,Reference\n2026-01-02,Salary,Credit,"85,000",R1\n03/01/2026,Rent,DR,22000.5,\n2026-01-04,Bad,Credit,12.345\n2026-01-05,,Debit,10\nnot-a-date,X,Debit,10');
  assert.equal(a.txns.length, 2);
  assert.deepEqual(a.txns.map(t => [t.date, t.type, t.amount, t.reference]), [['2026-01-02', 'credit', '85000.00', 'R1'], ['2026-01-03', 'debit', '22000.50', '']]);
  assert.deepEqual(a.errors.map(e => e.row), [4, 5, 6]);

  const b = importTransactionsCSV('Txn Date,Narration,Withdrawal Amt,Deposit Amt\n2026-01-02,Shop,250,\n2026-01-03,Refund,,99.99\n2026-01-04,Both,1,2');
  assert.deepEqual(b.txns.map(t => [t.type, t.amount]), [['debit', '250.00'], ['credit', '99.99']]);
  assert.equal(b.errors.length, 1);

  assert.match(importTransactionsCSV('Foo,Bar\n1,2').errors[0].reason, /Date/);
});

test('CSV export round-trips through import and guards against formulas', () => {
  const s = st('500', [tx('2026-01-03', 'debit', '10', { description: '=HYPERLINK("x")', reference: 'R,1' }), tx('2026-01-02', 'credit', '20.5')]);
  const csv = exportTransactionsCSV(s, compute(s));
  assert.match(csv, /'=HYPERLINK/);
  const back = importTransactionsCSV(csv);
  assert.equal(back.errors.length, 0);
  assert.deepEqual(back.txns.map(t => [t.date, t.type, t.amount, t.description, t.reference]), [
    ['2026-01-02', 'credit', '20.50', 'Test', ''],
    ['2026-01-03', 'debit', '10.00', '=HYPERLINK("x")', 'R,1'],
  ]);
});

test('demo data is valid and stays inside its period for Kotak Mahindra Bank', () => {
  const d = demoStatement(new Date(2026, 10, 12), 'Kotak Mahindra Bank');
  assert.equal(d.bank, 'Kotak Mahindra Bank');
  assert.equal(d.account.bank, 'Kotak Mahindra Bank');
  assert.equal(d.account.ifsc, 'DEMO0000123');
  assert.equal(d.account.micr, '999999123');
  assert.equal(d.account.branch, 'Demo Branch – Baner, Pune');
  assert.deepEqual(validateAccount(d.account), {});
  const c = compute(d);
  assert.equal(c.count, d.transactions.length);
  assert.ok(c.count > 50);
  assert.equal(d.account.periodStart, '2026-08-01');
  assert.equal(d.account.periodEnd, '2026-10-31');
  assert.equal(c.closing, c.lines.at(-1).balance);
  assert.ok(d.transactions.every(t => t.reference.startsWith('DM')));
});

test('demo data is valid and stays inside its period for HDFC Bank', () => {
  const d = demoStatement(new Date(2026, 10, 12), 'HDFC Bank');
  assert.equal(d.bank, 'HDFC Bank');
  assert.equal(d.account.bank, 'HDFC Bank');
  assert.equal(d.account.ifsc, 'HDFC0000794');
  assert.equal(d.account.micr, '411240018');
  assert.equal(d.account.branch, 'HINJAWADI');
  assert.equal(d.account.accountStatus, 'Regular');
  assert.deepEqual(validateAccount(d.account), {});
  const c = compute(d);
  assert.equal(c.count, d.transactions.length);
  assert.ok(c.count > 50);
  assert.equal(d.account.periodStart, '2026-08-01');
  assert.equal(d.account.periodEnd, '2026-10-31');
  assert.equal(c.closing, c.lines.at(-1).balance);
  // HDFC transactions should use 16-digit reference numbers
  assert.ok(d.transactions.every(t => /^\d{16}$/.test(t.reference)));
  // HDFC transactions should contain authentic HDFC UPI / NEFT narrations
  assert.ok(d.transactions.some(t => t.description.includes('UPI-') || t.description.includes('NEFT CR-')));
});

test('account number is masked to the last 4 digits', () => {
  assert.equal(maskAccount('00001234567890'), 'XXXXXXXXXX7890');
  assert.equal(maskAccount('123'), '123');
});

test('customer fields: CRN, PIN, MICR, address lengths', () => {
  const base = st('100', []).account;
  const ok = { ...base, title: 'Ms', customerId: '104582731', city: 'Pune', pinCode: '411007', state: 'Maharashtra', country: 'India', micr: '999999123', accountStatus: 'Active', nomination: 'Yes', branch: 'Demo Branch' };
  assert.deepEqual(validateAccount(ok), {});
  const bad = { ...base, customerId: 'CRN 1', micr: '12345', pinCode: '1', city: 'x'.repeat(41), country: 'y'.repeat(41) };
  assert.deepEqual(Object.keys(validateAccount(bad)).sort(), ['city', 'country', 'customerId', 'micr', 'pinCode']);
});

test('old saved statements gain the new fields with empty defaults', async () => {
  const { normalizeStatement, displayName } = await import('./lib/model.js');
  const old = normalizeStatement({ id: 'x', account: { holderName: 'Old Save', accountNumber: '1234567' }, transactions: [] });
  assert.equal(old.account.micr, '');
  assert.equal(old.account.country, 'India');
  assert.equal('odLimit' in old.account, false); // fields that were dropped from the layout are not carried over
  assert.equal(old.account.title, '');
  assert.equal(old.account.accountStatus, 'Active'); // blank status / nomination fall back to the printed defaults
  assert.equal(old.account.nomination, 'Yes');
  const kept = normalizeStatement({ account: { accountStatus: 'Dormant', nomination: 'No' }, transactions: [] });
  assert.equal(kept.account.accountStatus, 'Dormant');
  assert.equal(kept.account.nomination, 'No');
  assert.equal(displayName(old.account), 'Old Save');
  assert.equal(displayName({ ...old.account, title: 'Dr' }), 'Dr Old Save');
});

test('statement storage operates purely in-memory without localStorage dependency', async () => {
  const { loadAll, saveAll, isPersistent, clearMemory } = await import('./lib/storage.js');
  clearMemory();
  assert.deepEqual(loadAll(), []);
  assert.equal(isPersistent(), true);

  const testStmt = blankStatement();
  testStmt.account.holderName = 'In-Memory Test';
  saveAll([testStmt]);

  const loaded = loadAll();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].account.holderName, 'In-Memory Test');

  clearMemory();
  assert.deepEqual(loadAll(), []);
});
