import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Mic, Volume2, Award, Clock, CheckCircle2, 
  AlertCircle, Search, User, Filter, ArrowLeft, RefreshCw, 
  Sparkles, ChevronRight, Save, Headphones, Layers, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getTrainerCompetitionEvaluations, 
  getTrainerAttemptDetail, 
  evaluateVoiceAnswer 
} from '../../api/competitionApi';
import { formatDate } from '../../utils/dateFormatter';
import SkeletonCard from '../common/SkeletonCard';

const SET_STYLES = {
  A: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: 'ring-emerald-400/30'
  },
  B: {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    ring: 'ring-blue-400/30'
  },
  C: {
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    ring: 'ring-purple-400/30'
  },
  D: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    ring: 'ring-amber-400/30'
  }
};

export default function TrainerCompetitionEvaluationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentCompetition } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Evaluation Modal State
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [evaluatingMap, setEvaluatingMap] = useState({}); // answerId -> { marks: string/number, feedback: string, saving: bool, error: string, success: bool }

  useEffect(() => {
    if (!currentCompetition?.id) return;
    loadEvaluations();
  }, [currentCompetition]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const res = await getTrainerCompetitionEvaluations(currentCompetition.id);
      if (res && res.success && Array.isArray(res.data)) {
        setSubmissions(res.data);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Failed to load trainer evaluations:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluation = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setLoadingDetail(true);
    try {
      const res = await getTrainerAttemptDetail(attemptId);
      if (res && res.success && res.data) {
        setAttemptDetail(res.data);
        
        // Initialize form fields for each question's answer
        const formInit = {};
        const questions = res.data.questions || [];
        for (const q of questions) {
          const ans = q.studentAnswer;
          if (ans) {
            formInit[ans.id] = {
              marks: ans.marksAwarded != null ? ans.marksAwarded : '',
              feedback: ans.feedback || ans.trainerFeedback || '',
              saving: false,
              error: '',
              success: false
            };
          }
        }
        setEvaluatingMap(formInit);
      }
    } catch (err) {
      console.error('Failed to load attempt detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseEvaluation = () => {
    setSelectedAttemptId(null);
    setAttemptDetail(null);
    loadEvaluations(); // Refresh list to update status and scores
  };

  const handleSaveEvaluation = async (questionId, answerId, maxMarks) => {
    const formData = evaluatingMap[answerId] || {};
    const marksNum = parseFloat(formData.marks);

    if (isNaN(marksNum)) {
      setEvaluatingMap(prev => ({
        ...prev,
        [answerId]: { ...prev[answerId], error: 'Please enter a valid number for marks awarded' }
      }));
      return;
    }

    if (marksNum < 0 || marksNum > maxMarks) {
      setEvaluatingMap(prev => ({
        ...prev,
        [answerId]: { ...prev[answerId], error: `Marks must be between 0 and ${maxMarks}` }
      }));
      return;
    }

    setEvaluatingMap(prev => ({
      ...prev,
      [answerId]: { ...prev[answerId], saving: true, error: '', success: false }
    }));

    try {
      const payload = {
        marksAwarded: marksNum,
        feedback: formData.feedback || ''
      };
      const res = await evaluateVoiceAnswer(selectedAttemptId, answerId, payload);
      if (res && res.success) {
        setEvaluatingMap(prev => ({
          ...prev,
          [answerId]: { ...prev[answerId], saving: false, success: true, error: '' }
        }));

        // Refresh attempt detail in modal to reflect new score and status
        const refreshRes = await getTrainerAttemptDetail(selectedAttemptId);
        if (refreshRes && refreshRes.success && refreshRes.data) {
          setAttemptDetail(refreshRes.data);
        }
      } else {
        setEvaluatingMap(prev => ({
          ...prev,
          [answerId]: { ...prev[answerId], saving: false, error: res?.message || 'Failed to save evaluation' }
        }));
      }
    } catch (err) {
      setEvaluatingMap(prev => ({
        ...prev,
        [answerId]: { ...prev[answerId], saving: false, error: err.message || 'Error occurred while saving evaluation' }
      }));
    }
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (filterTab === 'PENDING') {
      if (sub.status !== 'EVALUATION_PENDING' && sub.voicePendingCount === 0) return false;
    } else if (filterTab === 'COMPLETED') {
      if (sub.status !== 'COMPLETED') return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (sub.studentName || '').toLowerCase().includes(term);
      const matchEmail = (sub.studentEmail || '').toLowerCase().includes(term);
      const matchReg = (sub.registrationId || '').toLowerCase().includes(term);
      const matchSet = (sub.setCode || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchReg && !matchSet) return false;
    }
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === 'EVALUATION_PENDING' || s.voicePendingCount > 0).length;
  const completedCount = submissions.filter(s => s.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-slate-900">
      
      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-700 text-xs font-bold">
            <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Trainer Voice Evaluation Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Examination Voice Paper Grading
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
            Listen to student speech recordings from your assigned examination set, evaluate clarity and cadence, and assign authoritative marks.
          </p>
        </div>

        <button
          onClick={loadEvaluations}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shrink-0 border border-slate-200"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Assigned Submissions</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{submissions.length}</div>
          <div className="text-[11px] font-semibold text-slate-400">Strict Set Isolation active</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1.5 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending Evaluation</span>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-amber-900">{pendingCount}</div>
          <div className="text-[11px] font-bold text-amber-600">Requires voice grading</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-1.5 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Completed & Evaluated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900">{completedCount}</div>
          <div className="text-[11px] font-bold text-emerald-600">Scores published</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              filterTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              filterTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, email, registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No submissions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterTab === 'PENDING'
              ? 'Great job! All pending voice responses from your assigned set have been evaluated.'
              : 'No examination attempts matching the current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Set</th>
                  <th className="py-3.5 px-4">Assessment</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Voice Progress</th>
                  <th className="py-3.5 px-4 text-right">Marks Awarded</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSubmissions.map((sub) => {
                  const setStyle = SET_STYLES[sub.setCode] || SET_STYLES.A;
                  const isPending = sub.status === 'EVALUATION_PENDING' || sub.voicePendingCount > 0;
                  return (
                    <tr key={sub.attemptId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sub.studentEmail || sub.registrationId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${setStyle.badge}`}>
                          Set {sub.setCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{sub.assessmentTitle}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{sub.assessmentType} Exam</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {sub.submittedAt ? formatDate(sub.submittedAt) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>Evaluation Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <Mic className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-bold text-slate-700">
                            {sub.voiceEvaluatedCount} / {sub.voiceQuestionsCount} graded
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          {sub.totalMarks != null ? Number(sub.totalMarks).toFixed(1) : '0.0'}
                          <span className="text-slate-400 text-xs font-normal"> / {sub.maxMarks}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          MCQ: {Number(sub.mcqMarks || 0).toFixed(1)} | Voice: {Number(sub.voiceMarks || 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEvaluation(sub.attemptId)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            isPending
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{isPending ? 'Evaluate Paper' : 'View Scores'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Voice Response Evaluation
                  </span>
                  {attemptDetail?.attempt?.setCode && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      Set {attemptDetail.attempt.setCode}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white">
                  {attemptDetail?.attempt?.studentName || 'Student Attempt'}
                </h2>
                <div className="text-xs text-slate-400 flex items-center space-x-3">
                  <span>Reg ID: <strong className="text-slate-300 font-mono">{attemptDetail?.attempt?.registrationId}</strong></span>
                  <span>•</span>
                  <span>Exam: <strong className="text-slate-300">{attemptDetail?.attempt?.assessmentTitle}</strong></span>
                </div>
              </div>

              <button
                onClick={handleCloseEvaluation}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scorecard Strip */}
            {attemptDetail && (
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Auto-Graded MCQ</span>
                    <span className="text-sm font-black text-slate-900">{Number(attemptDetail.attempt.mcqMarks || 0).toFixed(1)} marks</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trainer Voice Marks</span>
                    <span className="text-sm font-black text-blue-600">{Number(attemptDetail.attempt.voiceMarks || 0).toFixed(1)} marks</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Score</span>
                    <span className="text-base font-black text-emerald-600">
                      {Number(attemptDetail.attempt.totalMarks || 0).toFixed(1)} / {attemptDetail.attempt.maxMarks}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Attempt Status</span>
                  {attemptDetail.attempt.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>COMPLETED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>EVALUATION PENDING</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Questions Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">Loading student submission details & audio files...</p>
                </div>
              ) : !attemptDetail ? (
                <div className="py-12 text-center text-slate-500 text-xs">Failed to load attempt details.</div>
              ) : (
                attemptDetail.questions.map((q, idx) => {
                  const ans = q.studentAnswer;
                  const isVoice = q.answerFormat === 'VOICE' || (ans && ans.voiceFileId);
                  const form = (ans && evaluatingMap[ans.id]) || { marks: '', feedback: '', saving: false, error: '', success: false };

                  return (
                    <div 
                      key={q.id} 
                      className={`rounded-2xl border p-5 space-y-4 ${
                        isVoice 
                          ? 'border-indigo-200 bg-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      {/* Question Top Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            Question {idx + 1}
                          </span>
                          {isVoice ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                              <Mic className="w-3 h-3 text-purple-600" />
                              <span>Voice Response Task</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                              Objective MCQ
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-600">
                          Max Marks: <strong className="text-slate-900 font-black">{q.marks}</strong>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {q.questionText}
                      </div>

                      {/* Guidance text if present */}
                      {q.guidanceText && (
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 font-medium">
                          <strong className="font-bold">Evaluation Guidance: </strong>
                          {q.guidanceText}
                        </div>
                      )}

                      {/* Non-Voice MCQ Display */}
                      {!isVoice && (
                        <div className="text-xs text-slate-600 space-y-1 pt-2">
                          <div>Student Choice: {ans?.selectedOptionId ? 'Selected Option' : 'Not Answered'}</div>
                          <div>Evaluation: <strong className={ans?.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{ans?.isCorrect ? 'Correct (+10 marks)' : 'Incorrect (0 marks)'}</strong></div>
                        </div>
                      )}

                      {/* VOICE RESPONSE EVALUATION SECTION */}
                      {isVoice && (
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          
                          {/* Audio Player Box */}
                          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                                <Headphones className="w-4 h-4 text-amber-400" />
                                <span>Student Recorded Response</span>
                              </div>
                              {ans?.voiceDurationSec && (
                                <span className="text-slate-400 text-[11px] font-mono">
                                  Duration: {ans.voiceDurationSec}s
                                </span>
                              )}
                            </div>

                            {ans?.audioUrl ? (
                              <div className="space-y-2">
                                <audio 
                                  controls 
                                  src={ans.audioUrl} 
                                  className="w-full h-10 rounded-lg outline-hidden"
                                />
                                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                  <span>Authoritative recording stored securely in Bunny Storage</span>
                                  <a 
                                    href={ans.audioUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-amber-400 hover:underline font-bold"
                                  >
                                    Direct audio link ↗
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-rose-400 font-medium py-2">
                                Audio recording not found or student skipped this question.
                              </div>
                            )}
                          </div>

                          {/* Evaluation Status Banner */}
                          {ans?.evaluationStatus === 'EVALUATED' && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-emerald-800">
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Evaluated by Trainer ({Number(ans.marksAwarded).toFixed(1)} / {q.marks} marks)</span>
                              </div>
                              {ans.evaluatedAt && (
                                <span className="text-emerald-700 font-normal text-[11px]">
                                  Graded on {formatDate(ans.evaluatedAt)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Grading Form */}
                          {ans && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Assign Marks & Constructive Feedback
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-700">
                                    Marks Awarded (Max: {q.marks})
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={q.marks}
                                      value={form.marks}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEvaluatingMap(prev => ({
                                          ...prev,
                                          [ans.id]: { ...prev[ans.id], marks: val, error: '', success: false }
                                        }));
                                      }}
                                      placeholder={`0 to ${q.marks}`}
                                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                      / {q.marks}
                                    </span>
                                  </div>

                                  {/* Quick Score Chips */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    {[q.marks, Math.round(q.marks * 0.8), Math.round(q.marks * 0.5), 0].map((score) => (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() => {
                                          setEvaluatingMap(prev => ({
                                            ...prev,
                                            [ans.id]: { ...prev[ans.id], marks: score, error: '', success: false }
                                          }));
                                        }}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                                      >
                                        {score}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="sm:col-span-2 space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-700">
                                    Trainer Feedback / Remarks
                                  </label>
                                  <textarea
                                    rows="2"
                                    value={form.feedback}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEvaluatingMap(prev => ({
                                        ...prev,
                                        [ans.id]: { ...prev[ans.id], feedback: val, error: '', success: false }
                                      }));
                                    }}
                                    placeholder="Provide feedback on pronunciation, vocabulary, fluency, and delivery..."
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                                  />
                                </div>
                              </div>

                              {form.error && (
                                <div className="text-xs text-rose-600 font-bold flex items-center space-x-1.5">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>{form.error}</span>
                                </div>
                              )}

                              {form.success && (
                                <div className="text-xs text-emerald-600 font-bold flex items-center space-x-1.5">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Score successfully saved and student total recalculated!</span>
                                </div>
                              )}

                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  disabled={form.saving}
                                  onClick={() => handleSaveEvaluation(q.id, ans.id, q.marks)}
                                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
                                >
                                  {form.saving ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                      <span>Saving Evaluation...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4" />
                                      <span>Save Voice Evaluation</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Evaluations are instantly logged and scores update on the student's result card.
              </div>
              <button
                onClick={handleCloseEvaluation}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close & Return to List
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
