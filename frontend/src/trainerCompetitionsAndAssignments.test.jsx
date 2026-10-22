import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrainerAssignmentsPage from './components/trainer/TrainerAssignmentsPage';
import TrainerCompetitionsPage from './components/trainer/TrainerCompetitionsPage';

// Mock AuthContext
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'trainer_123', name: 'John Trainer', email: 'trainer@zoro.com', role: 'TRAINER' }
  })
}));

// Mock DialogContext
vi.mock('./context/DialogContext', () => ({
  useDialog: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true)
  })
}));

// Mock APIs for TrainerAssignmentsPage
vi.mock('./api/assignmentApi', () => ({
  getCreatedAssignments: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAssignments: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createExtraAssignment: vi.fn().mockResolvedValue({ success: true, data: {} }),
  updateAssignment: vi.fn().mockResolvedValue({ success: true, data: {} }),
  deleteAssignment: vi.fn().mockResolvedValue({ success: true, data: {} }),
  getTrainerAllocatedCourses: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'course_1', title: 'Speed Maths', name: 'Speed Maths', mode: 'Online' }]
  }),
  getTrainerBatchesForCourse: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'batch_1', name: 'Batch Alpha', courseId: 'course_1', trainerId: 'trainer_123' }]
  }),
  getTrainerStudentsForCourse: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'std_1', name: 'Alice', email: 'alice@student.com' }]
  })
}));

vi.mock('./api/courseApi', () => ({
  getCourses: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'course_1', title: 'Speed Maths', name: 'Speed Maths' }]
  }),
  getTrainerCourseRequests: vi.fn().mockResolvedValue({
    success: true,
    data: [{ courseId: 'course_1', courseTitle: 'Speed Maths', status: 'Approved' }]
  })
}));

vi.mock('./api/batchApi', () => ({
  getBatches: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'batch_1', name: 'Batch Alpha', courseId: 'course_1', trainerId: 'trainer_123' }]
  })
}));

vi.mock('./api/userApi', () => ({
  getTrainerStudents: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: 'std_1', name: 'Alice', email: 'alice@student.com' }]
  })
}));

// Mock APIs for TrainerCompetitionsPage
vi.mock('./api/competitionApi', () => ({
  getTrainerAssignedCompetitions: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 'comp_1',
        title: 'Abacus National Cup',
        category: 'Abacus',
        status: 'Active',
        assignedSets: [{ id: 'set_a', code: 'A', name: 'Set A' }],
        totalAssignedSets: 1
      }
    ]
  }),
  getTrainerFilteredSubmissions: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        attemptId: 'att_1',
        assessmentTitle: 'Speed Test 1',
        assessmentType: 'TEST_SERIES',
        studentName: 'Alice Student',
        studentEmail: 'alice@student.com',
        competitionTitle: 'Abacus National Cup',
        setCode: 'A',
        status: 'EVALUATION_PENDING',
        totalMarks: 0,
        maxMarks: 20,
        submittedAt: '2026-10-21T10:00:00Z'
      }
    ]
  }),
  getTrainerAttemptDetail: vi.fn().mockResolvedValue({
    success: true,
    data: {
      attempt: {
        id: 'att_1',
        studentName: 'Alice Student',
        studentEmail: 'alice@student.com',
        setCode: 'A',
        totalMarks: 0,
        maxMarks: 20
      },
      assessment: { title: 'Speed Test 1' },
      questions: [
        {
          id: 'q_1',
          questionText: 'Count the abacus beads',
          answerFormat: 'VOICE',
          marks: 10,
          studentAnswer: {
            id: 'ans_1',
            voiceFileId: 'vfile_1',
            audioUrl: '/api/files/vfile_1',
            evaluationStatus: 'PENDING_TRAINER',
            marksAwarded: null
          }
        }
      ]
    }
  }),
  evaluateVoiceAnswer: vi.fn().mockResolvedValue({ success: true, data: { status: 'COMPLETED' } })
}));

describe('Part B: Trainer Portal Enhancements (B1, B2, B3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('B2: TrainerAssignmentsPage does NOT offer "All Course Students", only "Entire Batch" and "Specific Student"', async () => {
    render(
      <BrowserRouter>
        <TrainerAssignmentsPage />
      </BrowserRouter>
    );

    // Click "Create Extra Assignment" button
    const createBtn = await screen.findByText(/Create Extra Assignment/i);
    expect(createBtn).toBeTruthy();
    fireEvent.click(createBtn);

    // In the create modal, verify target options
    expect(await screen.findByText('Assign Target Audience *')).toBeTruthy();
    expect(screen.getByRole('button', { name: /entire batch/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /specific student/i })).toBeTruthy();

    // Verify "All Course Students" is completely absent
    expect(screen.queryByRole('button', { name: /all course students/i })).toBeNull();
  });

  it('B3: TrainerCompetitionsPage displays assigned competitions, stats, and submissions table', async () => {
    render(
      <BrowserRouter>
        <TrainerCompetitionsPage />
      </BrowserRouter>
    );

    // Check Header and Stats
    expect(await screen.findByText('Trainer Competitions & Evaluations')).toBeTruthy();
    expect(screen.getByText('Assigned Competitions')).toBeTruthy();

    // Check Submissions table content
    expect(await screen.findByText('Alice Student')).toBeTruthy();
    expect(screen.getAllByText('Abacus National Cup').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Set A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending Review').length).toBeGreaterThanOrEqual(1);

    // Click "Evaluate" button to open evaluation drawer
    const evalBtn = screen.getByRole('button', { name: /evaluate/i });
    fireEvent.click(evalBtn);

    // Check evaluation drawer content
    expect(await screen.findByText('Submission Evaluation & Grading')).toBeTruthy();
    expect(screen.getByText('Count the abacus beads')).toBeTruthy();
    expect(screen.getByText('Voice Recording')).toBeTruthy();
    expect(screen.getByRole('button', { name: /save question score/i })).toBeTruthy();
  });
});
