import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  sortSchedulesChronologically,
  getSessionStartDateTime,
  getSessionEndDateTime,
  getUnlockTimeString,
  evaluateScheduleLocks
} from './utils/scheduleSortUtil';

describe('B3: Schedule Locking and Sorting Utility Tests', () => {
  it('parses time strings to minutes correctly', () => {
    expect(parseTimeToMinutes('09:30 AM')).toBe(9 * 60 + 30);
    expect(parseTimeToMinutes('05:00 PM - 06:00 PM')).toBe(17 * 60);
    expect(parseTimeToMinutes('12:00 PM')).toBe(12 * 60);
    expect(parseTimeToMinutes('12:00 AM')).toBe(0);
  });

  it('sorts schedules chronologically by date and start time', () => {
    const list = [
      { id: '3', date: '2026-10-15', time: '06:00 PM - 07:00 PM' },
      { id: '1', date: '2026-10-14', time: '10:00 AM - 11:00 AM' },
      { id: '2', date: '2026-10-15', time: '09:00 AM - 10:00 AM' }
    ];
    const sorted = sortSchedulesChronologically(list);
    expect(sorted.map(s => s.id)).toEqual(['1', '2', '3']);
  });

  it('computes correct unlock time string (60 minutes prior to start)', () => {
    expect(getUnlockTimeString('2026-10-15', '05:00 PM - 06:00 PM')).toBe('Unlocks at 04:00 PM');
    expect(getUnlockTimeString('2026-10-15', '10:00 AM - 11:00 AM')).toBe('Unlocks at 09:00 AM');
  });

  it('correctly locks and unlocks sessions based on Asia/Kolkata reference time', () => {
    // Reference time: 2026-10-15 15:00:00 UTC (representing 3:00 PM IST)
    const mockNow = new Date(Date.UTC(2026, 9, 15, 15, 0, 0));

    const sessions = [
      // Completed session earlier today
      { id: 'past', title: 'Past Session', date: '2026-10-15', time: '10:00 AM - 11:00 AM' },
      // Nearest upcoming session (at 5:00 PM today, 2 hours away -> locked until 4:00 PM)
      { id: 'nearest', title: 'Upcoming Nearest', date: '2026-10-15', time: '05:00 PM - 06:00 PM' },
      // Subsequent session tomorrow (locked)
      { id: 'future1', title: 'Future Session', date: '2026-10-16', time: '05:00 PM - 06:00 PM' },
      // Subsequent session next week (locked)
      { id: 'future2', title: 'Distant Session', date: '2026-10-20', time: '05:00 PM - 06:00 PM' }
    ];

    const evaluated = evaluateScheduleLocks(sessions, mockNow);

    const past = evaluated.find(s => s.id === 'past');
    expect(past.status).toBe('COMPLETED');
    expect(past.isLocked).toBe(false);

    const nearest = evaluated.find(s => s.id === 'nearest');
    expect(nearest.status).toBe('UPCOMING');
    expect(nearest.isLocked).toBe(true); // Locked until 60 min before start (no nearest exception)
    expect(nearest.unlockLabel).toBe('Unlocks at 04:00 PM');

    const future1 = evaluated.find(s => s.id === 'future1');
    expect(future1.status).toBe('UPCOMING');
    expect(future1.isLocked).toBe(true);
    expect(future1.unlockLabel).toBe('Unlocks at 04:00 PM');

    const future2 = evaluated.find(s => s.id === 'future2');
    expect(future2.isLocked).toBe(true);
  });

  it('automatically unlocks a future session when within 60 minutes of its start time', () => {
    // Reference time: 2026-10-16 16:15:00 UTC (4:15 PM, 45 minutes before 5:00 PM class)
    const mockNowWithin60m = new Date(Date.UTC(2026, 9, 16, 16, 15, 0));

    const sessions = [
      { id: 'future1', title: 'Session Within 60m', date: '2026-10-16', time: '05:00 PM - 06:00 PM' },
      { id: 'future2', title: 'Session Later', date: '2026-10-17', time: '05:00 PM - 06:00 PM' }
    ];

    const evaluated = evaluateScheduleLocks(sessions, mockNowWithin60m);
    const sessionWithin60m = evaluated.find(s => s.id === 'future1');
    expect(sessionWithin60m.isLocked).toBe(false);

    const sessionLater = evaluated.find(s => s.id === 'future2');
    expect(sessionLater.isLocked).toBe(true);
  });
});
