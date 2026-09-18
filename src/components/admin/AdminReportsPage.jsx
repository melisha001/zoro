import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Download, Star, Award, CheckCircle2, FileText, Calendar } from 'lucide-react';

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const trainerPerformance = [
    { name: 'Ms. Priya', course: 'English Communication', classes: '26/28', corrections: '24/28', rating: '4.8 / 5.0', satisfaction: 96 },
    { name: 'Mr. Rajesh', course: 'Grammar & Phonics', classes: '24/24', corrections: '22/24', rating: '4.9 / 5.0', satisfaction: 98 },
    { name: 'Ms. Anitha', course: 'Abacus Level 3', classes: '20/20', corrections: '20/20', rating: '4.7 / 5.0', satisfaction: 94 },
  ];

  const courseStats = [
    { title: 'English Communication - Level 2', batch: 'EN-L2', enrolled: 28, attendance: '95%', completion: '88%' },
    { title: 'English Communication - Level 1', batch: 'EN-L1', enrolled: 25, attendance: '92%', completion: '84%' },
    { title: 'Abacus Speed Calculation Level 3', batch: 'AB-L3', enrolled: 20, attendance: '96%', completion: '90%' },
    { title: 'Chess Strategic Thinking', batch: 'CH-L1', enrolled: 15, attendance: '90%', completion: '80%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Academy Analytics & Reports</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Comprehensive performance reports, trainer scorecards, and student enrollment metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
          >
            <option value="This Month">This Month (Sep 2026)</option>
            <option value="Last Month">Last Month (Aug 2026)</option>
            <option value="Quarter 3">Quarter 3 (2026)</option>
          </select>

          <button
            onClick={() => alert('Generating full Academy Performance PDF Report...')}
            className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Student Satisfaction</div>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <span>4.9</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Based on 88 student reviews</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Avg Attendance Rate</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">94.2%</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">↑ 2.1% higher than last month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Enrolled Students</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">88</div>
          <div className="text-[10px] text-[#0F52BA] font-bold mt-1">Across 4 active courses</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Assignment Completion</div>
          <div className="text-2xl font-black text-purple-600 mt-1">87.5%</div>
          <div className="text-[10px] text-purple-700 font-bold mt-1">57 of 65 submissions completed</div>
        </div>
      </div>

      {/* Trainer Performance Scorecard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0F52BA]" />
          <span>Trainer Performance Scorecard</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Trainer Name</th>
                <th className="py-3 px-4">Assigned Specialities</th>
                <th className="py-3 px-4">Classes Conducted</th>
                <th className="py-3 px-4">Assignments Corrected</th>
                <th className="py-3 px-4">Student Rating</th>
                <th className="py-3 px-4">Satisfaction Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {trainerPerformance.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.course}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{item.classes}</td>
                  <td className="py-3.5 px-4 text-slate-700">{item.corrections}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-600">{item.rating}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.satisfaction}%` }}></div>
                      </div>
                      <span className="font-bold text-emerald-700">{item.satisfaction}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Enrollment & Progress Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0F52BA]" />
          <span>Course Metrics & Attendance Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseStats.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                <span className="text-xs font-extrabold text-[#0F52BA] bg-blue-100 px-2.5 py-0.5 rounded-full">{item.batch}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Enrolled</span>
                  <span className="font-bold text-slate-800">{item.enrolled} Students</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Avg Attendance</span>
                  <span className="font-bold text-emerald-600">{item.attendance}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Completion Rate</span>
                  <span className="font-bold text-purple-600">{item.completion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
