import { getItem, setItem, apiResponse } from './client';

const LOGS_KEY = 'activity_logs_db';

const INITIAL_LOGS = [
  {
    id: 'log-1',
    date: '2026-09-20',
    time: '09:30 AM',
    category: 'Students',
    action: 'Student Added',
    details: 'New student Arjun M enrolled in English Communication (Batch A).'
  },
  {
    id: 'log-2',
    date: '2026-09-20',
    time: '11:15 AM',
    category: 'Batches',
    action: 'Batch Status Changed',
    details: 'Chess Mastery Batch D status changed to Inactive.'
  },
  {
    id: 'log-3',
    date: '2026-09-20',
    time: '02:00 PM',
    category: 'Schedules',
    action: 'Session Rescheduled',
    details: 'English Communication (Batch A) rescheduled from 10:00 AM to 11:00 AM.'
  },
  {
    id: 'log-4',
    date: '2026-09-21',
    time: '10:00 AM',
    category: 'Trainers',
    action: 'Salary Payment Recorded',
    details: 'Trainer Priya salary payment of ₹35,000 for Sept 2026 recorded.'
  },
  {
    id: 'log-5',
    date: '2026-09-21',
    time: '04:30 PM',
    category: 'Courses',
    action: 'Course Updated',
    details: 'Abacus Level 3 course fee updated to ₹12,000.'
  },
  {
    id: 'log-6',
    date: '2026-09-24',
    time: '09:00 AM',
    category: 'Students',
    action: 'Student Batch Updated',
    details: 'Student Ananya R assigned to Abacus Level 3 (Batch C).'
  },
  {
    id: 'log-7',
    date: '2026-09-24',
    time: '01:20 PM',
    category: 'Competitions',
    action: 'Competition Created',
    details: 'New competition "National Public Speaking Championship 2026" created.'
  }
];

export const getActivityLogs = async (fromDate, toDate) => {
  let logs = getItem(LOGS_KEY, null);
  if (!logs || logs.length === 0) {
    logs = INITIAL_LOGS;
    setItem(LOGS_KEY, logs);
  }

  let filtered = [...logs];
  if (fromDate && toDate) {
    filtered = filtered.filter(l => l.date >= fromDate && l.date <= toDate);
  } else if (fromDate) {
    filtered = filtered.filter(l => l.date >= fromDate);
  }

  // Sort descending by date & time
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  return apiResponse(filtered);
};

export const logActivity = async (category, action, details) => {
  let logs = getItem(LOGS_KEY, INITIAL_LOGS);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().split('T')[0];

  const newLog = {
    id: `log_${Date.now()}`,
    date: dateStr,
    time: timeStr,
    category,
    action,
    details
  };

  const updated = [newLog, ...logs];
  setItem(LOGS_KEY, updated);
  return apiResponse(newLog);
};
