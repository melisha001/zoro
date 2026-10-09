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
    const normalized = res.data.map(b => {
      const daysArr = Array.isArray(b.days) && b.days.length > 0 
        ? b.days 
        : (b.day ? b.day.split(',').map(d => d.trim()) : (typeof b.days === 'string' && b.days ? b.days.split(',').map(d => d.trim()) : []));
      return {
        ...b,
        days: daysArr,
        day: daysArr.join(', ')
      };
    });
    return apiResponse(normalized);
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

export const createBatch = async (batchData) => {
  if (!batchData?.name && !batchData?.batchName) {
    return apiResponse(null, false, 'Batch name is required');
  }
  const daysStr = Array.isArray(batchData.days) ? batchData.days.join(', ') : (batchData.day || '');
  const payload = {
    ...batchData,
    days: daysStr,
    day: daysStr
  };
  const res = await apiPost('/batches', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Batch created successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to create batch');
};

export const updateBatch = async (id, updatedData) => {
  if (!id) {
    return apiResponse(null, false, 'Batch ID is required');
  }
  const daysStr = Array.isArray(updatedData.days) ? updatedData.days.join(', ') : (updatedData.day !== undefined ? updatedData.day : undefined);
  const payload = {
    ...updatedData,
    ...(daysStr !== undefined ? { days: daysStr, day: daysStr } : {})
  };
  const res = await apiPut(`/batches/${encodeURIComponent(id)}`, payload);
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
