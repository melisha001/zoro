import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCheck,
  User,
  Users,
  Layers,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  FileText
} from 'lucide-react';
import {
  getCompetitions,
  getAdminCompetitionEvaluations,
  getTrainerAttemptDetail,
  evaluateVoiceAnswer
} from '../../api/competitionApi';
import { resolveFileUrl } from '../../api/fileApi';
import AudioPromptPlayer from '../common/AudioPromptPlayer';
import QuestionMedia from '../common/QuestionMedia';
import InlineSpinner from '../common/InlineSpinner';
import ButtonSpinner from '../common/ButtonSpinner';
import { useDialog } from '../../context/DialogContext';
import { formatDate } from '../../utils/dateFormatter';

export default function AdminCompetitionEvaluationsPage() {
  const { showSuccess, showError, showWarning } = useDialog();

  const [competitions, setCompetitions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCompId, setSelectedCompId] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [selectedSetCode, setSelectedSetCode] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Evaluation Modal / Drawer State
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [evaluatingMap, setEvaluatingMap] = useState({}); // answerId -> { marks, feedback, saving, error }

  // Audio Player State inside Evaluation Modal
  const [playingAnswerId, setPlayingAnswerId] = useState(null);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1);
  const audioRefs = useRef({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const compRes = await getCompetitions();
      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        setCompetitions(compRes.data);
      }
      await loadEvaluationsList();
    } catch (err) {
      console.error('Failed to load evaluations initial data:', err);
      showError('Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationsList = async () => {
    try {
      const res = await getAdminCompetitionEvaluations({
        competitionId: selectedCompId,
        examType: selectedExamType,
        setCode: selectedSetCode,
        status: selectedStatus,
        search: searchQuery
      });
      if (res && res.success && Array.isArray(res.data)) {
        setSubmissions(res.data);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Failed to load evaluations list:', err);
      setSubmissions([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvaluationsList();
    setRefreshing(false);
  };

  // Re-filter when local filter dropdowns change
  useEffect(() => {
    loadEvaluationsList();
  }, [selectedCompId, selectedExamType, selectedSetCode, selectedStatus, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(
      (s) => s.status === 'EVALUATION_PENDING' || (s.voicePendingCount || 0) > 0
    ).length;
    const completed = submissions.filter((s) => s.status === 'COMPLETED').length;
    return { total, pending, completed };
  }, [submissions]);

  // Open Evaluation Modal
  const handleOpenEvaluation = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setLoadingDetail(true);
    try {
      const res = await getTrainerAttemptDetail(attemptId);
      if (res && res.success && res.data) {
        setAttemptDetail(res.data);

        // Preload evaluation form fields
        const formInit = {};
        const questions = res.data.questions || [];
        for (const q of questions) {
          const ans = q.studentAnswer;
          if (ans) {
            formInit[ans.id] = {
              marks: ans.marksAwarded != null ? ans.marksAwarded : '',
              feedback: ans.feedback || ans.trainerFeedback || '',
              criteriaScores: (ans.criteriaScores || []).reduce((acc, c) => {
                acc[c.criterionId] = c.score;
                return acc;
              }, {}),
              saving: false,
              error: ''
            };
          }
        }
        setEvaluatingMap(formInit);
      } else {
        showError(res?.message || 'Failed to load attempt details');
      }
    } catch (err) {
      console.error('Failed to load attempt detail:', err);
      showError('Failed to load attempt detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseEvaluation = () => {
    setSelectedAttemptId(null);
    setAttemptDetail(null);
    setPlayingAnswerId(null);
    // Pause any playing audio
    Object.values(audioRefs.current).forEach((el) => {
      if (el) el.pause();
    });
    loadEvaluationsList();
  };

  // Audio Playback Toggle
  const togglePlayAudio = (ansId) => {
    const audioEl = audioRefs.current[ansId];
    if (!audioEl) return;

    if (playingAnswerId === ansId) {
      audioEl.pause();
      setPlayingAnswerId(null);
    } else {
      // Pause others
      Object.keys(audioRefs.current).forEach((id) => {
        if (id !== ansId && audioRefs.current[id]) {
          audioRefs.current[id].pause();
        }
      });
      audioEl.playbackRate = audioPlaybackSpeed;
      audioEl.play().catch((err) => console.warn('Audio play error:', err));
      setPlayingAnswerId(ansId);
    }
  };

  const handleSpeedChange = (speed) => {
    setAudioPlaybackSpeed(speed);
    if (playingAnswerId && audioRefs.current[playingAnswerId]) {
      audioRefs.current[playingAnswerId].playbackRate = speed;
    }
  };

  // Save / Override Evaluation
  const handleSaveEvaluation = async (questionId, answerId, maxMarks) => {
    const formData = evaluatingMap[answerId] || {};
    const marksNum = parseFloat(formData.marks);

    if (isNaN(marksNum)) {
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: { ...prev[answerId], error: 'Please enter a valid numeric mark.' }
      }));
      return;
    }

    if (marksNum < 0 || marksNum > maxMarks) {
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: {
          ...prev[answerId],
          error: `Marks must be between 0 and ${maxMarks}.`
        }
      }));
      return;
    }

    setEvaluatingMap((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], saving: true, error: '' }
    }));

    try {
      const criteriaList = Object.entries(formData.criteriaScores || {}).map(
        ([cId, score]) => ({
          criterionId: cId,
          score: parseFloat(score) || 0
        })
      );

      const payload = {
        marksAwarded: marksNum,
        feedback: formData.feedback || '',
        criteriaScores: criteriaList
      };

      const res = await evaluateVoiceAnswer(selectedAttemptId, answerId, payload);
      if (res && res.success) {
        await showSuccess('Evaluation saved successfully.');
        setEvaluatingMap((prev) => ({
          ...prev,
          [answerId]: { ...prev[answerId], saving: false, error: '' }
        }));
        // Reload attempt detail to reflect newly saved marks and audit trail
        const detailRes = await getTrainerAttemptDetail(selectedAttemptId);
        if (detailRes && detailRes.success) {
          setAttemptDetail(detailRes.data);
        }
      } else {
        setEvaluatingMap((prev) => ({
          ...prev,
          [answerId]: {
            ...prev[answerId],
            saving: false,
            error: res?.message || 'Failed to save evaluation'
          }
        }));
      }
    } catch (err) {
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: {
          ...prev[answerId],
          saving: false,
          error: err.message || 'Failed to save evaluation'
        }
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileCheck className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Competition Evaluations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review, evaluate and audit student voice submissions across all competition sets and trainers.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Submissions
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[10px] text-slate-500 font-medium">Across all filtered assessments</p>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Evaluation</span>
          </span>
          <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
          <p className="text-[10px] text-slate-500 font-medium">Awaiting trainer or admin review</p>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed & Graded</span>
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.completed}</div>
          <p className="text-[10px] text-slate-500 font-medium">Fully evaluated and ready for leaderboard</p>
        </div>
      </div>

      {/* Multi-Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filter Submissions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Competition Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Competition</label>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Exam Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">All Exam Types</option>
              <option value="TEST_SERIES">Test Series</option>
              <option value="MOCK">Mock Tests</option>
              <option value="FINAL">Final Assessment</option>
            </select>
          </div>

          {/* Set Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Set</label>
            <select
              value={selectedSetCode}
              onChange={(e) => setSelectedSetCode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">All Sets</option>
              <option value="A">Set A</option>
              <option value="B">Set B</option>
              <option value="C">Set C</option>
              <option value="D">Set D</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Evaluation</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student, trainer, title..."
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <InlineSpinner text="Loading competition evaluations..." />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm">No submissions match the current filters.</p>
            <p className="text-xs">Adjust your filters or wait for students to submit voice assessments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Competition & Set</th>
                  <th className="py-3.5 px-4">Assessment Slot</th>
                  <th className="py-3.5 px-4">Assigned Trainer</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Marks</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {submissions.map((sub) => {
                  const isPending =
                    sub.status === 'EVALUATION_PENDING' || (sub.voicePendingCount || 0) > 0;
                  return (
                    <tr
                      key={sub.attemptId}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{sub.studentEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-bold truncate max-w-[150px]">
                          {sub.competitionTitle || 'Competition'}
                        </div>
                        <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700">
                          Set {sub.setCode || 'A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-bold">
                          {sub.assessmentType === 'TEST_SERIES'
                            ? `Test #${sub.sequenceNo}`
                            : sub.assessmentType === 'MOCK'
                            ? `Mock #${sub.sequenceNo}`
                            : 'Final Assessment'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {sub.assessmentTitle}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-bold">
                          {sub.trainerName || 'Unassigned'}
                        </div>
                        {sub.trainerEmail && (
                          <div className="text-[10px] text-slate-400 truncate">{sub.trainerEmail}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {sub.submittedAt ? formatDate(sub.submittedAt) : 'In Progress'}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Evaluated</span>
                          </span>
                        )}
                        {sub.proctorViolationsCount > 0 ? (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>{sub.proctorViolationsCount} Violations {sub.autoSubmitted ? '(Auto-submitted)' : ''}</span>
                          </div>
                        ) : (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Proctored: 0</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900">
                          {sub.totalMarks != null ? sub.totalMarks : '-'}
                        </span>
                        <span className="text-slate-400 text-[10px]"> / {sub.maxMarks || 20}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEvaluation(sub.attemptId)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Grade & Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EVALUATION MODAL & GRADING UI */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Evaluation & Grade Review
                  </h3>
                  {attemptDetail?.attempt && (
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Student: <strong className="text-slate-800">{attemptDetail.attempt.studentName}</strong> •{' '}
                      Set {attemptDetail.attempt.setCode} • {attemptDetail.attempt.assessmentTitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCloseEvaluation}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingDetail ? (
                <div className="py-16 flex justify-center">
                  <InlineSpinner text="Loading submission details..." />
                </div>
              ) : !attemptDetail ? (
                <div className="p-8 text-center text-slate-400">Failed to load attempt detail.</div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Student</span>
                      <p className="font-black text-slate-900 mt-0.5">{attemptDetail.attempt.studentName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{attemptDetail.attempt.studentEmail}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Score</span>
                      <p className="font-black text-slate-900 mt-0.5">
                        {attemptDetail.attempt.totalMarks != null ? attemptDetail.attempt.totalMarks : 0} /{' '}
                        {attemptDetail.attempt.maxMarks || 20}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        MCQ: {attemptDetail.attempt.mcqMarks || 0} • Voice: {attemptDetail.attempt.voiceMarks || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Set</span>
                      <p className="font-black text-indigo-700 mt-0.5">Set {attemptDetail.attempt.setCode}</p>
                      <p className="text-[10px] text-slate-500">
                        {attemptDetail.attempt.setName || 'Competition Paper'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {attemptDetail.attempt.submittedAt
                          ? formatDate(attemptDetail.attempt.submittedAt)
                          : 'In Progress'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Proctoring</span>
                      {attemptDetail.attempt.proctorViolationsCount > 0 ? (
                        <p className="font-bold text-rose-700 text-xs mt-0.5 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>{attemptDetail.attempt.proctorViolationsCount} Infractions {attemptDetail.attempt.autoSubmitted ? '(Auto-submitted)' : ''}</span>
                        </p>
                      ) : (
                        <p className="font-bold text-emerald-700 text-xs mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Clean (0 Infractions)</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Audio Playback Speed Control */}
                  <div className="flex items-center justify-between bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <span>Audio Playback Speed</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            audioPlaybackSpeed === spd
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                      Assessment Questions ({attemptDetail.questions?.length || 0})
                    </h4>

                    {attemptDetail.questions?.map((q, idx) => {
                      const ans = q.studentAnswer;
                      const isVoice = q.answerFormat === 'VOICE' || (ans && ans.voiceFileId);
                      const isText = q.answerFormat === 'TEXT';
                      const isManual = isVoice || isText;
                      const formState = (ans && evaluatingMap[ans.id]) || {};

                      return (
                        <div
                          key={q.id || idx}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-black rounded-md text-[10px]">
                                  Q{idx + 1}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isVoice
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : isText
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {isVoice ? 'Voice Answer' : isText ? 'Written Answer' : 'MCQ Option'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Max Marks: {q.marks || 1}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs mt-1">{q.questionText}</h5>
                            </div>

                            {ans && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  (!isManual || ans.evaluationStatus === 'EVALUATED')
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {(!isManual || ans.evaluationStatus === 'EVALUATED') ? 'Graded' : 'Pending'}
                              </span>
                            )}
                          </div>

                          {/* Media prompt if present */}
                          {(q.questionFormat === 'IMAGE' || q.questionFormat === 'VIDEO' || q.questionFormat === 'AUDIO' || q.mediaRef || q.fileId) && (
                            <QuestionMedia
                              questionFormat={q.questionFormat}
                              mediaRef={q.mediaRef || q.fileId}
                              title={`Question ${idx + 1} Prompt`}
                            />
                          )}

                          {/* Student Answer Section */}
                          {ans ? (
                            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
                              {/* Voice Answer Media Player */}
                              {isVoice && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                      <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Student Voice Recording</span>
                                    </span>
                                    {ans.voiceDurationSec && (
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        Duration: {ans.voiceDurationSec}s
                                      </span>
                                    )}
                                  </div>

                                  {(ans.audioUrl || ans.voiceFileId) ? (
                                    <div className="mt-2">
                                      <AudioPromptPlayer 
                                        src={ans.audioUrl || ans.voiceFileId} 
                                        fileId={ans.voiceFileId} 
                                        label="Candidate Voice Answer" 
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-rose-50 text-rose-700 text-[11px] rounded-xl border border-rose-100">
                                      No audio recording available for this voice question.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Written Text Answer */}
                              {isText && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Candidate's Text Answer</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      {(ans.textAnswer || '').length} characters
                                    </span>
                                  </div>
                                  {ans.textAnswer ? (
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                                      {ans.textAnswer}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-rose-50 text-rose-700 text-[11px] rounded-xl border border-rose-100">
                                      Written answer not submitted or student skipped this question.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* MCQ Answer Info */}
                              {!isManual && (
                                <div className="text-xs space-y-1">
                                  <div>
                                    <span className="font-bold text-slate-600">Candidate Choice: </span>
                                    <span className="font-black text-slate-900">
                                      {(() => {
                                        if (!ans.selectedOptionId) return 'No option selected';
                                        const sel = q.options?.find(o => o.id === ans.selectedOptionId);
                                        return sel ? (sel.optionText || sel.text) : ans.selectedOptionId;
                                      })()}
                                    </span>
                                    {ans.isCorrect != null && (
                                      <span
                                        className={`ml-2 font-bold ${
                                          ans.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                      >
                                        ({ans.isCorrect ? 'Correct' : 'Incorrect'})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Audit Trail Note if Evaluated */}
                              {ans.evaluatedBy && (
                                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>
                                    Evaluated by{' '}
                                    <strong>{ans.evaluatorName || ans.evaluatedBy}</strong>{' '}
                                    {ans.evaluatorRole && `(${ans.evaluatorRole})`} on{' '}
                                    {ans.evaluatedAt ? formatDate(ans.evaluatedAt) : 'N/A'}
                                  </span>
                                </div>
                              )}

                              {/* Grading Form for Manual (Voice/Text) Question */}
                              {isManual && (
                                <div className="border-t border-slate-200 pt-3 space-y-3">
                                  {/* Evaluation Criteria Rubric if present */}
                                  {q.criteria && q.criteria.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold uppercase text-slate-500">
                                        Evaluation Criteria Rubric:
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {q.criteria.map((crit) => (
                                          <div
                                            key={crit.id}
                                            className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                                          >
                                            <span className="font-medium text-slate-700">{crit.title}</span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                              Max {crit.maxMarks}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Marks Awarded (Max: {q.marks || 10}) *
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={q.marks || 10}
                                        step="0.5"
                                        value={formState.marks ?? ''}
                                        onChange={(e) =>
                                          setEvaluatingMap((prev) => ({
                                            ...prev,
                                            [ans.id]: { ...prev[ans.id], marks: e.target.value }
                                          }))
                                        }
                                        placeholder={`0 - ${q.marks || 10}`}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-black text-slate-900"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Trainer / Admin Feedback & Remarks
                                      </label>
                                      <input
                                        type="text"
                                        value={formState.feedback ?? ''}
                                        onChange={(e) =>
                                          setEvaluatingMap((prev) => ({
                                            ...prev,
                                            [ans.id]: { ...prev[ans.id], feedback: e.target.value }
                                          }))
                                        }
                                        placeholder="Add constructive speaking feedback..."
                                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                                      />
                                    </div>
                                  </div>

                                  {formState.error && (
                                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>{formState.error}</span>
                                    </p>
                                  )}

                                  <div className="flex justify-end">
                                    <ButtonSpinner
                                      onClick={() => handleSaveEvaluation(q.id, ans.id, q.marks || 10)}
                                      loading={formState.saving}
                                      className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                                    >
                                      <span>{ans.evaluationStatus === 'EVALUATED' ? 'Update & Override' : 'Submit Grade'}</span>
                                    </ButtonSpinner>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 text-slate-400 text-xs rounded-xl text-center">
                              No answer recorded for this question.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseEvaluation}
                className="py-2 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
