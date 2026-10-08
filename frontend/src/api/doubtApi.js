import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

export const getDoubts = async () => {
  const res = await apiGet('/doubts');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(d => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.studentName || 'Student',
      studentEmail: d.studentEmail || '',
      course: d.courseTitle || d.course || '',
      courseTitle: d.courseTitle || d.course || '',
      mode: d.mode || 'Online',
      batchName: d.batchName || d.batch || '',
      batch: d.batchName || d.batch || '',
      topic: d.moduleTitle || d.topic || '',
      question: d.question || '',
      status: (d.status || 'OPEN').toUpperCase(),
      trainerName: d.trainerName || '',
      answer: d.reply || d.answer || '',
      reply: d.reply || d.answer || '',
      createdOn: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : (d.createdOn || '')
    }));
    return apiResponse(normalized);
  }
  return apiResponse([]);
};

export const createDoubt = async (doubtData) => {
  const payload = {
    studentId: doubtData.studentId,
    studentName: doubtData.studentName,
    courseTitle: doubtData.course || doubtData.courseTitle,
    moduleTitle: doubtData.topic || doubtData.moduleTitle,
    question: doubtData.question,
    status: 'OPEN'
  };
  const res = await apiPost('/doubts', payload);
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to submit doubt');
};

export const resolveDoubt = async (doubtId, trainerName, answerText) => {
  const res = await apiPut(`/doubts/${doubtId}/reply`, {
    reply: answerText,
    trainerName: trainerName || 'Trainer'
  });
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to resolve doubt');
};

export const deleteDoubt = async (doubtId) => {
  const res = await apiDelete(`/doubts/${doubtId}`);
  if (res && res.success) {
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete doubt');
};
