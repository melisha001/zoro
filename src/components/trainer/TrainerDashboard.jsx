import React from 'react';
import { 
  Users, Calendar, Video, FileText, CheckSquare, 
  HelpCircle, PlayCircle, Clock, Award, CheckCircle2 
} from 'lucide-react';
import { TRAINER_DATA } from '../../data/mockData';

export default function TrainerDashboard({ setActiveScreen }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header Banner - Page 1 PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Good morning, Ms. Priya!</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Here's your teaching overview for today.</p>
        </div>

        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60 self-start sm:self-center">
          Monday, 15 September 2026
        </div>
      </div>

      {/* 4 Trainer KPI Cards - Page 1 PDF */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-500">Today's Sessions</div>
          <div className="text-3xl font-black text-slate-900">3</div>
          <div className="text-[11px] font-extrabold text-emerald-600">2 completed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-500">My Students</div>
          <div className="text-3xl font-black text-slate-900">28</div>
          <div className="text-[11px] font-extrabold text-blue-600">Across 2 batches</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-500">Pending Corrections</div>
          <div className="text-3xl font-black text-slate-900">8</div>
          <div className="text-[11px] font-extrabold text-rose-600">Assignments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-500">Doubts to Answer</div>
          <div className="text-3xl font-black text-slate-900">2</div>
          <div className="text-[11px] font-extrabold text-purple-600">From students</div>
        </div>

      </div>

      {/* Main Grid: Today's Schedule + My Performance (Page 1 PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Today's Schedule (Left 7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">Today's Schedule</h3>
            <button 
              onClick={() => setActiveScreen('trainer-schedule')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-blue-900">5:00 PM</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">Level 2 – Present Tense</h4>
                <p className="text-[11px] font-semibold text-slate-500">English Communication</p>
              </div>
              <button 
                onClick={() => setActiveScreen('trainer-sessions')}
                className="bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-blue-700"
              >
                Orient
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-blue-900">6:00 PM</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">Level 1 – Daily Conversation</h4>
                <p className="text-[11px] font-semibold text-slate-500">English Communication</p>
              </div>
              <button 
                onClick={() => setActiveScreen('trainer-sessions')}
                className="bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-blue-700"
              >
                Join
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-blue-900">7:00 PM</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">Level 2 – Vocabulary Building</h4>
                <p className="text-[11px] font-semibold text-slate-500">English Communication</p>
              </div>
              <button 
                onClick={() => setActiveScreen('trainer-sessions')}
                className="bg-blue-100 text-blue-800 font-extrabold px-4 py-2 rounded-xl text-xs"
              >
                Online
              </button>
            </div>
          </div>
        </div>

        {/* My Performance (Right 5 cols) - Gauge Ring */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            My Performance (This Month)
          </h3>

          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="92, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-2xl font-black text-slate-900">92%</span>
            </div>

            <div className="w-full space-y-3 pt-2 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Classes Conducted</span>
                </div>
                <span className="font-extrabold text-slate-900">26 / 28</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Assignments Corrected</span>
                </div>
                <span className="font-extrabold text-slate-900">24 / 28</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Student Satisfaction</span>
                </div>
                <span className="font-extrabold text-slate-900">4.8 / 5.0</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
