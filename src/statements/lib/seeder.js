import { fakerEN_IN as faker } from '@faker-js/faker';
import { isISODate, parseFlexibleDate, plainAmount, toPaise } from './format.js';
import {
  CORPORATE_SALARY_PRESETS,
  formatBankNarration,
  MERCHANT_CATEGORIES,
  pickRandom,
  pickWeightedCategory,
  random12Digit,
  randomPhone,
  randomUtr,
  UPI_HANDLES,
} from './indianMerchants.js';
import { newId } from './model.js';

/**
 * Parse YYYY-MM-DD strictly into a local midnight Date object to avoid UTC timezone offset bugs
 */
export function parseLocalDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return new Date(NaN);
  const [y, m, d] = isoStr.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

/**
 * Format Date to ISO string YYYY-MM-DD
 */
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get all calendar months spanned between startDate and endDate.
 * Returns array of { year, month (1-12), key: 'YYYY-MM', label: 'Jan 2026' }
 */
export function getMonthsInRange(startStr, endStr) {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (cur <= last) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${monthNames[m - 1]} ${y}`;
    months.push({ year: y, month: m, key, label });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

/**
 * Generate a realistic random transaction amount in paise for a given category.
 */
function generateAmountPaise(cat) {
  if (cat.id === 'atm_wdl') {
    const multiples = [500, 1000, 2000, 3000, 5000];
    return pickRandom(multiples) * 100;
  }
  if (cat.id === 'tapri') {
    // Tapri: mostly clean round figures: 10, 15, 20, 25, 30, 40, 50
    const tapriAmts = [10, 15, 20, 25, 30, 35, 40, 50];
    return pickRandom(tapriAmts) * 100;
  }
  const min = cat.minAmt;
  const max = cat.maxAmt;
  // 70% whole rupees, 30% with paise (.50, etc.)
  const whole = Math.floor(min + Math.random() * (max - min));
  const hasPaise = Math.random() < 0.3;
  const paise = hasPaise ? pickRandom([25, 50, 75]) : 0;
  return whole * 100 + paise;
}

/**
 * Generate realistic secondary incoming credit transactions (P2P UPI, Refunds, Interest)
 */
export function generateRandomCredit({ bank, dateStr, isHdfc, holderName }) {
  const rrn = random12Digit();
  const utr = randomUtr(isHdfc ? 'AXOMB' : 'UTIB');
  const creditType = Math.random();

  let narration;
  let amtPaise;
  let refNumber = isHdfc ? utr : `UPI-${rrn}`;

  if (creditType < 0.65) {
    // P2P UPI Transfer Received (e.g. friend / family / reimbursement)
    const sender = faker.person.fullName().toUpperCase();
    amtPaise = Math.floor(200 + Math.random() * 4500) * 100;
    if (isHdfc) {
      narration = `UPI-${sender.replace(/[^A-Z0-9\s]/gi, '').slice(0, 15)}-${randomPhone()}${pickRandom(UPI_HANDLES)}-${rrn}-PAYMENT FROM PHONE`;
    } else {
      narration = `UPI/${sender}/${pickRandom(['YESB', 'SBIN', 'UTIB', 'HDFC', 'ICIC'])}/${rrn}/Payment from`;
    }
  } else if (creditType < 0.90) {
    // Merchant E-Commerce Refund / Reversal
    const merchant = pickRandom(['AMAZON', 'FLIPKART', 'SWIGGY', 'ZOMATO', 'MYNTRA']);
    amtPaise = Math.floor(150 + Math.random() * 2500) * 100;
    if (isHdfc) {
      narration = `UPI-REFUND-${merchant}@${pickRandom(['apl', 'ybl', 'okhdfcbank'])}-${rrn}-REFUND`;
    } else {
      narration = `UPI/REFUND/${merchant}/${rrn}/Refund processed`;
    }
  } else {
    // Savings Bank Interest
    amtPaise = Math.floor(350 + Math.random() * 1800) * 100;
    narration = isHdfc ? 'CREDIT INTEREST CAPITALISED' : '1.75% SB INT:KKBK0001767';
    refNumber = isHdfc ? '000000000000000' : 'KKBK-INT';
  }

  return {
    id: newId(),
    date: dateStr,
    valueDate: dateStr,
    description: narration,
    reference: refNumber,
    amount: (amtPaise / 100).toFixed(2),
    type: 'credit',
  };
}

/**
 * Generate dynamic statement transactions (Pointer 1, Pointer 2, Pointer 3)
 *
 * @param {Object} account - statement account data (bank, periodStart, periodEnd, openingBalance, etc.)
 * @param {Object} options - seeder configuration options
 * @returns {Array} generated transaction objects
 */
export function generateSeedTransactions(account, options = {}) {
  const {
    minDailyTx = 5,
    maxDailyTx = 10,
    minReserveBalance = 2000,
    recurringCredit = {},
  } = options;

  const bank = account.bank || 'Kotak Mahindra Bank';
  const isHdfc = bank === 'HDFC Bank';
  const holderName = account.holderName || 'Customer';
  const ifsc = account.ifsc || (isHdfc ? 'HDFC0000794' : 'KKBK0001767');

  const start = parseLocalDate(account.periodStart);
  const end = parseLocalDate(account.periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const txs = [];

  // ==========================================
  // POINTER 2: Own / Monthly Recurring Credit
  // ==========================================
  const creditEnabled = recurringCredit.enabled !== false;
  const creditMode = recurringCredit.mode || 'NEFT';
  const creditSender = recurringCredit.from || pickRandom(CORPORATE_SALARY_PRESETS);
  const defaultDay = recurringCredit.dayOfMonth || 5;
  const defaultAmtPaise = toPaise(recurringCredit.defaultAmount || '50000.00');
  const sameAmountAll = recurringCredit.sameAmountAllMonths !== false;
  const sameDateAll = recurringCredit.sameDateAllMonths !== false;
  const overrides = recurringCredit.monthlyOverrides || {};

  const months = getMonthsInRange(account.periodStart, account.periodEnd);

  for (const m of months) {
    if (!creditEnabled) break;

    const monthDay = (!sameDateAll && overrides[m.key]?.day) ? overrides[m.key].day : defaultDay;
    const maxDaysInMonth = new Date(m.year, m.month, 0).getDate();
    const actualDay = Math.min(Math.max(1, monthDay), maxDaysInMonth);

    const creditDate = new Date(m.year, m.month - 1, actualDay);
    if (creditDate >= start && creditDate <= end) {
      const amtPaise = (!sameAmountAll && overrides[m.key]?.amount != null)
        ? toPaise(overrides[m.key].amount)
        : defaultAmtPaise;

      const rrn = random12Digit();
      const utr = randomUtr(isHdfc ? 'AXOMB' : 'UTIB');
      const dateStr = toISO(creditDate);

      let narration;
      if (creditMode === 'UPI') {
        narration = isHdfc
          ? `UPI-${creditSender.replace(/[^A-Z0-9\s]/gi, '')}-${randomPhone()}${pickRandom(UPI_HANDLES)}-${rrn}-PAYMENT FROM PHONE`
          : `UPI/${creditSender}/${pickRandom(['YESB', 'SBIN', 'UTIB'])}/${rrn}/Payment from`;
      } else if (creditMode === 'IMPS') {
        narration = `IMPS-${rrn}-${creditSender}-TRANSFER FROM OWN ACC`;
      } else {
        // NEFT Salary
        narration = formatBankNarration({
          bank,
          type: 'credit',
          sender: creditSender,
          holderName,
          ifsc,
          utr,
        });
      }

      const refNumber = isHdfc ? utr : `UPI-${rrn}`;

      txs.push({
        id: newId(),
        date: dateStr,
        valueDate: dateStr,
        description: narration,
        reference: refNumber,
        amount: (amtPaise / 100).toFixed(2),
        type: 'credit',
        _isMonthlyCredit: true,
      });
    }
  }

  // ==========================================
  // POINTER 1: Dynamic Random Daily Debits
  // ==========================================
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = toISO(cur);
    // Randomize 5 to 10 daily transactions
    const count = Math.floor(minDailyTx + Math.random() * (maxDailyTx - minDailyTx + 1));

    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.08) {
        txs.push(generateRandomCredit({ bank, dateStr, isHdfc, holderName }));
        continue;
      }

      const cat = pickWeightedCategory();
      const amtPaise = generateAmountPaise(cat);

      let storeName;
      let vpa;
      if (cat.id === 'p2p') {
        const pName = faker.person.fullName().toUpperCase();
        storeName = pName;
        vpa = `${pName.replace(/[^A-Z]/g, '').toLowerCase().slice(0, 10)}${pickRandom(UPI_HANDLES)}`;
      } else {
        storeName = pickRandom(cat.stores);
        vpa = `${randomPhone()}${pickRandom(UPI_HANDLES)}`;
      }

      const rrn = random12Digit();
      const utr = randomUtr();
      const narration = formatBankNarration({
        bank,
        categoryId: cat.id,
        merchantName: storeName,
        rrn,
        utr,
        vpa,
        type: 'debit',
        holderName,
        ifsc,
      });

      let refNumber;
      if (isHdfc) {
        if (cat.id === 'atm_wdl') {
          refNumber = '000000000000000';
        } else if (Math.random() < 0.6) {
          refNumber = `0000${rrn}`;
        } else {
          refNumber = `000000${rrn.slice(0, 10)}`;
        }
      } else {
        refNumber = `UPI-${rrn}`;
      }

      txs.push({
        id: newId(),
        date: dateStr,
        valueDate: dateStr,
        description: narration,
        reference: refNumber,
        amount: (amtPaise / 100).toFixed(2),
        type: 'debit',
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Sort chronologically by date; monthly credits appear at beginning of that day
  txs.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type === 'credit' && b.type !== 'credit') return -1;
    if (a.type !== 'credit' && b.type === 'credit') return 1;
    return a.id.localeCompare(b.id);
  });

  return txs;
}

/**
 * Parses and normalizes transactions from imported JSON data.
 * Supports:
 * 1. OCR Salary Schedule: { salaryCredits: [ { date, amount, notes, ... } ] }
 * 2. Full or partial Statement Builder JSON: { transactions: [ ... ] }
 * 3. Array of transactions or salary items: [ { ... }, ... ]
 *
 * @param {string|Object} jsonOrObj - Raw JSON string or parsed object
 * @param {Object} account - Current statement account data for bank narration formatting
 * @returns {Object} { transactions, isSalaryCredits, minDate, maxDate, totalPaise }
 */
export function parseTransactionsFromJson(jsonOrObj, account = {}) {
  const data = typeof jsonOrObj === 'string' ? JSON.parse(jsonOrObj) : jsonOrObj;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON format: expected an object or array.');
  }

  let items = [];
  let isSalaryCredits = false;

  if (Array.isArray(data)) {
    items = data;
    if (items.length > 0 && (items[0].salaryCredits || items[0].amountNumeric != null || items[0].srNo != null)) {
      isSalaryCredits = true;
    }
  } else if (Array.isArray(data.salaryCredits)) {
    items = data.salaryCredits;
    isSalaryCredits = true;
  } else if (Array.isArray(data.salary_credits)) {
    items = data.salary_credits;
    isSalaryCredits = true;
  } else if (Array.isArray(data.credits)) {
    items = data.credits;
    isSalaryCredits = true;
  } else if (Array.isArray(data.transactions)) {
    items = data.transactions;
  } else {
    throw new Error('No recognisable transactions or salaryCredits found in the JSON file.');
  }

  const bank = account.bank || 'Kotak Mahindra Bank';
  const isHdfc = bank === 'HDFC Bank';
  const holderName = account.holderName || 'Customer';
  const ifsc = account.ifsc || (isHdfc ? 'HDFC0000794' : 'KKBK0001767');

  const result = [];
  let totalPaise = 0;
  let minDate = '';
  let maxDate = '';

  for (const item of items) {
    let dateStr = item.date || item.transactionDate;
    if (!dateStr && item.displayDate) {
      dateStr = parseFlexibleDate(item.displayDate);
    }
    if (!dateStr || !isISODate(dateStr)) {
      dateStr = parseFlexibleDate(dateStr);
    }
    if (!dateStr) continue;

    const rawAmt = item.amount != null ? item.amount : item.amountNumeric;
    const amtPaise = toPaise(rawAmt);
    if (isNaN(amtPaise) || amtPaise <= 0) continue;

    const amtFormatted = plainAmount(amtPaise);
    totalPaise += amtPaise;

    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    const type = item.type === 'debit' ? 'debit' : 'credit';

    let description = item.description || item.narration;
    if (!description && isSalaryCredits) {
      const sender = item.sender || (item.notes && !item.notes.toLowerCase().includes('salary') ? item.notes : 'INFOSYS LIMITED');
      const utr = randomUtr(isHdfc ? 'AXOMB' : 'UTIB');
      description = formatBankNarration({
        bank,
        type: 'credit',
        sender,
        holderName,
        ifsc,
        utr,
      });
    } else if (!description) {
      description = type === 'credit' ? 'NEFT Credit Transfer' : 'UPI Payment';
    }

    let reference = item.reference || item.refNo;
    if (!reference) {
      reference = isHdfc ? randomUtr('AXOMB') : `UPI-${random12Digit()}`;
    }

    result.push({
      id: newId(),
      date: dateStr,
      valueDate: item.valueDate || dateStr,
      description,
      reference,
      type,
      amount: amtFormatted,
    });
  }

  if (result.length === 0) {
    throw new Error('No valid transactions could be parsed from the JSON file.');
  }

  // Sort chronologically
  result.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type === 'credit' && b.type !== 'credit') return -1;
    if (a.type !== 'credit' && b.type === 'credit') return 1;
    return a.id.localeCompare(b.id);
  });

  return {
    transactions: result,
    isSalaryCredits,
    minDate,
    maxDate,
    totalPaise,
  };
}

/**
 * Fill gaps between existing transactions with realistic daily random debits.
 * Preserves all existing transactions (such as imported salary credits),
 * generates daily expenses on empty days, and ensures that the monthly spending
 * stays safely within incoming credits so the running balance never goes negative.
 *
 * @param {Object} account - statement account data (bank, periodStart, periodEnd, openingBalance, holderName, ifsc)
 * @param {Array} existingTransactions - current list of transactions
 * @param {Object} options - configuration
 * @returns {Object} { transactions, addedCount, periodStart, periodEnd }
 */
export function fillTransactionGaps(account, existingTransactions = [], options = {}) {
  const bank = account.bank || 'Kotak Mahindra Bank';
  const isHdfc = bank === 'HDFC Bank';
  const holderName = account.holderName || 'Customer';
  const ifsc = account.ifsc || (isHdfc ? 'HDFC0000794' : 'KKBK0001767');
  const openingPaise = toPaise(account.openingBalance || '0.00');
  const minReservePaise = 1000 * 100; // Keep at least ₹1,000 reserve

  // Determine date bounds
  let startStr = account.periodStart;
  let endStr = account.periodEnd;

  if (!startStr || !endStr) {
    if (existingTransactions.length > 0) {
      const dates = existingTransactions.map(t => t.date).filter(Boolean).sort();
      if (!startStr && dates.length > 0) {
        const [y, m] = dates[0].split('-');
        startStr = `${y}-${m}-01`;
      }
      if (!endStr && dates.length > 0) {
        const [y, m] = dates[dates.length - 1].split('-');
        const lastDay = new Date(Number(y), Number(m), 0).getDate();
        endStr = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      }
    } else {
      const now = new Date();
      startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endStr = toISO(now);
    }
  }

  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { transactions: existingTransactions, addedCount: 0, periodStart: startStr, periodEnd: endStr };
  }

  // If there are no existing transactions at all, generate fresh transactions
  if (existingTransactions.length === 0) {
    const fresh = generateSeedTransactions({ ...account, periodStart: startStr, periodEnd: endStr });
    return { transactions: fresh, addedCount: fresh.length, periodStart: startStr, periodEnd: endStr };
  }

  // Index existing transactions by date (sorted: credits first on each date)
  const existingByDate = new Map();
  for (const t of existingTransactions) {
    if (!t.date) continue;
    if (!existingByDate.has(t.date)) {
      existingByDate.set(t.date, []);
    }
    existingByDate.get(t.date).push(t);
  }

  for (const list of existingByDate.values()) {
    list.sort((a, b) => {
      if (a.type === 'credit' && b.type !== 'credit') return -1;
      if (a.type !== 'credit' && b.type === 'credit') return 1;
      return 0;
    });
  }

  // Pre-calculate monthly credits so we know monthly spending appetite
  const creditByMonth = new Map();
  for (const t of existingTransactions) {
    if (t.type === 'credit' && t.date) {
      const m = t.date.slice(0, 7);
      const p = toPaise(t.amount);
      if (!isNaN(p)) creditByMonth.set(m, (creditByMonth.get(m) || 0) + p);
    }
  }

  let runningBalPaise = openingPaise;
  const newDebits = [];

  // Step through each calendar day from start to end
  const cur = new Date(start);
  let currentMonthKey = '';
  let monthlyDebitsSpentPaise = 0;
  let targetMonthlySpendingPaise = 0;

  while (cur <= end) {
    const dateStr = toISO(cur);
    const mKey = dateStr.slice(0, 7);

    if (mKey !== currentMonthKey) {
      currentMonthKey = mKey;
      monthlyDebitsSpentPaise = 0;
      const monthIncome = creditByMonth.get(mKey) || 0;
      targetMonthlySpendingPaise = monthIncome > 0
        ? Math.floor(monthIncome * (0.65 + Math.random() * 0.15))
        : Math.min(runningBalPaise > minReservePaise ? runningBalPaise - minReservePaise : 0, 5000 * 100);
    }

    // 1. Process existing transactions on this day
    const existingToday = existingByDate.get(dateStr) || [];
    for (const t of existingToday) {
      const p = toPaise(t.amount);
      if (!isNaN(p)) {
        if (t.type === 'credit') {
          runningBalPaise += p;
        } else {
          runningBalPaise -= p;
          monthlyDebitsSpentPaise += p;
        }
      }
    }

    // 2. Decide if we can generate debits on this day
    const safeBuffer = runningBalPaise - minReservePaise;
    const budgetLeft = targetMonthlySpendingPaise - monthlyDebitsSpentPaise;

    const isGapDay = existingToday.length === 0;
    const shouldSpend = isGapDay && Math.random() < 0.65 && safeBuffer > 2000 && budgetLeft > 2000;

    if (shouldSpend) {
      const txCount = Math.random() < 0.7 ? 1 : 2;
      for (let i = 0; i < txCount; i++) {
        // Probabilistically generate occasional auxiliary incoming credit (P2P UPI received, refund, interest)
        if (Math.random() < 0.10) {
          const cred = generateRandomCredit({ bank, dateStr, isHdfc, holderName });
          const p = toPaise(cred.amount);
          runningBalPaise += p;
          newDebits.push(cred);
          continue;
        }

        const currentSafe = runningBalPaise - minReservePaise;
        const currentBudget = targetMonthlySpendingPaise - monthlyDebitsSpentPaise;
        const maxSpendable = Math.min(currentSafe, currentBudget);
        if (maxSpendable < 5000) break;

        const cat = pickWeightedCategory();
        let amtPaise = generateAmountPaise(cat);
        if (amtPaise > maxSpendable) {
          amtPaise = Math.floor(maxSpendable * 0.8);
          amtPaise = Math.round(amtPaise / 100) * 100;
        }
        if (amtPaise < 1000) amtPaise = 1000;
        if (amtPaise > maxSpendable) break;

        let storeName;
        let vpa;
        if (cat.id === 'p2p') {
          const pName = faker.person.fullName().toUpperCase();
          storeName = pName;
          vpa = `${pName.replace(/[^A-Z]/g, '').toLowerCase().slice(0, 10)}${pickRandom(UPI_HANDLES)}`;
        } else {
          storeName = pickRandom(cat.stores);
          vpa = `${randomPhone()}${pickRandom(UPI_HANDLES)}`;
        }

        const rrn = random12Digit();
        const utr = randomUtr();
        const narration = formatBankNarration({
          bank,
          categoryId: cat.id,
          merchantName: storeName,
          rrn,
          utr,
          vpa,
          type: 'debit',
          holderName,
          ifsc,
        });

        let refNumber;
        if (isHdfc) {
          if (cat.id === 'atm_wdl') {
            refNumber = '000000000000000';
          } else if (Math.random() < 0.6) {
            refNumber = `0000${rrn}`;
          } else {
            refNumber = `000000${rrn.slice(0, 10)}`;
          }
        } else {
          refNumber = `UPI-${rrn}`;
        }

        newDebits.push({
          id: newId(),
          date: dateStr,
          valueDate: dateStr,
          description: narration,
          reference: refNumber,
          amount: plainAmount(amtPaise),
          type: 'debit',
        });

        runningBalPaise -= amtPaise;
        monthlyDebitsSpentPaise += amtPaise;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Combine and sort
  const combined = [...existingTransactions, ...newDebits];
  combined.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type === 'credit' && b.type !== 'credit') return -1;
    if (a.type !== 'credit' && b.type === 'credit') return 1;
    return a.id.localeCompare(b.id);
  });

  return {
    transactions: combined,
    addedCount: newDebits.length,
    periodStart: startStr,
    periodEnd: endStr,
  };
}
