import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { initiateRazorpayPayment } from './utils/razorpay';
import { isAnswered, getNavigatorButtonClass } from './utils/examUtils';
import QuestionMedia from './components/common/QuestionMedia';
import * as fileApi from './api/fileApi';

describe('Y1: Razorpay Payment Utility & Error Translation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.Razorpay;
  });

  it('fails closed and throws friendly message without calling constructor when key is missing or blank', async () => {
    const razorpayConstructor = vi.fn();
    window.Razorpay = razorpayConstructor;

    // 1. Missing key throws friendly error
    await expect(initiateRazorpayPayment({
      keyId: '',
      orderId: 'order_123',
      amount: 500,
    })).rejects.toThrow('Payment could not be started. Please try again.');
    expect(razorpayConstructor).not.toHaveBeenCalled();

    // 2. Undefined key throws friendly error
    await expect(initiateRazorpayPayment({
      order_id: 'order_456',
    })).rejects.toThrow('Payment could not be started. Please try again.');
    expect(razorpayConstructor).not.toHaveBeenCalled();
  });

  it('initializes Razorpay constructor with the public key when key or keyId is supplied', async () => {
    const mockOpen = vi.fn();
    const mockOn = vi.fn();
    let passedOptions = null;

    function MockRazorpay(options) {
      passedOptions = options;
      this.open = mockOpen;
      this.on = mockOn;
    }
    window.Razorpay = MockRazorpay;

    initiateRazorpayPayment({
      key: 'rzp_test_public_123',
      order_id: 'order_live_999',
      amount: 1000,
      studentName: 'Test Student',
      studentEmail: 'student@example.com',
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(passedOptions).toBeTruthy();
    expect(passedOptions.key).toBe('rzp_test_public_123');
    expect(passedOptions.order_id).toBe('order_live_999');
    expect(mockOpen).toHaveBeenCalled();
  });

  it('handles cancellation and translates error events to plain human messages', async () => {
    let dismissCallback = null;

    function MockRazorpay(options) {
      dismissCallback = options.modal?.ondismiss;
      this.open = vi.fn();
      this.on = vi.fn();
    }
    window.Razorpay = MockRazorpay;

    const paymentPromise = initiateRazorpayPayment({
      keyId: 'rzp_test_456',
      orderId: 'order_cancel_1',
    });

    await new Promise((r) => setTimeout(r, 0));

    // Simulate modal dismissal by user
    expect(typeof dismissCallback).toBe('function');
    dismissCallback();

    await expect(paymentPromise).rejects.toThrow('Payment was cancelled.');
  });
});

describe('Y5: Exam Question Answered State & Navigator Classes', () => {
  it('MCQ: isAnswered is true only when selectedOptionId is present', () => {
    const qMcq = { answerFormat: 'MCQ' };
    expect(isAnswered(qMcq, null)).toBe(false);
    expect(isAnswered(qMcq, {})).toBe(false);
    expect(isAnswered(qMcq, { selectedOptionId: '' })).toBe(false);
    expect(isAnswered(qMcq, { selectedOptionId: 'opt_1' })).toBe(true);
  });

  it('TEXT: isAnswered handles empty, whitespace-only, filled, and cleared strings', () => {
    const qText = { answerFormat: 'TEXT' };
    expect(isAnswered(qText, null)).toBe(false);
    expect(isAnswered(qText, {})).toBe(false);
    expect(isAnswered(qText, { textAnswer: '' })).toBe(false);
    expect(isAnswered(qText, { textAnswer: '     ' })).toBe(false);
    expect(isAnswered(qText, { textAnswer: '\n\t  \n' })).toBe(false);

    // Filled text
    expect(isAnswered(qText, { textAnswer: 'Proper student essay response' })).toBe(true);

    // Cleared back to empty
    const state = { textAnswer: 'Initial text' };
    expect(isAnswered(qText, state)).toBe(true);
    state.textAnswer = '';
    expect(isAnswered(qText, state)).toBe(false);
    state.textAnswer = '   ';
    expect(isAnswered(qText, state)).toBe(false);
  });

  it('VOICE: isAnswered is true only when voiceFileId is present', () => {
    const qVoice = { answerFormat: 'VOICE' };
    expect(isAnswered(qVoice, null)).toBe(false);
    expect(isAnswered(qVoice, {})).toBe(false);
    expect(isAnswered(qVoice, { voiceFileId: null })).toBe(false);
    expect(isAnswered(qVoice, { voiceFileId: 'file_audio_123' })).toBe(true);
  });

  it('Navigator classes: verifies priority of current > flagged (yellow) > answered (green) > default (slate)', () => {
    // Current question is always blue
    expect(getNavigatorButtonClass({ isCurrent: true, isFlagged: false, isAnswered: false })).toContain('border-blue-600');
    expect(getNavigatorButtonClass({ isCurrent: true, isFlagged: true, isAnswered: true })).toContain('border-blue-600');

    // Flagged questions take precedence over answered (Yellow)
    expect(getNavigatorButtonClass({ isCurrent: false, isFlagged: true, isAnswered: true })).toContain('border-amber-400');
    expect(getNavigatorButtonClass({ isCurrent: false, isFlagged: true, isAnswered: false })).toContain('border-amber-400');

    // Answered questions when not flagged are green/emerald
    expect(getNavigatorButtonClass({ isCurrent: false, isFlagged: false, isAnswered: true })).toContain('border-emerald-500');

    // Unanswered & unflagged questions are default slate
    expect(getNavigatorButtonClass({ isCurrent: false, isFlagged: false, isAnswered: false })).toContain('border-slate-300');
  });
});

describe('Y4 & Y6: QuestionMedia Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders image through signed link without placeholder and supports click to zoom', async () => {
    vi.spyOn(fileApi, 'getFileLink').mockResolvedValue({
      fileUrl: 'https://storage.bunnycdn.com/test-zone/images/q1.png',
      directUrl: 'https://storage.bunnycdn.com/test-zone/images/q1.png',
    });

    render(
      <QuestionMedia
        questionFormat="IMAGE"
        mediaRef="file_img_uuid_001"
        promptText="Identify the item in the illustration"
      />
    );

    // Shows loading skeleton first
    expect(screen.getByText(/Loading secure question image/i)).toBeTruthy();

    // Resolves signed link
    await waitFor(() => {
      const img = screen.getByAltText(/Question Media Prompt/i);
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe('https://storage.bunnycdn.com/test-zone/images/q1.png');
      expect(img.className).toContain('object-contain');
    });

    // Verify click opens zoom modal (renders enlarged image)
    const imgEl = screen.getByAltText(/Question Media Prompt/i);
    fireEvent.click(imgEl);

    await waitFor(() => {
      const images = screen.getAllByAltText(/Question Media Prompt/i);
      expect(images.length).toBe(2);
    });
  });

  it('displays clear error with Retry button and NEVER renders a placeholder when image fails', async () => {
    vi.spyOn(fileApi, 'getFileLink').mockRejectedValue(new Error('Network error or token expired'));

    render(
      <QuestionMedia
        questionFormat="IMAGE"
        mediaRef="file_img_failed_002"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Could not load question image/i)).toBeTruthy();
      expect(screen.getByText(/Retry/i)).toBeTruthy();
      // Ensure no img tag exists (no placeholder fallback)
      expect(screen.queryByRole('img')).toBeNull();
    });
  });

  it('renders Audio player for AUDIO questions and no media for TEXT questions', () => {
    const { container: textContainer } = render(
      <QuestionMedia questionFormat="TEXT" promptText="Plain text prompt" />
    );
    expect(textContainer.querySelector('audio')).toBeNull();
    expect(textContainer.querySelector('img')).toBeNull();
  });
});
