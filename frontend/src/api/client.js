// Centralized API Client with LocalStorage Persistence & REST backend integration
const STORAGE_PREFIX = 'zoro_english_academy_';
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL !== undefined)
  ? import.meta.env.VITE_API_BASE_URL
  : (typeof window !== 'undefined' && window.__VITE_API_BASE_URL__)
    ? window.__VITE_API_BASE_URL__
    : 'http://localhost:8080/api';

export const getItem = (key, defaultVal = null) => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultVal;
  }
};

export const setItem = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage', e);
  }
};

export const getAuthToken = () => {
  try {
    return getItem('authToken') || localStorage.getItem('zoro_token') || localStorage.getItem('authToken') || null;
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    setItem('authToken', token);
    try {
      localStorage.setItem('zoro_token', token);
      localStorage.setItem('authToken', token);
    } catch (e) {}
  } else {
    try {
      localStorage.removeItem(STORAGE_PREFIX + 'authToken');
      localStorage.removeItem('zoro_token');
      localStorage.removeItem('authToken');
    } catch (e) {}
  }
};

export const clearAuthSession = () => {
  setAuthToken(null);
  try {
    localStorage.removeItem(STORAGE_PREFIX + 'user');
    localStorage.removeItem(STORAGE_PREFIX + 'role');
    localStorage.removeItem(STORAGE_PREFIX + 'authToken');
    localStorage.removeItem('zoro_token');
    localStorage.removeItem('authToken');
  } catch (e) {}
};

// Generic API response wrapper for backward compatibility
export const apiResponse = (data, success = true, message = 'Success') => {
  return Promise.resolve({ success, data, message });
};

// Live REST API fetch with automatic Authorization header and error recovery
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    let json;
    try {
      json = await res.json();
    } catch (e) {
      json = null;
    }

    if (res.status === 401) {
      // Clear token and user session on 401 Unauthorized
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      return {
        success: false,
        status: 401,
        message: json?.message || 'Session expired or unauthorized. Please log in.',
        data: null
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: json?.message || `HTTP ${res.status}: ${res.statusText}`,
        data: json?.data || null
      };
    }
    return json;
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Network error while contacting server.',
      data: null
    };
  }
};

export const apiGet = (endpoint) => apiFetch(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = (endpoint, body) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (endpoint) => apiFetch(endpoint, { method: 'DELETE' });
