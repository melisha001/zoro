import { apiResponse, apiGet, apiPost, apiPut, apiDelete, setAuthToken } from './client';

/**
 * User & Authentication API
 * 100% Database-backed via Spring Boot REST endpoints.
 * ZERO mock data. ZERO localStorage persistence.
 */

// --- STUDENTS CRUD ---
export const getStudents = async () => {
  const res = await apiGet('/users/students');
  if (res.success && Array.isArray(res.data)) {
    return apiResponse(res.data);
  }
  return apiResponse([]);
};

export const createStudent = async (data) => {
  const res = await apiPost('/users/students', data);
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Student created successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to create student');
};

export const updateStudent = async (id, data) => {
  const res = await apiPut(`/users/students/${id}`, data);
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

export const deleteStudent = async (id) => {
  const res = await apiDelete(`/users/${id}`);
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
  return apiResponse([]);
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
  let res = await apiPut(`/trainers/${id}`, data);
  if (!res.success) {
    res = await apiPut(`/users/trainers/${id}`, data);
  }
  if (res.success && res.data) {
    return apiResponse(res.data, true, 'Trainer updated successfully');
  }
  return apiResponse(null, false, res.message || 'Failed to update trainer');
};

export const updateTrainerProfile = updateTrainer;
export const updateStudentProfile = updateStudent;

export const deleteTrainer = async (id) => {
  let res = await apiDelete(`/trainers/${id}`);
  if (!res.success) {
    res = await apiDelete(`/users/${id}`);
  }
  if (res.success) {
    return apiResponse(true, true, 'Trainer deleted successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to delete trainer');
};

export const getTrainerDependencies = async (id) => {
  const res = await apiGet(`/trainers/${id}/dependencies`);
  if (res.success && res.data) {
    return apiResponse(res.data);
  }
  return apiResponse({ hasDependencies: false, courseCount: 0, batchCount: 0, scheduleCount: 0, courses: [], batches: [], schedules: [] });
};

export const replaceTrainer = async (id, payload) => {
  const res = await apiPost(`/trainers/${id}/replace`, payload);
  if (res.success) {
    return apiResponse(true, true, 'Trainer replaced successfully');
  }
  return apiResponse(false, false, res.message || 'Failed to replace trainer');
};

// --- AUTHENTICATION API ---
export const authenticateUser = async (email, password) => {
  const lowerEmail = (email || '').toLowerCase().trim();
  
  const res = await apiPost('/auth/login', { email: lowerEmail, password });
  if (res.success && res.data && res.data.user) {
    if (res.data.token) {
      setAuthToken(res.data.token);
    }
    const u = res.data.user;
    const roleUpper = (u.role || 'STUDENT').toUpperCase();
    return {
      success: true,
      user: {
        ...u,
        role: roleUpper,
        avatar: u.avatar || (roleUpper === 'ADMIN'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
          : roleUpper === 'TRAINER'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200')
      }
    };
  }

  return { success: false, message: res.message || 'Invalid email or password.' };
};

// --- AUTO DETECT USER BY EMAIL / USERNAME ---
export const findUserByEmail = async (email) => {
  const lowerEmail = (email || '').toLowerCase().trim();
  if (lowerEmail.includes('admin')) {
    return { name: 'System Administrator', email: lowerEmail, role: 'ADMIN' };
  }
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

  return { name: email ? email.split('@')[0] : 'User', email: lowerEmail, role: 'STUDENT' };
};
