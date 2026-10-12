import React, { useState, useEffect } from 'react';
import { Plus, User, CheckCircle2, Edit2, Trash2, X, AlertTriangle, RefreshCw, Eye, Upload } from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../api/scheduleApi';
import { uploadFile } from '../../api/fileApi';
import { getTrainers } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { notifyScheduleChange, notifyScheduleCreated } from '../../api/notificationApi';
import { logActivity } from '../../api/activityLogApi';
import ConfirmModal from '../common/ConfirmModal';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';
import { useDialog } from '../../context/DialogContext';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'avi', 'webm',
  'mp3', 'wav', 'm4a'
];

export default function AdminSchedulePage() {
  const { showSuccess, showError, showWarning } = useDialog();
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [notifToast, setNotifToast] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fileErrors, setFileErrors] = useState({});

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    course: '',
    batch: '',
    trainer: '',
    time: '05:00 PM - 06:00 PM',
    mode: 'Online (Google Meet)',
    date: todayStr,
    notesFile: null,
    worksheetFile: null,
    assignmentFile: null
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

      // Only show Online & Hybrid courses in Schedule Management
      const liveCourses = loadedCourses.filter(c => c.mode === 'Online' || c.mode === 'Hybrid' || !c.mode);

      if (liveCourses.length > 0) {
        const firstCourse = liveCourses[0].title;
        const matchingBatches = loadedBatches.filter(b => b.courseName === firstCourse && b.status === 'Active');
        const defaultBatch = matchingBatches[0];

        setFormData(prev => ({
          ...prev,
          course: firstCourse,
          batch: defaultBatch?.name || '',
          trainer: defaultBatch?.trainerName || loadedTrainers[0]?.name || ''
        }));
      }
    } catch (err) {
      console.error('Error loading metadata for schedules:', err);
    }
  };

  const handleCourseChangeInForm = (newCourseTitle) => {
    const courseBatches = (batchesList || []).filter(b => b.courseName === newCourseTitle && b.status === 'Active');
    const firstBatch = courseBatches[0];
    const autoTrainer = firstBatch ? firstBatch.trainerName : (trainers[0]?.name || '');

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

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileErrors(prev => ({ 
        ...prev, 
        [fieldName]: `Unsupported file type (.${ext}). Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}` 
      }));
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      setFileErrors(prev => ({ ...prev, [fieldName]: 'File size must be 100 MB or less.' }));
      e.target.value = '';
      return;
    }

    setFileErrors(prev => ({ ...prev, [fieldName]: '' }));
    const catName = fieldName === 'notesFile' ? 'notes' : fieldName === 'worksheetFile' ? 'worksheet' : 'assignment';

    try {
      const res = await uploadFile(file, catName);
      const category = fieldName === 'notesFile' ? 'Notes' : fieldName === 'worksheetFile' ? 'Worksheet' : 'Assignment';
      setFormData(prev => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: ext,
          uploadedAt: new Date().toLocaleDateString('en-GB'),
          fileUrl: res.url,
          category
        }
      }));
    } catch (err) {
      setFileErrors(prev => ({ ...prev, [fieldName]: err.message || 'Upload failed' }));
    }
  };

  const handleReuploadScheduleFile = async (scheduleItem, fieldName, file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      showWarning(`Unsupported file type (.${ext}). Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`, 'Unsupported Format');
      return;
    }
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showWarning('File size must be 100 MB or less.', 'File Too Large');
      return;
    }

    const catName = fieldName === 'notesFile' ? 'notes' : fieldName === 'worksheetFile' ? 'worksheet' : 'assignment';
    try {
      const res = await uploadFile(file, catName);
      const category = fieldName === 'notesFile' ? 'Notes' : fieldName === 'worksheetFile' ? 'Worksheet' : 'Assignment';
      const newFileObj = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: ext,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
        fileUrl: res.url,
        category
      };

      const updatedItem = {
        ...scheduleItem,
        [fieldName]: newFileObj
      };
      await updateSchedule(scheduleItem.id, updatedItem);
      logActivity('Schedule Attachment Re-uploaded', `Re-uploaded ${category} file "${file.name}" for schedule session "${scheduleItem.title}"`, 'Schedule');
      setNotifToast({
        title: 'Attachment Re-uploaded',
        message: `${category} file updated for session "${scheduleItem.title}".`
      });
      await loadSchedules();
    } catch (err) {
      showError(err.message || 'Re-upload failed', 'Upload Error');
    }
  };

  const handleOpenEditModal = (item) => {
    setEditingSchedule(item);
    setFormData({
      title: item.title || '',
      course: item.course || '',
      batch: item.batch || '',
      trainer: item.trainer || '',
      time: item.time || '05:00 PM - 06:00 PM',
      mode: item.mode || 'Online (Google Meet)',
      date: item.date || todayStr,
      notesFile: item.notesFile || null,
      worksheetFile: item.worksheetFile || null,
      assignmentFile: item.assignmentFile || null
    });
    setFileErrors({});
    setShowAddModal(true);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.batch) return;

    try {
      if (editingSchedule) {
        const res = await updateSchedule(editingSchedule.id, {
          ...formData
        });
        if (res && res.success) {
          logActivity('Schedule Updated', `Updated session "${formData.title}" for ${formData.batch}`, 'Schedule');
          await showSuccess(res.message || `Session "${formData.title}" updated successfully.`, 'Schedule Updated');
        } else {
          await showError(res?.message || 'Failed to update schedule', 'Update Failed');
          return;
        }
      } else {
        const res = await createSchedule({
          ...formData,
          originalDate: formData.date,
          originalTime: formData.time
        });

        if (res?.success) {
          logActivity('Schedule Created', `Scheduled session "${formData.title}" for ${formData.batch} on ${formData.date} (${formData.time})`, 'Schedule');
          await notifyScheduleCreated(res.data || formData);
          await showSuccess(`Session "${formData.title}" created for ${formData.batch}. Automatic notifications dispatched.`, 'Schedule Created');
        } else {
          await showError(res?.message || 'Failed to create schedule', 'Creation Failed');
          return;
        }
      }

      await loadSchedules();
      setShowAddModal(false);
      setEditingSchedule(null);

      const liveCourses = (courses || []).filter(c => c.mode === 'Online' || c.mode === 'Hybrid' || !c.mode);
      const firstCourse = liveCourses[0]?.title || 'English Communication';
      const matchingBatches = (batchesList || []).filter(b => b.courseName === firstCourse && b.status === 'Active');

      setFormData({
        title: '',
        course: firstCourse,
        batch: matchingBatches[0]?.name || '',
        trainer: matchingBatches[0]?.trainerName || trainers[0]?.name || '',
        time: '05:00 PM - 06:00 PM',
        mode: 'Online (Google Meet)',
        date: todayStr,
        notesFile: null,
        worksheetFile: null,
        assignmentFile: null
      });
      setFileErrors({});
    } catch (err) {
      console.error('Failed to save schedule:', err);
      await showError(err?.message || 'Failed to save schedule', 'Save Error');
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

    try {
      const res = await updateSchedule(rescheduleItem.id, updatedPayload);
      if (res && res.success) {
        await notifyScheduleChange(
          rescheduleItem, 
          'Rescheduled', 
          originalDate, 
          originalTime, 
          rescheduleFormData.newDate, 
          rescheduleFormData.newTime
        );

        logActivity('Schedule Rescheduled', `Rescheduled "${rescheduleItem.title}" (${rescheduleItem.batch}) from ${originalDate} ${originalTime} to ${rescheduleFormData.newDate} ${rescheduleFormData.newTime}`, 'Schedule');

        await showSuccess(`${rescheduleItem.batch} (${rescheduleItem.course}) updated to ${rescheduleFormData.newDate} at ${rescheduleFormData.newTime}. Affected trainer and students notified.`, 'Session Rescheduled');

        setRescheduleItem(null);
        loadSchedules();
      } else {
        await showError(res?.message || 'Failed to reschedule session', 'Reschedule Failed');
      }
    } catch (err) {
      await showError(err?.message || 'Failed to reschedule session', 'Reschedule Failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const itemToDelete = (schedules || []).find(s => s.id === deleteId);
      const res = await deleteSchedule(deleteId);
      setDeleteId(null);
      if (res && res.success) {
        if (itemToDelete) {
          logActivity('Schedule Deleted', `Deleted scheduled session "${itemToDelete.title}" for ${itemToDelete.batch}`, 'Schedule');
        }
        await showSuccess(res.message || 'Schedule deleted successfully', 'Schedule Deleted');
        await loadSchedules();
      } else {
        await showError(res?.message || 'Failed to delete schedule', 'Delete Failed');
      }
    } catch (err) {
      setDeleteId(null);
      await showError(err?.message || 'Failed to delete schedule', 'Delete Failed');
    }
  };

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeTrainers = Array.isArray(trainers) ? trainers : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeBatches = Array.isArray(batchesList) ? batchesList : [];

  // Filter out Recorded courses from schedule management dropdown
  const liveCourses = safeCourses.filter(c => c.mode === 'Online' || c.mode === 'Hybrid' || !c.mode);

  const filteredSchedules = safeSchedules.filter(item => {
    if (!item) return false;
    const matchesBatch = selectedBatchFilter === 'All' || item.batchId === selectedBatchFilter || item.batch === selectedBatchFilter;
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
          <button onClick={() => setNotifToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Master Schedule Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage live class timetables for Online & Hybrid courses, auto-fetch trainers, attach study files, and notify users.</p>
        </div>

        <button
          onClick={() => {
            const firstCourse = liveCourses[0]?.title || 'English Communication';
            const courseBatches = safeBatches.filter(b => b.courseName === firstCourse && b.status === 'Active');
            const defaultBatch = courseBatches[0];
            setFormData({
              title: '',
              course: firstCourse,
              batch: defaultBatch?.name || '',
              trainer: defaultBatch?.trainerName || safeTrainers[0]?.name || '',
              time: '05:00 PM - 06:00 PM',
              mode: 'Online (Google Meet)',
              date: todayStr,
              notesFile: null,
              worksheetFile: null,
              assignmentFile: null
            });
            setFileErrors({});
            setShowAddModal(true);
          }}
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs sm:text-sm self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Schedule</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Sessions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{safeSchedules.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Upcoming</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">{upcomingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-600 font-semibold">Rescheduled</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{rescheduledCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-600 font-semibold">Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Error Alert if data load failed */}
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button onClick={loadSchedules} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold cursor-pointer">Retry</button>
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
                <option key={b.id} value={b.id}>{b.name} ({b.courseName})</option>
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
              className="mt-4 px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-bold text-[10px] cursor-pointer"
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
                <th className="py-3.5 px-4">Attachments</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-bold whitespace-normal">
                    Loading schedules...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-bold whitespace-normal">
                    No schedules available.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => {
                  const isRescheduled = item.status === 'Rescheduled';
                  const hasNotes = Boolean(item.notesFile);
                  const hasWorksheet = Boolean(item.worksheetFile);
                  const hasAssignment = Boolean(item.assignmentFile);

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
                          {item.batch || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.trainer || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-mono font-bold">{item.time || '10:00 AM - 11:00 AM'}</td>
                      
                      {/* Attachments Column */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 text-[10px] font-bold">
                          {hasNotes && (
                            <div className="flex items-center justify-between gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200">
                              <span className="truncate max-w-[100px]" title={item.notesFile.name}>📄 {item.notesFile.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewerFile(item.notesFile)}
                                  className="p-1 hover:bg-emerald-200 rounded text-emerald-900 cursor-pointer"
                                  title="View Attachment"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <label className="p-1 hover:bg-emerald-200 rounded text-emerald-900 cursor-pointer" title="Re-upload / Replace File">
                                  <Upload className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleReuploadScheduleFile(item, 'notesFile', e.target.files[0]);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {hasWorksheet && (
                            <div className="flex items-center justify-between gap-1.5 bg-blue-50 text-blue-800 px-2 py-1 rounded-lg border border-blue-200">
                              <span className="truncate max-w-[100px]" title={item.worksheetFile.name}>📑 {item.worksheetFile.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewerFile(item.worksheetFile)}
                                  className="p-1 hover:bg-blue-200 rounded text-blue-900 cursor-pointer"
                                  title="View Attachment"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <label className="p-1 hover:bg-blue-200 rounded text-blue-900 cursor-pointer" title="Re-upload / Replace File">
                                  <Upload className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleReuploadScheduleFile(item, 'worksheetFile', e.target.files[0]);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {hasAssignment && (
                            <div className="flex items-center justify-between gap-1.5 bg-purple-50 text-purple-800 px-2 py-1 rounded-lg border border-purple-200">
                              <span className="truncate max-w-[100px]" title={item.assignmentFile.name}>📝 {item.assignmentFile.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewerFile(item.assignmentFile)}
                                  className="p-1 hover:bg-purple-200 rounded text-purple-900 cursor-pointer"
                                  title="View Attachment"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <label className="p-1 hover:bg-purple-200 rounded text-purple-900 cursor-pointer" title="Re-upload / Replace File">
                                  <Upload className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleReuploadScheduleFile(item, 'assignmentFile', e.target.files[0]);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {!hasNotes && !hasWorksheet && !hasAssignment && (
                            <span className="text-slate-400 italic font-medium">None</span>
                          )}
                        </div>
                      </td>

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
                        
                        {/* Edit Action Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 bg-blue-50 text-[#0F52BA] hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Schedule"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

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

      {/* Add / Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingSchedule(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">{editingSchedule ? 'Edit Scheduled Session' : 'Schedule New Session'}</h3>

            <form onSubmit={handleAddSchedule} className="space-y-3.5">
              
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
                <label className="block font-bold text-slate-700 mb-1">Course (Online & Hybrid Only) *</label>
                <select
                  value={formData.course}
                  onChange={(e) => handleCourseChangeInForm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {liveCourses.map((c) => (
                    <option key={c.id} value={c.title}>{c.title} ({c.mode || 'Online'})</option>
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

              {/* CLASS RESOURCE ATTACHMENTS (Notes, Worksheet, Assignment) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 pt-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                  <span>Class Resource Attachments (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-semibold">All formats supported (Max 100 MB)</span>
                </h4>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Notes File</label>
                  {formData.notesFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold">
                      <span className="truncate max-w-[180px]" title={formData.notesFile.name}>📄 {formData.notesFile.name} ({formData.notesFile.size})</span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewerFile(formData.notesFile)}
                          className="px-2 py-1 bg-blue-50 text-[#0F52BA] hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'notesFile')}
                          />
                        </label>
                        <button type="button" onClick={() => setFormData({ ...formData, notesFile: null })} className="text-rose-600 font-bold hover:underline text-[11px]">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <input type="file" onChange={(e) => handleFileUpload(e, 'notesFile')} className="w-full text-xs font-medium cursor-pointer" />
                  )}
                  {fileErrors.notesFile && <p className="text-[10px] font-bold text-rose-600">{fileErrors.notesFile}</p>}
                </div>

                {/* Worksheet */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Worksheet File</label>
                  {formData.worksheetFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold">
                      <span className="truncate max-w-[180px]" title={formData.worksheetFile.name}>📑 {formData.worksheetFile.name} ({formData.worksheetFile.size})</span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewerFile(formData.worksheetFile)}
                          className="px-2 py-1 bg-blue-50 text-[#0F52BA] hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'worksheetFile')}
                          />
                        </label>
                        <button type="button" onClick={() => setFormData({ ...formData, worksheetFile: null })} className="text-rose-600 font-bold hover:underline text-[11px]">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <input type="file" onChange={(e) => handleFileUpload(e, 'worksheetFile')} className="w-full text-xs font-medium cursor-pointer" />
                  )}
                  {fileErrors.worksheetFile && <p className="text-[10px] font-bold text-rose-600">{fileErrors.worksheetFile}</p>}
                </div>

                {/* Assignment */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Assignment File</label>
                  {formData.assignmentFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold">
                      <span className="truncate max-w-[180px]" title={formData.assignmentFile.name}>📝 {formData.assignmentFile.name} ({formData.assignmentFile.size})</span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewerFile(formData.assignmentFile)}
                          className="px-2 py-1 bg-blue-50 text-[#0F52BA] hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'assignmentFile')}
                          />
                        </label>
                        <button type="button" onClick={() => setFormData({ ...formData, assignmentFile: null })} className="text-rose-600 font-bold hover:underline text-[11px]">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <input type="file" onChange={(e) => handleFileUpload(e, 'assignmentFile')} className="w-full text-xs font-medium cursor-pointer" />
                  )}
                  {fileErrors.assignmentFile && <p className="text-[10px] font-bold text-rose-600">{fileErrors.assignmentFile}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.batch}
                className="w-full bg-[#0F52BA] hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-3.5 rounded-xl shadow-md transition-colors text-xs mt-3 cursor-pointer"
              >
                {editingSchedule ? 'Update Schedule & Notify' : 'Schedule & Auto-Notify Trainer & Batch'}
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
                Note: Rescheduling overrides this specific session instance and dispatches in-app notifications.
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

      {/* Universal File Viewer Modal */}
      <UniversalFileViewerModal
        isOpen={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
      />

    </div>
  );
}

