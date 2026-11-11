 

/**
 * Formats a date as '11-Mar-2026' (DD-MMM-YYYY).
 * @param date - The date string or Date object to format.
 * @returns The formatted date string.
 */
export function formatDateToDayMonYear(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d);

  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';

  return day && month && year ? `${day}-${month}-${year}` : '-';
}

/**
 * Formats a date and time as '20 Jun 2025, 3:45 PM' in Indian timezone.
 * @param date - The date string or Date object to format.
 * @returns The formatted date and time string.
 */
export function formatDateToDayMonYearWithTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
} 