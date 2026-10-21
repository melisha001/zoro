/**
 * Utility to format friendly reference numbers for Doubts (e.g., #D-0012).
 * Prevents exposing internal raw UUIDs or dbt_ strings in the UI.
 */
export function getFriendlyDoubtId(doubt, index = 0, allDoubts = []) {
  if (!doubt) return '#D-0001';

  // If allDoubts array provided, find position sorted chronologically
  if (Array.isArray(allDoubts) && allDoubts.length > 0) {
    const sorted = [...allDoubts].sort((a, b) => {
      const tA = new Date(a.createdAt || a.createdOn || 0).getTime();
      const tB = new Date(b.createdAt || b.createdOn || 0).getTime();
      return tA - tB;
    });
    const foundIdx = sorted.findIndex(d => d.id === doubt.id);
    if (foundIdx !== -1) {
      return `#D-${String(foundIdx + 1).padStart(4, '0')}`;
    }
  }

  // Fallback to explicit index if valid
  if (typeof index === 'number' && index >= 0) {
    return `#D-${String(index + 1).padStart(4, '0')}`;
  }

  // Deterministic fallback based on ID hash
  let hash = 0;
  const str = String(doubt.id || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash) % 10000;
  return `#D-${String(num || 1).padStart(4, '0')}`;
}
