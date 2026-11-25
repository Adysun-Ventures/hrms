import { isISODate, toPaise } from './format.js';
import { validateTransaction } from './validate.js';

/**
 * Everything the summary, transaction list and PDF need, derived from the raw statement.
 * Only valid transactions dated inside the statement period appear on the statement.
 * They are ordered by date; same-day transactions keep the order they were entered in.
 *   closing = opening + total credits − total debits
 */
export function compute(statement) {
  const a = statement.account;
  const openingRaw = toPaise(a.openingBalance, { allowNegative: true });
  const opening = Number.isFinite(openingRaw) ? openingRaw : 0;
  const start = isISODate(a.periodStart) ? a.periodStart : null;
  const end = isISODate(a.periodEnd) ? a.periodEnd : null;

  const invalidIds = new Set();
  const outOfPeriodIds = new Set();
  const inPeriod = [];
  statement.transactions.forEach((t, index) => {
    if (Object.keys(validateTransaction(t)).length) return invalidIds.add(t.id);
    if ((start && t.date < start) || (end && t.date > end)) return outOfPeriodIds.add(t.id);
    inPeriod.push({ t, index, amount: toPaise(t.amount) });
  });
  inPeriod.sort((x, y) => (x.t.date < y.t.date ? -1 : x.t.date > y.t.date ? 1 : x.index - y.index));

  let balance = opening, credit = 0, debit = 0, creditCount = 0, debitCount = 0, negativeCount = 0;
  const lines = inPeriod.map(({ t, amount }) => {
    const isCredit = t.type === 'credit';
    if (isCredit) { credit += amount; creditCount++; balance += amount; }
    else { debit += amount; debitCount++; balance -= amount; }
    if (balance < 0) negativeCount++;
    return {
      id: t.id,
      date: t.date,
      valueDate: t.valueDate || t.date,
      description: t.description.trim(),
      reference: t.reference.trim(),
      debit: isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
      balance,
    };
  });

  return {
    currency: a.currency,
    opening,
    openingValid: Number.isFinite(openingRaw),
    credit,
    debit,
    creditCount,
    debitCount,
    closing: opening + credit - debit,
    count: lines.length,
    lines,
    balanceById: new Map(lines.map(l => [l.id, l.balance])),
    invalidIds,
    outOfPeriodIds,
    negativeCount,
  };
}
