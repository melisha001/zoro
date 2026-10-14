import { apiGet, apiPost, apiResponse } from './client';

/**
 * Student Enrollment API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getEnrollments = async () => {
  const res = await apiGet('/enrollments');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch enrollments');
};

export const getStudentEnrollments = async (studentIdOrEmail) => {
  if (!studentIdOrEmail) {
    return apiResponse([], false, 'Student identifier is required');
  }
  const res = await apiGet(`/enrollments/student/${encodeURIComponent(studentIdOrEmail)}`);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch student enrollments');
};

export const enrollStudentInCourse = async (studentIdOrEmail, courseId, batchName = '', batchId = null) => {
  if (!studentIdOrEmail || !courseId) {
    return apiResponse(null, false, 'Student identifier and Course ID are required to enroll');
  }
  const payload = {
    studentId: studentIdOrEmail,
    studentEmail: studentIdOrEmail,
    courseId,
    batchName,
    batchId
  };
  const res = await apiPost('/enrollments', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Enrolled successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to enroll');
};

export const getStudentEnrolledCourses = async (studentIdOrEmail) => {
  if (!studentIdOrEmail) return [];
  const res = await apiGet(`/enrollments/student/${encodeURIComponent(studentIdOrEmail)}`);
  if (res.success && Array.isArray(res.data)) {
    return res.data.map(e => ({
      id: e.courseId,
      courseId: e.courseId,
      title: e.courseTitle,
      courseTitle: e.courseTitle,
      batch: e.batchName,
      batchName: e.batchName,
      batchId: e.batchId,
      mode: e.courseMode || 'Online',
      courseMode: e.courseMode || 'Online',
      trainerId: e.trainerId || null,
      trainerName: e.trainerName || null,
      trainers: Array.isArray(e.trainers) ? e.trainers : [],
      enrolledDate: e.enrolledDate,
      status: e.status
    }));
  }
  return [];
};
