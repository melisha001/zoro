import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Video, Users, User, Search, Filter, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';
import { getSchedules, createSchedule, deleteSchedule } from '../../api/scheduleApi';
import { getTrainers } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';

export default function AdminSchedulePage() {
  const [selectedDate, setSelectedDate] = useState('2026-09-17');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedTrainer, setSelectedTrainer] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    course: 'English Communication',
    batch: 'EN-L2',
    trainer: 'Priya',
    time: '05:00 PM - 06:00 PM',
    mode: 'Online (Google Meet)',
    date: '2026-09-17'
  });

  useEffect(() => {
    loadSchedules();
    loadTrainersAndCourses();
  }, []);

  const loadSchedules = async () => {
    try {
      const res = await getSchedules();
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  const loadTrainersAndCourses = async () => {
    try {
      const trRes = await getTrainers();
      setTrainers(trRes.data || []);
      if (trRes.data?.length > 0) {
        setFormData(prev => ({ ...prev, trainer: trRes.data[0].name }));
      }

      const crsRes = await getCourses();
      setCourses(crsRes.data || []);
      if (crsRes.data?.length > 0) {
        setFormData(prev => ({ ...prev, course: crsRes.data[0].title }));
      }
    } catch (err) {
      console.error('Error loading metadata for schedules:', err);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await createSchedule(formData);
      if (res.success) {
        await loadSchedules();
        setShowAddModal(false);
        setFormData({
          title: '',
          course: courses[0]?.title || 'English Communication',
          batch: 'EN-L2',
          trainer: trainers[0]?.name || 'Priya',
          time: '05:00 PM - 06:00 PM',
          mode: 'Online (Google Meet)',
          date: selectedDate
        });
      }
    } catch (err) {
      console.error('Failed to create schedule:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this scheduled session?')) {
      try {
        await deleteSchedule(id);
        await loadSchedules();
      } catch (err) {
        console.error('Failed to delete schedule:', err);
      }
    }
  };

  const filteredSchedules = schedules.filter(item => {
    const matchesBatch = selectedBatch === 'All' || item.batch === selectedBatch;
    const matchesTrainer = selectedTrainer === 'All' || item.trainer?.toLowerCase().includes(selectedTrainer.toLowerCase());
    return matchesBatch && matchesTrainer;
  });

  const upcomingCount = schedules.filter(s => s.status === 'Upcoming').length;
  const completedCount = schedules.filter(s => s.status === 'Completed').length;
  const uniqueTrainersCount = new Set(schedules.map(s => s.trainer)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Master Schedule</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage timetable, live class sessions, and trainer assignments.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 text-xs sm:text-sm self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Schedule Session</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Sessions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{schedules.length} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Upcoming</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">{upcomingCount} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Active Trainers</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{uniqueTrainersCount} Trainers</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="All">All Batches</option>
              <option value="EN-L1">EN-L1</option>
              <option value="EN-L2">EN-L2</option>
              <option value="AB-L3">AB-L3</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Trainer</label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="All">All Trainers</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Session & Topic</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Assigned Trainer</th>
                <th className="py-3.5 px-4">Time Slot</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No schedules found matching criteria.</td>
                </tr>
              ) : (
                filteredSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-slate-500 text-xs">{item.course}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-[#0F52BA]">{item.batch}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{item.trainer}</td>
                    <td className="py-4 px-4 text-slate-700 font-mono">{item.time}</td>
                    <td className="py-4 px-4 text-slate-600">{item.mode}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Cancel Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Schedule New Session</h3>

            <form onSubmit={handleAddSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic / Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Present Continuous Tense"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
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
                    <option value="AB-L3">AB-L3</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trainer</label>
                  <select
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 05:00 PM - 06:00 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="Online (Google Meet)">Online (Google Meet)</option>
                  <option value="Offline (Branch A)">Offline (Branch A)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-colors text-xs mt-3 cursor-pointer"
              >
                Schedule & Assign Trainer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

