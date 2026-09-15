import React from 'react';
import { 
  Users, Calendar, Video, FileText, CheckSquare, 
  HelpCircle, PlayCircle, Clock 
} from 'lucide-react';
import { TRAINER_DATA } from '../../data/mockData';

export default function TrainerDashboard({ setActiveScreen }) {
  const trainerStats = [
    { title: 'My Students', value: TRAINER_DATA.myStudents, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { title: "Today's Sessions", value: TRAINER_DATA.todaysSessionsCount, icon: Calendar, color: 'bg-emerald-50 text-emerald-700' },
    { title: 'Upcoming Sessions', value: TRAINER_DATA.upcomingSessionsCount, icon: Video, color: 'bg-purple-50 text-purple-700' },
    { title: 'Pending Assignments', value: TRAINER_DATA.pendingAssignments, icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { title: 'To Be Corrected', value: TRAINER_DATA.toBeCorrected, icon: CheckSquare, color: 'bg-rose-50 text-rose-700' },
    { title: 'Unresolved Doubts', value: TRAINER_DATA.unresolvedDoubts, icon: HelpCircle, color: 'bg-teal-50 text-teal-700' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header Banner - Screen 5 Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {TRAINER_DATA.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium">Here's your teaching overview for today.</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <img
            src={TRAINER_DATA.avatar}
            alt={TRAINER_DATA.name}
            className="w-12 h-12 rounded-full object-cover ring-4 ring-blue-100"
          />
          <div>
            <div className="text-xs font-bold text-slate-800">{TRAINER_DATA.name}</div>
            <div className="text-[10px] font-semibold text-blue-600">{TRAINER_DATA.role}</div>
          </div>
        </div>
      </div>

      {/* Grid of 6 Trainer Metric Cards (Row 2 - Screen 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {trainerStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all space-y-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">{stat.title}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Sessions Table - Screen 5 Bottom */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Today's Sessions</h3>
            <p className="text-[11px] font-medium text-slate-400">Launch live Google Meet classes with one click</p>
          </div>
          <button className="text-xs font-bold text-blue-600 hover:text-blue-800">View All</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {TRAINER_DATA.todaysSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 flex items-center space-x-2 font-bold text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{session.time}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-blue-900">{session.course}</td>
                  <td className="py-4 px-4 text-slate-600">{session.topic}</td>
                  <td className="py-4 px-4">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-700">
                      {session.students} enrolled
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setActiveScreen('student-join')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-lg shadow-xs hover:shadow transition-all inline-flex items-center space-x-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Join / Start</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
