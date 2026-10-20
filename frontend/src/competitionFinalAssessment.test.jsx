import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CompetitionFinalAssessmentPage from './components/competition/CompetitionFinalAssessmentPage';
import * as competitionApi from './api/competitionApi';

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    currentCompetition: {
      id: 'comp_test_123',
      title: 'National English Olympiad 2026',
    },
  }),
}));

describe('CompetitionFinalAssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assigned set badge, trainer details, and live countdown banner', async () => {
    const mockData = {
      competitionId: 'comp_test_123',
      competitionTitle: 'National English Olympiad 2026',
      assignedSet: {
        id: 'set_a_123',
        code: 'A',
        title: 'Championship Paper - Set A',
        trainerName: 'Master Trainer Alex',
        trainerEmail: 'alex.trainer@zoro.com',
      },
      finalAssessment: {
        id: 'asmt_final_1',
        title: 'Grand Finale Assessment',
        durationMinutes: 90,
        totalMarks: 100,
        windowStatus: 'LIVE',
        attemptStatus: 'NOT_STARTED',
        secondsToEnd: 3600,
        startAt: new Date(Date.now() - 600000).toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      },
    };

    vi.spyOn(competitionApi, 'getStudentFinalAssessment').mockResolvedValue({
      success: true,
      data: mockData,
    });

    render(<CompetitionFinalAssessmentPage />);

    await waitFor(() => {
      expect(screen.getByText(/Grand Finale Assessment/i)).toBeTruthy();
      expect(screen.getAllByText(/Set A/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Master Trainer Alex/i)).toBeTruthy();
      expect(screen.getByText(/Examination Window Live Now/i)).toBeTruthy();
      expect(screen.getByText(/Strict Single Attempt/i)).toBeTruthy();
      expect(screen.getByText(/Start Examination Now/i)).toBeTruthy();
    });
  });

  it('renders completed attempt button when exam has already been submitted', async () => {
    const mockData = {
      competitionId: 'comp_test_123',
      competitionTitle: 'National English Olympiad 2026',
      assignedSet: {
        id: 'set_b_123',
        code: 'B',
        title: 'Championship Paper - Set B',
        trainerName: 'Master Trainer Sarah',
        trainerEmail: 'sarah.trainer@zoro.com',
      },
      finalAssessment: {
        id: 'asmt_final_1',
        title: 'Grand Finale Assessment',
        durationMinutes: 90,
        totalMarks: 100,
        windowStatus: 'LIVE',
        attemptStatus: 'COMPLETED',
        secondsToEnd: 3600,
      },
    };

    vi.spyOn(competitionApi, 'getStudentFinalAssessment').mockResolvedValue({
      success: true,
      data: mockData,
    });

    render(<CompetitionFinalAssessmentPage />);

    await waitFor(() => {
      expect(screen.getByText(/View Scorecard & Results/i)).toBeTruthy();
    });
  });
});
