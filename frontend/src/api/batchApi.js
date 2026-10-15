import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

/**
 * Batch Management API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getBatches = async (courseId = null, trainerId = null) => {
  let endpoint = '/batches';
  const params = [];
  if (courseId) params.push(`courseId=${encodeURIComponent(courseId)}`);
  if (trainerId) params.push(`trainerId=${encodeURIComponent(trainerId)}`);
  if (params.length > 0) endpoint += `?${params.join('&')}`;

  const res = await apiGet(endpoint);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch batches');
};

export const getBatchById = async (id) => {
  if (!id) {
    return apiResponse(null, false, 'Batch ID is required');
  }
  const res = await apiGet(`/batches/${encodeURIComponent(id)}`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Batch not found');
};

export const getBatchStudents = async (id) => {
  if (!id) {
    return apiResponse([], false, 'Batch ID is required');
  }
  const res = await apiGet(`/batches/${encodeURIComponent(id)}/students`);
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch batch students');
};

export const getBatchStudentCount = async (id) => {
  if (!id) {
    return apiResponse(0, false, 'Batch ID is required');
  }
  const res = await apiGet(`/batches/${encodeURIComponent(id)}/students/count`);
  if (res.success && typeof res.data === 'number') {
    return apiResponse(res.data);
  }
  return apiResponse(0, false, res?.message || 'Failed to fetch batch student count');
};

export const createBatch = async (batchData) => {
  if (!batchData?.name && !batchData?.batchName) {
    return apiResponse(null, false, 'Batch name is required');
  }
  const res = await apiPost('/batches', batchData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Batch created successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to create batch');
};

export const updateBatch = async (id, updatedData) => {
  if (!id) {
    return apiResponse(null, false, 'Batch ID is required');
  }
  const res = await apiPut(`/batches/${encodeURIComponent(id)}`, updatedData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Batch updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update batch');
};

export const deleteBatch = async (id) => {
  if (!id) {
    return apiResponse(false, false, 'Batch ID is required');
  }
  const res = await apiDelete(`/batches/${encodeURIComponent(id)}`);
  if (res.success) {
    return apiResponse(true, true, 'Batch deleted successfully');
  }
  return apiResponse(false, false, res?.message || 'Failed to delete batch');
};
