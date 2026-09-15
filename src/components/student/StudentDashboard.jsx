import React from 'react';
import { 
  Video, FileText, HelpCircle, Award, Calendar, 
  Clock, ArrowRight, Play, CheckCircle 
} from 'lucide-react';
import { STUDENT_DATA } from '../../data/mockData';

export default function StudentDashboard({ setActiveScreen }) {
  const studentStats = [
    { title: 'Upcoming Sessions', value: STUDENT_DATA.upcomingSessionsCount, icon: Video, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { title: 'Pending Assignments', value: STUDENT_DATA.pendingAssignmentsCount, icon: FileText, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { title: 'My Doubts', value: STUDENT_DATA.myDoubtsCount, icon: HelpCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { title: 'Attendance', value: STUDENT_DATA.attendancePercentage, icon: Award, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header Banner - Screen 6 Top */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center space-x-3">
            <img
              src={STUDENT_DATA.avatar}
              alt={STUDENT_DATA.name}
              className="w-12 h-12 rounded-full object-cover ring-4 ring-blue-100"
            />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome, {STUDENT_DATA.name}
              </h1>
              <p className="text-xs text-slate-500 font-bold">Keep learning. Keep growing!</p>
            </div>
          </div>
        </div>

        {/* Motivational Right Badge Card - Screen 6 Header illustration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex items-center space-x-4 shrink-0 shadow-xs">
          <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black text-xl shadow">
            💡
          </div>
          <div>
            <div className="text-xs font-black text-blue-950">"{STUDENT_DATA.quote}"</div>
            <div className="text-[10px] font-semibold text-slate-500">Every session brings you closer to victory</div>
          </div>
        </div>
      </div>

      {/* 4 Student Metric Cards (Row 2 - Screen 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {studentStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-5 rounded-2xl border ${stat.color} shadow-xs hover:shadow-sm transition-all space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{stat.title}</span>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming Session Highlight Card - Screen 6 Middle */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Video className="w-4 h-4 text-blue-600" />
            <span>Upcoming Session</span>
          </h3>
          <button 
            onClick={() => setActiveScreen('student-join')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow">12</span>
              <div>
                <span className="text-xs font-bold text-slate-400">September 2026</span>
                <h4 className="text-lg font-black text-slate-900">{STUDENT_DATA.nextSession.course}</h4>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pl-11">
              <span className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Topic: {STUDENT_DATA.nextSession.topic}</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{STUDENT_DATA.nextSession.time}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('student-join')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center space-x-2 shrink-0 text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Join Session</span>
          </button>
        </div>
      </div>

      {/* Recent Assignments Widget - Screen 6 Bottom */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Recent Assignments</span>
          </h3>
          <button 
            onClick={() => setActiveScreen('student-assignment')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {STUDENT_DATA.recentAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">{assignment.title}</td>
                  <td className="py-4 px-4 text-slate-500">{assignment.dueDate}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      assignment.status === 'Pending' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setActiveScreen('student-assignment')}
                      className="text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View
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
