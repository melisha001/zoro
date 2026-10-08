// Centralized API Client with LocalStorage Persistence & REST backend integration
const STORAGE_PREFIX = 'zoro_english_academy_';
export const API_BASE_URL = typeof window !== 'undefined' && window.__VITE_API_BASE_URL__ 
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
    return getItem('authToken') || localStorage.getItem('zoro_token') || null;
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  setItem('authToken', token);
  try {
    if (token) {
      localStorage.setItem('zoro_token', token);
    } else {
      localStorage.removeItem('zoro_token');
    }
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

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: json?.message || `HTTP ${res.status}: ${res.statusText}`,
        data: json?.data || null,
        fallback: true
      };
    }
    return json;
  } catch (err) {
    console.warn(`[REST API] Call to ${endpoint} failed (${err.message}). Using local store fallback.`);
    return {
      success: false,
      message: err.message,
      data: null,
      fallback: true
    };
  }
};

export const apiGet = (endpoint) => apiFetch(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (endpoint) => apiFetch(endpoint, { method: 'DELETE' });
