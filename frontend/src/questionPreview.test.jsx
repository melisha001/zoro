import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuestionPreview from './components/common/QuestionPreview';

describe('QuestionPreview Component (Task K4)', () => {
  beforeEach(() => {
    // Spy on global fetch, XMLHttpRequest, Audio, and Image to verify ZERO network calls
    vi.spyOn(globalThis, 'fetch');
    if (globalThis.window) {
      vi.spyOn(globalThis.window, 'fetch');
    }
  });

  it('renders TEXT question with MCQ options without making ANY network calls', () => {
    const q = {
      id: 'q1',
      questionFormat: 'MCQ',
      answerFormat: 'MCQ_OPTIONS',
      questionText: 'What is the speed of sound in dry air at 20°C?',
      options: [
        { id: 'opt1', text: '343 m/s', isCorrect: true },
        { id: 'opt2', text: '300 m/s', isCorrect: false },
        { id: 'opt3', text: '1500 m/s', isCorrect: false }
      ]
    };

    render(<QuestionPreview question={q} isAdmin={true} />);

    expect(screen.getByTestId('question-text').textContent).toContain('What is the speed of sound');
    expect(screen.getByTestId('option-item-0').textContent).toContain('343 m/s');
    expect(screen.getByTestId('option-item-0').textContent).toContain('Correct');
    expect(screen.queryByTestId('dummy-video-player')).toBeNull();
    expect(screen.queryByTestId('dummy-audio-player')).toBeNull();
    expect(screen.queryByTestId('dummy-voice-recorder')).toBeNull();

    // Verify zero network calls
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('renders VIDEO prompt question with dummy video player and zero network calls', () => {
    const q = {
      id: 'q2',
      questionFormat: 'VIDEO',
      answerFormat: 'MCQ_OPTIONS',
      questionText: 'Watch the video prompt and select the correct hypothesis:',
      mediaRef: 'dummy_video_guid_123',
      options: [
        { id: 'opt1', text: 'Hypothesis A', isCorrect: true },
        { id: 'opt2', text: 'Hypothesis B', isCorrect: false }
      ]
    };

    render(<QuestionPreview question={q} isAdmin={false} />);

    expect(screen.getByTestId('dummy-video-player')).toBeDefined();
    expect(screen.queryByTestId('dummy-audio-player')).toBeNull();
    // In student preview (isAdmin=false), correct answer is not tagged
    expect(screen.queryByText('Correct')).toBeNull();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('renders AUDIO prompt question with dummy audio player and zero network calls', () => {
    const q = {
      id: 'q3',
      questionFormat: 'AUDIO',
      answerFormat: 'VOICE',
      questionText: 'Listen to the audio clip and record your verbal analysis:',
      mediaRef: 'dummy_audio_file_456',
      maxDurationSeconds: 60
    };

    render(<QuestionPreview question={q} isAdmin={true} />);

    expect(screen.getByTestId('dummy-audio-player')).toBeDefined();
    expect(screen.getByTestId('dummy-voice-recorder')).toBeDefined();
    expect(screen.getByText(/Max Duration: 60s/)).toBeDefined();
    expect(screen.getByText('Tap to record')).toBeDefined();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
