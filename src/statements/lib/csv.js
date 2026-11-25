import { parseFlexibleDate, plainAmount, toPaise } from './format.js';
import { newId } from './model.js';
import { validateTransaction } from './validate.js';

/** RFC 4180-style parser: quoted fields, doubled quotes, CRLF/LF, BOM. Delimiter (, ; tab) is detected from the first line. */
export function parseCSV(text) {
  text = String(text).replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const count = d => first.split(d).length;
  const delim = [';', '\t'].reduce((best, d) => (count(d) > count(best) ? d : best), ',');

  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const FORMULA_START = /^[=+\-@\t\r]/;
const cell = (v, { text = false } = {}) => {
  let s = String(v ?? '');
  if (text && FORMULA_START.test(s)) s = "'" + s; // stop spreadsheets executing "=..." descriptions
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = rows => rows.map(r => r.map(c => (Array.isArray(c) ? cell(c[0], { text: true }) : cell(c))).join(',')).join('\r\n') + '\r\n';

export const CSV_HEADER = ['Date', 'Value Date', 'Description', 'Reference', 'Type', 'Amount', 'Balance'];

/** All valid transactions in date order; Balance is blank for ones outside the statement period. */
export function exportTransactionsCSV(statement, computed) {
  const rows = statement.transactions
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !computed.invalidIds.has(t.id))
    .sort((x, y) => (x.t.date < y.t.date ? -1 : x.t.date > y.t.date ? 1 : x.i - y.i))
    .map(({ t }) => [
      t.date, t.valueDate || t.date, [t.description], [t.reference],
      t.type === 'credit' ? 'Credit' : 'Debit', plainAmount(toPaise(t.amount)),
      computed.balanceById.has(t.id) ? plainAmount(computed.balanceById.get(t.id)) : '',
    ]);
  return toCSV([CSV_HEADER, ...rows]);
}

export const CSV_TEMPLATE = toCSV([
  CSV_HEADER.slice(0, 6),
  ['2026-08-01', '2026-08-01', ['Salary credit - Demo Employer'], ['DM100001'], 'Credit', '85000.00'],
  ['2026-08-03', '2026-08-03', ['Rent transfer'], ['DM100002'], 'Debit', '22000.00'],
]);

// Header aliases, compared after lower-casing and stripping everything but letters/digits.
const HEADERS = {
  date: ['date', 'txndate', 'transactiondate', 'trandate', 'postingdate'],
  valueDate: ['valuedate', 'valuedt', 'value'],
  description: ['description', 'narration', 'particulars', 'details', 'remarks'],
  reference: ['reference', 'ref', 'refno', 'referenceno', 'referencenumber', 'chqrefno', 'chequeno', 'chqno'],
  type: ['type', 'transactiontype', 'txntype', 'drcr', 'crdr'],
  amount: ['amount', 'amt', 'transactionamount'],
  debit: ['debit', 'debitamount', 'debitamt', 'withdrawal', 'withdrawalamt', 'withdrawalamount', 'dr'],
  credit: ['credit', 'creditamount', 'creditamt', 'deposit', 'depositamt', 'depositamount', 'cr'],
};
const CREDIT_WORDS = ['credit', 'cr', 'c', 'deposit'];
const DEBIT_WORDS = ['debit', 'dr', 'd', 'withdrawal'];
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanAmount = s => String(s).replace(/[^\d.,-]/g, '').replace(/,/g, '');
const isZero = s => !s || Number(s) === 0;

/** Returns { txns, errors: [{ row, reason }] }. Accepts Amount+Type columns or separate Debit/Credit columns. */
export function importTransactionsCSV(text) {
  const rows = parseCSV(text).map(r => r.map(c => c.trim()));
  const headerAt = rows.findIndex(r => r.some(Boolean));
  if (headerAt < 0) return { txns: [], errors: [{ row: 0, reason: 'The file is empty.' }] };

  const col = {};
  rows[headerAt].forEach((h, i) => {
    const n = norm(h);
    for (const [key, names] of Object.entries(HEADERS)) if (col[key] == null && names.includes(n)) col[key] = i;
  });
  const fail = reason => ({ txns: [], errors: [{ row: headerAt + 1, reason }] });
  if (col.date == null) return fail('No "Date" column found in the header row.');
  if (col.description == null) return fail('No "Description" (or "Narration") column found in the header row.');
  const hasDrCr = col.debit != null || col.credit != null;
  if (col.amount == null && !hasDrCr) return fail('Need an "Amount" column (with "Type"), or "Debit"/"Credit" columns.');

  const txns = [], errors = [];
  for (let r = headerAt + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row.some(Boolean)) continue;
    const get = k => (col[k] == null ? '' : String(row[col[k]] ?? '').replace(/^'(?=[=+\-@])/, ''));
    const err = reason => errors.push({ row: r + 1, reason });

    const rawDate = get('date'), rawValue = get('valueDate');
    const t = { id: newId(), date: parseFlexibleDate(rawDate), valueDate: '', description: get('description'), reference: get('reference'), type: '', amount: '' };
    if (!t.date) { err(rawDate ? `Unrecognised date "${rawDate}" (use YYYY-MM-DD or DD/MM/YYYY)` : 'Date is missing'); continue; }
    if (rawValue) {
      t.valueDate = parseFlexibleDate(rawValue);
      if (!t.valueDate) { err(`Unrecognised value date "${rawValue}"`); continue; }
    }

    const debit = cleanAmount(get('debit')), credit = cleanAmount(get('credit'));
    if (hasDrCr && (!isZero(debit) || !isZero(credit))) {
      if (!isZero(debit) && !isZero(credit)) { err('Both Debit and Credit are filled'); continue; }
      t.type = isZero(debit) ? 'credit' : 'debit';
      t.amount = isZero(debit) ? credit : debit;
    } else if (col.amount != null) {
      const amount = cleanAmount(get('amount')), type = norm(get('type'));
      if (CREDIT_WORDS.includes(type)) t.type = 'credit';
      else if (DEBIT_WORDS.includes(type)) t.type = 'debit';
      else if (!type && amount) t.type = amount.startsWith('-') ? 'debit' : 'credit';
      else { err(`Type "${get('type')}" must be Credit or Debit`); continue; }
      t.amount = amount.replace(/^-/, '');
    } else { err('No amount'); continue; }

    const problems = validateTransaction(t);
    const first = Object.values(problems)[0];
    if (first) { err(first); continue; }
    t.amount = plainAmount(toPaise(t.amount));
    txns.push(t);
  }
  return { txns, errors };
}
