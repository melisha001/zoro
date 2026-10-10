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

export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

let isRefreshing = false;
export const checkAndRefreshToken = async () => {
  const token = getAuthToken();
  if (!token || isRefreshing) return;
  const payload = parseJwt(token);
  if (!payload || !payload.exp || !payload.iat) return;
  const now = Math.floor(Date.now() / 1000);
  const total = payload.exp - payload.iat;
  const elapsed = now - payload.iat;

  // Silent renewal if > 50% lifetime has elapsed and token is still valid
  if (elapsed > total * 0.5 && now < payload.exp) {
    isRefreshing = true;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.token) {
          setAuthToken(json.data.token);
        }
      }
    } catch (e) {
      console.warn('Silent token renewal failed:', e);
    } finally {
      isRefreshing = false;
    }
  }
};

// Generic API response wrapper for backward compatibility
export const apiResponse = (data, success = true, message = 'Success') => {
  return Promise.resolve({ success, data, message });
};

// Live REST API fetch with automatic Authorization header and error recovery
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  if (!cleanEndpoint.includes('/auth/refresh') && !cleanEndpoint.includes('/auth/login')) {
    checkAndRefreshToken().catch(() => {});
  }

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
      const code = json?.code || 'UNAUTHORIZED';
      const message = json?.message || 'Session expired or unauthorized. Please log in.';

      // Clear token and user session ONLY on structured 401 codes
      const isTerminalAuthFailure = 
        code === 'TOKEN_EXPIRED' || 
        code === 'ACCOUNT_REMOVED' || 
        code === 'ACCOUNT_DISABLED';

      if (isTerminalAuthFailure) {
        clearAuthSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { code, message } }));
        }
      }

      return {
        success: false,
        status: 401,
        code,
        message,
        data: null
      };
    }

    if (!res.ok) {
      const errorPayload = {
        success: false,
        status: res.status,
        code: json?.errorCode || json?.code || `HTTP_${res.status}`,
        message: json?.message || `HTTP ${res.status}: ${res.statusText}`,
        correlationId: json?.correlationId || null,
        data: json?.data || null
      };

      const method = (options.method || 'GET').toUpperCase();
      if (method !== 'GET' && !options.skipGlobalError && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: errorPayload }));
      }

      return errorPayload;
    }
    return json;
  } catch (err) {
    const errorPayload = {
      success: false,
      status: 0,
      code: 'NETWORK_ERROR',
      message: err.message || 'Network error while contacting server.',
      data: null
    };

    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && !options.skipGlobalError && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:error', { detail: errorPayload }));
    }

    return errorPayload;
  }
};

export const apiGet = (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' });
export const apiPost = (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const apiPut = (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' });
