import { apiGet, apiPost, apiPut, apiResponse } from './client';

/**
 * Attendance Management API
 * 100% Database-backed via Spring Boot REST endpoints.
 * Automatic Attendance System (No manual marking).
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

export const getTrainerAttendanceRecords = async () => {
  const res = await apiGet('/attendance/trainer');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch trainer attendance records');
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

export const updateStudentRemark = async ({ scheduleId, studentId, remark, id }) => {
  if (!studentId) {
    return apiResponse(null, false, 'Student ID is required');
  }
  const payload = { id, scheduleId, studentId, remark };
  const res = id
    ? await apiPut(`/attendance/${encodeURIComponent(id)}/remark`, payload)
    : await apiPut('/attendance/remark', payload);

  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Student remark updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update student remark');
};

export const correctStudentAttendance = async ({ scheduleId, studentId, status, remark }) => {
  if (!scheduleId) {
    return apiResponse(null, false, 'Schedule ID is required');
  }
  if (!studentId) {
    return apiResponse(null, false, 'Student ID is required');
  }
  if (!remark || !remark.trim()) {
    return apiResponse(null, false, 'Remark is mandatory when correcting attendance status');
  }
  const res = await apiPut('/attendance/correction', { scheduleId, studentId, status, remark });
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Attendance corrected successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to correct attendance');
};

export const updateTrainerRemark = async ({ scheduleId, trainerId, remark, id }) => {
  if (!trainerId) {
    return apiResponse(null, false, 'Trainer ID is required');
  }
  const payload = { id, scheduleId, trainerId, remark };
  const res = id
    ? await apiPut(`/attendance/trainer/${encodeURIComponent(id)}/remark`, payload)
    : await apiPut('/attendance/trainer/remark', payload);

  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Trainer remark updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update trainer remark');
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
  return updateStudentRemark({
    id: remarkData?.id,
    scheduleId: remarkData?.scheduleId,
    studentId: finalStudentId,
    remark: remarkData?.remark || remarkData?.remarks
  });
};

export const saveAttendanceRemark = addAttendanceRemark;

// Legacy stubs kept for backwards compatibility; backend rejects manual marking with 403
export const recordAttendance = async () => {
  return apiResponse(null, false, 'Manual attendance marking is disabled.');
};

export const recordBatchAttendance = async () => {
  return apiResponse(null, false, 'Manual attendance marking is disabled.');
};

export const updateAttendanceStatus = async () => {
  return apiResponse(null, false, 'Manual attendance marking is disabled.');
};
