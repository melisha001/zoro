import React from 'react';
import { 
  Users, DollarSign, UserCheck, Activity, AlertCircle, 
  FileText, HelpCircle, Video, TrendingUp, Filter 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ADMIN_STATS } from '../../data/mockData';

export default function AdminDashboard() {
  const primaryStats = [
    { title: 'New Admissions', value: ADMIN_STATS.newAdmissions, icon: Users, color: 'border-l-4 border-blue-600 bg-blue-50/50 text-blue-700' },
    { title: 'Fee Revenue', value: ADMIN_STATS.feeRevenue, icon: DollarSign, color: 'border-l-4 border-emerald-600 bg-emerald-50/50 text-emerald-700' },
    { title: 'Students Joined', value: ADMIN_STATS.studentsJoined, icon: UserCheck, color: 'border-l-4 border-purple-600 bg-purple-50/50 text-purple-700' },
    { title: 'Active Students', value: ADMIN_STATS.activeStudents, icon: Activity, color: 'border-l-4 border-amber-500 bg-amber-50/50 text-amber-700' },
  ];

  const secondaryStats = [
    { title: 'Pending Fees', value: ADMIN_STATS.pendingFees, icon: AlertCircle, color: 'border-l-4 border-rose-500 bg-rose-50/50 text-rose-700' },
    { title: 'Assignments Pending', value: ADMIN_STATS.assignmentsPending, icon: FileText, color: 'border-l-4 border-yellow-500 bg-yellow-50/50 text-yellow-800' },
    { title: 'Unresolved Doubts', value: ADMIN_STATS.unresolvedDoubts, icon: HelpCircle, color: 'border-l-4 border-teal-500 bg-teal-50/50 text-teal-700' },
    { title: 'Total Sessions', value: ADMIN_STATS.totalSessions, icon: Video, color: 'border-l-4 border-indigo-600 bg-indigo-50/50 text-indigo-700' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Title Header - Screen 4 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Academy performance metrics and operational statistics.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-100">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Month: Sep 2026</span>
          </button>
        </div>
      </div>

      {/* Top Primary Metric Cards (Row 1 - Screen 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 ${stat.color} transition-all hover:shadow-md`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metric Cards (Row 2 - Screen 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {secondaryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 ${stat.color} transition-all hover:shadow-md`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar Charts Row (Row 3 - Screen 4 Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: New Admissions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>New Admissions (Jan – Sep)</span>
            </h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">+18% MoM</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ADMIN_STATS.admissionsChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fee Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Fee Revenue (Jan – Sep)</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Total: ₹1,85,000</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ADMIN_STATS.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
