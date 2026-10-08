import { apiResponse, apiGet, apiPost } from './client';

/**
 * Student Video Watch Progress API
 * 100% Database-backed via Spring Boot REST endpoints and PostgreSQL (student_module_progress).
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getStudentProgress = async (studentId, courseId) => {
  if (!studentId || !courseId) {
    return apiResponse([]);
  }
  try {
    const res = await apiGet(`/progress/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`);
    if (res.success && Array.isArray(res.data)) {
      return apiResponse(res.data);
    }
  } catch (e) {
    console.error('[Progress] Fetch error:', e);
  }
  return apiResponse([]);
};

export const updateModuleProgress = async ({ studentId, courseId, moduleId, lastPosition, completionPercentage, status }) => {
  try {
    const res = await apiPost('/progress', {
      studentId,
      courseId,
      moduleId,
      lastPosition,
      completionPercentage,
      status
    });
    if (res.success && res.data) {
      return apiResponse(res.data, true, 'Progress saved successfully');
    }
  } catch (e) {
    console.error('[Progress] Update error:', e);
  }
  return apiResponse(null, false, 'Failed to save progress');
};

// Secure Video Playback Authorization Check with Bunny Stream
export const authorizeVideoPlayback = async (studentId, courseId, moduleId) => {
  if (!studentId) {
    return apiResponse(null, false, 'Access Denied: Authentication required.');
  }

  const targetId = moduleId || courseId;
  if (!targetId) {
    return apiResponse(null, false, 'Video or module identifier is required.');
  }

  const params = new URLSearchParams();
  if (courseId) params.append('courseId', courseId);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  try {
    const backendRes = await apiGet(`/videos/${encodeURIComponent(targetId)}/playback${queryStr}`);
    if (backendRes.success && backendRes.data && backendRes.data.authorized) {
      return apiResponse(backendRes.data, true, 'Playback authorized successfully');
    }
    return apiResponse(null, false, backendRes.message || 'Access Denied: You are not authorized to stream this video.');
  } catch (err) {
    return apiResponse(null, false, err.message || 'Playback authorization failed.');
  }
};
