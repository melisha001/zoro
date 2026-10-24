import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCompetitionManagementPage from './components/admin/AdminCompetitionManagementPage';
import * as compApi from './api/competitionApi';
import * as userApi from './api/userApi';
import { DialogProvider } from './context/DialogContext';

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams({ comp: 'comp_test_1' }), vi.fn()],
  useNavigate: () => vi.fn()
}));

const mockCompetitions = [
  {
    id: 'comp_test_1',
    title: 'National English Olympiad 2026',
    status: 'Active'
  }
];

const mockAssessments = [
  {
    id: 'asmt_ts_1',
    sequenceNo: 1,
    title: 'Test Series 1 - Grammar Fundamentals',
    type: 'TEST_SERIES',
    status: 'PUBLISHED',
    durationMinutes: 20,
    totalMarks: 20
  },
  {
    id: 'asmt_mock_1',
    sequenceNo: 1,
    title: 'Championship Mock 1',
    type: 'MOCK',
    status: 'PUBLISHED',
    durationMinutes: 45,
    totalMarks: 50,
    startAt: '2026-10-24T10:00:00Z',
    endAt: '2026-10-24T12:00:00Z'
  },
  {
    id: 'asmt_final_1',
    sequenceNo: 1,
    title: 'National Grand Finale Assessment',
    type: 'FINAL',
    status: 'DRAFT',
    durationMinutes: 60,
    totalMarks: 100
  }
];

const mockQuestions = [
  {
    id: 'q_1',
    questionFormat: 'MCQ',
    answerFormat: 'MCQ_OPTIONS',
    questionText: 'Identify the noun clause in the sentence provided.',
    marks: 2,
    sortOrder: 1,
    explanation: 'A noun clause functions as a subject or object in the main clause.',
    options: [
      { id: 'opt_1', text: 'That she had completed the work', isCorrect: true },
      { id: 'opt_2', text: 'Quickly running away', isCorrect: false }
    ]
  }
];

describe('Admin Competition Management & Question Builder (Phase 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders competition tabs and allows slot settings and question builder inspection', async () => {
    vi.spyOn(compApi, 'getCompetitions').mockResolvedValue({
      success: true,
      data: mockCompetitions
    });

    vi.spyOn(compApi, 'getCompetitionOverview').mockResolvedValue({
      success: true,
      data: {
        totalRegistrations: 14,
        paidRegistrations: 14,
        pendingRegistrations: 0,
        publishedAssessmentsCount: 38,
        totalAssessmentsCount: 40,
        hasSyllabus: true,
        guidanceVideosCount: 2,
        studyMaterialsCount: 1,
        sets: [
          { code: 'A', memberCount: 10 },
          { code: 'B', memberCount: 2 },
          { code: 'C', memberCount: 1 },
          { code: 'D', memberCount: 1 }
        ]
      }
    });

    vi.spyOn(compApi, 'getCompetitionAssessments').mockResolvedValue({
      success: true,
      data: mockAssessments
    });

    vi.spyOn(compApi, 'getAssessmentQuestions').mockResolvedValue({
      success: true,
      data: mockQuestions
    });

    vi.spyOn(compApi, 'getAssessmentRepublishInfo').mockResolvedValue({
      success: true,
      data: { attemptCount: 0 }
    });

    render(
      <DialogProvider>
        <AdminCompetitionManagementPage />
      </DialogProvider>
    );

    // Verify main header and overview stats
    expect(await screen.findByText('Competition Management')).toBeDefined();
    expect(screen.getAllByText('National English Olympiad 2026').length).toBeGreaterThan(0);
    expect(await screen.findByText('14')).toBeDefined(); // Total registrations

    // Switch to Test Series (35) sub-tab
    const testSeriesTab = screen.getByRole('button', { name: /Test Series \(35\)/i });
    fireEvent.click(testSeriesTab);

    // Verify Slot #1 card is rendered
    expect(await screen.findByText('Test Series 1 - Grammar Fundamentals')).toBeDefined();
    expect(screen.getByText('Slot #1')).toBeDefined();

    // Click "Edit Settings" to open Slot Edit modal
    const editSettingsBtn = screen.getByRole('button', { name: /Edit Settings/i });
    fireEvent.click(editSettingsBtn);

    expect(await screen.findByText(/Edit Slot Settings: Test Series 1 - Grammar Fundamentals/i)).toBeDefined();
    expect(screen.getByDisplayValue('Test Series 1 - Grammar Fundamentals')).toBeDefined();

    // Close Slot Edit modal
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Click "Questions" to open Question Builder
    const questionsBtn = screen.getByRole('button', { name: /^Questions$/i });
    fireEvent.click(questionsBtn);

    expect(await screen.findByText(/Question Builder: Test Series 1 - Grammar Fundamentals/i)).toBeDefined();
    expect(screen.getByText('Identify the noun clause in the sentence provided.')).toBeDefined();
    expect(screen.getByText('(2 Marks)')).toBeDefined();
    expect(screen.getByText('That she had completed the work')).toBeDefined();

    // Click "Add Question" to open Add Question Sub-Modal
    const addQBtn = screen.getByRole('button', { name: /Add Question/i });
    fireEvent.click(addQBtn);

    expect(await screen.findByText('Add New Question')).toBeDefined();
    expect(screen.getByText('Student Preview')).toBeDefined();

    // Toggle Preview Mode
    const previewBtn = screen.getByRole('button', { name: /Student Preview/i });
    fireEvent.click(previewBtn);
    expect(await screen.findByText(/Student Perspective Preview/i)).toBeDefined();
    expect(screen.getByText('Exit Preview')).toBeDefined();
  });
});
