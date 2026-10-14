import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSettingsPage from './components/admin/AdminSettingsPage';
import { DialogProvider } from './context/DialogContext';
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext';
import * as storageApi from './api/storageApi';

vi.mock('./api/storageApi', () => ({
  getStorageMetrics: vi.fn(),
  triggerStorageCleanup: vi.fn(),
  updateStorageSettings: vi.fn()
}));

vi.mock('./api/websiteSettingsApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getWebsiteSettings: vi.fn().mockResolvedValue({
      success: true,
      data: {
        landingPageContent: {},
        aboutPageContent: {},
        contactPageContent: {},
        generalInfo: {}
      }
    }),
    saveWebsiteSettings: vi.fn().mockResolvedValue({ success: true })
  };
});

describe('AdminSettingsPage - Storage & Cost Control (Part C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Storage & Cost Control tab and displays metrics', async () => {
    storageApi.getStorageMetrics.mockResolvedValueOnce({
      success: true,
      data: {
        totalFiles: 42,
        totalSizeBytes: 104857600, // 100 MB
        sizeByCategory: {
          document: 52428800,
          image: 31457280,
          submission: 20971520
        },
        countByCategory: {
          document: 20,
          image: 15,
          submission: 7
        },
        orphanCount: 5,
        orphanSizeBytes: 15728640,
        lastCleanupTime: '2026-10-12 18:30:00',
        lastCleanedCount: 3,
        lastReclaimedBytes: 12582912,
        submissionRetentionMonths: 6,
        dryRunDefault: false
      }
    });

    render(
      <DialogProvider>
        <WebsiteSettingsProvider>
          <AdminSettingsPage />
        </WebsiteSettingsProvider>
      </DialogProvider>
    );

    const storageTabBtn = screen.getByRole('button', { name: /Storage & Cost Control/i });
    expect(storageTabBtn).toBeDefined();
    fireEvent.click(storageTabBtn);

    expect(storageApi.getStorageMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Bunny Storage & Stream Overview')).toBeDefined();
      expect(screen.getByText('Total Stored Files')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Total Storage Used')).toBeDefined();
      expect(screen.getByText('100 MB')).toBeDefined();
      expect(screen.getByText('Orphan Files Detected')).toBeDefined();
      expect(screen.getByText('Last Cleanup Run')).toBeDefined();
      expect(screen.getByText('Student Submission Retention Policy')).toBeDefined();
    });
  });

  it('allows triggering storage cleanup preview and executing dry-run', async () => {
    storageApi.getStorageMetrics.mockResolvedValue({
      success: true,
      data: {
        totalFiles: 10,
        totalSizeBytes: 20971520,
        sizeByCategory: { document: 20971520 },
        countByCategory: { document: 10 },
        orphanCount: 2,
        orphanSizeBytes: 4194304,
        lastCleanupTime: 'Never',
        lastCleanedCount: 0,
        lastReclaimedBytes: 0,
        submissionRetentionMonths: 0,
        dryRunDefault: false
      }
    });

    storageApi.triggerStorageCleanup.mockResolvedValue({
      success: true,
      data: {
        dryRun: true,
        orphanedFilesFound: 2,
        orphanedFilesDeleted: 0,
        orphanedVideosFound: 0,
        orphanedVideosDeleted: 0,
        submissionsPurged: 0,
        bytesReclaimed: 4194304,
        message: 'Dry-run scan completed: 2 files flagged as orphans (4.00 MB), 0 videos flagged as orphans, 0 submissions purged.'
      }
    });

    render(
      <DialogProvider>
        <WebsiteSettingsProvider>
          <AdminSettingsPage />
        </WebsiteSettingsProvider>
      </DialogProvider>
    );

    const storageTabBtn = screen.getByRole('button', { name: /Storage & Cost Control/i });
    fireEvent.click(storageTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Orphan & Video Cleanup')).toBeDefined();
    });

    const initialRunBtn = screen.getByRole('button', { name: /Run Cleanup Now/i });
    expect(initialRunBtn).toBeDefined();

    const dryRunCheckbox = screen.getByRole('checkbox');
    fireEvent.click(dryRunCheckbox);

    const previewBtn = await screen.findByRole('button', { name: /Preview Cleanup Scan/i });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(storageApi.triggerStorageCleanup).toHaveBeenCalledWith(true, 24);
      expect(screen.getByText('Cleanup Executed')).toBeDefined();
    });
  });
});
