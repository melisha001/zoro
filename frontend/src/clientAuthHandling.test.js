import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  apiFetch,
  setAuthTokens,
  getAuthToken,
  getRefreshToken,
  clearAuthSession
} from './api/client';

describe('client.js 401 and Auth Handling Tests', () => {
  let unauthorizedEvents = [];
  let onUnauthorized;

  beforeEach(() => {
    unauthorizedEvents = [];
    clearAuthSession();
    sessionStorage.clear();
    localStorage.clear();

    onUnauthorized = (e) => {
      unauthorizedEvents.push(e.detail);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
  });

  afterEach(() => {
    window.removeEventListener('auth:unauthorized', onUnauthorized);
    vi.restoreAllMocks();
  });

  it('1. Public/unauthenticated request returning 401 AUTH_REQUIRED never clears session or fires auth:unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => JSON.stringify({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Please log in'
      })
    }));

    const result = await apiFetch('/me/courses');
    expect(result.success).toBe(false);
    expect(result.code).toBe('AUTH_REQUIRED');
    expect(unauthorizedEvents.length).toBe(0);
  });

  it('2. Request with token returning 401 TOKEN_EXPIRED retries with refreshed token when refresh succeeds', async () => {
    setAuthTokens('initial_access_token', 'initial_refresh_token');

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url?.url || '';
      callCount++;

      if (urlStr.includes('/auth/refresh')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          text: async () => JSON.stringify({
            success: true,
            data: { accessToken: 'new_refreshed_access_token' }
          })
        };
      }

      if (callCount === 1) {
        // Initial request fails with TOKEN_EXPIRED
        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          text: async () => JSON.stringify({
            success: false,
            code: 'TOKEN_EXPIRED',
            message: 'Token expired or invalid'
          })
        };
      }

      // Retry request with new token succeeds
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => JSON.stringify({
          success: true,
          data: [{ id: 'crs_1', title: 'English Mastery' }]
        })
      };
    }));

    const result = await apiFetch('/me/courses');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([{ id: 'crs_1', title: 'English Mastery' }]);
    expect(unauthorizedEvents.length).toBe(0);
    expect(getAuthToken()).toBe('new_refreshed_access_token');
  });

  it('3. Request with token returning 401 TOKEN_EXPIRED clears session and fires auth:unauthorized when refresh fails', async () => {
    setAuthTokens('expired_access_token', 'invalid_refresh_token');

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url?.url || '';
      if (urlStr.includes('/auth/refresh')) {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          text: async () => JSON.stringify({
            success: false,
            code: 'TOKEN_INVALID',
            message: 'Invalid refresh token'
          })
        };
      }

      return {
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => JSON.stringify({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Token expired or invalid'
        })
      };
    }));

    const result = await apiFetch('/me/courses');
    expect(result.success).toBe(false);
    expect(unauthorizedEvents.length).toBe(1);
    expect(unauthorizedEvents[0].code).toBe('TOKEN_EXPIRED');
    expect(getAuthToken()).toBeNull();
  });

  it('4. 403 FORBIDDEN never clears session or fires auth:unauthorized', async () => {
    setAuthTokens('valid_student_token', 'valid_refresh_token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => JSON.stringify({
        success: false,
        code: 'FORBIDDEN',
        message: 'Access denied: insufficient permissions'
      })
    }));

    const result = await apiFetch('/trainers');
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(unauthorizedEvents.length).toBe(0);
    expect(getAuthToken()).toBe('valid_student_token');
  });

  it('5. Auth endpoints (/auth/login, /auth/refresh) never send Authorization header', async () => {
    setAuthTokens('existing_token', 'existing_refresh');

    let capturedHeaders = {};
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url, init) => {
      capturedHeaders = init?.headers || {};
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => JSON.stringify({ success: true, data: {} })
      };
    }));

    await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@zoro.com', password: 'pass' }) });
    expect(capturedHeaders['Authorization']).toBeUndefined();
    expect(capturedHeaders['authorization']).toBeUndefined();

    await apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: 'existing_refresh' }) });
    expect(capturedHeaders['Authorization']).toBeUndefined();
    expect(capturedHeaders['authorization']).toBeUndefined();
  });
});
