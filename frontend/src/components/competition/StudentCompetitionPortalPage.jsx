import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Trophy, Calendar, Clock, MapPin, Award, CheckCircle2, 
  FileText, BookOpen, Layers, Target, BarChart2, ArrowRight, 
  UserCheck, ShieldCheck, Sparkles, CheckSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCompetitionPortalContext } from '../../api/competitionApi';
import { formatDate } from '../../utils/dateFormatter';
import SkeletonCard from '../common/SkeletonCard';

export default function StudentCompetitionPortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentCompetition } = useOutletContext();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompetition?.id) return;
    loadPortalDetails();
  }, [currentCompetition]);

  const loadPortalDetails = async () => {
    setLoading(true);
    try {
      const res = await getCompetitionPortalContext(currentCompetition.id);
      if (res.success && res.data) {
        setPortalData(res.data);
      }
    } catch (err) {
      console.error('Failed to load competition portal details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const comp = portalData?.competition || currentCompetition;
  const reg = portalData?.registration;
  const set = portalData?.set;
  const serverNow = portalData?.serverNow ? new Date(portalData.serverNow).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{comp.category || 'National Scholastic Competition'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {comp.title || comp.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {comp.description || 'Welcome to your official competition preparation and examination portal.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300 pt-2">
            {(comp.startDate || comp.date) && (
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{formatDate(comp.startDate || comp.date)}{comp.startTime ? ` at ${comp.startTime}` : ''}</span>
              </div>
            )}
            {comp.venue && (
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{comp.venue}</span>
              </div>
            )}
            {serverNow && (
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs" title="Authoritative server clock">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Date & Time: {serverNow} IST</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Status Strip */}
      {reg && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Participant Name</span>
              <span className="text-sm font-black text-slate-900">{reg.studentName || 'Participant'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Registration Status</span>
            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{reg.paymentStatus || 'Confirmed (Paid)'}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Registered Email</span>
            <span className="text-slate-800 font-bold">{reg.studentEmail || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Trainer Evaluation Desk Callout Banner (if Trainer or Admin) */}
      {(user?.role === 'TRAINER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-400/40 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md inline-block mb-1">
                Assigned Set Evaluator Desk
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Grade Student Voice Responses
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Listen to audio recordings submitted by students in your assigned set and assign scores.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/competition/evaluations')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center space-x-2"
          >
            <span>Open Evaluation Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Portal Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Syllabus & Guidance Videos */}
        <div
          onClick={() => navigate('/competition/syllabus')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-blue-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              Syllabus & Guidance Videos
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Official curriculum syllabus PDF, topic breakdowns, and mentor video briefings to prepare thoroughly.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>View Syllabus</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Study Materials */}
        <div
          onClick={() => navigate('/competition/materials')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-emerald-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              Study Materials
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Practice worksheets, formula sheets, sample question papers, and downloadable revision notes.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Open Materials</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Test Series */}
        <div
          onClick={() => navigate('/competition/test-series')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-purple-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                Test Series
              </h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black">
                35 Slots
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Targeted chapter-wise and module-level MCQ test papers to benchmark accuracy and speed.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
            <span>Access Tests</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Mock Tests */}
        <div
          onClick={() => navigate('/competition/mock-tests')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-amber-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                Mock Tests
              </h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">
                4 Slots
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Full-length timed simulation exams with scheduled test windows to experience real exam conditions.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
            <span>Enter Mocks</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 5: Final Assessment */}
        <div
          onClick={() => navigate('/competition/final-assessment')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-rose-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                Final Assessment
              </h3>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black">
                Main Exam
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Official championship exam with set-shuffled papers, voice/audio submissions, and synchronized release.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
            <span>Exam Chamber</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 6: Live Leaderboard */}
        <div
          onClick={() => navigate('/competition/leaderboard')}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group hover:border-indigo-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              Championship Leaderboard
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Real-time rankings, performance statistics, and published ranks upon official completion.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>View Standings</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
