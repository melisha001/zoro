import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TrainerSubmissionsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');

  const submissions = [
    { id: 1, student: 'Abhishek', assignment: 'Self Introduction', submittedOn: '14 Sep', status: 'Pending', type: 'pending' },
    { id: 2, student: 'Nivetha', assignment: 'Grammar Practice', submittedOn: '14 Sep', status: 'Pending', type: 'pending' },
    { id: 3, student: 'Tharun', assignment: 'Vocabulary List', submittedOn: '13 Sep', status: 'Pending', type: 'pending' },
    { id: 4, student: 'Divya', assignment: 'Conversation Writing', submittedOn: '12 Sep', status: 'Overdue', type: 'overdue' },
    { id: 5, student: 'Arjun M', assignment: 'Self Introduction', submittedOn: '10 Sep', status: 'Corrected', type: 'corrected' },
    { id: 6, student: 'Keerthana P', assignment: 'Grammar Practice', submittedOn: '11 Sep', status: 'Corrected', type: 'corrected' },
  ];

  const filteredSubmissions = submissions.filter(item => {
    const matchesTab = item.type === activeTab;
    const matchesSearch = item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.assignment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Assignment Submissions</h1>
        <p className="text-slate-500 text-sm mt-1">Review and correct student submissions.</p>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedBatch} 
            onChange={(e) => setSelectedBatch(e.target.value)}
            aria-label="Filter by batch"
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
          >
            <option value="All">All Batches</option>
            <option value="EN-L1">EN-L1</option>
            <option value="EN-L2">EN-L2</option>
          </select>

          <select 
            aria-label="Filter by status"
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
          >
            <option value="All">All Status</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by student or assignment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'pending'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending (8)
        </button>
        <button
          onClick={() => setActiveTab('corrected')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'corrected'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Corrected (24)
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'overdue'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overdue (2)
        </button>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 text-xs font-semibold">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Assignment</th>
                <th className="py-3.5 px-4">Submitted On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSubmissions.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{item.student}</td>
                  <td className="py-4 px-4 text-slate-700 font-medium">{item.assignment}</td>
                  <td className="py-4 px-4 text-slate-600">{item.submittedOn}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : item.status === 'Corrected'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="bg-[#0F52BA] text-white hover:bg-blue-700 font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors">
                      {item.status === 'Corrected' ? 'View Grade' : 'Correct'}
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
