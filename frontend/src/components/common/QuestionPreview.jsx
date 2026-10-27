import React from 'react';
import { Play, Volume2, Maximize2, Mic, HelpCircle, Check, Image as ImageIcon, FileText } from 'lucide-react';

/**
 * QuestionPreview
 * 
 * Shared miniature non-interactive preview component for question builder cards
 * and question editor "Student Preview" modal.
 * 
 * Strictly follows Task K4 & X6:
 * - Miniature size, non-interactive
 * - ZERO network calls (no audio/video/image src, no fetch/axios/iframe)
 * - Dummy video player for VIDEO prompt
 * - Dummy audio player for AUDIO prompt
 * - Dummy image box for IMAGE prompt
 * - MCQ options layout (with correct highlighted for admin)
 * - Dummy voice recorder for VOICE answer
 * - Dummy disabled textarea for TEXT answer
 */
export default function QuestionPreview({
  question,
  isAdmin = true,
  className = ''
}) {
  if (!question) return null;

  const questionFormat = (question.questionFormat || 'TEXT').toUpperCase();
  const answerFormat = (question.answerFormat || 'MCQ_OPTIONS').toUpperCase();
  const isVideo = questionFormat === 'VIDEO';
  const isAudio = questionFormat === 'AUDIO';
  const isImage = questionFormat === 'IMAGE';
  const isVoice = answerFormat === 'VOICE';
  const isText = answerFormat === 'TEXT';
  const isMcq = answerFormat === 'MCQ_OPTIONS' || answerFormat === 'MCQ';

  return (
    <div className={`space-y-2.5 text-xs select-none ${className}`} data-testid="question-preview">
      {/* 1. MEDIA PROMPTS (DUMMY, ZERO NETWORK CALLS) */}
      {isImage && (
        <div
          data-testid="dummy-image-prompt"
          className="w-full max-w-md h-36 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5"
        >
          <ImageIcon className="w-8 h-8 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image Prompt (Preview)</span>
        </div>
      )}

      {isVideo && (
        <div
          data-testid="dummy-video-player"
          className="w-full max-w-md aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex flex-col justify-between p-3 border border-slate-800 shadow-inner"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 font-mono">Video Prompt</span>
            <span className="text-[10px] text-slate-500">Preview Only</span>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Dummy video control bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-1 bg-slate-700/80 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-blue-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <Play className="w-3 h-3 fill-slate-400" />
                <span className="font-mono text-[9px]">0:15 / 1:30</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                <Maximize2 className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isAudio && (
        <div
          data-testid="dummy-audio-player"
          className="w-full max-w-md p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-blue-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>0:00</span>
              <span>Audio Prompt</span>
              <span>0:45</span>
            </div>
          </div>
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      )}

      {/* 2. QUESTION TEXT */}
      <div className="font-bold text-slate-900 text-xs sm:text-sm leading-relaxed" data-testid="question-text">
        {question.questionText || 'Question statement will appear here...'}
      </div>

      {/* 3. GUIDANCE TEXT */}
      {question.guidanceText && (
        <div className="p-2 bg-blue-50/80 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 flex items-start gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>{question.guidanceText}</span>
        </div>
      )}

      {/* 4. ANSWER FORMAT (MCQ / VOICE / OTHER) */}
      {isMcq && question.options && question.options.length > 0 && (
        <div className="space-y-1.5 pt-1" data-testid="mcq-options-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options.map((opt, idx) => {
              const isCorrect = Boolean(opt.isCorrect);
              const highlightCorrect = isAdmin && isCorrect;

              return (
                <div
                  key={opt.id || idx}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                    highlightCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  data-testid={`option-item-${idx}`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        highlightCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="truncate">{opt.text || `Option ${idx + 1}`}</span>
                  </div>

                  {highlightCorrect ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isVoice && (
        <div
          data-testid="dummy-voice-recorder"
          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Mic className="w-3 h-3" />
              </div>
              <span className="font-bold">Tap to record</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Max Duration: {question.maxDurationSeconds || 90}s
            </span>
          </div>

          {/* Dummy waveform placeholder */}
          <div className="h-6 bg-white rounded-lg border border-slate-200 px-3 flex items-center justify-center gap-1">
            <span className="w-1 h-2 bg-slate-300 rounded-full" />
            <span className="w-1 h-4 bg-slate-400 rounded-full" />
            <span className="w-1 h-5 bg-slate-500 rounded-full" />
            <span className="w-1 h-3 bg-slate-300 rounded-full" />
            <span className="w-1 h-4 bg-slate-400 rounded-full" />
            <span className="w-1 h-2 bg-slate-300 rounded-full" />
            <span className="w-1 h-5 bg-slate-500 rounded-full" />
            <span className="w-1 h-3 bg-slate-400 rounded-full" />
            <span className="w-1 h-2 bg-slate-300 rounded-full" />
            <span className="text-[10px] text-slate-400 ml-2 font-medium">Waveform Placeholder</span>
          </div>

          {/* Dummy audio player for recorded answer */}
          <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-[10px] text-slate-500">
            <Play className="w-3 h-3 text-slate-400 fill-slate-400 shrink-0" />
            <div className="h-1 bg-slate-200 flex-1 rounded-full" />
            <span className="font-mono text-[9px]">0:00 / {question.maxDurationSeconds || 90}s</span>
          </div>
        </div>
      )}

      {isText && (
        <div
          data-testid="dummy-text-answer"
          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Written Response (Candidate Input)</span>
            <span className="font-mono">0 / 5,000 characters</span>
          </div>
          <textarea
            disabled
            rows={3}
            placeholder="Candidate will enter text answer here (up to 5,000 characters)..."
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed resize-none"
          />
        </div>
      )}
    </div>
  );
}
