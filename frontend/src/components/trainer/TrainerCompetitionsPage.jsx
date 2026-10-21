import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
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
  Award,
  Sparkles
} from 'lucide-react';
import {
  getTrainerAssignedCompetitions,
  getTrainerFilteredSubmissions,
  getTrainerAttemptDetail,
  evaluateVoiceAnswer
} from '../../api/competitionApi';
import { resolveFileUrl } from '../../api/fileApi';
import SafeVideo from '../common/SafeVideo';
import InlineSpinner from '../common/InlineSpinner';
import ButtonSpinner from '../common/ButtonSpinner';
import { useDialog } from '../../context/DialogContext';
import { formatDate } from '../../utils/dateFormatter';
import { useAuth } from '../../context/AuthContext';

const SET_STYLES = {
  A: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  B: { badge: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  C: { badge: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
  D: { badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' }
};

export default function TrainerCompetitionsPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useDialog();

  const [assignedCompetitions, setAssignedCompetitions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCompId, setSelectedCompId] = useState('ALL');
  const [selectedExamType, setSelectedExamType] = useState('ALL');
  const [selectedSetCode, setSelectedSetCode] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
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
      const compRes = await getTrainerAssignedCompetitions();
      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        setAssignedCompetitions(compRes.data);
      }
      await loadSubmissionsList();
    } catch (err) {
      console.error('Failed to load trainer competitions data:', err);
      showError('Failed to load assigned competitions');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionsList = async () => {
    try {
      const res = await getTrainerFilteredSubmissions({
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
      console.error('Failed to load trainer submissions:', err);
      setSubmissions([]);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadSubmissionsList();
    }
  }, [selectedCompId, selectedExamType, selectedSetCode, selectedStatus, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const compRes = await getTrainerAssignedCompetitions();
      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        setAssignedCompetitions(compRes.data);
      }
      await loadSubmissionsList();
      showSuccess('Submissions refreshed');
    } catch (e) {
      showError('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Available sets for the currently selected competition (or all assigned sets across all competitions)
  const availableSets = useMemo(() => {
    if (selectedCompId && selectedCompId !== 'ALL') {
      const comp = assignedCompetitions.find((c) => c.id === selectedCompId);
      return comp?.assignedSets || [];
    }
    const setMap = new Map();
    assignedCompetitions.forEach((c) => {
      (c.assignedSets || []).forEach((s) => {
        if (!setMap.has(s.code)) {
          setMap.set(s.code, s);
        }
      });
    });
    return Array.from(setMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [assignedCompetitions, selectedCompId]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'EVALUATION_PENDING').length;
    const evaluated = submissions.filter(
      (s) => s.status === 'EVALUATED' || s.status === 'COMPLETED'
    ).length;
    return { total, pending, evaluated };
  }, [submissions]);

  // Open Evaluation Drawer
  const handleOpenEvaluation = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setLoadingDetail(true);
    try {
      const res = await getTrainerAttemptDetail(attemptId);
      if (res && res.success && res.data) {
        setAttemptDetail(res.data);
        const map = {};
        const questions = res.data.questions || [];
        for (const q of questions) {
          const ans = q.studentAnswer;
          if (ans) {
            map[ans.id] = {
              marks: ans.marksAwarded != null ? ans.marksAwarded : '',
              feedback: ans.trainerFeedback || ans.feedback || '',
              saving: false,
              error: null
            };
          }
        }
        setEvaluatingMap(map);
      } else {
        showError(res?.message || 'Failed to load submission details');
      }
    } catch (err) {
      console.error('Error loading attempt detail:', err);
      showError('Could not load submission detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseEvaluation = () => {
    // Stop all audio
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && !audio.paused) {
        audio.pause();
      }
    });
    setPlayingAnswerId(null);
    setSelectedAttemptId(null);
    setAttemptDetail(null);
    setEvaluatingMap({});
    loadSubmissionsList();
  };

  // Save Evaluation for a single Question
  const handleSaveQuestionEvaluation = async (questionId, answerId, maxMarks) => {
    const state = evaluatingMap[answerId] || {};
    const marksNum = parseFloat(state.marks);

    if (isNaN(marksNum) || marksNum < 0) {
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: { ...prev[answerId], error: 'Please enter a valid positive score' }
      }));
      return;
    }

    if (marksNum > maxMarks) {
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: {
          ...prev[answerId],
          error: `Marks cannot exceed max marks (${maxMarks})`
        }
      }));
      return;
    }

    setEvaluatingMap((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], saving: true, error: null }
    }));

    try {
      const payload = {
        marksAwarded: marksNum,
        feedback: state.feedback || ''
      };
      const res = await evaluateVoiceAnswer(selectedAttemptId, answerId, payload);
      if (res && res.success) {
        showSuccess('Evaluation marks saved!');
        setEvaluatingMap((prev) => ({
          ...prev,
          [answerId]: { ...prev[answerId], saving: false, error: null }
        }));
        // Reload detail to update attempt status and answer evaluated tags
        const refreshed = await getTrainerAttemptDetail(selectedAttemptId);
        if (refreshed?.success && refreshed.data) {
          setAttemptDetail(refreshed.data);
        }
      } else {
        setEvaluatingMap((prev) => ({
          ...prev,
          [answerId]: {
            ...prev[answerId],
            saving: false,
            error: res?.message || 'Failed to save score'
          }
        }));
      }
    } catch (err) {
      console.error('Error evaluating answer:', err);
      setEvaluatingMap((prev) => ({
        ...prev,
        [answerId]: {
          ...prev[answerId],
          saving: false,
          error: err.message || 'Evaluation submission failed'
        }
      }));
    }
  };

  // Audio Playback Controls
  const togglePlayAudio = (answerId) => {
    const audio = audioRefs.current[answerId];
    if (!audio) return;

    if (playingAnswerId === answerId) {
      audio.pause();
      setPlayingAnswerId(null);
    } else {
      // Pause other audios
      Object.keys(audioRefs.current).forEach((k) => {
        if (k !== answerId && audioRefs.current[k]) {
          audioRefs.current[k].pause();
        }
      });
      audio.playbackRate = audioPlaybackSpeed;
      audio.play().catch((e) => console.error('Audio play error:', e));
      setPlayingAnswerId(answerId);
    }
  };

  const handleSpeedChange = (speed) => {
    setAudioPlaybackSpeed(speed);
    if (playingAnswerId && audioRefs.current[playingAnswerId]) {
      audioRefs.current[playingAnswerId].playbackRate = speed;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <InlineSpinner className="w-10 h-10 text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">
          Loading assigned competitions & submissions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 rounded-2xl text-amber-600 border border-amber-200">
              <Trophy className="w-6 h-6" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Trainer Competitions & Evaluations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review student submissions and evaluate question sets assigned to you by the admin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Competitions
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {assignedCompetitions.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {assignedCompetitions.reduce((acc, c) => acc + (c.totalAssignedSets || 0), 0)} Assigned Sets
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across your assigned sets</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.pending}</p>
          <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Awaiting evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Graded Submissions
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.evaluated}</p>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Marks recorded</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Competition Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Competition
            </label>
            <select
              value={selectedCompId}
              onChange={(e) => {
                setSelectedCompId(e.target.value);
                setSelectedSetCode('ALL');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Assigned Competitions</option>
              {assignedCompetitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Exam Types</option>
              <option value="TEST_SERIES">Test Series</option>
              <option value="MOCK_TEST">Mock Tests</option>
              <option value="FINAL">Final Assessment</option>
            </select>
          </div>

          {/* Set Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Assigned Set
            </label>
            <select
              value={selectedSetCode}
              onChange={(e) => setSelectedSetCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Assigned Sets</option>
              {availableSets.map((s) => (
                <option key={s.id || s.code} value={s.code}>
                  Set {s.code}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="EVALUATED">Graded / Completed</option>
            </select>
          </div>

          {/* Student Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, assessment..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Assigned Submissions</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700">
              {submissions.length}
            </span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No submissions found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {assignedCompetitions.length === 0
                ? 'You have not been assigned to any competition sets yet. The administrator will allocate sets to you for grading.'
                : 'No student submissions match your current filter settings. Try adjusting the competition, exam, set, or status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-4">Competition</th>
                  <th className="py-3.5 px-4">Exam</th>
                  <th className="py-3.5 px-4 text-center">Set</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Marks</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const setStyle = SET_STYLES[sub.setCode] || {
                    badge: 'bg-slate-100 text-slate-800 border-slate-200',
                    dot: 'bg-slate-400'
                  };
                  const isPending = sub.status === 'EVALUATION_PENDING';

                  return (
                    <tr
                      key={sub.attemptId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Student info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(sub.studentName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sub.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Competition Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {sub.competitionTitle || 'Competition'}
                      </td>

                      {/* Exam Title & Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.assessmentTitle}</div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 mt-0.5">
                          {sub.assessmentType === 'TEST_SERIES'
                            ? `Test #${sub.sequenceNo || ''}`
                            : sub.assessmentType === 'MOCK_TEST'
                            ? `Mock Test #${sub.sequenceNo || ''}`
                            : 'Final Assessment'}
                        </span>
                      </td>

                      {/* Set Code */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${setStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${setStyle.dot}`} />
                          Set {sub.setCode || 'A'}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(sub.submittedAt, 'MMM dd, yyyy HH:mm')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending Review
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Graded
                            </>
                          )}
                        </span>
                      </td>

                      {/* Marks */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {sub.totalMarks != null ? (
                          <span className="text-slate-900">
                            {sub.totalMarks}{' '}
                            <span className="text-slate-400 font-normal">
                              / {sub.maxMarks || 20}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleOpenEvaluation(sub.attemptId)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isPending
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          {isPending ? 'Evaluate' : 'Review Marks'}
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

      {/* EVALUATION DRAWER / MODAL */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Submission Evaluation & Grading
                  </h3>
                </div>
                {attemptDetail?.attempt && (
                  <p className="text-xs text-slate-500 font-medium">
                    Student:{' '}
                    <strong className="text-slate-800">
                      {attemptDetail.attempt.studentName}
                    </strong>{' '}
                    ({attemptDetail.attempt.studentEmail}) &bull;{' '}
                    <span className="font-bold text-indigo-700">
                      Set {attemptDetail.attempt.setCode}
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={handleCloseEvaluation}
                className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <InlineSpinner className="w-8 h-8 text-indigo-600 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Loading student answers & media...
                  </p>
                </div>
              ) : attemptDetail ? (
                <>
                  {/* Summary Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Assessment
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {attemptDetail.assessment?.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Submitted: {formatDate(attemptDetail.attempt?.submittedAt, 'PPpp')}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          MCQ Score
                        </div>
                        <div className="text-sm font-black text-slate-700">
                          {attemptDetail.attempt?.mcqMarks ?? 0}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Voice Score
                        </div>
                        <div className="text-sm font-black text-purple-700">
                          {attemptDetail.attempt?.voiceMarks ?? 0}
                        </div>
                      </div>
                      <div className="text-right border-l border-slate-200 pl-6">
                        <div className="text-[10px] font-bold text-indigo-500 uppercase">
                          Total Score
                        </div>
                        <div className="text-base font-black text-indigo-700">
                          {attemptDetail.attempt?.totalMarks ?? 0} /{' '}
                          {attemptDetail.attempt?.maxMarks || 20}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio Global Speed Switcher (if voice questions exist) */}
                  <div className="flex items-center justify-between px-4 py-2 bg-purple-50/60 rounded-xl border border-purple-100">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-purple-600" />
                      Audio Playback Speed
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                            audioPlaybackSpeed === spd
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-white text-purple-900 hover:bg-purple-100'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Questions and Answers List */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Student Responses ({attemptDetail.questions?.length || 0})
                    </h4>

                    {(attemptDetail.questions || []).map((q, idx) => {
                      const ans = q.studentAnswer;
                      const isVoice =
                        q.answerFormat === 'VOICE' ||
                        (ans?.audioUrl != null && ans?.audioUrl !== '');
                      const isVideo = q.answerFormat === 'VIDEO';
                      const formState = ans ? evaluatingMap[ans.id] || {} : {};

                      return (
                        <div
                          key={q.id || idx}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          {/* Question header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-indigo-700">
                                  Q{idx + 1}.
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                    isVoice
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : isVideo
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {isVoice
                                    ? 'Voice Answer'
                                    : isVideo
                                    ? 'Video Answer'
                                    : 'MCQ Option'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Max Marks: {q.marks || 1}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs mt-1">
                                {q.questionText}
                              </h5>
                            </div>

                            {ans && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  ans.evaluationStatus === 'EVALUATED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {ans.evaluationStatus === 'EVALUATED' ? 'Graded' : 'Pending'}
                              </span>
                            )}
                          </div>

                          {/* Media prompt if present */}
                          {q.mediaRef && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600">
                              <span className="font-bold text-slate-800">Media Prompt:</span>{' '}
                              <code className="text-[10px] font-mono text-indigo-700">
                                {q.mediaRef}
                              </code>
                            </div>
                          )}

                          {/* Student Answer Section */}
                          {ans ? (
                            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
                              {/* Voice Answer Media Player */}
                              {isVoice && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                      <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                                      Voice Recording
                                    </span>
                                    {ans.audioUrl && (
                                      <a
                                        href={resolveFileUrl(ans.audioUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Direct File Link
                                      </a>
                                    )}
                                  </div>

                                  {ans.audioUrl ? (
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() => togglePlayAudio(ans.id)}
                                        className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                                      >
                                        {playingAnswerId === ans.id ? (
                                          <Pause className="w-4 h-4" />
                                        ) : (
                                          <Play className="w-4 h-4 ml-0.5" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <audio
                                          ref={(el) => (audioRefs.current[ans.id] = el)}
                                          src={resolveFileUrl(ans.audioUrl)}
                                          onEnded={() => setPlayingAnswerId(null)}
                                          controls
                                          className="w-full h-8"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-amber-700 italic">
                                      No voice audio uploaded for this question.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Video Answer Media Player */}
                              {isVideo && (
                                <div className="space-y-2">
                                  <div className="text-xs font-bold text-slate-700">
                                    Submitted Video:
                                  </div>
                                  {ans.videoGuid ? (
                                    <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-w-md">
                                      <SafeVideo
                                        videoId={ans.videoGuid}
                                        title={`Answer to Q${idx + 1}`}
                                      />
                                    </div>
                                  ) : ans.videoUrl ? (
                                    <video
                                      src={resolveFileUrl(ans.videoUrl)}
                                      controls
                                      className="rounded-xl border border-slate-200 max-w-md"
                                    />
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">
                                      No video attached.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* MCQ Option Info */}
                              {!isVoice && !isVideo && (
                                <div className="text-xs text-slate-700">
                                  <span className="font-bold">Selected Option:</span>{' '}
                                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-indigo-700">
                                    {ans.selectedOption || 'None'}
                                  </span>
                                  {q.correctOption && (
                                    <span className="ml-3 text-[11px] text-slate-500">
                                      (Correct: {q.correctOption})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Evaluator Audit Trail if already evaluated */}
                              {ans.evaluatedBy && (
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                                  <span>
                                    Evaluated by:{' '}
                                    <strong className="text-slate-600">
                                      {ans.evaluatorName || user?.name || 'Trainer'}
                                    </strong>
                                  </span>
                                  {ans.evaluatedAt && (
                                    <span>{formatDate(ans.evaluatedAt, 'PPp')}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No answer submitted.</p>
                          )}

                          {/* Trainer Evaluation Controls (only for answers submitted) */}
                          {ans && (
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                  Grading & Remarks
                                </label>
                                {/* Quick Score Presets */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                                    Preset:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEvaluatingMap((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          ...prev[ans.id],
                                          marks: q.marks || 1
                                        }
                                      }))
                                    }
                                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 cursor-pointer"
                                  >
                                    Full ({q.marks || 1})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEvaluatingMap((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          ...prev[ans.id],
                                          marks: Math.round(((q.marks || 1) / 2) * 10) / 10
                                        }
                                      }))
                                    }
                                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 cursor-pointer"
                                  >
                                    Half ({Math.round(((q.marks || 1) / 2) * 10) / 10})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEvaluatingMap((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          ...prev[ans.id],
                                          marks: 0
                                        }
                                      }))
                                    }
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    0
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                    Marks Awarded (Max {q.marks || 1})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={q.marks || 1}
                                    step="0.5"
                                    value={formState.marks !== undefined ? formState.marks : ''}
                                    onChange={(e) =>
                                      setEvaluatingMap((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          ...prev[ans.id],
                                          marks: e.target.value
                                        }
                                      }))
                                    }
                                    placeholder="Marks"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                    Feedback / Remarks (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={formState.feedback || ''}
                                    onChange={(e) =>
                                      setEvaluatingMap((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          ...prev[ans.id],
                                          feedback: e.target.value
                                        }
                                      }))
                                    }
                                    placeholder="Provide constructive feedback for student..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>

                              {formState.error && (
                                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {formState.error}
                                </p>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={formState.saving}
                                  onClick={() =>
                                    handleSaveQuestionEvaluation(q.id, ans.id, q.marks || 1)
                                  }
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  {formState.saving && <ButtonSpinner />}
                                  Save Question Score
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Marks automatically update student attempt totals and leaderboard standings.
              </span>
              <button
                onClick={handleCloseEvaluation}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
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
