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

/**
 * Send video playback heartbeat every 5s while playing.
 * Server accumulates watched_seconds, capped by elapsed time,
 * and sets video_completed = true when watched_seconds >= 95% of duration.
 */
export const sendVideoHeartbeat = async ({ moduleId, position, duration, courseId, studentId }) => {
  try {
    const res = await apiPost('/progress/heartbeat', {
      moduleId,
      position,
      duration,
      courseId,
      studentId
    });
    return res;
  } catch (e) {
    console.error('[Progress] Heartbeat error:', e);
    return apiResponse(null, false, e.message);
  }
};

/**
 * Get detailed module progress records (including video_completed, duration_seconds, watched_seconds, last_position)
 */
export const getStudentModuleProgress = async (studentId, courseId) => {
  try {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    const res = await apiGet(`/progress/modules/${encodeURIComponent(studentId)}${query}`);
    return res;
  } catch (e) {
    console.error('[Progress] Fetch module progress error:', e);
    return apiResponse([]);
  }
};

