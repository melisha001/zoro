/**
 * Utility for parsing schedule time strings and sorting schedule items chronologically.
 */

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // If time string is a range like "05:00 PM - 06:00 PM", extract the start time "05:00 PM"
  const startPart = String(timeStr).split('-')[0].trim();
  const match = startPart.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function sortSchedulesChronologically(schedulesList) {
  if (!Array.isArray(schedulesList)) return [];
  return [...schedulesList].sort((a, b) => {
    // 1. Sort by DATE ascending if both items have valid dates and they differ
    if (a.date && b.date && a.date !== b.date) {
      return String(a.date).localeCompare(String(b.date));
    }
    // 2. Sort by START TIME ascending numerically in minutes from midnight
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
}
