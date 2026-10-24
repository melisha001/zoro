import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompetitionSyllabusPage from './components/competition/CompetitionSyllabusPage';
import CompetitionStudyMaterialsPage from './components/competition/CompetitionStudyMaterialsPage';
import * as compApi from './api/competitionApi';

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    currentCompetition: {
      id: 'comp_test_123',
      title: 'National English Olympiad 2026'
    }
  }),
  useNavigate: () => vi.fn()
}));

// Mock SafeVideo
vi.mock('./components/common/SafeVideo', () => ({
  default: ({ bunnyVideoId, title }) => (
    <div data-testid="safe-video-player" data-video-id={bunnyVideoId}>
      {title}
    </div>
  )
}));

describe('Competition Syllabus & Guidance Videos (Phase 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders syllabus details, download link, and guidance videos playlist', async () => {
    vi.spyOn(compApi, 'getCompetitionSyllabus').mockResolvedValue({
      success: true,
      data: {
        id: 'syl_1',
        title: '2026 Official English Olympiad Syllabus',
        fileName: 'Olympiad_Syllabus_2026.pdf',
        fileType: 'pdf',
        viewUrl: 'https://storage.bunnycdn.com/zoro-academy/syllabus.pdf'
      }
    });

    vi.spyOn(compApi, 'getCompetitionGuidanceVideos').mockResolvedValue({
      success: true,
      data: [
        {
          id: 'vid_1',
          title: 'Exam Instructions & Proctoring Overview',
          bunnyVideoId: 'bunny_vid_101',
          duration: 360,
          sortOrder: 1
        },
        {
          id: 'vid_2',
          title: 'Speech Recording Tips & Voice Rubrics',
          bunnyVideoId: 'bunny_vid_102',
          duration: 480,
          sortOrder: 2
        }
      ]
    });

    render(<CompetitionSyllabusPage />);

    // Check Syllabus Section
    expect(await screen.findByText('2026 Official English Olympiad Syllabus')).toBeDefined();
    expect(screen.getByText('View Syllabus')).toBeDefined();
    expect(screen.getByText(/Olympiad_Syllabus_2026\.pdf/)).toBeDefined();

    // Check Guidance Videos Section
    expect(screen.getByText('Mentor Guidance & Preparation Videos')).toBeDefined();
    expect(screen.getByText('Playlist (2)')).toBeDefined();
    expect(screen.getAllByText('Exam Instructions & Proctoring Overview').length).toBeGreaterThan(0);
    expect(screen.getByText('Speech Recording Tips & Voice Rubrics')).toBeDefined();

    // Verify first video is playing in SafeVideo
    const player = screen.getByTestId('safe-video-player');
    expect(player.getAttribute('data-video-id')).toBe('bunny_vid_101');

    // Switch video by clicking second item
    fireEvent.click(screen.getByText('Speech Recording Tips & Voice Rubrics'));
    await waitFor(() => {
      expect(screen.getByTestId('safe-video-player').getAttribute('data-video-id')).toBe('bunny_vid_102');
    });
  });

  it('renders study materials handouts list and handles empty state', async () => {
    vi.spyOn(compApi, 'getCompetitionStudyMaterials').mockResolvedValue({
      success: true,
      data: [
        {
          id: 'sm_1',
          title: 'Advanced Vocabulary & Idioms Handout',
          fileName: 'Vocabulary_Handout.pdf',
          fileType: 'pdf',
          viewUrl: 'https://storage.bunnycdn.com/zoro-academy/handout.pdf'
        },
        {
          id: 'sm_2',
          title: 'Phonetics & Intonation Guide',
          fileName: 'Phonetics_Guide.docx',
          fileType: 'docx',
          viewUrl: 'https://storage.bunnycdn.com/zoro-academy/phonetics.docx'
        }
      ]
    });

    const { unmount } = render(<CompetitionStudyMaterialsPage />);

    expect(await screen.findByText('Advanced Vocabulary & Idioms Handout')).toBeDefined();
    expect(screen.getByText('Phonetics & Intonation Guide')).toBeDefined();

    const viewLinks = screen.getAllByText('View Material');
    expect(viewLinks.length).toBe(2);

    unmount();

    // Test empty state
    vi.spyOn(compApi, 'getCompetitionStudyMaterials').mockResolvedValue({
      success: true,
      data: []
    });

    render(<CompetitionStudyMaterialsPage />);
    expect(await screen.findByText('No Study Materials Yet')).toBeDefined();
  });
});
