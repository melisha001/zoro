import { apiResponse, apiGet, apiPost, apiPut, apiPatch, apiDelete, setAuthToken, setAuthTokens, getRefreshToken, clearAuthSession } from './client';

/**
 * User & Authentication API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

export const updateUserStatus = async (id, status) => {
  if (!id) {
    return apiResponse(null, false, 'User ID is required');
  }
  const res = await apiPatch(`/users/${encodeURIComponent(id)}/status`, { status });
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'User status updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update user status');
};

// --- STUDENTS CRUD ---
export const getStudents = async () => {
  let res = await apiGet('/users/students');
  if (!res.success && (res.status === 403 || res.status === 401 || res.message?.toLowerCase().includes('access denied'))) {
    res = await apiGet('/me/students');
  }
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res.message || 'Failed to fetch students');
};

export const getTrainerStudents = async () => {
  const res = await apiGet('/me/students');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res.message || 'Failed to fetch trainer students');
};

export const createStudent = async (data) => {
  const res = await apiPost('/users/students', data);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Student created successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to create student');
};

export const updateStudent = async (id, data) => {
  if (!id) {
    return apiResponse(null, false, 'Student ID is required');
  }
  const res = await apiPut(`/users/students/${encodeURIComponent(id)}`, data);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Student updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update student');
};

export const updateStudentPassword = async (studentIdOrEmail, currentPassword, newPassword) => {
  const res = await apiPost('/users/password', {
    id: studentIdOrEmail,
    currentPassword,
    newPassword
  });
  if (res.success) {
    return { success: true, message: 'Password changed successfully.' };
  }
  return { success: false, message: res.message || 'Failed to change password.' };
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await apiPost('/users/password', {
    currentPassword,
    newPassword
  });
  if (res.success) {
    return { success: true, message: res.message || 'Password changed successfully.' };
  }
  return { success: false, message: res.message || 'Failed to change password.' };
};

export const getAdminVisiblePassword = async (id) => {
  if (!id) {
    return apiResponse(null, false, 'User ID is required');
  }
  const res = await apiGet(`/users/${encodeURIComponent(id)}/admin-password`);
  if (res.success && res.data) {
    return apiResponse(res.data.password, true, 'Password retrieved successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to retrieve password');
};

export const setAdminUserPassword = async (id, newPassword) => {
  if (!id) {
    return apiResponse(null, false, 'User ID is required');
  }
  const res = await apiPut(`/users/${encodeURIComponent(id)}/admin-password`, { newPassword });
  if (res.success) {
    return apiResponse(true, true, res.message || 'Password updated successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to update password');
};

export const resetUserPassword = async (id) => {
  return setAdminUserPassword(id, 'Pass1234!');
};

export const deleteStudent = async (id, force = false) => {
  if (!id) {
    return apiResponse(false, false, 'Student ID is required');
  }
  const endpoint = `/users/${encodeURIComponent(id)}${force ? '?force=true' : ''}`;
  const res = await apiDelete(endpoint);
  if (res.success) {
    return apiResponse(true, true, 'Student deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete student');
};

// --- TRAINERS CRUD ---
export const getTrainers = async () => {
  let res = await apiGet('/trainers');
  if (!res.success) {
    res = await apiGet('/users/trainers');
  }
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([], false, res.message || 'Failed to fetch trainers');
};

export const createTrainer = async (data) => {
  let res = await apiPost('/trainers', data);
  if (!res.success) {
    res = await apiPost('/users/trainers', data);
  }
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Trainer created successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to create trainer');
};

export const updateTrainer = async (id, data) => {
  if (!id) {
    return apiResponse(null, false, 'Trainer ID is required');
  }
  let res = await apiPut(`/trainers/${encodeURIComponent(id)}`, data);
  if (!res.success) {
    res = await apiPut(`/users/trainers/${encodeURIComponent(id)}`, data);
  }
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Trainer updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update trainer');
};

export const getMyProfile = async () => {
  const res = await apiGet('/me/profile');
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to fetch profile');
};

export const updateMyProfile = async (data) => {
  const res = await apiPut('/me/profile', data);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Profile updated successfully');
  }
  return apiResponse(null, false, res?.message || 'Failed to update profile');
};

export const updateTrainerProfile = async (idOrData, maybeData) => {
  const payload = maybeData !== undefined ? maybeData : idOrData;
  return updateMyProfile(payload);
};

export const updateStudentProfile = async (idOrData, maybeData) => {
  const payload = maybeData !== undefined ? maybeData : idOrData;
  return updateMyProfile(payload);
};

export const deleteTrainer = async (id, replacementTrainerId = null, force = false) => {
  if (!id) {
    return apiResponse(false, false, 'Trainer ID is required');
  }
  const params = [];
  if (replacementTrainerId) params.push(`replacementTrainerId=${encodeURIComponent(replacementTrainerId)}`);
  if (force) params.push('force=true');
  const query = params.length > 0 ? `?${params.join('&')}` : '';

  let res = await apiDelete(`/trainers/${encodeURIComponent(id)}${query}`);
  if (!res.success && !replacementTrainerId) {
    res = await apiDelete(`/users/${encodeURIComponent(id)}${query}`);
  }
  if (res.success) {
    return apiResponse(true, true, 'Trainer deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete trainer');
};

export const getTrainerDependencies = async (id) => {
  if (!id) {
    return apiResponse(null, false, 'Trainer ID is required');
  }
  const res = await apiGet(`/trainers/${encodeURIComponent(id)}/dependencies`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse({ hasDependencies: false, courseCount: 0, batchCount: 0, scheduleCount: 0, courses: [], batches: [], schedules: [] }, false, res.message || 'Failed to fetch dependencies');
};

export const getTrainerDeletionImpact = async (id) => {
  if (!id) {
    return apiResponse(null, false, 'Trainer ID is required');
  }
  const res = await apiGet(`/users/trainers/${encodeURIComponent(id)}/deletion-impact`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse({ canDelete: false, blockingReasons: [res?.message || 'Failed to check deletion impact'] }, false, res?.message);
};

export const replaceTrainer = async (id, payload) => {
  if (!id) {
    return apiResponse(false, false, 'Trainer ID is required');
  }
  const res = await apiPost(`/trainers/${encodeURIComponent(id)}/replace`, payload);
  if (res.success) {
    return apiResponse(true, true, 'Trainer replaced successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to replace trainer');
};

// --- AUTHENTICATION API ---
export const authenticateUser = async (email, password) => {
  const lowerEmail = (email || '').toLowerCase().trim();
  clearAuthSession();

  const res = await apiPost('/auth/login', { email: lowerEmail, password });
  if (res.success && res.data && res.data.user) {
    clearAuthSession();
    const accessToken = res.data.accessToken || res.data.token;
    const refreshToken = res.data.refreshToken;
    if (accessToken) {
      setAuthTokens(accessToken, refreshToken);
    }
    const u = res.data.user;
    const roleUpper = (u.role || 'STUDENT').toUpperCase();
    return {
      success: true,
      user: {
        ...u,
        role: roleUpper,
        avatar: u.avatar || null
      }
    };
  }

  return { success: false, message: res.message || 'Invalid email or password.' };
};

export const logoutUser = async () => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken });
    }
  } catch (e) {
    // Ignore error on network or offline logout
  }
  clearAuthSession();
};

export const refreshTokenApi = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await apiPost('/auth/refresh', { refreshToken });
  if (res.success && res.data) {
    const accessToken = res.data.accessToken || res.data.token;
    const newRefreshToken = res.data.refreshToken;
    if (accessToken) {
      setAuthTokens(accessToken, newRefreshToken || refreshToken);
      return res.data;
    }
  }
  return null;
};

// --- AUTO DETECT USER BY EMAIL / USERNAME ---
export const findUserByEmail = async (email) => {
  const lowerEmail = (email || '').toLowerCase().trim();
  if (!lowerEmail) return null;

  const { data: students } = await getStudents();
  const foundStudent = (students || []).find(s => 
    (s.email && s.email.toLowerCase() === lowerEmail) || (s.username && s.username.toLowerCase() === lowerEmail)
  );
  if (foundStudent) {
    return { ...foundStudent, role: 'STUDENT' };
  }
  const { data: trainers } = await getTrainers();
  const foundTrainer = (trainers || []).find(t => t.email && t.email.toLowerCase() === lowerEmail);
  if (foundTrainer) {
    return { ...foundTrainer, role: 'TRAINER' };
  }

  return null;
};

export const checkEmailExists = async (email) => {
  if (!email || !email.trim()) return false;
  try {
    const res = await apiGet(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
    return Boolean(res?.data?.exists);
  } catch (err) {
    return false;
  }
};
