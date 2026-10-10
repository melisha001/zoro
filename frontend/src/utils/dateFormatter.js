/**
 * Formats a date string (e.g. "2026-10-01" or ISO timestamp) to DD/MM/YYYY.
 * Returns empty string if dateStr is blank or invalid.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;

  // Check YYYY-MM-DD
  const rawDate = trimmed.split('T')[0];
  const parts = rawDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Fallback to Date parsing
  try {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return trimmed;
  }
}
