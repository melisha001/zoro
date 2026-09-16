import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, FileText, Check, Save } from 'lucide-react';

export default function TrainerAttendancePage() {
  const [selectedDate, setSelectedDate] = useState('2026-09-15');
  const [selectedBatch, setSelectedBatch] = useState('EN-L2');
  
  const [attendance, setAttendance] = useState([
    { id: 1, name: 'Abhishek', status: 'Present' },
    { id: 2, name: 'Nivetha', status: 'Present' },
    { id: 3, name: 'Tharun', status: 'Absent' },
    { id: 4, name: 'Divya', status: 'Present' },
  ]);

  const toggleAttendance = (id) => {
    setAttendance(attendance.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Mark and manage student attendance.</p>
      </div>

      {/* Selectors and Action buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              aria-label="Select batch"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
            >
              <option value="EN-L1">EN-L1</option>
              <option value="EN-L2">EN-L2</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button className="bg-[#0F52BA] hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm inline-flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 transition-colors">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 text-xs font-semibold">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {attendance.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Present'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toggleAttendance(item.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        item.status === 'Present'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      Mark {item.status === 'Present' ? 'Absent' : 'Present'}
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
