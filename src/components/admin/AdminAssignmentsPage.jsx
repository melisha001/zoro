import React, { useState } from 'react';
import { FileText, Plus, Search, CheckCircle2, Clock, Trash2, Edit2, X } from 'lucide-react';

export default function AdminAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Self Introduction Speech', course: 'English Communication', batch: 'EN-L2', trainer: 'Ms. Priya', assignedOn: '10 Sep 2026', dueDate: '16 Sep 2026', status: 'Active', submissions: 24, total: 28 },
    { id: 2, title: 'Grammar Practice Worksheet', course: 'English Communication', batch: 'EN-L1', trainer: 'Mr. Rajesh', assignedOn: '12 Sep 2026', dueDate: '18 Sep 2026', status: 'Active', submissions: 18, total: 25 },
    { id: 3, title: 'Vocabulary List & Synonyms', course: 'English Communication', batch: 'EN-L2', trainer: 'Ms. Priya', assignedOn: '14 Sep 2026', dueDate: '20 Sep 2026', status: 'Active', submissions: 15, total: 28 },
    { id: 4, title: 'Interactive Story Writing', course: 'English Communication', batch: 'EN-L2', trainer: 'Ms. Priya', assignedOn: '15 Sep 2026', dueDate: '22 Sep 2026', status: 'Draft', submissions: 0, total: 28 },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    course: 'English Communication',
    batch: 'EN-L2',
    trainer: 'Ms. Priya',
    dueDate: '2026-09-25',
    status: 'Active'
  });

  const handleAddAssignment = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      ...formData,
      assignedOn: '17 Sep 2026',
      submissions: 0,
      total: 28
    };
    setAssignments([newItem, ...assignments]);
    setShowAddModal(false);
    setFormData({ title: '', course: 'English Communication', batch: 'EN-L2', trainer: 'Ms. Priya', dueDate: '2026-09-25', status: 'Active' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === 'All' || item.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Master Assignments</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage course assignments, due dates, and student submission tracking across all batches.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 text-xs sm:text-sm self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-3 items-center">
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto"
        >
          <option value="All">All Batches</option>
          <option value="EN-L1">EN-L1</option>
          <option value="EN-L2">EN-L2</option>
        </select>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Title & Course</th>
                <th className="py-3.5 px-4">Batch & Trainer</th>
                <th className="py-3.5 px-4">Assigned On</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Submissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAssignments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                    <div className="text-slate-500 text-xs">{item.course}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-[#0F52BA]">{item.batch}</div>
                    <div className="text-slate-500 text-xs">{item.trainer}</div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{item.assignedOn}</td>
                  <td className="py-4 px-4 text-slate-600 font-semibold">{item.dueDate}</td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-900">{item.submissions}</span> / <span className="text-slate-500">{item.total}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      item.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Create New Assignment</h3>

            <form onSubmit={handleAddAssignment} className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essay Writing on Environment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="EN-L1">EN-L1</option>
                    <option value="EN-L2">EN-L2</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trainer</label>
                  <select
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Ms. Priya">Ms. Priya</option>
                    <option value="Mr. Rajesh">Mr. Rajesh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-colors text-xs mt-2 cursor-pointer"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
