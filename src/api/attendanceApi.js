import { getItem, setItem, apiResponse } from './client';

const ATTENDANCE_KEY = 'attendance_records';

export const getAttendanceRecords = async () => {
  const records = getItem(ATTENDANCE_KEY, [
    {
      id: 'att-1',
      studentName: 'Arjun',
      course: 'English Communication',
      topic: 'Public Speaking Workshop',
      date: '12 Sep 2026',
      status: 'PRESENT',
      joinedAt: '5:59 PM',
      source: 'PORTAL_JOIN'
    }
  ]);
  return apiResponse(records);
};

export const recordAttendance = async (sessionData, studentName = 'Arjun') => {
  const { data: records } = await getAttendanceRecords();
  
  // Prevent duplicate records for the same session date
  const existing = records.find(r => r.course === sessionData.course && r.date === sessionData.date);
  if (existing) {
    return apiResponse(existing, true, 'Attendance already marked');
  }

  const newRecord = {
    id: `att_${Date.now()}`,
    studentName,
    course: sessionData.course,
    topic: sessionData.topic || 'General Session',
    date: sessionData.date || new Date().toLocaleDateString('en-GB'),
    status: 'PRESENT',
    joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'PORTAL_JOIN'
  };

  const updated = [newRecord, ...records];
  setItem(ATTENDANCE_KEY, updated);
  return apiResponse(newRecord, true, 'Attendance marked successfully');
};
