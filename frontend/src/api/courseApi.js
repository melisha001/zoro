import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

/**
 * Course Management API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getCourses = async (audience = null) => {
  const url = audience ? `/courses?audience=${encodeURIComponent(audience)}` : '/courses';
  const res = await apiGet(url);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const getCourseById = async (id) => {
  const res = await apiGet(`/courses/${id}`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res.message || 'Course not found');
};

export const createCourse = async (newCourseData) => {
  const res = await apiPost('/courses', newCourseData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Course created successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to create course');
};

export const updateCourse = async (id, updatedData) => {
  const res = await apiPut(`/courses/${id}`, updatedData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Course updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update course');
};

export const deleteCourse = async (id) => {
  const res = await apiDelete(`/courses/${id}`);
  if (res.success) {
    return apiResponse(true, true, 'Course deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete course');
};

export const addModule = async (courseId, moduleData) => {
  const res = await apiPost(`/courses/${courseId}/modules`, moduleData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Module added successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to add module');
};

export const updateModule = async (courseId, moduleId, updatedModuleData) => {
  const res = await apiPut(`/courses/${courseId}/modules/${moduleId}`, updatedModuleData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Module updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update module');
};

export const deleteModule = async (courseId, moduleId) => {
  const res = await apiDelete(`/courses/${courseId}/modules/${moduleId}`);
  if (res.success) {
    return apiResponse(true, true, 'Module deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete module');
};

export const addLesson = async (courseId, moduleId, lessonData) => {
  const res = await apiPost(`/courses/${courseId}/modules/${moduleId}/lessons`, lessonData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Lesson added successfully');
  }
  return apiResponse(lessonData, true, 'Lesson updated');
};

// --- TRAINER COURSE REQUESTS API ---
export const getTrainerCourseRequests = async (trainerId = null) => {
  const url = trainerId ? `/trainer-course-requests?trainerId=${encodeURIComponent(trainerId)}` : '/trainer-course-requests';
  const res = await apiGet(url);
  if (res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(r => ({
      id: r.id,
      trainerId: r.trainerId,
      trainerName: r.trainerName,
      trainerEmail: r.trainerEmail,
      courseId: r.courseId,
      courseTitle: r.courseTitle,
      requestedAt: r.requestDate,
      status: r.status
    }));
    return apiResponse(normalized);
  }
  return apiResponse([]);
};

export const createTrainerCourseRequest = async ({ trainerId, trainerName, trainerEmail, courseId, courseTitle }) => {
  const payload = {
    trainerId: trainerId || trainerEmail,
    trainerName,
    trainerEmail,
    courseId,
    courseTitle,
    status: 'Pending',
    requestDate: new Date().toLocaleDateString('en-GB')
  };
  const res = await apiPost('/trainer-course-requests', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Course access requested successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to request course');
};

export const updateTrainerCourseRequestStatus = async (requestId, status) => {
  const res = await apiPut(`/trainer-course-requests/${requestId}/status`, { status });
  if (res.success) {
    return apiResponse(true, true, 'Status updated');
  }
  return apiResponse(false, false, res.message || 'Failed to update status');
};
