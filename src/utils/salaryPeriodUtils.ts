export type IsoDateParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
};

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

type FirestoreTimestampLike =
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number };

const toDateSafe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const maybeTs = value as FirestoreTimestampLike;
  if (maybeTs && typeof (maybeTs as any).toDate === 'function') {
    const d = (maybeTs as any).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const seconds = (maybeTs as any).seconds ?? (maybeTs as any)._seconds;
  if (typeof seconds === 'number') {
    const d = new Date(seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export function parseIsoDateParts(value: unknown): IsoDateParts | null {
  const d = toDateSafe(value);
  if (!d) return null;
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

export function getYearOptions(joining: IsoDateParts | null, now = new Date()): number[] {
  const currentYear = now.getFullYear();
  const startYear = joining?.year ?? currentYear;
  const from = Math.min(startYear, currentYear);
  const to = Math.max(startYear, currentYear);
  const out: number[] = [];
  for (let y = from; y <= to; y++) out.push(y);
  return out;
}

export function getMonthOptions(selectedYear: number | null, joining: IsoDateParts | null) {
  if (!selectedYear) return MONTHS;
  if (!joining) return MONTHS;
  if (selectedYear !== joining.year) return MONTHS;
  return MONTHS.filter((m) => m.value >= joining.month);
}

export function computeReadOnlyDay(
  selectedYear: number | null,
  selectedMonth: number | null,
  joining: IsoDateParts | null
): number {
  if (!joining || !selectedYear || !selectedMonth) return 1;
  if (selectedYear === joining.year && selectedMonth === joining.month) return joining.day;
  return 1;
}

