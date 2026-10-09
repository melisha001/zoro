import { apiGet, apiPost, apiPut, apiResponse } from './client';
import { logActivity } from './activityLogApi';

export const getCompetitionRegistrations = async () => {
  const res = await apiGet('/competitions/registrations');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(r => ({
      id: r.id,
      competitionId: r.competition?.id || r.competitionId,
      competitionName: r.competition?.title || r.competitionName || 'Competition',
      studentId: r.studentId || null,
      studentName: r.studentName || 'Participant',
      studentEmail: r.studentEmail || '',
      studentPhone: r.studentPhone || '',
      age: r.age || null,
      school: r.school || '',
      city: r.city || '',
      registrationDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      registrationFee: r.competition?.registrationFee || 0,
      paymentStatus: r.paymentStatus || 'Pending',
      registrationStatus: 'Registered',
      score: r.score,
      rank: r.rank,
      certificateUrl: r.certificateUrl
    }));
    return apiResponse(normalized);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch competition registrations');
};

export const checkDuplicateRegistration = async (studentEmail, competitionId, studentPhone, studentId) => {
  if (!competitionId) return false;
  const res = await getCompetitionRegistrations();
  if (!res.success) return false;
  const regs = res.data;
  const lowerEmail = (studentEmail || '').toLowerCase().trim();
  const cleanPhone = (studentPhone || '').trim();

  return (regs || []).some(r => {
    if (r.competitionId !== competitionId || r.registrationStatus === 'Cancelled') {
      return false;
    }
    if (studentId && r.studentId === studentId) return true;
    if (cleanPhone && r.studentPhone === cleanPhone) return true;
    if (lowerEmail && r.studentEmail.toLowerCase().trim() === lowerEmail) return true;
    return false;
  });
};

export const createCompetitionRegistration = async (regData) => {
  if (!regData?.competitionId) {
    return apiResponse(null, false, 'Competition ID is required');
  }

  const isDuplicate = await checkDuplicateRegistration(
    regData.studentEmail,
    regData.competitionId,
    regData.studentPhone,
    regData.studentId
  );
  if (isDuplicate) {
    return apiResponse(null, false, 'Already registered for this competition.');
  }

  const payload = {
    studentId: regData.studentId || null,
    studentName: regData.studentName || 'Participant',
    studentEmail: regData.studentEmail,
    studentPhone: regData.studentPhone,
    age: regData.age ? Number(regData.age) : null,
    school: regData.school || null,
    city: regData.city || null,
    paymentStatus: regData.paymentStatus || 'Pending',
    score: null,
    rank: null
  };

  const res = await apiPost(`/competitions/${encodeURIComponent(regData.competitionId)}/registrations`, payload);
  if (res && res.success) {
    await logActivity(
      'Competition Registration',
      'Participant Registered for Competition',
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
