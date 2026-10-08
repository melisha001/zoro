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
  return apiResponse([]);
};

export const checkDuplicateRegistration = async (studentEmail, competitionId) => {
  const { data: regs } = await getCompetitionRegistrations();
  const lowerEmail = (studentEmail || '').toLowerCase().trim();
  return (regs || []).some(r => 
    r.competitionId === competitionId && 
    r.studentEmail.toLowerCase().trim() === lowerEmail &&
    r.registrationStatus !== 'Cancelled'
  );
};

export const createCompetitionRegistration = async (regData) => {
  const isDuplicate = await checkDuplicateRegistration(regData.studentEmail, regData.competitionId);
  if (isDuplicate) {
    return { success: false, message: 'Already registered for this competition.' };
  }

  const payload = {
    studentId: regData.studentId || `std_${Date.now()}`,
    studentName: regData.studentName,
    studentEmail: regData.studentEmail,
    paymentStatus: regData.paymentStatus || 'Paid',
    score: null,
    rank: null
  };

  const res = await apiPost(`/competitions/${regData.competitionId}/registrations`, payload);
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

export const updateRegistrationStatus = async (id, regStatus, payStatus) => {
  const res = await apiPut(`/competitions/registrations/${id}`, {
    paymentStatus: payStatus || 'Paid'
  });
  if (res && res.success) {
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to update registration');
};

// COMPETITION ATTENDANCE API
export const getCompetitionAttendance = async (competitionId, batchName) => {
  return apiResponse([]);
};

export const saveCompetitionAttendance = async (attendanceRecords) => {
  return apiResponse(true);
};
