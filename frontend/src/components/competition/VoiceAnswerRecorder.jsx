import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../api/fileApi';
import InlineSpinner from '../common/InlineSpinner';


export default function VoiceAnswerRecorder({
  questionId,
  savedVoiceFileId,
  savedDurationSec,
  maxDurationSeconds = 90,
  onUploadComplete,
  readOnly = false
}) {
  const [recordingState, setRecordingState] = useState(savedVoiceFileId ? 'uploaded' : 'idle');
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordDuration, setRecordDuration] = useState(savedDurationSec || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [micError, setMicError] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(savedVoiceFileId || null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // When questionId changes or savedVoiceFileId updates, cleanly reset recorder state
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    audioChunksRef.current = [];
    setIsPlaying(false);
    setUploadProgress(0);
    setMicError(null);

    if (savedVoiceFileId) {
      setRecordingState('uploaded');
      setUploadedFileId(savedVoiceFileId);
      setRecordDuration(savedDurationSec || 0);
      setAudioUrl(null);
    } else {
      setRecordingState('idle');
      setUploadedFileId(null);
      setRecordDuration(0);
      setAudioUrl(null);
    }
  }, [questionId, savedVoiceFileId, savedDurationSec]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: selectedMime || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('recorded');
      };

      recorder.start(250);
      setRecordingState('recording');
      setRecordDuration(0);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordDuration(elapsed);
        if (elapsed >= maxDurationSeconds) {
          stopRecording();
        }
      }, 500);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission was denied. Please allow microphone access in your browser settings to record your voice answer.');
      } else {
        setMicError(`Unable to access microphone: ${err.message || 'Check audio hardware'}`);
      }
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordDuration(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
        setIsPlaying(false);
      });
    }
  };

  const uploadRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    setRecordingState('uploading');
    setUploadProgress(10);
    try {
      const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
      const blob = new Blob(audioChunksRef.current, { type: mime });
      const rand = Math.random().toString(36).substring(2, 9);
      const file = new File([blob], `voice_answer_${questionId}_${Date.now()}_${rand}.${ext}`, { type: mime });

      const data = await uploadFile(file, 'voice-answer', (p) => setUploadProgress(p));
      if (data && data.id) {
        const fileId = data.id;
        setUploadedFileId(fileId);
        setRecordingState('uploaded');
        if (onUploadComplete) {
          onUploadComplete({
            voiceFileId: fileId,
            durationSec: recordDuration
          });
        }
      } else {
        throw new Error('Upload returned no file ID');
      }

    } catch (err) {
      console.error('Voice answer upload failed:', err);
      setMicError(`Upload failed: ${err.message || 'Network error'}. Please try uploading again.`);
      setRecordingState('recorded');
    } finally {
      setUploadProgress(0);
    }
  };

  const formatSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all">
      {micError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Microphone Notice</span>
            <span>{micError}</span>
          </div>
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Status & Duration */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {recordingState === 'recording' && (
            <div className="flex items-center space-x-2 text-red-600 animate-pulse font-mono font-bold text-sm">
              <span className="w-3 h-3 bg-red-600 rounded-full inline-block" />
              <span>RECORDING ({formatSec(recordDuration)} / {formatSec(maxDurationSeconds)})</span>
            </div>
          )}

          {recordingState === 'uploaded' && (
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Voice Answer Uploaded & Linked ({formatSec(recordDuration)})</span>
            </div>
          )}

          {recordingState === 'recorded' && (
            <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs">
              <span>Recorded: {formatSec(recordDuration)}</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-600 font-medium">Ready to upload</span>
            </div>
          )}

          {recordingState === 'idle' && (
            <div className="text-xs text-slate-500 font-medium">
              Click record to capture your voice answer (Max: {formatSec(maxDurationSeconds)})
            </div>
          )}
        </div>

        {/* Right: Controls */}
        {!readOnly && (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {recordingState === 'idle' && (
              <button
                type="button"
                onClick={startRecording}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            )}

            {recordingState === 'recording' && (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm transition-all"
              >
                <Square className="w-4 h-4 text-rose-400" />
                <span>Stop Recording</span>
              </button>
            )}

            {recordingState === 'recorded' && (
              <>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-blue-600" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetRecording}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
                <button
                  type="button"
                  onClick={uploadRecording}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-sm transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Answer</span>
                </button>
              </>
            )}

            {recordingState === 'uploading' && (
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 opacity-80 cursor-not-allowed"
              >
                <InlineSpinner size="w-4 h-4" />
                <span>Uploading Voice ({uploadProgress}%)...</span>
              </button>
            )}

            {recordingState === 'uploaded' && (
              <button
                type="button"
                onClick={resetRecording}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Record Again</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
