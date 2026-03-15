/**
 * Format a date string as DD-Mon-YYYY (e.g. "20-Jun-2026")
 * Site-wide standard date format for Adventist Pulse.
 */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // fallback to raw string if unparseable
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}
