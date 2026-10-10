/**
 * Standard submit error message for invalid mobile number.
 */
export const SUBMIT_PHONE_ERROR = 'Enter a valid 10-digit mobile number (starts with 6-9)';

/**
 * Strips non-digits and truncates to max 10 digits.
 * @param {string} val
 * @returns {string} 10-digit numeric string
 */
export function sanitizePhone(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 10);
}

/**
 * Validates whether string is a valid 10-digit Indian mobile number.
 * Pattern: Starts with 6-9, followed by 9 digits.
 * @param {string} val
 * @returns {boolean}
 */
export function validatePhone(val) {
  if (!val) return false;
  const cleaned = sanitizePhone(val);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Formats a 10-digit number for display e.g. "+91 98765 43210"
 * @param {string} val
 * @returns {string}
 */
export function formatPhone(val) {
  const cleaned = sanitizePhone(val);
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return val || '';
}
