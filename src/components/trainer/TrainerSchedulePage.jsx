import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function TrainerSchedulePage({ setActiveScreen }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Schedule</h1>
          <p className="text-xs text-slate-500 font-medium">View and manage your upcoming training sessions.</p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Reschedule</span>
        </button>
      </div>

      {/* Calendar Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-base font-black text-slate-900">September 2026</h3>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-xs">Week</button>
            <button className="px-3 py-1.5 hover:text-slate-900">Month</button>
            <button className="px-3 py-1.5 hover:text-slate-900">List</button>
          </div>
        </div>

        {/* Days Bar */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
          {[
            { day: 'Sun', date: '13' },
            { day: 'Mon', date: '14' },
            { day: 'Tue', date: '15', active: true },
            { day: 'Wed', date: '16' },
            { day: 'Thu', date: '17' },
            { day: 'Fri', date: '18' },
            { day: 'Sat', date: '19' },
          ].map((d, i) => (
            <div key={i} className={`p-3 rounded-2xl border transition-all ${
              d.active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200/60'
            }`}>
              <div className="text-[10px] uppercase">{d.day}</div>
              <div className="text-lg font-black mt-0.5">{d.date}</div>
            </div>
          ))}
        </div>

        {/* Schedule List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Monday, 15 September 2026</h4>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">5:00 PM – 6:00 PM</span>
              <h5 className="text-sm font-black text-slate-900">Level 2 – Present Tense</h5>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Online</span>
            </div>
            <button 
              onClick={() => setActiveScreen('trainer-sessions')}
              className="bg-emerald-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs"
            >
              Start
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">6:00 PM – 7:00 PM</span>
              <h5 className="text-sm font-black text-slate-900">Level 1 – Daily Conversation</h5>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Online</span>
            </div>
            <button 
              onClick={() => setActiveScreen('trainer-sessions')}
              className="bg-blue-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
