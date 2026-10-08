import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { logActivity } from './activityLogApi';

export const getCompetitionModules = async (competitionId = null) => {
  if (competitionId) {
    const res = await apiGet(`/competitions/${encodeURIComponent(competitionId)}/modules`);
    if (res && res.success && Array.isArray(res.data)) {
      const normalized = res.data.map(m => ({
        id: m.id,
        competitionId,
        title: m.title || '',
        description: m.description || '',
        roundNumber: m.roundNumber || 1,
        url: '',
        thumbnail: '',
        notesFile: null,
        worksheetFile: null,
        assignmentFile: null,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : ''
      }));
      return apiResponse(normalized);
    }
    return apiResponse([], false, res?.message || 'Failed to fetch competition modules');
  }

  // If no competitionId provided, get all competitions and flatten their modules
  const compRes = await apiGet('/competitions');
  if (compRes && compRes.success && Array.isArray(compRes.data)) {
    const allModules = [];
    compRes.data.forEach(comp => {
      if (Array.isArray(comp.modules)) {
        comp.modules.forEach(m => {
          allModules.push({
            id: m.id,
            competitionId: comp.id,
            title: m.title || '',
            description: m.description || '',
            roundNumber: m.roundNumber || 1,
            url: '',
            thumbnail: '',
            notesFile: null,
            worksheetFile: null,
            assignmentFile: null,
            createdAt: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : ''
          });
        });
      }
    });
    return apiResponse(allModules);
  }
  return apiResponse([], false, compRes?.message || 'Failed to fetch competition modules');
};

export const addCompetitionModule = async (competitionId, moduleData) => {
  if (!competitionId) {
    return apiResponse(null, false, 'Competition ID is required');
  }
  const payload = {
    title: moduleData?.title || 'Untitled Module',
    description: moduleData?.description || '',
    roundNumber: moduleData?.roundNumber || 1
  };

  const res = await apiPost(`/competitions/${encodeURIComponent(competitionId)}/modules`, payload);
  if (res && res.success) {
    await logActivity('Competitions', 'Module Added', `Added module "${payload.title}" to competition ${competitionId}`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to add module');
};

export const updateCompetitionModule = async (moduleId, updatedData) => {
  if (!moduleId) {
    return apiResponse(null, false, 'Module ID is required');
  }
  const payload = {
    title: updatedData?.title,
    description: updatedData?.description,
    roundNumber: updatedData?.roundNumber
  };

  const res = await apiPut(`/competitions/modules/${encodeURIComponent(moduleId)}`, payload);
  if (res && res.success) {
    await logActivity('Competitions', 'Module Updated', `Updated competition module ${moduleId}`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update module');
};

export const deleteCompetitionModule = async (moduleId) => {
  if (!moduleId) {
    return apiResponse(false, false, 'Module ID is required');
  }
  const res = await apiDelete(`/competitions/modules/${encodeURIComponent(moduleId)}`);
  if (res && res.success) {
    await logActivity('Competitions', 'Module Deleted', `Deleted competition module "${moduleId}"`);
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete module');
};
