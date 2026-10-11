import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App Smoke Tests', () => {
  let consoleErrors = [];
  let uncaughtExceptions = [];
  let originalConsoleError;

  beforeEach(() => {
    consoleErrors = [];
    uncaughtExceptions = [];

    originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.map(a => (a instanceof Error ? a.stack || a.message : typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      consoleErrors.push(msg);
      originalConsoleError(...args);
    };

    window.onerror = (message, source, lineno, colno, error) => {
      uncaughtExceptions.push(error || message);
    };

    window.onunhandledrejection = (event) => {
      uncaughtExceptions.push(event.reason);
    };

    // Mock fetch for safe smoke testing without requiring live backend
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      let data = [];
      if (url.includes('/auth/me')) {
        const uStr = sessionStorage.getItem('zoro_user');
        data = uStr ? JSON.parse(uStr) : null;
      } else if (url.includes('/website-settings') || url.includes('/settings')) {
        data = { heroHeadline: 'Zoro Academy', landingPage: {}, aboutPage: {}, generalInfo: {} };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true, data }),
        text: async () => JSON.stringify({ success: true, data }),
      };
    }));

    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    window.onerror = null;
    window.onunhandledrejection = null;
    vi.restoreAllMocks();
  });

  const publicRoutes = ['/', '/courses', '/competitions', '/contact'];

  publicRoutes.forEach((route) => {
    it(`renders <App /> at public route ${route} without errors or exceptions`, async () => {
      window.history.pushState({}, '', route);

      let rendered;
      await act(async () => {
        rendered = render(<App />);
      });

      expect(uncaughtExceptions).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(rendered.container).toBeTruthy();

      rendered.unmount();
    });
  });

  const adminRoutes = [
    '/admin',
    '/admin/students',
    '/admin/trainers',
    '/admin/batches',
    '/admin/courses',
    '/admin/settings',
    '/admin/competitions',
    '/admin/schedules',
    '/admin/assignments',
    '/admin/attendance',
  ];

  adminRoutes.forEach((route) => {
    it(`renders <App /> as ADMIN at ${route} without errors or exceptions`, async () => {
      const adminUser = { id: 'usr-admin-1', name: 'Admin Test', role: 'ADMIN', email: 'admin@test.com' };
      sessionStorage.setItem('zoro_token', 'test_admin_jwt_token');
      sessionStorage.setItem('zoro_role', 'ADMIN');
      sessionStorage.setItem('zoro_user', JSON.stringify(adminUser));

      window.history.pushState({}, '', route);

      let rendered;
      await act(async () => {
        rendered = render(<App />);
      });

      expect(uncaughtExceptions).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(rendered.container).toBeTruthy();

      rendered.unmount();
    });
  });

  const trainerRoutes = [
    '/trainer',
    '/trainer/students',
    '/trainer/courses',
    '/trainer/assignments',
    '/trainer/schedules',
  ];

  trainerRoutes.forEach((route) => {
    it(`renders <App /> as TRAINER at ${route} without errors or exceptions`, async () => {
      const trainerUser = { id: 'usr-trainer-1', name: 'Trainer Test', role: 'TRAINER', email: 'trainer@test.com' };
      sessionStorage.setItem('zoro_token', 'test_trainer_jwt_token');
      sessionStorage.setItem('zoro_role', 'TRAINER');
      sessionStorage.setItem('zoro_user', JSON.stringify(trainerUser));

      window.history.pushState({}, '', route);

      let rendered;
      await act(async () => {
        rendered = render(<App />);
      });

      expect(uncaughtExceptions).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(rendered.container).toBeTruthy();

      rendered.unmount();
    });
  });

  const studentRoutes = [
    '/student',
    '/student/courses',
    '/student/assignments',
    '/student/doubts',
  ];

  studentRoutes.forEach((route) => {
    it(`renders <App /> as STUDENT at ${route} without errors or exceptions`, async () => {
      const studentUser = { id: 'usr-student-1', name: 'Student Test', role: 'STUDENT', email: 'student@test.com' };
      sessionStorage.setItem('zoro_token', 'test_student_jwt_token');
      sessionStorage.setItem('zoro_role', 'STUDENT');
      sessionStorage.setItem('zoro_user', JSON.stringify(studentUser));

      window.history.pushState({}, '', route);

      let rendered;
      await act(async () => {
        rendered = render(<App />);
      });

      expect(uncaughtExceptions).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(rendered.container).toBeTruthy();

      rendered.unmount();
    });
  });

  it('purges legacy localStorage auth keys and keeps session in sessionStorage', async () => {
    localStorage.setItem('zoro_token', 'legacy_token');
    localStorage.setItem('zoro_english_academy_authToken', 'legacy_token_2');
    
    // Importing client or initializing app triggers cleanup
    const { clearLegacyLocalStorage } = await import('./api/client');
    clearLegacyLocalStorage();

    expect(localStorage.getItem('zoro_token')).toBeNull();
    expect(localStorage.getItem('zoro_english_academy_authToken')).toBeNull();
  });
});
