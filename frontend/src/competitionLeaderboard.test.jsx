import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompetitionLeaderboardPage from './components/competition/CompetitionLeaderboardPage';
import * as competitionApi from './api/competitionApi';
import * as AuthContext from './context/AuthContext';

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    currentCompetition: {
      id: 'comp_test_123',
      title: 'National English Olympiad 2026'
    }
  }),
  useNavigate: () => vi.fn()
}));

const mockLeaderboardData = {
  competitionId: 'comp_test_123',
  competitionTitle: 'National English Olympiad 2026',
  status: 'PUBLISHED',
  isPublished: true,
  publishedAt: '2026-10-25T18:00:00Z',
  answerReviewEnabled: false,
  totalParticipants: 3,
  myRank: {
    registrationId: 'reg_2',
    studentName: 'Bob Runnerup',
    setCode: 'A',
    rank: 2,
    setRank: 2,
    totalMarks: 88.0,
    percentile: 50.0
  },
  podium: [
    { id: '1', rank: 1, registrationId: 'reg_1', studentName: 'Alice Champion', setCode: 'A', totalMarks: 95.5, percentile: 100.0 },
    { id: '2', rank: 2, registrationId: 'reg_2', studentName: 'Bob Runnerup', setCode: 'A', totalMarks: 88.0, percentile: 50.0 },
    { id: '3', rank: 3, registrationId: 'reg_3', studentName: 'Charlie Third', setCode: 'B', totalMarks: 72.0, percentile: 0.0 }
  ],
  entries: [
    { id: '1', rank: 1, registrationId: 'reg_1', studentName: 'Alice Champion', setCode: 'A', setRank: 1, totalMarks: 95.5, percentile: 100.0 },
    { id: '2', rank: 2, registrationId: 'reg_2', studentName: 'Bob Runnerup', setCode: 'A', setRank: 2, totalMarks: 88.0, percentile: 50.0 },
    { id: '3', rank: 3, registrationId: 'reg_3', studentName: 'Charlie Third', setCode: 'B', setRank: 1, totalMarks: 72.0, percentile: 0.0 }
  ],
  setStats: {
    A: { count: 2, topScore: 95.5 },
    B: { count: 1, topScore: 72.0 },
    C: { count: 0, topScore: 0 },
    D: { count: 0, topScore: 0 }
  }
};

describe('CompetitionLeaderboardPage (Phase 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders published leaderboard with podium, personal card, and set filtering', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'usr_student', role: 'STUDENT', email: 'bob@example.com' }
    });

    vi.spyOn(competitionApi, 'getCompetitionLeaderboard').mockResolvedValue({
      success: true,
      data: mockLeaderboardData
    });

    render(<CompetitionLeaderboardPage />);

    // Check title and official live badge
    expect(await screen.findByText(/National English Olympiad 2026 Merit List/i)).toBeTruthy();
    expect(screen.getByText(/Official Standings Live/i)).toBeTruthy();

    // Check personal standing card
    expect(screen.getByText(/Your Official Performance Card/i)).toBeTruthy();
    expect(screen.getAllByText('#2').length).toBeGreaterThan(0); // Rank
    expect(screen.getAllByText(/50.0%/i).length).toBeGreaterThan(0); // Percentile

    // Check Podium
    expect(screen.getAllByText('Alice Champion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Charlie Third').length).toBeGreaterThan(0);

    // Filter by Set B
    const setBBtn = screen.getByRole('button', { name: /Set B/i });
    fireEvent.click(setBBtn);

    // In Set B, Charlie should be present
    expect(screen.getAllByText('Charlie Third').length).toBeGreaterThan(0);
  });

  it('renders unpublished scheduled state for students when leaderboard is not published', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'usr_student', role: 'STUDENT', email: 'student@example.com' }
    });

    vi.spyOn(competitionApi, 'getCompetitionLeaderboard').mockResolvedValue({
      success: true,
      data: {
        competitionId: 'comp_test_123',
        status: 'NOT_PUBLISHED',
        isPublished: false,
        publishedAt: '2026-10-30T18:00:00Z',
        totalParticipants: 14,
        entries: [],
        podium: [],
        myRank: null
      }
    });

    render(<CompetitionLeaderboardPage />);

    expect(await screen.findByText(/Official Leaderboard Pending Release/i)).toBeTruthy();
    expect(screen.getByText(/Our evaluation committee is completing speech evaluations/i)).toBeTruthy();
    expect(screen.getByText(/Total Enrolled Candidates in this Competition:/i)).toBeTruthy();
    expect(screen.getByText('14')).toBeTruthy();
  });

  it('renders admin controls and handles recalculate and publish toggles', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'usr_admin', role: 'ADMIN', email: 'admin@zoro.com' }
    });

    vi.spyOn(competitionApi, 'getCompetitionLeaderboard').mockResolvedValue({
      success: true,
      data: { ...mockLeaderboardData, isPublished: false, status: 'NOT_PUBLISHED' }
    });

    const mockRecalc = vi.spyOn(competitionApi, 'recalculateCompetitionLeaderboard').mockResolvedValue({
      success: true,
      data: mockLeaderboardData
    });

    const mockPublish = vi.spyOn(competitionApi, 'publishCompetitionLeaderboard').mockResolvedValue({
      success: true,
      data: { ...mockLeaderboardData, isPublished: true, status: 'PUBLISHED' }
    });

    render(<CompetitionLeaderboardPage />);

    // Admin should see Recalculate and Publish Results buttons
    const recalcBtn = await screen.findByRole('button', { name: /Recalculate/i });
    expect(recalcBtn).toBeTruthy();

    const publishBtn = screen.getByRole('button', { name: /Publish Results/i });
    expect(publishBtn).toBeTruthy();

    // Click Recalculate
    fireEvent.click(recalcBtn);
    await waitFor(() => {
      expect(mockRecalc).toHaveBeenCalledWith('comp_test_123');
    });

    // Click Publish Results
    fireEvent.click(publishBtn);
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('comp_test_123');
    });
  });
});
