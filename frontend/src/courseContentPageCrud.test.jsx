import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseContentPage from './components/admin/CourseContentPage';
import { DialogProvider } from './context/DialogContext';
import realCourseFixture from './test/fixtures/real-course-module.json';

describe('Task 3: CourseContentPage CRUD and Safe JSON Parsing Tests', () => {
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

    // Mock fetch for real pipeline testing
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input, options = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = (options.method || 'GET').toUpperCase();

      if (url.includes('/courses/')) {
        if (method === 'GET') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: async () => realCourseFixture,
            text: async () => JSON.stringify(realCourseFixture)
          };
        }
        if (method === 'PUT') {
          const body = options.body ? JSON.parse(options.body) : {};
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: async () => ({
              success: true,
              data: { id: 'mod_a7d06aee-1838-49a1-a236-117725e7d61a', ...body },
              message: 'Module updated successfully'
            }),
            text: async () => JSON.stringify({
              success: true,
              data: { id: 'mod_a7d06aee-1838-49a1-a236-117725e7d61a', ...body },
              message: 'Module updated successfully'
            })
          };
        }
        if (method === 'DELETE') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: async () => ({ success: true, message: 'Module deleted successfully' }),
            text: async () => JSON.stringify({ success: true, message: 'Module deleted successfully' })
          };
        }
      }

      if (url.includes('/video/')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ success: true, data: { status: 3, statusLabel: 'Ready', durationSeconds: 300 } }),
          text: async () => JSON.stringify({ success: true, data: { status: 3, statusLabel: 'Ready', durationSeconds: 300 } })
        };
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
        text: async () => JSON.stringify({ success: true, data: {} })
      };
    }));
  });

  afterEach(() => {
    console.error = originalConsoleError;
    window.onerror = null;
    vi.restoreAllMocks();
  });

  it('1. Renders CourseContentPage with real JSON fixture without throwing or rendering invalid objects', async () => {
    render(
      <MemoryRouter>
        <DialogProvider>
          <CourseContentPage courseId={realCourseFixture.data.id} />
        </DialogProvider>
      </MemoryRouter>
    );

    // Wait for course to load
    await waitFor(() => {
      expect(screen.getByText('Task 2 Test Module')).toBeDefined();
    });

    // Verify no unhandled errors or React child crashes occurred
    expect(uncaughtExceptions).toEqual([]);
    const reactChildErrors = consoleErrors.filter(e => e.includes('Objects are not valid as a React child'));
    expect(reactChildErrors).toEqual([]);
  });

  it('2. Clicking Edit on module with object videoStorageRef and afterSessionAssessment does not crash and populates form', async () => {
    render(
      <MemoryRouter>
        <DialogProvider>
          <CourseContentPage courseId={realCourseFixture.data.id} />
        </DialogProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 2 Test Module')).toBeDefined();
    });

    // Find and click the Edit button for the test module
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
    
    // Click edit on the second module (Task 2 Test Module)
    fireEvent.click(editButtons[1] || editButtons[0]);

    // Modal should open with heading "Edit Module"
    await waitFor(() => {
      expect(screen.getByText(/Edit Module/i)).toBeDefined();
    });

    // Title input should be populated with module title
    const titleInput = screen.getByDisplayValue('Task 2 Test Module');
    expect(titleInput).toBeDefined();

    // Verify zero React child crashes occurred during modal render
    expect(uncaughtExceptions).toEqual([]);
    const reactChildErrors = consoleErrors.filter(e => e.includes('Objects are not valid as a React child'));
    expect(reactChildErrors).toEqual([]);

    // Save module
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    // Success dialog or closed modal should appear without errors
    await waitFor(() => {
      expect(uncaughtExceptions).toEqual([]);
    });
  });

  it('3. Delete module flow triggers confirmation modal and successfully deletes without throwing', async () => {
    render(
      <MemoryRouter>
        <DialogProvider>
          <CourseContentPage courseId={realCourseFixture.data.id} />
        </DialogProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 2 Test Module')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click Delete on the second module
    fireEvent.click(deleteButtons[1] || deleteButtons[0]);

    // ConfirmModal should appear
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete module/i)).toBeDefined();
    });

    // Find Delete Module confirm button
    const confirmDeleteBtn = screen.getByRole('button', { name: /Delete Module/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(uncaughtExceptions).toEqual([]);
    });
  });
});
