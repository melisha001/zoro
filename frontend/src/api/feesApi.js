import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

/**
 * Student Fees API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const getFeeRecords = async () => {
  const res = await apiGet('/fees');
  if (res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(f => ({
      ...f,
      student: f.studentName || f.student || 'Unknown Student',
      studentName: f.studentName || f.student || 'Unknown Student',
      totalFee: parseFloat(f.totalFee || 0),
      paidAmount: parseFloat(f.paidAmount || 0),
      dueAmount: parseFloat(f.dueAmount || 0),
      status: f.status || 'Pending'
    }));
    return apiResponse(normalized);
  }
  return apiResponse([]);
};

export const getFeeById = async (id) => {
  const res = await apiGet(`/fees/${id}`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res.message || 'Fee record not found');
};

export const createFeeRecord = async (newFeeData) => {
  const student = newFeeData.student || newFeeData.studentName || 'Student';
  const payload = {
    studentId: newFeeData.studentId || newFeeData.id || `std_${student.toLowerCase().replace(/\s+/g, '')}`,
    studentName: student,
    course: newFeeData.course || newFeeData.courseName || '',
    batch: newFeeData.batch || newFeeData.batchName || 'Unassigned',
    totalFee: parseFloat(newFeeData.totalFee || 0),
    paidAmount: parseFloat(newFeeData.paidAmount || 0),
    dueAmount: parseFloat(newFeeData.dueAmount || 0),
    status: (parseFloat(newFeeData.dueAmount || 0)) === 0 ? 'Paid' : 'Pending',
    date: newFeeData.date || new Date().toISOString().split('T')[0]
  };

  const res = await apiPost('/fees', payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Fee record created');
  }
  return apiResponse(null, false, res.message || 'Failed to create fee record');
};

export const updateFeeRecord = async (id, updatedFeeData) => {
  const res = await apiPut(`/fees/${id}`, updatedFeeData);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Fee record updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update fee record');
};

export const recordStudentPayment = async (id, amount, method = 'Online', ref = '', notes = '') => {
  const payload = {
    amount: parseFloat(amount),
    paymentMethod: method,
    transactionRef: ref || `TXN-${Date.now()}`,
    notes: notes || 'Student payment'
  };

  const res = await apiPost(`/fees/${id}/payments`, payload);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Payment recorded successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to record payment');
};

export const deleteFeeRecord = async (id) => {
  const res = await apiDelete(`/fees/${id}`);
  if (res.success) {
    return apiResponse(true, true, 'Fee record deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete fee record');
};

export const deleteFeePayment = async (paymentId) => {
  const res = await apiDelete(`/fees/payments/${paymentId}`);
  if (res.success) {
    return apiResponse(true, true, 'Payment deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete payment');
};

export const getFeeStats = async () => {
  const res = await apiGet('/fees/stats');
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse({
    totalCollections: 0,
    pendingDues: 0,
    paidCount: 0,
    totalRecords: 0
  });
};
