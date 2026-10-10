import React, { useState, useEffect } from 'react';
import { Layers, Search, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../../api/batchApi';
import { getCourses } from '../../api/courseApi';
import { getTrainers } from '../../api/userApi';
import ConfirmModal from '../common/ConfirmModal';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminBatchManagementPage() {
  const [batches, setBatches] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [_loading, setLoading] = useState(true);
  const [dayError, setDayError] = useState('');
  
  const [editingBatch, setEditingBatch] = useState(null);
  const [deleteBatchData, setDeleteBatchData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    courseName: '',
    selectedDays: ['Monday', 'Wednesday', 'Friday'],
    session: 'Morning',
    trainerId: '',
    trainerName: '',
    status: 'Active'
  });

  const loadData = async () => {
    setLoading(true);
    const bRes = await getBatches();
    setBatches(bRes.data || []);
    
    const cRes = await getCourses();
    const courses = cRes.data || [];
    setCoursesList(courses);

    const tRes = await getTrainers();
    const trainers = tRes.data || [];
    setTrainersList(trainers);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setDayError('');
    setFormData({
      name: '',
      courseId: '',
      courseName: '',
      selectedDays: ['Monday', 'Wednesday', 'Friday'],
      session: 'Morning',
      trainerId: '',
      trainerName: '',
      status: 'Active'
    });
    setEditingBatch(null);
  };

  const handleToggleDay = (dayName) => {
    const current = formData.selectedDays || [];
    let updated;
    if (current.includes(dayName)) {
      updated = current.filter(d => d !== dayName);
    } else {
      updated = [...current, dayName];
    }
    setFormData({ ...formData, selectedDays: updated });
    if (updated.length > 0) setDayError('');
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!formData.courseId && !formData.courseName) {
      setDayError('Please select a course for this batch.');
      return;
    }

    if (!formData.trainerId && !formData.trainerName) {
      setDayError('Please select a trainer for this batch.');
      return;
    }

    if (!formData.selectedDays || formData.selectedDays.length === 0) {
      setDayError('Please select at least one day for this batch.');
      return;
    }
    setDayError('');

    const matchedCourse = coursesList.find(c => c.id === formData.courseId || c.title?.toLowerCase().trim() === formData.courseName?.toLowerCase().trim());
    const matchedTrainer = trainersList.find(t => t.id === formData.trainerId || t.name?.toLowerCase().trim() === formData.trainerName?.toLowerCase().trim());

    const payload = {
      name: formData.name.trim(),
      courseId: formData.courseId || matchedCourse?.id || '',
      courseName: formData.courseName || matchedCourse?.title || '',
      trainerId: formData.trainerId || matchedTrainer?.id || '',
      trainerName: formData.trainerName || matchedTrainer?.name || '',
      days: formData.selectedDays,
      day: formData.selectedDays.join(', '),
      session: formData.session,
      status: formData.status
    };

    if (editingBatch) {
      await updateBatch(editingBatch.id, payload);
    } else {
      await createBatch(payload);
    }
    resetForm();
    loadData();
  };

  const handleToggleStatus = async (batch) => {
    const newStatus = batch.status === 'Active' ? 'Inactive' : 'Active';
    await updateBatch(batch.id, { status: newStatus });
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (deleteBatchData) {
      await deleteBatch(deleteBatchData.id);
      setDeleteBatchData(null);
      loadData();
    }
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setDayError('');
    let daysArr = [];
    if (Array.isArray(batch.days) && batch.days.length > 0) {
      daysArr = batch.days;
    } else if (batch.day) {
      daysArr = batch.day.split(',').map(d => d.trim());
    } else {
      daysArr = ['Monday'];
    }

    const matchedCourse = coursesList.find(c => c.id === batch.courseId || (batch.courseName && c.title?.toLowerCase().trim() === batch.courseName?.toLowerCase().trim()));
    const matchedTrainer = trainersList.find(t => t.id === batch.trainerId || (batch.trainerName && t.name?.toLowerCase().trim() === batch.trainerName?.toLowerCase().trim()));

    setFormData({
      name: batch.name || '',
      courseId: batch.courseId || matchedCourse?.id || '',
      courseName: batch.courseName || matchedCourse?.title || '',
      selectedDays: daysArr,
      session: batch.session || 'Morning',
      trainerId: batch.trainerId || matchedTrainer?.id || '',
      trainerName: batch.trainerName || matchedTrainer?.name || '',
      status: batch.status || 'Active'
    });
  };

  const filteredBatches = batches.filter(b => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const daysStr = Array.isArray(b.days) ? b.days.join(' ') : (b.day || '');
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.courseName && b.courseName.toLowerCase().includes(q)) ||
      (b.trainerName && b.trainerName.toLowerCase().includes(q)) ||
      daysStr.toLowerCase().includes(q) ||
      (b.session && b.session.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Batch Management</h1>
          <p className="text-xs text-slate-500 font-medium">Create course batches with multiple schedule days, assign trainers, and manage active status.</p>
        </div>
      </div>

      {/* Add / Edit Batch Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create New Batch'}</span>
        </h3>

        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Batch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Java Morning Batch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

              {/* Course Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course *</label>
              <select
                value={formData.courseId || ''}
                onChange={(e) => {
                  const selId = e.target.value;
                  const matched = coursesList.find(c => c.id === selId);
                  setFormData({
                    ...formData,
                    courseId: selId,
                    courseName: matched?.title || ''
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">{coursesList.length === 0 ? "No courses available" : "-- Select Course --"}</option>
                {coursesList.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Session Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session / Time *</label>
              <select
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            {/* Trainer Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trainer *</label>
              <select
                value={formData.trainerId || ''}
                onChange={(e) => {
                  const selId = e.target.value;
                  const matched = trainersList.find(t => t.id === selId);
                  setFormData({
                    ...formData,
                    trainerId: selId,
                    trainerName: matched?.name || ''
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">{trainersList.length === 0 ? "No trainers available" : "-- Select Trainer --"}</option>
                {trainersList.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Multiple Days Selection (Requirement #1.1) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              Selected Days (Multi-Select Day Schedule) *
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_DAYS.map((dayName) => {
                const isSelected = (formData.selectedDays || []).includes(dayName);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => handleToggleDay(dayName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#0F52BA] text-white shadow-xs scale-105'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span>{dayName}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
            {dayError && (
              <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {dayError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingBatch && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
            >
              {editingBatch ? 'Update Batch' : 'Save Batch'}
            </button>
          </div>
        </form>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search batches by name, course, trainer, days, or session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Batch Name</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Selected Days</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Assigned Trainer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const isActive = batch.status === 'Active';
                  const daysList = Array.isArray(batch.days) ? batch.days : (batch.day ? batch.day.split(',').map(d => d.trim()) : []);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900">{batch.name}</td>
                      <td className="py-4 px-4 text-blue-900 font-bold">{batch.courseName}</td>
                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {daysList.map((d, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{batch.session}</td>
                      <td className="py-4 px-4 text-slate-800 font-bold">{batch.trainerName}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(batch)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Batch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteBatchData(batch)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-bold text-xs">
                    No batches found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteBatchData)}
        title="Delete Batch"
        message={`Are you sure you want to delete batch "${deleteBatchData?.name}" (${deleteBatchData?.courseName})?`}
        confirmText="Delete Batch"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteBatchData(null)}
      />

    </div>
  );
}
