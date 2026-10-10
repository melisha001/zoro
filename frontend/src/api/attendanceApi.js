import { apiGet, apiPost, apiResponse } from './client';

/**
 * Attendance Management API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getAttendanceRecords = async () => {
  let res = await apiGet('/attendance');
  if (!res.success && (res.status === 403 || res.status === 401 || res?.message?.toLowerCase().includes('access denied'))) {
    res = await apiGet('/me/attendance');
  }
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch attendance records');
};

export const getMyAttendanceRecords = async () => {
  const res = await apiGet('/me/attendance');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch my attendance records');
};

export const getStudentAttendance = async (studentId) => {
  if (!studentId) {
    return apiResponse([], false, 'Student ID is required');
  }
  const res = await apiGet(`/attendance/student/${encodeURIComponent(studentId)}`);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch student attendance');
};

export const recordAttendance = async (sessionData, studentName = 'Student', studentEmail = 'student@zoro.com', studentId = null) => {
  const finalStudentId = studentId || sessionData?.studentId || studentEmail;
  if (!finalStudentId) {
    return apiResponse(null, false, 'Student identifier is required to record attendance');
  }

  const payload = {
    scheduleId: sessionData?.id ? String(sessionData.id) : null,
    studentId: finalStudentId,
    studentName: studentName || 'Student',
    courseId: sessionData?.courseId || sessionData?.course,
    batchId: sessionData?.batchId || sessionData?.batch,
    date: sessionData?.date || new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    remarks: 'Portal Live Class Join',
    recordedBy: studentName || 'Student'
  };

  const res = await apiPost('/attendance', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Attendance recorded');
  }
  return apiResponse(null, false, res?.message || 'Failed to record attendance');
};

export const recordBatchAttendance = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return apiResponse(null, false, 'No attendance records provided');
  }
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
  return apiResponse([], false, res?.message || 'Failed to fetch attendance remarks');
};

export const addAttendanceRemark = async (remarkData) => {
  const finalStudentId = remarkData?.studentId || remarkData?.studentEmail || remarkData?.studentName;
  if (!finalStudentId) {
    return apiResponse(null, false, 'Student identifier is required for remark');
  }

  const payload = {
    studentId: finalStudentId,
    studentName: remarkData?.studentName,
    courseId: remarkData?.courseId || remarkData?.course,
    batchId: remarkData?.batchId || remarkData?.batch,
    date: remarkData?.date || new Date().toISOString().split('T')[0],
    status: remarkData?.status || 'PRESENT',
    remarks: remarkData?.remark || remarkData?.remarks,
    recordedBy: remarkData?.addedByName || 'Trainer'
  };

  const res = await apiPost('/attendance', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Remark added');
  }
  return apiResponse(null, false, res?.message || 'Failed to add remark');
};

export const saveAttendanceRemark = addAttendanceRemark;

export const updateAttendanceStatus = async (recordId, status) => {
  if (!recordId) {
    return apiResponse(null, false, 'Attendance record ID is required');
  }
  const payload = {
    id: recordId,
    status: status
  };
  const res = await apiPost('/attendance', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Status updated');
  }
  return apiResponse(null, false, res?.message || 'Failed to update attendance status');
};
