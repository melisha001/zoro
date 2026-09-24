import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Video, Users, User, Search, Filter, CheckCircle2, Edit2, Trash2, X, AlertTriangle, RefreshCw, Send, Check } from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../api/scheduleApi';
import { getTrainers } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { notifyScheduleChange } from '../../api/notificationApi';
import { logActivity } from '../../api/activityLogApi';
import ConfirmModal from '../common/ConfirmModal';

export default function AdminSchedulePage() {
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [notifToast, setNotifToast] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    course: 'English Communication',
    batch: 'Batch A',
    trainer: 'Priya',
    time: '05:00 PM - 06:00 PM',
    mode: 'Online (Google Meet)',
    date: todayStr
  });

  const [rescheduleFormData, setRescheduleFormData] = useState({
    newDate: todayStr,
    newTime: '10:00 AM - 11:00 AM'
  });

  useEffect(() => {
    loadSchedules();
    loadMetadata();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getSchedules();
      setSchedules(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setLoadError('Unable to load schedules. Please check network connection.');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const trRes = await getTrainers();
      const loadedTrainers = Array.isArray(trRes?.data) ? trRes.data : [];
      setTrainers(loadedTrainers);

      const crsRes = await getCourses();
      const loadedCourses = Array.isArray(crsRes?.data) ? crsRes.data : [];
      setCourses(loadedCourses);

      const bRes = await getBatches();
      const loadedBatches = Array.isArray(bRes?.data) ? bRes.data : [];
      setBatchesList(loadedBatches);

      if (loadedCourses.length > 0) {
        const firstCourse = loadedCourses[0].title;
        const matchingBatches = loadedBatches.filter(b => b.courseName === firstCourse && b.status === 'Active');
        const defaultBatch = matchingBatches[0];

        setFormData(prev => ({
          ...prev,
          course: firstCourse,
          batch: defaultBatch?.name || 'Batch A',
          trainer: defaultBatch?.trainerName || loadedTrainers[0]?.name || 'Priya'
        }));
      }
    } catch (err) {
      console.error('Error loading metadata for schedules:', err);
    }
  };

  const handleCourseChangeInForm = (newCourseTitle) => {
    const courseBatches = (batchesList || []).filter(b => b.courseName === newCourseTitle && b.status === 'Active');
    const firstBatch = courseBatches[0];
    const autoTrainer = firstBatch ? firstBatch.trainerName : (trainers[0]?.name || 'Priya');

    setFormData(prev => ({
      ...prev,
      course: newCourseTitle,
      batch: firstBatch ? firstBatch.name : '',
      trainer: autoTrainer
    }));
  };

  const handleBatchChangeInForm = (newBatchName) => {
    const selectedBatchObj = (batchesList || []).find(b => b.name === newBatchName && b.courseName === formData.course);
    const autoTrainer = selectedBatchObj ? selectedBatchObj.trainerName : formData.trainer;

    setFormData(prev => ({
      ...prev,
      batch: newBatchName,
      trainer: autoTrainer
    }));
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.batch) return;

    try {
      const res = await createSchedule({
        ...formData,
        originalDate: formData.date,
        originalTime: formData.time
      });

      if (res?.success) {
        logActivity('Schedule Created', `Scheduled session "${formData.title}" for ${formData.batch} on ${formData.date} (${formData.time})`, 'Schedule');
        await loadSchedules();
        setShowAddModal(false);
        setFormData({
          title: '',
          course: courses[0]?.title || 'English Communication',
          batch: batchesList[0]?.name || 'Batch A',
          trainer: batchesList[0]?.trainerName || trainers[0]?.name || 'Priya',
          time: '05:00 PM - 06:00 PM',
          mode: 'Online (Google Meet)',
          date: todayStr
        });
      }
    } catch (err) {
      console.error('Failed to create schedule:', err);
    }
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleItem) return;

    const originalDate = rescheduleItem.originalDate || rescheduleItem.date;
    const originalTime = rescheduleItem.originalTime || rescheduleItem.time;

    const updatedPayload = {
      status: 'Rescheduled',
      originalDate,
      originalTime,
      date: rescheduleFormData.newDate,
      time: rescheduleFormData.newTime,
      rescheduledDate: rescheduleFormData.newDate,
      rescheduledTime: rescheduleFormData.newTime
    };

    await updateSchedule(rescheduleItem.id, updatedPayload);
    await notifyScheduleChange(
      rescheduleItem, 
      'Rescheduled', 
      originalDate, 
      originalTime, 
      rescheduleFormData.newDate, 
      rescheduleFormData.newTime
    );

    logActivity('Schedule Rescheduled', `Rescheduled "${rescheduleItem.title}" (${rescheduleItem.batch}) from ${originalDate} ${originalTime} to ${rescheduleFormData.newDate} ${rescheduleFormData.newTime}`, 'Schedule');

    setNotifToast({
      title: 'Session Rescheduled & Notifications Dispatched',
      message: `${rescheduleItem.batch} (${rescheduleItem.course}) updated to ${rescheduleFormData.newDate} at ${rescheduleFormData.newTime}. Affected trainer (${rescheduleItem.trainer}) and students notified.`
    });

    setRescheduleItem(null);
    loadSchedules();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const itemToDelete = (schedules || []).find(s => s.id === deleteId);
      await deleteSchedule(deleteId);
      if (itemToDelete) {
        logActivity('Schedule Deleted', `Deleted scheduled session "${itemToDelete.title}" for ${itemToDelete.batch}`, 'Schedule');
      }
      await loadSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    } finally {
      setDeleteId(null);
    }
  };

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeTrainers = Array.isArray(trainers) ? trainers : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeBatches = Array.isArray(batchesList) ? batchesList : [];

  const filteredSchedules = safeSchedules.filter(item => {
    if (!item) return false;
    const matchesBatch = selectedBatchFilter === 'All' || item.batch === selectedBatchFilter;
    const matchesTrainer = selectedTrainerFilter === 'All' || 
      (item.trainer && item.trainer.toLowerCase().includes(selectedTrainerFilter.toLowerCase()));
    const matchesDate = !selectedDateFilter || item.date === selectedDateFilter;
    return matchesBatch && matchesTrainer && matchesDate;
  });

  const upcomingCount = safeSchedules.filter(s => s && s.status === 'Upcoming').length;
  const rescheduledCount = safeSchedules.filter(s => s && s.status === 'Rescheduled').length;
  const completedCount = safeSchedules.filter(s => s && s.status === 'Completed').length;

  const availableBatchesForSelectedCourse = safeBatches.filter(b => b.courseName === formData.course && b.status === 'Active');

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 sm:p-8">
      
      {/* Toast Alert */}
      {notifToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-medium text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <div>
              <strong className="block font-bold">{notifToast.title}</strong>
              <span>{notifToast.message}</span>
            </div>
          </div>
          <button onClick={() => setNotifToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Master Schedule Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage class timetables, assign course batches, auto-fetch trainers, and handle session reschedules.</p>
        </div>

        <button
          onClick={() => {
            const courseBatches = safeBatches.filter(b => b.courseName === (safeCourses[0]?.title || 'English Communication') && b.status === 'Active');
            const defaultBatch = courseBatches[0];
            setFormData({
              title: '',
              course: safeCourses[0]?.title || 'English Communication',
              batch: defaultBatch?.name || '',
              trainer: defaultBatch?.trainerName || safeTrainers[0]?.name || 'Priya',
              time: '05:00 PM - 06:00 PM',
              mode: 'Online (Google Meet)',
              date: todayStr
            });
            setShowAddModal(true);
          }}
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs sm:text-sm self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Schedule</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Sessions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{safeSchedules.length} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Upcoming</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">{upcomingCount} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-600 font-semibold">Rescheduled Sessions</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{rescheduledCount} Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-600 font-semibold">Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount} Sessions</div>
        </div>
      </div>

      {/* Error Alert if data load failed */}
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button onClick={loadSchedules} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold">Retry</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
          
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Date</label>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Batch</label>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="All">All Batches</option>
              {safeBatches.map((b) => (
                <option key={b.id} value={b.name}>{b.name} ({b.courseName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Trainer</label>
            <select
              value={selectedTrainerFilter}
              onChange={(e) => setSelectedTrainerFilter(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="All">All Trainers</option>
              {safeTrainers.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {selectedDateFilter && (
            <button
              onClick={() => setSelectedDateFilter('')}
              className="mt-4 px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-bold text-[10px]"
            >
              Clear Date Filter
            </button>
          )}

        </div>
      </div>

      {/* Timetable Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Session & Course</th>
                <th className="py-3.5 px-4">Schedule Date</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Assigned Trainer</th>
                <th className="py-3.5 px-4">Time Slot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-bold whitespace-normal">
                    Loading schedules...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-bold whitespace-normal">
                    No schedules available.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => {
                  const isRescheduled = item.status === 'Rescheduled';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm">{item.title || 'Untitled Session'}</div>
                        <div className="text-slate-500 text-xs font-semibold">{item.course || 'English Communication'}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {item.date || todayStr}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#0F52BA]">
                        <span className="bg-blue-50 text-[#0F52BA] border border-blue-200 px-2.5 py-1 rounded-lg">
                          {item.batch || 'Batch A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.trainer || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-mono font-bold">{item.time || '10:00 AM - 11:00 AM'}</td>
                      <td className="py-4 px-4 space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isRescheduled
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {item.status || 'Upcoming'}
                        </span>

                        {isRescheduled && (item.originalDate || item.originalTime) && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Orig: {item.originalDate} ({item.originalTime})
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right space-x-1.5">
                        
                        {/* Reschedule Action Button */}
                        <button
                          onClick={() => {
                            setRescheduleItem(item);
                            setRescheduleFormData({
                              newDate: item.date || todayStr,
                              newTime: item.time || '10:00 AM - 11:00 AM'
                            });
                          }}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          title="Reschedule Session"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Schedule New Session</h3>

            <form onSubmit={handleAddSchedule} className="space-y-3">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic / Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Present Continuous Tense"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course *</label>
                <select
                  value={formData.course}
                  onChange={(e) => handleCourseChangeInForm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {safeCourses.map((c) => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch (Course-Filtered) *</label>
                  <select
                    value={formData.batch}
                    onChange={(e) => handleBatchChangeInForm(e.target.value)}
                    disabled={availableBatchesForSelectedCourse.length === 0}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {availableBatchesForSelectedCourse.length > 0 ? (
                      availableBatchesForSelectedCourse.map((b) => (
                        <option key={b.id} value={b.name}>{b.name} ({b.session})</option>
                      ))
                    ) : (
                      <option value="">No batches for this course</option>
                    )}
                  </select>
                  {availableBatchesForSelectedCourse.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1">No active batches available for this course.</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Trainer (Auto-Fetched) *</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.trainer}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-extrabold text-blue-900 cursor-not-allowed"
                    title="Trainer automatically fetched from Batch Management"
                  />
                  <p className="text-[9px] text-slate-400 font-bold mt-1">⚡ Auto-populated from Batch Management</p>
                </div>

              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:00 AM - 12:00 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="Online (Google Meet)">Online (Google Meet)</option>
                  <option value="Offline (Branch A)">Offline (Branch A)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!formData.batch}
                className="w-full bg-[#0F52BA] hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-3 rounded-xl shadow-md transition-colors text-xs mt-3 cursor-pointer"
              >
                Schedule & Issue Notification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setRescheduleItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 text-amber-600">
              <RefreshCw className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-slate-900">Reschedule Session</h3>
                <p className="text-slate-500 text-[11px] font-medium">{rescheduleItem.title} ({rescheduleItem.batch})</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 font-semibold space-y-1">
              <div><strong>Original Schedule:</strong> {rescheduleItem.date || rescheduleItem.originalDate} ({rescheduleItem.time || rescheduleItem.originalTime})</div>
              <div><strong>Batch Trainer:</strong> {rescheduleItem.trainer}</div>
              <p className="text-[10px] text-amber-700 italic pt-1">
                Note: Rescheduling only overrides this specific class instance. Parent batch days remain unchanged.
              </p>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Schedule Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleFormData.newDate}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, newDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11:00 AM - 12:00 PM"
                  value={rescheduleFormData.newTime}
                  onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, newTime: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl shadow-md text-xs mt-2 cursor-pointer"
              >
                Confirm Reschedule & Notify Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to cancel and delete this scheduled session?"
        confirmText="Delete"
        cancelText="Cancel"
      />

    </div>
  );
}
