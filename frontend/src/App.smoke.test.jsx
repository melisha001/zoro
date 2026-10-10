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
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true, data: [] }),
        text: async () => JSON.stringify({ success: true, data: [] }),
      };
    }));

    localStorage.clear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    window.onerror = null;
    window.onunhandledrejection = null;
    vi.restoreAllMocks();
  });

  const routes = ['/', '/courses', '/competitions', '/contact'];

  routes.forEach((route) => {
    it(`renders <App /> at ${route} without console errors or uncaught exceptions`, async () => {
      window.history.pushState({}, '', route);

      let rendered;
      await act(async () => {
        rendered = render(<App />);
      });

      // Verify no uncaught exceptions occurred during render or lifecycle
      expect(uncaughtExceptions).toEqual([]);

      // Verify no console errors were logged
      expect(consoleErrors).toEqual([]);

      // Verify the container rendered something
      expect(rendered.container).toBeTruthy();

      rendered.unmount();
    });
  });
});
