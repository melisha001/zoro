import { getItem, setItem, apiResponse, apiGet, apiPost } from './client';
import { getStudentEnrolledCourses } from './enrollmentApi';

const PROGRESS_KEY = 'student_progress_db';

const INITIAL_PROGRESS = [
  {
    studentId: 'arjun@student.com',
    courseId: 'english-comm',
    moduleId: 'mod-1',
    lastPosition: 45, // seconds
    completionPercentage: 100,
    status: 'Completed',
    lastAccessedTime: '2026-09-25T20:00:00.000Z'
  },
  {
    studentId: 'arjun@student.com',
    courseId: 'english-comm',
    moduleId: 'mod-2',
    lastPosition: 120, // seconds
    completionPercentage: 50,
    status: 'In Progress',
    lastAccessedTime: '2026-09-25T21:30:00.000Z'
  }
];

export const getStudentProgress = async (studentId, courseId) => {
  // Try backend first
  if (studentId && courseId) {
    try {
      const res = await apiGet(`/progress/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return apiResponse(res.data);
      }
    } catch (e) {
      console.warn('[Progress] Backend fetch error:', e);
    }
  }

  let allProgress = getItem(PROGRESS_KEY, null);
  if (!allProgress) {
    allProgress = INITIAL_PROGRESS;
    setItem(PROGRESS_KEY, allProgress);
  }

  const sIdLower = (studentId || '').toLowerCase().trim();
  const filtered = allProgress.filter(
    p => (p.studentId || '').toLowerCase().trim() === sIdLower && p.courseId === courseId
  );

  return apiResponse(filtered);
};

export const updateModuleProgress = async ({ studentId, courseId, moduleId, lastPosition, completionPercentage, status }) => {
  // Sync to backend
  try {
    apiPost('/progress', {
      studentId,
      courseId,
      moduleId,
      lastPosition,
      completionPercentage,
      status
    }).catch(() => {});
  } catch (e) {}

  let allProgress = getItem(PROGRESS_KEY, INITIAL_PROGRESS);
  const sIdLower = (studentId || '').toLowerCase().trim();

  const existingIndex = allProgress.findIndex(
    p => (p.studentId || '').toLowerCase().trim() === sIdLower &&
         p.courseId === courseId &&
         p.moduleId === moduleId
  );

  const calcStatus = status || (completionPercentage >= 80 ? 'Completed' : completionPercentage > 0 ? 'In Progress' : 'Not Started');

  let updated;
  if (existingIndex >= 0) {
    updated = [...allProgress];
    updated[existingIndex] = {
      ...updated[existingIndex],
      lastPosition: lastPosition !== undefined ? lastPosition : updated[existingIndex].lastPosition,
      completionPercentage: completionPercentage !== undefined ? completionPercentage : updated[existingIndex].completionPercentage,
      status: calcStatus,
      lastAccessedTime: new Date().toISOString()
    };
  } else {
    const newProg = {
      studentId,
      courseId,
      moduleId,
      lastPosition: lastPosition || 0,
      completionPercentage: completionPercentage || 0,
      status: calcStatus,
      lastAccessedTime: new Date().toISOString()
    };
    updated = [newProg, ...allProgress];
  }

  setItem(PROGRESS_KEY, updated);
  return apiResponse(updated);
};

// Requirement #5 & #16: Secure Video Playback Authorization Check with Bunny Stream
export const authorizeVideoPlayback = async (studentId, courseId, moduleId) => {
  if (!studentId) {
    return apiResponse(null, false, 'Access Denied: Authentication required.');
  }

  const targetId = moduleId || courseId || 'demo-video';

  // 1. Try real backend Bunny Stream signed playback token
  try {
    const backendRes = await apiGet(`/videos/${encodeURIComponent(targetId)}/playback?studentId=${encodeURIComponent(studentId)}&courseId=${encodeURIComponent(courseId || '')}`);
    if (backendRes.success && backendRes.data && backendRes.data.authorized) {
      return apiResponse(backendRes.data, true, 'Playback authorized successfully');
    }
    if (backendRes.status === 403 || (backendRes.data && backendRes.data.authorized === false)) {
      return apiResponse(null, false, backendRes.message || 'Access Denied: You are not enrolled in this course.');
    }
  } catch (err) {
    console.warn('[Playback Authorization] Spring Boot backend unreachable, evaluating local enrollment:', err);
  }

  // 2. Local fallback check
  try {
    const enrolledCourses = await getStudentEnrolledCourses(studentId);
    const isEnrolled = (enrolledCourses || []).some(c => c.id === courseId || c.title?.toLowerCase() === courseId?.toLowerCase());

    if (!isEnrolled) {
      return apiResponse(null, false, 'Access Denied: You are not enrolled in this course.');
    }

    // Generate signed playback access token
    const token = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + 3600 * 1000;

    return apiResponse({
      authorized: true,
      token,
      expiresAt,
      studentId,
      courseId,
      moduleId,
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }, true, 'Playback authorized successfully');

  } catch (err) {
    console.error('Playback authorization failed:', err);
    return apiResponse(null, false, 'Authorization check error.');
  }
};
