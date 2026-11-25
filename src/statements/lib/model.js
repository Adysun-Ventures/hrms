import { CURRENCIES } from './format.js';

export const SAMPLE_TEXT = '';

// Works on plain http:// over the LAN too, where crypto.randomUUID is unavailable.
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export const ACCOUNT_TYPES = ['Savings', 'Current', 'Salary', 'NRE Savings', 'NRO Savings', 'Overdraft'];
export const BANK_OPTIONS = ['Kotak Mahindra Bank', 'HDFC Bank'];
export const TITLES = ['Mr', 'Ms', 'Mrs', 'Mx', 'Dr'];
export const ACCOUNT_STATUSES = ['Active', 'Regular', 'Dormant', 'Inactive', 'Frozen'];
export const NOMINATION_OPTIONS = ['Yes', 'No'];

export const blankAccount = () => ({
  bank: 'Kotak Mahindra Bank',
  title: '',
  holderName: '',
  customerId: '', // printed as CRN
  address: '',
  city: '',
  pinCode: '',
  state: '',
  country: 'India',
  micr: '',
  ifsc: '',
  accountNumber: '',
  accountType: 'Savings',
  branch: '',
  accountStatus: 'Active',
  nomination: 'Yes',
  currency: 'INR',
  periodStart: '',
  periodEnd: '',
  openingBalance: '0.00',
  encryptPdf: false,
  pdfPassword: '',
});

export const blankStatement = () => {
  const now = Date.now();
  return { id: newId(), createdAt: now, updatedAt: now, account: blankAccount(), transactions: [] };
};

export const blankTransaction = (date = '') => ({
  id: newId(),
  date,
  valueDate: '',
  description: '',
  reference: '',
  type: 'debit',
  amount: '',
});

const str = v => (v == null ? '' : String(v));

export const normalizeTransaction = t => ({
  id: typeof t?.id === 'string' && t.id ? t.id : newId(),
  date: str(t?.date),
  valueDate: str(t?.valueDate),
  description: str(t?.description),
  reference: str(t?.reference),
  type: t?.type === 'credit' ? 'credit' : 'debit',
  amount: str(t?.amount),
});

/** Coerce anything loaded from storage or a file into a well-formed statement (or null). */
export function normalizeStatement(s) {
  if (!s || typeof s !== 'object' || typeof s.account !== 'object') return null;
  const base = blankAccount();
  const account = {};
  for (const k of Object.keys(base)) {
    if (s.account[k] == null) {
      account[k] = base[k];
    } else if (typeof base[k] === 'boolean') {
      account[k] = s.account[k] === true || s.account[k] === 'true';
    } else {
      account[k] = String(s.account[k]);
    }
  }
  if (s.bank && (!s.account.bank || s.account.bank === base.bank)) {
    account.bank = String(s.bank);
  }
  const bankStr = (account.bank || '').toLowerCase();
  if (bankStr.includes('hdfc')) account.bank = 'HDFC Bank';
  else account.bank = 'Kotak Mahindra Bank';

  // Older statements saved these blank; the PDF always prints "Account Status" and "Nominee Registered".
  for (const k of ['accountStatus', 'nomination']) if (!account[k].trim()) account[k] = base[k];
  if (!CURRENCIES.includes(account.currency)) account.currency = 'INR';
  return {
    id: typeof s.id === 'string' && s.id ? s.id : newId(),
    bank: account.bank,
    createdAt: Number(s.createdAt) || Date.now(),
    updatedAt: Number(s.updatedAt) || Date.now(),
    account,
    transactions: Array.isArray(s.transactions) ? s.transactions.map(normalizeTransaction) : [],
  };
}

/** The statement only ever shows the last 4 digits. */
export const maskAccount = n => {
  const d = String(n || '').replace(/\s/g, '');
  return d.length > 4 ? 'X'.repeat(d.length - 4) + d.slice(-4) : d;
};

/** The CRN is printed with only its last 3 characters visible: "xxxxxx135". */
export const maskCRN = n => {
  const d = String(n || '').replace(/\s/g, '');
  return d.length > 3 ? 'x'.repeat(d.length - 3) + d.slice(-3) : d;
};

export const statementTitle = s => s.account.holderName.trim() || 'Untitled statement';

/** "Mr Aarav Mehta" when a title is set. */
export const displayName = a => [a.title, a.holderName.trim()].filter(Boolean).join(' ');
