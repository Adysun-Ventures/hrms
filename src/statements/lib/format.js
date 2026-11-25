// Money is handled as integer paise/cents everywhere to avoid floating-point drift in balances.

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

/** Printed in full on the statement ("Currency INDIAN RUPEE"). */
export const CURRENCY_NAMES = {
  INR: 'INDIAN RUPEE',
  USD: 'US DOLLAR',
  EUR: 'EURO',
  GBP: 'POUND STERLING',
  AED: 'UAE DIRHAM',
  SGD: 'SINGAPORE DOLLAR',
  AUD: 'AUSTRALIAN DOLLAR',
  CAD: 'CANADIAN DOLLAR',
};

const formatters = {};
const numberFormat = cur =>
  (formatters[cur] ||= new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));

/** 12345678 (paise) -> "1,23,456.78" for INR, "123,456.78" otherwise. */
export const money = (paise, cur = 'INR') => (Number.isFinite(paise) ? numberFormat(cur).format(paise / 100) : '');
export const moneyWithCode = (paise, cur = 'INR') => `${cur} ${money(paise, cur)}`;

/** Plain "1234.50" for inputs and CSV. */
export const plainAmount = paise => (Number.isFinite(paise) ? (paise < 0 ? '-' : '') + (Math.abs(paise) / 100).toFixed(2) : '');

const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/;
/** "1,250.5" -> 125050. Returns NaN for anything that is not a plain amount with at most 2 decimals. */
export function toPaise(value, { allowNegative = false } = {}) {
  const s = String(value ?? '').replace(/[,\s]/g, '');
  if (!AMOUNT_RE.test(s)) return NaN;
  const negative = s.startsWith('-');
  if (negative && !allowNegative) return NaN;
  const [int, frac = ''] = s.replace('-', '').split('.');
  const paise = Number(int) * 100 + Number((frac + '00').slice(0, 2));
  return negative ? -paise : paise;
}

const pad = n => String(n).padStart(2, '0');
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for real calendar dates in YYYY-MM-DD form (rejects 2026-02-30). */
export function isISODate(s) {
  const m = ISO_RE.exec(s || '');
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
/** Local date and time as "2026-11-12T15:48" (when a PDF was generated). */
export const nowStamp = (d = new Date()) => `${toISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-05" -> "05/11/2026" */
export const fmtDate = iso => (isISODate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
/** "2026-11-05" -> "5 Nov 2026" */
export const fmtLongDate = iso => (isISODate(iso) ? `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}` : '');
/** "2026-11-05" -> "05 Nov 2026" (statement period and transaction dates on the PDF) */
export const fmtStatementDate = iso => (isISODate(iso) ? `${iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}` : '');
/** "2026-11-05" -> "05-Nov-2026" (date inputs in the editor) */
export const fmtDashDate = iso => fmtStatementDate(iso).replaceAll(' ', '-');
/** "2026-11-12T15:48" -> "12 Nov 2026, 15:48" (PDF footer). A plain ISO date is printed without a time. */
export function fmtGenerated(stamp) {
  const s = String(stamp ?? '');
  const date = fmtStatementDate(s.slice(0, 10));
  const time = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(s)?.[1];
  return date && time ? `${date}, ${time}` : date;
}

const HDFC_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "2026-11-05" -> "05/11/24" (HDFC 2-digit year date) */
export const fmtHdfcDate = iso => {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  if (!d || !m || !y) return iso;
  return `${d}/${m}/${y.slice(-2)}`;
};

/** "2026-11-05" -> "05/11/2026" (HDFC full 4-digit year date) */
export const fmtHdfcFullDate = iso => {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  if (!d || !m || !y) return iso;
  return `${d}/${m}/${y}`;
};

/** "2026-11-12T15:48:22" or now -> "12-NOV-2026 15:48:22" (HDFC uppercase timestamp) */
export function fmtHdfcTimestamp(stamp) {
  if (!stamp) {
    const now = new Date();
    const d = pad(now.getDate());
    const m = HDFC_MONTHS[now.getMonth()];
    const y = now.getFullYear();
    const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return `${d}-${m}-${y} ${t}`;
  }
  const s = String(stamp);
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2})(?::(\d{2}))?)?/.exec(s);
  if (!m) return s;
  const day = m[3];
  const mon = HDFC_MONTHS[+m[2] - 1] || 'JAN';
  const yr = m[1];
  const time = m[4] ? `${m[4]}:${m[5] || '00'}` : '00:00:00';
  return `${day}-${mon}-${yr} ${time}`;
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YY, DD.MM.YYYY and "5 Nov 2026". Returns ISO or ''. */
export function parseFlexibleDate(input) {
  const s = String(input ?? '').trim();
  if (isISODate(s)) return s;
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) {
    const y = m[3].length === 2 ? (+m[3] <= 69 ? 2000 : 1900) + +m[3] : +m[3];
    const iso = `${y}-${pad(m[2])}-${pad(m[1])}`;
    return isISODate(iso) ? iso : '';
  }
  m = /^(\d{1,2})[\s-]+([A-Za-z]{3})[A-Za-z]*[\s,-]+(\d{4})$/.exec(s);
  if (m) {
    const mi = MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
    const iso = mi < 0 ? '' : `${m[3]}-${pad(mi + 1)}-${pad(m[1])}`;
    return isISODate(iso) ? iso : '';
  }
  return '';
}
