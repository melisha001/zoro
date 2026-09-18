import { getItem, setItem, apiResponse } from './client';

const SCHEDULES_KEY = 'schedules_db';

const INITIAL_SCHEDULES = [
  { id: 1, title: 'Level 2 - Present Tense', course: 'English Communication', batch: 'EN-L2', trainer: 'Priya', time: '05:00 PM - 06:00 PM', mode: 'Online (Google Meet)', status: 'Upcoming', students: 28, date: '2026-09-17' },
  { id: 2, title: 'Level 1 - Daily Conversation', course: 'English Communication', batch: 'EN-L1', trainer: 'Priya', time: '06:00 PM - 07:00 PM', mode: 'Online (Google Meet)', status: 'Upcoming', students: 25, date: '2026-09-17' },
  { id: 3, title: 'Vocabulary Building & Phonics', course: 'English Communication', batch: 'EN-L2', trainer: 'Rahul', time: '07:00 PM - 08:00 PM', mode: 'Online (Google Meet)', status: 'Completed', students: 28, date: '2026-09-17' },
  { id: 4, title: 'Abacus Speed Calculation', course: 'Abacus Level 3', batch: 'AB-L3', trainer: 'Rahul', time: '04:00 PM - 05:00 PM', mode: 'Offline (Branch A)', status: 'Completed', students: 20, date: '2026-09-17' }
];

export const getSchedules = async () => {
  let schedules = getItem(SCHEDULES_KEY, null);
  if (!schedules) {
    schedules = INITIAL_SCHEDULES;
    setItem(SCHEDULES_KEY, schedules);
  }
  return apiResponse(schedules);
};

export const createSchedule = async (scheduleData) => {
  const { data: schedules } = await getSchedules();
  const newSchedule = {
    id: `sch_${Date.now()}`,
    status: 'Upcoming',
    students: 25,
    ...scheduleData
  };
  const updated = [newSchedule, ...schedules];
  setItem(SCHEDULES_KEY, updated);
  return apiResponse(newSchedule);
};

export const updateSchedule = async (id, scheduleData) => {
  const { data: schedules } = await getSchedules();
  const updated = schedules.map(s => s.id === id ? { ...s, ...scheduleData } : s);
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
  
  return apiResponse(schedules.filter(s => {
    if (!s.trainer) return false;
    const tLower = s.trainer.toLowerCase();
    return tLower.includes(lowerQuery) || lowerQuery.includes(tLower);
  }));
};
