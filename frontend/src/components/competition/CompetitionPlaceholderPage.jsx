import React from 'react';
import { Sparkles, ArrowLeft, Trophy, Calendar, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompetitionPlaceholderPage({ title, description, icon: Icon = Trophy, badge = 'Phase 2 Exam Engine' }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-in fade-in duration-200">
      <button
        onClick={() => navigate('/competition')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Competition Overview</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-100">
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{badge}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-md mx-auto text-xs text-slate-600 space-y-2 font-medium">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Release Schedule:</span>
            </span>
            <span className="font-bold text-slate-800">Prompt 2 Rollout</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Engine Status:</span>
            </span>
            <span className="font-bold text-emerald-600">Schema Ready & Migrated</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/competition')}
          className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-md inline-flex items-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>Explore Syllabus & Study Materials</span>
        </button>
      </div>
    </div>
  );
}
