import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { createNotification } from './notificationApi';

export const getSalaryPayments = async () => {
  const res = await apiGet('/salary-records');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(s => ({
      id: s.id,
      trainerId: s.trainerId,
      trainerName: s.trainerName || 'Trainer',
      month: s.month || '',
      date: s.paymentDate || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''),
      paymentDate: s.paymentDate || '',
      amount: parseFloat(s.amount || 0),
      method: 'Bank Transfer',
      reference: s.id,
      notes: s.notes || '',
      status: s.status || 'Paid'
    }));
    return apiResponse(normalized);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch salary records');
};

export const getSalaries = getSalaryPayments;

export const createSalaryPayment = async (data) => {
  if (data?.amount === undefined || data?.amount === null) {
    return apiResponse(null, false, 'Salary amount is required');
  }
  const payload = {
    trainerId: data.trainerId || `trn-${Date.now()}`,
    trainerName: data.trainerName || 'Trainer',
    month: data.month || '',
    amount: parseFloat(data.amount || 0),
    paymentDate: data.date || data.paymentDate || new Date().toISOString().split('T')[0],
    notes: data.notes || '',
    status: data.status || 'Paid'
  };

  const res = await apiPost('/salary-records', payload);
  if (res && res.success) {
    if (payload.trainerName) {
      await createNotification({
        trainerName: payload.trainerName,
        title: 'Salary Payment Recorded',
        desc: `Salary payment of ₹${Number(payload.amount).toLocaleString()} for ${payload.month || 'current month'} has been recorded.`,
        type: 'system'
      });
    }
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to record salary');
};

export const updateSalaryPayment = async (id, data) => {
  if (!id) {
    return apiResponse(null, false, 'Salary record ID is required');
  }
  const payload = {
    month: data?.month,
    amount: parseFloat(data?.amount || 0),
    paymentDate: data?.date || data?.paymentDate,
    notes: data?.notes,
    status: data?.status
  };

  const res = await apiPut(`/salary-records/${encodeURIComponent(id)}`, payload);
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update salary');
};

export const deleteSalaryPayment = async (id) => {
  if (!id) {
    return apiResponse(false, false, 'Salary record ID is required');
  }
  const res = await apiDelete(`/salary-records/${encodeURIComponent(id)}`);
  if (res && res.success) {
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete salary');
};

export const getSalaryStats = async () => {
  const salRes = await getSalaryPayments();
  if (!salRes.success) {
    return apiResponse({
      totalPaid: 0,
      currentMonthPaid: 0,
      uniqueTrainersPaid: 0,
      totalRecords: 0
    }, false, salRes?.message || 'Failed to fetch salary stats');
  }
  const list = salRes.data || [];
  const totalPaid = list.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthPaid = list
    .filter(s => s.month?.toLowerCase() === currentMonthStr.toLowerCase())
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const uniqueTrainersPaid = new Set(list.map(s => s.trainerName)).size;

  return apiResponse({
    totalPaid,
    currentMonthPaid,
    uniqueTrainersPaid,
    totalRecords: list.length
  });
};
