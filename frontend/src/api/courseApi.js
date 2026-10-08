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
  return apiResponse([], false, res?.message || 'Failed to fetch courses');
};

export const getCourseById = async (id) => {
  if (!id) {
    return apiResponse(null, false, 'Course ID is required');
  }
  const res = await apiGet(`/courses/${encodeURIComponent(id)}`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Course not found');
};

export const createCourse = async (newCourseData) => {
  if (!newCourseData?.title) {
    return apiResponse(null, false, 'Course title is required');
  }
  const res = await apiPost('/courses', newCourseData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Course created successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to create course');
};

export const updateCourse = async (id, updatedData) => {
  if (!id) {
    return apiResponse(null, false, 'Course ID is required');
  }
  const res = await apiPut(`/courses/${encodeURIComponent(id)}`, updatedData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Course updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update course');
};

export const deleteCourse = async (id) => {
  if (!id) {
    return apiResponse(false, false, 'Course ID is required');
  }
  const res = await apiDelete(`/courses/${encodeURIComponent(id)}`);
  if (res.success) {
    return apiResponse(true, true, 'Course deleted successfully');
  }
  return apiResponse(false, false, res?.message || 'Failed to delete course');
};

export const addModule = async (courseId, moduleData) => {
  if (!courseId) {
    return apiResponse(null, false, 'Course ID is required');
  }
  const res = await apiPost(`/courses/${encodeURIComponent(courseId)}/modules`, moduleData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Module added successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to add module');
};

export const updateModule = async (courseId, moduleId, updatedModuleData) => {
  if (!courseId || !moduleId) {
    return apiResponse(null, false, 'Course ID and Module ID are required');
  }
  const res = await apiPut(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`, updatedModuleData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Module updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update module');
};

export const deleteModule = async (courseId, moduleId) => {
  if (!courseId || !moduleId) {
    return apiResponse(false, false, 'Course ID and Module ID are required');
  }
  const res = await apiDelete(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`);
  if (res.success) {
    return apiResponse(true, true, 'Module deleted successfully');
  }
  return apiResponse(false, false, res?.message || 'Failed to delete module');
};

export const addLesson = async (courseId, moduleId, lessonData) => {
  if (!courseId || !moduleId) {
    return apiResponse(null, false, 'Course ID and Module ID are required');
  }
  const res = await apiPost(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/lessons`, lessonData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Lesson added successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to add lesson');
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
  return apiResponse([], false, res?.message || 'Failed to fetch trainer course requests');
};

export const createTrainerCourseRequest = async ({ trainerId, trainerName, trainerEmail, courseId, courseTitle }) => {
  if (!courseId) {
    return apiResponse(null, false, 'Course ID is required');
  }
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
  return apiResponse(null, false, res?.message || 'Failed to request course');
};

export const updateTrainerCourseRequestStatus = async (requestId, status) => {
  if (!requestId) {
    return apiResponse(false, false, 'Request ID is required');
  }
  const res = await apiPut(`/trainer-course-requests/${encodeURIComponent(requestId)}/status`, { status });
  if (res.success) {
    return apiResponse(true, true, 'Status updated');
  }
  return apiResponse(false, false, res?.message || 'Failed to update status');
};
