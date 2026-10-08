import { apiGet, apiPost } from './client';

/**
 * Bunny Stream Video API
 * Connects frontend to Spring Boot backend Bunny Stream endpoints
 */

export const createVideoUploadSession = async ({ title, courseId, moduleId, collectionId }) => {
  const res = await apiPost('/videos/upload-session', {
    title,
    courseId,
    moduleId,
    collectionId
  });

  if (res.success && res.data) {
    return res;
  }

  return {
    success: false,
    message: res.message || 'Failed to create video upload session'
  };
};

export const getVideoPlayback = async (videoId, _studentId, courseId) => {
  if (!videoId) {
    return {
      success: false,
      message: 'Video ID is required'
    };
  }
  const params = new URLSearchParams();
  if (courseId) params.append('courseId', courseId);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const endpoint = `/videos/${encodeURIComponent(videoId)}/playback${queryStr}`;
  const res = await apiGet(endpoint);

  if (res.success && res.data && res.data.authorized) {
    return res;
  }

  return {
    success: false,
    message: res.message || 'Access Denied: You are not authorized to stream this video.'
  };
};

export const getVideos = async () => {
  const res = await apiGet('/videos');
  if (res.success && res.data) {
    return res;
  }
  return {
    success: false,
    data: [],
    message: res.message || 'Failed to fetch videos'
  };
};
