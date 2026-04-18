export type YearMonth = {
  year: number;
  month: number; // 1-12
};

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const toMonthKey = (item: YearMonth) => `${item.year}-${item.month}`;

export const getAllMonths = (startDate: Date, endDate: Date): YearMonth[] => {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  if (start > end) return [];

  const result: YearMonth[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
};

export const findMissingMonths = (expected: YearMonth[], paid: YearMonth[]): YearMonth[] => {
  const paidSet = new Set(paid.map(toMonthKey));
  const dedupe = new Set<string>();
  const missing: YearMonth[] = [];

  for (const month of expected) {
    const key = toMonthKey(month);
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    if (!paidSet.has(key)) missing.push(month);
  }

  return missing.sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));
};

export const groupByYear = (months: YearMonth[]): Record<number, number[]> => {
  const grouped: Record<number, number[]> = {};
  for (const item of months) {
    if (!grouped[item.year]) grouped[item.year] = [];
    if (!grouped[item.year].includes(item.month)) grouped[item.year].push(item.month);
  }
  for (const year of Object.keys(grouped)) {
    grouped[Number(year)] = grouped[Number(year)].sort((a, b) => a - b);
  }
  return grouped;
};

export const monthNumberToShortName = (month: number): string => {
  if (month < 1 || month > 12) return '';
  return MONTH_SHORT_NAMES[month - 1];
};

