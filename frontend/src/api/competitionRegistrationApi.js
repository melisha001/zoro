import { apiGet, apiPost, apiPut, apiResponse } from './client';
import { logActivity } from './activityLogApi';

export const getCompetitionRegistrations = async () => {
  const res = await apiGet('/competitions/registrations');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(r => ({
      id: r.id,
      competitionId: r.competition?.id || r.competitionId,
      competitionName: r.competition?.title || r.competitionName || 'Competition',
      studentId: r.studentId,
      studentName: r.studentName || 'Student',
      studentEmail: r.studentEmail || '',
      studentPhone: '',
      batchName: 'All Batches',
      registrationDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      registrationFee: r.competition?.registrationFee || 0,
      paymentStatus: r.paymentStatus || 'Paid',
      registrationStatus: 'Registered',
      score: r.score,
      rank: r.rank,
      certificateUrl: r.certificateUrl
    }));
    return apiResponse(normalized);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch competition registrations');
};

export const checkDuplicateRegistration = async (studentEmail, competitionId) => {
  if (!studentEmail || !competitionId) return false;
  const res = await getCompetitionRegistrations();
  if (!res.success) return false;
  const regs = res.data;
  const lowerEmail = (studentEmail || '').toLowerCase().trim();
  return (regs || []).some(r => 
    r.competitionId === competitionId && 
    r.studentEmail.toLowerCase().trim() === lowerEmail &&
    r.registrationStatus !== 'Cancelled'
  );
};

export const createCompetitionRegistration = async (regData) => {
  if (!regData?.competitionId) {
    return apiResponse(null, false, 'Competition ID is required');
  }

  const isDuplicate = await checkDuplicateRegistration(regData.studentEmail, regData.competitionId);
  if (isDuplicate) {
    return apiResponse(null, false, 'Already registered for this competition.');
  }

  const payload = {
    studentId: regData.studentId || `std_${Date.now()}`,
    studentName: regData.studentName || 'Student',
    studentEmail: regData.studentEmail,
    paymentStatus: regData.paymentStatus || 'Paid',
    score: null,
    rank: null
  };

  const res = await apiPost(`/competitions/${encodeURIComponent(regData.competitionId)}/registrations`, payload);
  if (res && res.success) {
    await logActivity(
      'Competition Registration',
      'Student Registered for Competition',
      `${payload.studentName} registered for competition ${regData.competitionId}`
    );
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to register for competition');
};

export const updateRegistrationStatus = async (id, _regStatus, payStatus) => {
  if (!id) {
    return apiResponse(false, false, 'Registration ID is required');
  }
  const res = await apiPut(`/competitions/registrations/${encodeURIComponent(id)}`, {
    paymentStatus: payStatus || 'Paid'
  });
  if (res && res.success) {
    return apiResponse(true, true, 'Registration updated successfully');
  }
  return apiResponse(false, false, res?.message || 'Failed to update registration');
};

// COMPETITION ATTENDANCE API
export const getCompetitionAttendance = async (_competitionId, _batchName) => {
  return apiResponse([]);
};

export const saveCompetitionAttendance = async (_attendanceRecords) => {
  return apiResponse(true);
};
