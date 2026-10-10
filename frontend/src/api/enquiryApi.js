import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';

export const getEnquiries = async () => {
  const res = await apiGet('/enquiries');
  if (res && res.success && Array.isArray(res.data)) {
    const normalized = res.data.map(e => ({
      id: e.id,
      name: e.name || '',
      phone: e.phone || '',
      email: e.email || '',
      courseId: e.courseId || null,
      course: e.courseInterest || e.course || '',
      courseInterest: e.courseInterest || e.course || '',
      message: e.message || '',
      status: e.status || 'New',
      submittedAt: e.createdAt ? new Date(e.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : (e.submittedAt || '')
    }));
    return apiResponse(normalized);
  }
  return apiResponse([], false, res?.message || 'Failed to fetch enquiries');
};

export const createEnquiry = async (enquiryData) => {
  if (!enquiryData?.name) {
    return apiResponse(null, false, 'Name is required');
  }
  const payload = {
    name: enquiryData.name,
    email: enquiryData.email || '',
    phone: enquiryData.phone || '',
    courseId: enquiryData.courseId || null,
    courseInterest: enquiryData.courseInterest || enquiryData.course || '',
    message: enquiryData.message || '',
    status: 'New'
  };
  const res = await apiPost('/enquiries', payload);
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to submit enquiry');
};

export const updateEnquiryStatus = async (id, status) => {
  if (!id) {
    return apiResponse(null, false, 'Enquiry ID is required');
  }
  const res = await apiPut(`/enquiries/${encodeURIComponent(id)}/status`, { status });
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update enquiry status');
};

export const deleteEnquiry = async (id) => {
  if (!id) {
    return apiResponse(false, false, 'Enquiry ID is required');
  }
  const res = await apiDelete(`/enquiries/${encodeURIComponent(id)}`);
  if (res && res.success) {
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete enquiry');
};
