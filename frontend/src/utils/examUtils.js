/**
 * Determines whether a candidate has answered a question based on its answer format.
 *
 * Rules:
 * - MCQ: an option is selected (selectedOptionId is present).
 * - TEXT: the saved text is non-empty after trim.
 * - VOICE: a recording is uploaded (voiceFileId is present).
 * - Fallback / untyped: checks any of the three.
 *
 * @param {Object} question - The question object (may contain answerFormat or type).
 * @param {Object} answerState - The answer state for this question.
 * @returns {boolean} True if answered, false otherwise.
 */
export function isAnswered(question, answerState) {
  if (!answerState) return false;

  const answerFormat = (question?.answerFormat || question?.type || '').toUpperCase();

  if (answerFormat === 'TEXT') {
    return typeof answerState.textAnswer === 'string' && answerState.textAnswer.trim().length > 0;
  }

  if (answerFormat === 'VOICE' || answerFormat === 'VOICE_RECORDING') {
    return !!(answerState.voiceFileId || answerState.fileId);
  }

  if (answerFormat === 'MCQ' || answerFormat === 'MULTIPLE_CHOICE') {
    return !!answerState.selectedOptionId;
  }

  // Fallback for objects without explicit answerFormat
  return !!(
    answerState.selectedOptionId ||
    answerState.voiceFileId ||
    answerState.fileId ||
    (typeof answerState.textAnswer === 'string' && answerState.textAnswer.trim().length > 0)
  );
}

/**
 * Returns the CSS styling classes for the question navigator button.
 *
 * Precedence rules:
 * 1. isCurrent: blue highlighted
 * 2. isFlagged: yellow/amber (takes precedence over answered)
 * 3. isAnswered: emerald/green
 * 4. Unanswered: slate/white
 */
export function getNavigatorButtonClass({ isCurrent, isFlagged, isAnswered }) {
  if (isCurrent) {
    return "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20";
  }
  if (isFlagged) {
    return "border-amber-400 bg-amber-50 text-amber-700";
  }
  if (isAnswered) {
    return "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold";
  }
  return "border-slate-300 text-slate-700 bg-white hover:bg-slate-50";
}
