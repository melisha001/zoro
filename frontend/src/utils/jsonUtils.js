/**
 * Safe JSON field parsing utility.
 * Accepts:
 * - A parsed Object/Array (returns as-is)
 * - A JSON string (safely parses with JSON.parse)
 * - A plain string / primitive / null / undefined (returns null)
 * 
 * Never throws, never evaluates '[object Object]' into invalid state,
 * and ensures components only receive expected Object or null.
 * 
 * @param {any} value 
 * @returns {object|null}
 */
export function parseJsonField(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}
