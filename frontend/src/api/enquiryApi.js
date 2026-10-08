import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

export const getEnquiries = async () => {
  const res = await apiGet('/enquiries');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(e => ({
      id: e.id,
      name: e.name || '',
      phone: e.phone || '',
      email: e.email || '',
      course: e.courseInterest || e.course || '',
      courseInterest: e.courseInterest || e.course || '',
      message: e.message || '',
      status: e.status || 'New',
      submittedAt: e.createdAt ? new Date(e.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : (e.submittedAt || '')
    }));
    return apiResponse(normalized);
  }
  return apiResponse([]);
};

export const createEnquiry = async (enquiryData) => {
  const payload = {
    name: enquiryData.name,
    email: enquiryData.email,
    phone: enquiryData.phone,
    courseInterest: enquiryData.course || enquiryData.courseInterest,
    message: enquiryData.message,
    status: 'New'
  };
  const res = await apiPost('/enquiries', payload);
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to submit enquiry');
};

export const updateEnquiryStatus = async (id, status) => {
  const res = await apiPut(`/enquiries/${id}/status`, { status });
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update enquiry status');
};

export const deleteEnquiry = async (id) => {
  const res = await apiDelete(`/enquiries/${id}`);
  if (res && res.success) {
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete enquiry');
};
