import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { logActivity } from './activityLogApi';

export const getCompetitions = async () => {
  const res = await apiGet('/competitions');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(c => ({
      id: c.id,
      title: c.title || 'Competition',
      name: c.title || 'Competition',
      category: c.category || 'Academic',
      description: c.description || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      regStartDate: c.regStartDate || '',
      regEndDate: c.regEndDate || '',
      startTime: c.startTime || '',
      endTime: c.endTime || '',
      venue: c.venue || '',
      bannerUrl: c.bannerUrl || '',
      rulesPdfUrl: c.rulesPdfUrl || '',
      instructions: c.instructions || '',
      rules: c.rules || '',
      contactDetails: c.contactDetails || '',
      registrationFee: parseFloat(c.registrationFee || 0),
      status: c.status || 'Active',
      modules: c.modules || [],
      registrations: c.registrations || []
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
    title: (newCompData.title || newCompData.name || '').trim(),
    category: newCompData.category || 'Academic',
    description: newCompData.description || '',
    startDate: newCompData.startDate || '',
    endDate: newCompData.endDate || '',
    regStartDate: newCompData.regStartDate || '',
    regEndDate: newCompData.regEndDate || '',
    startTime: newCompData.startTime || '',
    endTime: newCompData.endTime || '',
    venue: newCompData.venue || '',
    bannerUrl: newCompData.bannerUrl || '',
    rulesPdfUrl: newCompData.rulesPdfUrl || '',
    instructions: newCompData.instructions || '',
    rules: newCompData.rules || '',
    contactDetails: newCompData.contactDetails || '',
    registrationFee: parseFloat(newCompData.registrationFee || 0),
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
    title: (updatedData.title || updatedData.name || '').trim(),
    category: updatedData.category || 'Academic',
    description: updatedData.description || '',
    startDate: updatedData.startDate || '',
    endDate: updatedData.endDate || '',
    regStartDate: updatedData.regStartDate || '',
    regEndDate: updatedData.regEndDate || '',
    startTime: updatedData.startTime || '',
    endTime: updatedData.endTime || '',
    venue: updatedData.venue || '',
    bannerUrl: updatedData.bannerUrl || '',
    rulesPdfUrl: updatedData.rulesPdfUrl || '',
    instructions: updatedData.instructions || '',
    rules: updatedData.rules || '',
    contactDetails: updatedData.contactDetails || '',
    registrationFee: parseFloat(updatedData.registrationFee || 0),
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
