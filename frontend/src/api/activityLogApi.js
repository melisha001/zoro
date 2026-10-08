import { apiGet, apiPost, apiResponse } from './client';

export const getActivityLogs = async (fromDate, toDate) => {
  const res = await apiGet('/activity-logs');
  if (!res || !res.success) {
    return {
      success: false,
      message: res?.message || 'Failed to fetch activity logs',
      data: null
    };
  }

  let logs = (res.data || []).map(l => ({
    id: l.id,
    date: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '',
    time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    category: l.action || 'General',
    action: l.action || 'Action',
    details: l.details || '',
    userName: l.userName || 'Admin'
  }));

  if (fromDate && toDate) {
    logs = logs.filter(l => l.date >= fromDate && l.date <= toDate);
  } else if (fromDate) {
    logs = logs.filter(l => l.date >= fromDate);
  }

  logs.sort((a, b) => b.date.localeCompare(a.date));
  return apiResponse(logs);
};

export const logActivity = async (category, action, details) => {
  const userStr = localStorage.getItem('zoro_user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) {}
  }

  const payload = {
    userId: user?.id || 'admin',
    userName: user?.name || user?.email || 'Administrator',
    action: category ? `${category}: ${action}` : action,
    details: details || ''
  };

  const res = await apiPost('/activity-logs', payload);
  if (res && res.success) {
    return apiResponse(res.data);
  }
  return {
    success: false,
    message: res?.message || 'Failed to log activity',
    data: null
  };
};
