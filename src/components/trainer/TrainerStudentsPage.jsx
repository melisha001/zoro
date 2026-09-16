import React, { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';

export default function TrainerStudentsPage() {
  const studentsList = [
    { id: 1, name: 'S.J. Abhishek', batch: 'EN-L2', course: 'English Communication', status: 'Active' },
    { id: 2, name: 'Nivetha R', batch: 'EN-L2', course: 'English Communication', status: 'Active' },
    { id: 3, name: 'Tharun K', batch: 'EN-L1', course: 'English Communication', status: 'Active' },
    { id: 4, name: 'Divya S', batch: 'EN-L2', course: 'English Communication', status: 'Active' },
    { id: 5, name: 'Arjun M', batch: 'EN-L1', course: 'English Communication', status: 'Inactive' },
    { id: 6, name: 'Keerthana P', batch: 'EN-L2', course: 'English Communication', status: 'Active' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Students</h1>
          <p className="text-xs text-slate-500 font-medium">Manage and view the students assigned to you.</p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          />
        </div>
        <select className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
          <option>All Batches</option>
          <option>EN-L1</option>
          <option>EN-L2</option>
        </select>
        <select className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {studentsList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-mono text-slate-400">{s.id}</td>
                  <td className="py-4 px-4 font-black text-slate-900">{s.name}</td>
                  <td className="py-4 px-4 font-bold text-blue-900">{s.batch}</td>
                  <td className="py-4 px-4 text-slate-600">{s.course}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-3 py-1 rounded-lg">
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
