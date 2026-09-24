import { getItem, setItem, apiResponse } from './client';

const SCHEDULES_KEY = 'schedules_db';

const INITIAL_SCHEDULES = [
  { id: 1, title: 'Level 2 - Present Tense', course: 'English Communication', batch: 'Batch A', trainer: 'Priya', time: '05:00 PM - 06:00 PM', mode: 'Online (Google Meet)', status: 'Upcoming', students: 28, date: '2026-09-24' },
  { id: 2, title: 'Level 1 - Daily Conversation', course: 'English Communication', batch: 'Batch A', trainer: 'Priya', time: '06:00 PM - 07:00 PM', mode: 'Online (Google Meet)', status: 'Upcoming', students: 25, date: '2026-09-24' },
  { id: 3, title: 'Vocabulary Building & Phonics', course: 'English Communication', batch: 'Batch B', trainer: 'Rahul', time: '07:00 PM - 08:00 PM', mode: 'Online (Google Meet)', status: 'Completed', students: 28, date: '2026-09-24' },
  { id: 4, title: 'Abacus Speed Calculation', course: 'Abacus Level 3', batch: 'Batch C', trainer: 'Rahul', time: '04:00 PM - 05:00 PM', mode: 'Offline (Branch A)', status: 'Completed', students: 20, date: '2026-09-24' }
];

export function computeDynamicStatus(schedule, now = new Date()) {
  if (schedule.status === 'Completed' || schedule.status === 'Rescheduled') {
    return schedule.status;
  }

  const timeStr = schedule.time || '';
  const parts = timeStr.split('-');
  const startStr = parts[0] ? parts[0].trim() : '';
  const endStr = parts[1] ? parts[1].trim() : startStr;

  const startMins = parseTimeMinutes(startStr);
  let endMins = parseTimeMinutes(endStr);
  if (endMins <= startMins) endMins = startMins + 60;

  const dStr = schedule.date || new Date().toISOString().split('T')[0];
  const dateParts = dStr.split('-').map(Number);
  if (dateParts.length < 3) return schedule.status || 'Upcoming';

  const [year, month, day] = dateParts;
  const startDate = new Date(year, month - 1, day, Math.floor(startMins / 60), startMins % 60);
  const endDate = new Date(year, month - 1, day, Math.floor(endMins / 60), endMins % 60);

  if (now < startDate) {
    return 'Upcoming';
  } else if (now > endDate && schedule.date < new Date().toISOString().split('T')[0]) {
    return 'Completed';
  } else {
    return schedule.status || 'Upcoming';
  }
}

export function parseTimeMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function sortSchedulesByTime(schedulesList) {
  return [...(schedulesList || [])].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
  });
}

export const getSchedules = async () => {
  let schedules = getItem(SCHEDULES_KEY, null);
  if (!schedules || schedules.length === 0 || schedules.some(s => s.batch === 'EN-L2' || s.batch === 'EN-L1' || s.batch === 'AB-L3')) {
    schedules = INITIAL_SCHEDULES;
    setItem(SCHEDULES_KEY, schedules);
  }
  const now = new Date();
  const updatedWithDynamicStatus = (schedules || []).map(s => ({
    ...s,
    status: computeDynamicStatus(s, now)
  }));
  return apiResponse(sortSchedulesByTime(updatedWithDynamicStatus));
};

export const createSchedule = async (scheduleData) => {
  const { data: schedules } = await getSchedules();
  const newSchedule = {
    id: `sch_${Date.now()}`,
    status: 'Upcoming',
    students: 25,
    ...scheduleData
  };
  const updated = sortSchedulesByTime([newSchedule, ...schedules]);
  setItem(SCHEDULES_KEY, updated);
  return apiResponse(newSchedule);
};

export const updateSchedule = async (id, scheduleData) => {
  const { data: schedules } = await getSchedules();
  const updated = sortSchedulesByTime(schedules.map(s => s.id === id ? { ...s, ...scheduleData } : s));
  setItem(SCHEDULES_KEY, updated);
  return apiResponse(updated.find(s => s.id === id));
};

export const deleteSchedule = async (id) => {
  const { data: schedules } = await getSchedules();
  const updated = schedules.filter(s => s.id !== id);
  setItem(SCHEDULES_KEY, updated);
  return apiResponse(true);
};

export const getTrainerSchedules = async (trainerNameOrEmail) => {
  const { data: schedules } = await getSchedules();
  const lowerQuery = trainerNameOrEmail.toLowerCase().trim();
  
  const filtered = schedules.filter(s => {
    if (!s.trainer) return false;
    const tLower = s.trainer.toLowerCase();
    return tLower.includes(lowerQuery) || lowerQuery.includes(tLower);
  });

  return apiResponse(sortSchedulesByTime(filtered));
};

