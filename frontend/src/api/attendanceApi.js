import { apiGet, apiPost, apiResponse } from './client';

/**
 * Attendance Management API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getAttendanceRecords = async () => {
  const res = await apiGet('/attendance');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const getStudentAttendance = async (studentId) => {
  if (!studentId) return apiResponse([]);
  const res = await apiGet(`/attendance/student/${encodeURIComponent(studentId)}`);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const recordAttendance = async (sessionData, studentName = 'Student', studentEmail = 'student@zoro.com', studentId = null) => {
  const payload = {
    scheduleId: sessionData.id ? String(sessionData.id) : null,
    studentId: studentId || sessionData.studentId || studentEmail,
    studentName: studentName,
    courseId: sessionData.courseId || sessionData.course,
    batchId: sessionData.batchId || sessionData.batch,
    date: sessionData.date || new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    remarks: 'Portal Live Class Join',
    recordedBy: studentName
  };

  const res = await apiPost('/attendance', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Attendance recorded');
  }
  return apiResponse(null, false, res?.message || 'Failed to record attendance');
};

export const recordBatchAttendance = async (records) => {
  const res = await apiPost('/attendance/batch', records);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Batch attendance recorded');
  }
  return apiResponse(null, false, res?.message || 'Failed to record batch attendance');
};

export const getAttendanceRemarks = async () => {
  const res = await apiGet('/attendance');
  if (res.success && Array.isArray(res.data)) {
    const withRemarks = res.data.filter(r => r.remarks && r.remarks.trim().length > 0);
    return apiResponse(withRemarks);
  }
  return apiResponse([]);
};

export const addAttendanceRemark = async (remarkData) => {
  const payload = {
    studentId: remarkData.studentId || remarkData.studentEmail || remarkData.studentName,
    studentName: remarkData.studentName,
    courseId: remarkData.courseId || remarkData.course,
    batchId: remarkData.batchId || remarkData.batch,
    date: remarkData.date || new Date().toISOString().split('T')[0],
    status: remarkData.status || 'PRESENT',
    remarks: remarkData.remark || remarkData.remarks,
    recordedBy: remarkData.addedByName || 'Trainer'
  };

  const res = await apiPost('/attendance', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Remark added');
  }
  return apiResponse(null, false, res?.message || 'Failed to add remark');
};

export const saveAttendanceRemark = addAttendanceRemark;

export const updateAttendanceStatus = async (recordId, status) => {
  const payload = {
    id: recordId,
    status: status
  };
  const res = await apiPost('/attendance', payload);
  return apiResponse(res?.data || null, res?.success || false);
};

