import { apiGet, apiPost, apiPut } from './client';

export const getStorageMetrics = async () => {
  return await apiGet('/admin/storage/metrics');
};

export const triggerStorageCleanup = async (dryRun = false, cutoffHours = 24) => {
  return await apiPost(`/admin/storage/cleanup?dryRun=${dryRun}&cutoffHours=${cutoffHours}`);
};

export const updateStorageSettings = async (settings) => {
  return await apiPut('/admin/storage/settings', settings);
};
