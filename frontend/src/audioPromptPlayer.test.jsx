import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudioPromptPlayer from './components/common/AudioPromptPlayer';
import * as fileApi from './api/fileApi';

describe('AudioPromptPlayer Component (Task K5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading initially and fetches signed link for UUID', async () => {
    const fileId = '11111111-2222-3333-4444-555555555555';
    const mockGetFileLink = vi.spyOn(fileApi, 'getFileLink').mockResolvedValue({
      url: `/api/files/${fileId}?token=mockToken&expires=123456789`,
      name: 'believer.mp3',
      contentType: 'audio/mpeg'
    });

    render(<AudioPromptPlayer fileId={fileId} title="Believer Track" />);

    expect(screen.getByText('Believer Track')).toBeDefined();
    await waitFor(() => {
      expect(mockGetFileLink).toHaveBeenCalledWith(fileId);
    });
  });

  it('shows error with Retry button on network/fetch failure, and retries on click', async () => {
    const fileId = '11111111-2222-3333-4444-555555555555';
    let callCount = 0;
    vi.spyOn(fileApi, 'getFileLink').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Network error or token expired');
      }
      return {
        url: `/api/files/${fileId}?token=freshToken&expires=999999999`,
        name: 'believer.mp3',
        contentType: 'audio/mpeg'
      };
    });

    render(<AudioPromptPlayer fileId={fileId} title="Believer Track" />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeDefined();
      expect(screen.getByText(/Network error or token expired/)).toBeDefined();
    });

    // Click Retry
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(callCount).toBe(2);
    });
  });
});
