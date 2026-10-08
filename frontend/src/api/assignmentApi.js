import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

/**
 * Assignments and Submissions API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getAssignments = async () => {
  const res = await apiGet('/assignments');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const createAssignment = async (assignmentData) => {
  const res = await apiPost('/assignments', assignmentData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Assignment published successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to create assignment');
};

export const deleteAssignment = async (id) => {
  const res = await apiDelete(`/assignments/${id}`);
  if (res.success) {
    return apiResponse(true, true, 'Assignment deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete assignment');
};

export const getSubmissions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.studentEmail) params.append('studentEmail', filters.studentEmail);
  if (filters.trainer) params.append('trainer', filters.trainer);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await apiGet(`/submissions${qs}`);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const createSubmission = async (submissionData) => {
  const res = await apiPost('/submissions', submissionData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Submission uploaded successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to upload submission');
};

export const reviewSubmission = async (id, reviewData) => {
  const res = await apiPut(`/submissions/${id}/review`, reviewData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Correction saved successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to save review');
};

export const deleteSubmission = async (id) => {
  const res = await apiDelete(`/submissions/${id}`);
  if (res.success) {
    return apiResponse(true, true, 'Submission deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete submission');
};

export const updateCorrection = async (id, correctionData) => {
  return await reviewSubmission(id, correctionData);
};

export const assignRecordedSubmissionsToTrainer = async (batchName, courseTitle, trainerName) => {
  const res = await apiPost('/submissions/assign-batch', { batchName, courseTitle, trainerName });
  return apiResponse(true);
};

export const getCreatedAssignments = getAssignments;
export const createExtraAssignment = createAssignment;
