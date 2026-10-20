import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrainerCompetitionEvaluationPage from './components/competition/TrainerCompetitionEvaluationPage';
import * as competitionApi from './api/competitionApi';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useOutletContext: () => ({
    currentCompetition: {
      id: 'comp_eval_test',
      title: 'National English Championship 2026',
    },
  }),
}));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'trn_alice_123',
      name: 'Trainer Alice',
      email: 'alice@zoro.com',
      role: 'TRAINER',
    },
  }),
}));

describe('TrainerCompetitionEvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders evaluation queue with assigned set submissions and KPI stats', async () => {
    const mockSubmissions = [
      {
        attemptId: 'att_101',
        assessmentId: 'asmt_final_1',
        assessmentTitle: 'Grand Finale Examination',
        assessmentType: 'FINAL',
        sequenceNo: 40,
        status: 'EVALUATION_PENDING',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        submittedAt: new Date(Date.now() - 1800000).toISOString(),
        mcqMarks: 10,
        voiceMarks: 0,
        totalMarks: 10,
        maxMarks: 30,
        registrationId: 'reg_101',
        studentName: 'Student Alice Participant',
        studentEmail: 'student.alice@example.com',
        setId: 'set_a_101',
        setCode: 'A',
        setName: 'Set A',
        voiceQuestionsCount: 1,
        voiceEvaluatedCount: 0,
        voicePendingCount: 1,
      },
    ];

    vi.spyOn(competitionApi, 'getTrainerCompetitionEvaluations').mockResolvedValue({
      success: true,
      data: mockSubmissions,
    });

    render(<TrainerCompetitionEvaluationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Examination Voice Paper Grading/i)).toBeTruthy();
      expect(screen.getByText(/Student Alice Participant/i)).toBeTruthy();
      expect(screen.getByText(/Set A/i)).toBeTruthy();
      expect(screen.getByText(/Evaluation Pending/i)).toBeTruthy();
      expect(screen.getByText(/Evaluate Paper/i)).toBeTruthy();
    });
  });

  it('opens evaluation modal, displays voice recording and submits evaluation score', async () => {
    const mockSubmissions = [
      {
        attemptId: 'att_101',
        assessmentId: 'asmt_final_1',
        assessmentTitle: 'Grand Finale Examination',
        assessmentType: 'FINAL',
        sequenceNo: 40,
        status: 'EVALUATION_PENDING',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        submittedAt: new Date(Date.now() - 1800000).toISOString(),
        mcqMarks: 10,
        voiceMarks: 0,
        totalMarks: 10,
        maxMarks: 30,
        registrationId: 'reg_101',
        studentName: 'Student Alice Participant',
        studentEmail: 'student.alice@example.com',
        setId: 'set_a_101',
        setCode: 'A',
        setName: 'Set A',
        voiceQuestionsCount: 1,
        voiceEvaluatedCount: 0,
        voicePendingCount: 1,
      },
    ];

    const mockDetail = {
      attempt: {
        id: 'att_101',
        assessmentId: 'asmt_final_1',
        assessmentTitle: 'Grand Finale Examination',
        assessmentType: 'FINAL',
        status: 'EVALUATION_PENDING',
        mcqMarks: 10,
        voiceMarks: 0,
        totalMarks: 10,
        maxMarks: 30,
        registrationId: 'reg_101',
        studentName: 'Student Alice Participant',
        studentEmail: 'student.alice@example.com',
        setCode: 'A',
        setName: 'Set A',
      },
      questions: [
        {
          id: 'q_voice_1',
          sortOrder: 1,
          questionFormat: 'VOICE',
          questionText: 'Read the poem aloud with proper cadence and expression.',
          answerFormat: 'VOICE',
          guidanceText: 'Check for pause and rhythm.',
          marks: 10,
          studentAnswer: {
            id: 'ans_v_1',
            voiceFileId: 'file_audio_123',
            voiceDurationSec: 42,
            marksAwarded: null,
            evaluationStatus: 'PENDING_TRAINER',
            audioUrl: 'https://storage.bunnycdn.com/audio/sample.wav',
          },
        },
      ],
    };

    vi.spyOn(competitionApi, 'getTrainerCompetitionEvaluations').mockResolvedValue({
      success: true,
      data: mockSubmissions,
    });

    vi.spyOn(competitionApi, 'getTrainerAttemptDetail').mockResolvedValue({
      success: true,
      data: mockDetail,
    });

    const evalSpy = vi.spyOn(competitionApi, 'evaluateVoiceAnswer').mockResolvedValue({
      success: true,
      data: {
        attemptId: 'att_101',
        status: 'COMPLETED',
        mcqMarks: 10,
        voiceMarks: 8.5,
        totalMarks: 18.5,
      },
    });

    render(<TrainerCompetitionEvaluationPage />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText(/Evaluate Paper/i)).toBeTruthy();
    });

    // Click "Evaluate Paper"
    fireEvent.click(screen.getByText(/Evaluate Paper/i));

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText(/Voice Response Evaluation/i)).toBeTruthy();
      expect(screen.getByText(/Read the poem aloud with proper cadence and expression./i)).toBeTruthy();
      expect(screen.getByText(/Student Recorded Response/i)).toBeTruthy();
      expect(screen.getByText(/Save Voice Evaluation/i)).toBeTruthy();
    });

    // Enter marks
    const marksInput = screen.getByPlaceholderText(/0 to 10/i);
    fireEvent.change(marksInput, { target: { value: '8.5' } });

    // Click Save Voice Evaluation
    fireEvent.click(screen.getByText(/Save Voice Evaluation/i));

    await waitFor(() => {
      expect(evalSpy).toHaveBeenCalledWith('att_101', 'ans_v_1', {
        marksAwarded: 8.5,
        feedback: '',
      });
    });
  });
});
