import React, { useState } from 'react';
import { Video, Copy, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function TrainerSessionsPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('student list');

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://meet.google.com/abc-defg-hij');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const studentAttendance = [
    { id: 1, name: 'S.J. Abhishek', status: 'Joined', joinTime: '5:01 PM' },
    { id: 2, name: 'Nivetha R', status: 'Joined', joinTime: '5:02 PM' },
    { id: 3, name: 'Tharun K', status: 'Not Joined', joinTime: '–' },
    { id: 4, name: 'Divya S', status: 'Joined', joinTime: '5:01 PM' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Session</h1>
        <p className="text-xs text-slate-500 font-medium">Conduct your session, manage attendance and take notes.</p>
      </div>

      {/* Current Session Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">Current Session</span>
          <h2 className="text-xl font-black text-slate-900 mt-2">Level 2 – Present Tense</h2>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mt-2">
            <span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /> Mon, 15 Sep 2026</span>
            <span className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> 5:00 PM – 6:00 PM</span>
            <span className="flex items-center space-x-1"><Video className="w-3.5 h-3.5 text-emerald-600" /> Online (Google Meet)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.open('https://meet.google.com/abc-defg-hij', '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md text-xs flex items-center space-x-2"
          >
            <Video className="w-4 h-4" />
            <span>Start Session</span>
          </button>

          <button 
            onClick={handleCopyLink}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 border border-slate-200"
          >
            <Copy className="w-4 h-4 text-slate-500" />
            <span>{copied ? 'Copied Link!' : 'Copy Meet Link'}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Student Join List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
          {['student list', 'session notes', 'resources'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 capitalize border-b-2 ${
                activeTab === tab ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'student list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Join Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {studentAttendance.map((s) => (
                  <tr key={s.id}>
                    <td className="py-4 px-4 font-mono text-slate-400">{s.id}</td>
                    <td className="py-4 px-4 font-black text-slate-900">{s.name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        s.status === 'Joined' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-bold">{s.joinTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
