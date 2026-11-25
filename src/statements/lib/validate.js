import { CURRENCIES, isISODate, toPaise } from './format.js';

export const MAX_PAISE = 9_999_999_999_999; // 99,999,999,999.99
export const LIMITS = {
  holderName: 80, title: 10, address: 200, city: 40, state: 40, country: 40, nomination: 20, accountType: 30, accountStatus: 20,
  branch: 60, description: 160, reference: 30,
};

const tooLong = (v, max) => String(v || '').length > max;

/** Returns { field: message } — empty object when valid. */
export function validateAccount(a) {
  const e = {};
  if (!a.holderName.trim()) e.holderName = 'Account holder name is required';

  const acct = a.accountNumber.replace(/\s/g, '');
  if (!acct) e.accountNumber = 'Account number is required';
  else if (!/^\d{6,18}$/.test(acct)) e.accountNumber = 'Use 6–18 digits';

  if (a.customerId && !/^[A-Za-z0-9-]{1,20}$/.test(a.customerId)) e.customerId = 'Letters, digits or hyphens (max 20)';
  if (a.pinCode && !/^[A-Za-z0-9 -]{3,10}$/.test(a.pinCode)) e.pinCode = '3–10 letters or digits';
  if (a.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(a.ifsc)) e.ifsc = '11 characters: 4 letters, a zero, then 6 letters or digits';
  if (a.micr && !/^\d{9}$/.test(a.micr)) e.micr = 'MICR is 9 digits';
  if (!CURRENCIES.includes(a.currency)) e.currency = 'Choose a currency';

  if (!isISODate(a.periodStart)) e.periodStart = a.periodStart ? 'Invalid date' : 'Start date is required';
  if (!isISODate(a.periodEnd)) e.periodEnd = a.periodEnd ? 'Invalid date' : 'End date is required';
  if (!e.periodStart && !e.periodEnd && a.periodStart > a.periodEnd) e.periodEnd = 'End date must be on or after the start date';

  const ob = toPaise(a.openingBalance, { allowNegative: true });
  if (!String(a.openingBalance).trim()) e.openingBalance = 'Opening balance is required';
  else if (!Number.isFinite(ob)) e.openingBalance = 'Enter an amount like 12500.00 (max 2 decimals)';
  else if (Math.abs(ob) > MAX_PAISE) e.openingBalance = 'Amount is too large';

  for (const k of ['holderName', 'title', 'address', 'city', 'state', 'country', 'nomination', 'accountType', 'accountStatus', 'branch'])
    if (!e[k] && tooLong(a[k], LIMITS[k])) e[k] = `Keep it under ${LIMITS[k]} characters`;
  return e;
}

export function validateTransaction(t) {
  const e = {};
  if (!isISODate(t.date)) e.date = t.date ? 'Invalid date' : 'Date is required';
  if (t.valueDate && !isISODate(t.valueDate)) e.valueDate = 'Invalid date';

  if (!t.description.trim()) e.description = 'Description is required';
  else if (tooLong(t.description, LIMITS.description)) e.description = `Keep it under ${LIMITS.description} characters`;
  if (tooLong(t.reference, LIMITS.reference)) e.reference = `Keep it under ${LIMITS.reference} characters`;

  if (t.type !== 'credit' && t.type !== 'debit') e.type = 'Choose credit or debit';

  const p = toPaise(t.amount);
  if (!String(t.amount).trim()) e.amount = 'Amount is required';
  else if (!Number.isFinite(p)) e.amount = 'Enter a positive amount like 1250.50 (max 2 decimals)';
  else if (p <= 0) e.amount = 'Amount must be greater than zero';
  else if (p > MAX_PAISE) e.amount = 'Amount is too large';
  return e;
}
