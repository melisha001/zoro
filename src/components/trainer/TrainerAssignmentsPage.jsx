import React, { useState } from 'react';
import { Plus, Search, Filter, BookOpen, Clock, CheckCircle2, FileText } from 'lucide-react';

export default function TrainerAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Self Introduction', batch: 'EN-L2', course: 'English Communication', assignedOn: '10 Sep', dueDate: '16 Sep', status: 'Active', submissions: 24, totalStudents: 28 },
    { id: 2, title: 'Grammar Practice', batch: 'EN-L1', course: 'English Communication', assignedOn: '12 Sep', dueDate: '18 Sep', status: 'Active', submissions: 18, totalStudents: 25 },
    { id: 3, title: 'Vocabulary List', batch: 'EN-L2', course: 'English Communication', assignedOn: '14 Sep', dueDate: '20 Sep', status: 'Active', submissions: 15, totalStudents: 28 },
    { id: 4, title: 'Conversation Writing', batch: 'EN-L2', course: 'English Communication', assignedOn: '14 Sep', dueDate: '21 Sep', status: 'Draft', submissions: 0, totalStudents: 28 },
  ]);

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === 'All' || item.batch === selectedBatch;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Assignment</h1>
          <p className="text-slate-500 text-sm mt-1">Upload and assign assignments to your students.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-[#0F52BA] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm">
          <Plus className="w-4 h-4" />
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
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
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by status"
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 text-xs font-semibold">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Course/Batch</th>
                <th className="py-3.5 px-4">Assigned On</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAssignments.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{item.title}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{item.batch}</td>
                  <td className="py-4 px-4 text-slate-600">{item.assignedOn}</td>
                  <td className="py-4 px-4 text-slate-600">{item.dueDate}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-[#0F52BA] hover:text-blue-700 font-semibold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
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
