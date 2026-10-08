import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { logActivity } from './activityLogApi';

export const getCompetitions = async () => {
  const res = await apiGet('/competitions');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(c => ({
      id: c.id,
      name: c.title || c.name || 'Competition',
      title: c.title || c.name || 'Competition',
      category: c.category || '',
      courseName: c.category || '',
      description: c.description || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      date: c.startDate || '',
      fee: parseFloat(c.registrationFee || 0),
      registrationFee: parseFloat(c.registrationFee || 0),
      rules: c.rules || '',
      status: c.status || 'Active',
      modules: c.modules || [],
      registrations: c.registrations || [],
      venue: 'Online (Zoro Portal)',
      eligibleBatch: 'All Batches',
      instructions: c.rules || ''
    }));
    return apiResponse(normalized);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch competitions');
};

export const createCompetition = async (newCompData) => {
  if (!newCompData?.title && !newCompData?.name) {
    return apiResponse(null, false, 'Competition title is required');
  }
  const payload = {
    title: newCompData.title || newCompData.name,
    category: newCompData.category || newCompData.courseName || '',
    startDate: newCompData.startDate || newCompData.date || '',
    endDate: newCompData.endDate || newCompData.date || '',
    registrationFee: parseFloat(newCompData.registrationFee || newCompData.fee || 0),
    description: newCompData.description || '',
    rules: newCompData.rules || newCompData.instructions || '',
    status: newCompData.status || 'Active'
  };

  const res = await apiPost('/competitions', payload);
  if (res && res.success) {
    await logActivity('Competitions', 'Competition Created', `New competition "${payload.title}" created.`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to create competition');
};

export const updateCompetition = async (id, updatedData) => {
  if (!id) {
    return apiResponse(null, false, 'Competition ID is required');
  }
  const payload = {
    title: updatedData.title || updatedData.name,
    category: updatedData.category || updatedData.courseName,
    startDate: updatedData.startDate || updatedData.date,
    endDate: updatedData.endDate || updatedData.date,
    registrationFee: parseFloat(updatedData.registrationFee || updatedData.fee || 0),
    description: updatedData.description,
    rules: updatedData.rules || updatedData.instructions,
    status: updatedData.status || 'Active'
  };

  const res = await apiPut(`/competitions/${encodeURIComponent(id)}`, payload);
  if (res && res.success) {
    await logActivity('Competitions', 'Competition Updated', `Updated competition "${payload.title || id}"`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update competition');
};

export const deleteCompetition = async (id) => {
  if (!id) {
    return apiResponse(false, false, 'Competition ID is required');
  }
  const res = await apiDelete(`/competitions/${encodeURIComponent(id)}`);
  if (res && res.success) {
    await logActivity('Competitions', 'Competition Deleted', `Deleted competition "${id}"`);
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete competition');
};
