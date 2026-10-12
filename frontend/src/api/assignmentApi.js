import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { parseJsonField } from '../utils/jsonUtils';

/**
 * Assignments and Submissions API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export function normalizeAssignment(a) {
  if (!a) return a;
  const parsedAtt = parseJsonField(a.attachment);
  const attObj = parsedAtt || (typeof a.attachment === 'string' && a.attachment.trim() && !a.attachment.startsWith('{') ? { name: 'Assignment Attachment', fileUrl: a.attachment } : null);
  return {
    ...a,
    attachment: attObj
  };
}

export function normalizeSubmission(s) {
  if (!s) return s;
  const parsedAtt = parseJsonField(s.attachment);
  const attObj = parsedAtt || (typeof s.attachment === 'string' && s.attachment.trim() && !s.attachment.startsWith('{') ? { name: 'Submission Document', fileUrl: s.attachment } : null);
  const parsedCorr = parseJsonField(s.correctionAttachment);
  const corrObj = parsedCorr || (typeof s.correctionAttachment === 'string' && s.correctionAttachment.trim() && !s.correctionAttachment.startsWith('{') ? { name: 'Correction Document', fileUrl: s.correctionAttachment } : null);
  return {
    ...s,
    attachment: attObj,
    correctionAttachment: corrObj
  };
}

export const getAssignments = async (studentId) => {
  const endpoint = studentId ? `/assignments?studentId=${encodeURIComponent(studentId)}` : '/assignments';
  const res = await apiGet(endpoint);
  if (res && res.success && Array.isArray(res.data)) {
    return apiResponse(res.data.map(normalizeAssignment));
  }
  return {
    success: false,
    message: res?.message || 'Failed to fetch assignments',
    data: []
  };
};

export const createAssignment = async (assignmentData) => {
  const res = await apiPost('/assignments', assignmentData);
  if (res && res.success && res.data) {
    return apiResponse(normalizeAssignment(res.data), true, 'Assignment published successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to create assignment',
    data: null
  };
};

export const updateAssignment = async (id, assignmentData) => {
  if (!id) {
    return { success: false, message: 'Assignment ID is required', data: null };
  }
  const res = await apiPut(`/assignments/${id}`, assignmentData);
  if (res && res.success && res.data) {
    return apiResponse(normalizeAssignment(res.data), true, 'Assignment updated successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to update assignment',
    data: null
  };
};

export const deleteAssignment = async (id) => {
  if (!id) {
    return { success: false, message: 'Assignment ID is required', data: null };
  }
  const res = await apiDelete(`/assignments/${id}`);
  if (res && res.success) {
    return apiResponse(true, true, 'Assignment deleted successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to delete assignment',
    data: null
  };
};

export const getSubmissions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.studentEmail) params.append('studentEmail', filters.studentEmail);
  if (filters.trainer) params.append('trainer', filters.trainer);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await apiGet(`/submissions${qs}`);
  if (res && res.success && Array.isArray(res.data)) {
    return apiResponse(res.data.map(normalizeSubmission));
  }
  return {
    success: false,
    message: res?.message || 'Failed to fetch submissions',
    data: []
  };
};

export const createSubmission = async (submissionData) => {
  const res = await apiPost('/submissions', submissionData);
  if (res && res.success && res.data) {
    return apiResponse(normalizeSubmission(res.data), true, 'Submission uploaded successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to upload submission',
    data: null
  };
};

export const reviewSubmission = async (id, reviewData) => {
  if (!id) {
    return { success: false, message: 'Submission ID is required', data: null };
  }
  const res = await apiPut(`/submissions/${id}/review`, reviewData);
  if (res && res.success && res.data) {
    return apiResponse(normalizeSubmission(res.data), true, 'Correction saved successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to save review',
    data: null
  };
};

export const deleteSubmission = async (id) => {
  if (!id) {
    return { success: false, message: 'Submission ID is required', data: null };
  }
  const res = await apiDelete(`/submissions/${id}`);
  if (res && res.success) {
    return apiResponse(true, true, 'Submission deleted successfully');
  }
  return {
    success: false,
    message: res?.message || 'Failed to delete submission',
    data: null
  };
};

export const updateCorrection = async (id, correctionData) => {
  return await reviewSubmission(id, correctionData);
};

export const assignRecordedSubmissionsToTrainer = async (batchName, courseTitle, trainerName) => {
  const res = await apiPost('/submissions/assign-batch', { batchName, courseTitle, trainerName });
  if (res && res.success) {
    return apiResponse(true);
  }
  return {
    success: false,
    message: res?.message || 'Failed to assign submissions',
    data: null
  };
};

export const getCreatedAssignments = getAssignments;
export const createExtraAssignment = createAssignment;
