import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, UserCheck, Calendar, Download, BookOpen, Layers, User, Check, X as XIcon, Clock } from 'lucide-react';
import { getAttendanceRecords, recordAttendance, recordBatchAttendance } from '../../api/attendanceApi';
import { getStudents, getTrainers } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { getSchedules } from '../../api/scheduleApi';
import { exportToExcel } from '../../utils/excelExporter';
import { useDialog } from '../../context/DialogContext';

export default function AdminAttendancePage({ setActiveScreen }) {
  const { showSuccess, showError } = useDialog();
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'trainers'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const [allRecords, setAllRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, stdRes, trnRes, crsRes, bRes, schRes] = await Promise.all([
        getAttendanceRecords(),
        getStudents(),
        getTrainers(),
        getCourses(),
        getBatches(),
        getSchedules()
      ]);

      setAllRecords(attRes.data || []);
      setStudents(stdRes.data || []);
      setTrainers(trnRes.data || []);
      setCourses(crsRes.data || []);
      setBatches(bRes.data || []);
      setSchedules(schRes.data || []);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Batches filtered by selected course
  const availableBatches = useMemo(() => {
    if (!selectedCourse) return batches;
    return batches.filter(b => b.courseName === selectedCourse || b.courseId === selectedCourse);
  }, [batches, selectedCourse]);

  // Filter students based on course and batch
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedCourse) {
        let inCourse = false;
        if (s.courseBatches && Array.isArray(s.courseBatches)) {
          inCourse = s.courseBatches.some(cb => cb.course === selectedCourse || cb.courseId === selectedCourse);
        } else if (s.course) {
          inCourse = s.course.toLowerCase().includes(selectedCourse.toLowerCase());
        }
        if (!inCourse) return false;
      }

      if (selectedBatch) {
        let inBatch = false;
        if (s.courseBatches && Array.isArray(s.courseBatches)) {
          inBatch = s.courseBatches.some(cb => cb.batch === selectedBatch || cb.batchId === selectedBatch);
        } else if (s.batch) {
          inBatch = s.batch === selectedBatch;
        }
        if (!inBatch) return false;
      }

      return true;
    });
  }, [students, selectedCourse, selectedBatch]);

  // Map student attendance for selected date
  const studentAttendanceMap = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      if (r.date === selectedDate) {
        if (r.studentId) map[r.studentId] = r.status;
        if (r.studentName) map[r.studentName.toLowerCase().trim()] = r.status;
      }
    });
    return map;
  }, [allRecords, selectedDate]);

  // Handler for student attendance toggle
  const handleSetStudentAttendance = async (student, newStatus) => {
    const record = {
      studentId: student.id,
      studentName: student.name,
      courseId: student.courseBatches?.[0]?.courseId || student.course || selectedCourse || null,
      batchId: student.courseBatches?.[0]?.batchId || student.batch || selectedBatch || null,
      date: selectedDate,
      status: newStatus,
      recordedBy: 'Admin'
    };

    try {
      const res = await recordAttendance(record);
      if (res.success) {
        setAllRecords(prev => {
          const filtered = prev.filter(r => !(r.date === selectedDate && (r.studentId === student.id || (r.studentName && r.studentName.toLowerCase().trim() === student.name.toLowerCase().trim()))));
          return [...filtered, res.data || { ...record, id: `att_${Date.now()}` }];
        });
      }
    } catch (err) {
      console.error('Failed to update student attendance:', err);
    }
  };

  // Bulk actions for students
  const handleBulkStudentAttendance = async (status) => {
    if (filteredStudents.length === 0) return;
    setSaving(true);
    const records = filteredStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      courseId: s.courseBatches?.[0]?.courseId || s.course || selectedCourse || null,
      batchId: s.courseBatches?.[0]?.batchId || s.batch || selectedBatch || null,
      date: selectedDate,
      status,
      recordedBy: 'Admin'
    }));

    try {
      const res = await recordBatchAttendance(records);
      if (res.success) {
        await showSuccess(`Marked all ${filteredStudents.length} students as ${status}`, 'Attendance Updated');
        const updated = await getAttendanceRecords();
        setAllRecords(updated.data || []);
      } else {
        await showError(res?.message || 'Failed to update attendance', 'Update Failed');
      }
    } catch (err) {
      await showError(err?.message || 'Failed to update attendance', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  // Export students attendance
  const handleExportStudents = () => {
    const headers = ['Date', 'Student Name', 'Email', 'Phone', 'Course & Batch', 'Attendance Status'];
    const rows = filteredStudents.map(s => {
      const status = studentAttendanceMap[s.id] || studentAttendanceMap[s.name?.toLowerCase().trim()] || 'Absent';
      const cStr = s.courseBatches?.map(cb => `${cb.course} (${cb.batch})`).join('; ') || s.course || 'General';
      return [selectedDate, s.name, s.email, s.phone || '', cStr, status];
    });
    exportToExcel(`Student_Attendance_${selectedDate}.xlsx`, 'Student Attendance', headers, rows);
  };

  // --- TRAINERS VIEW ---
  // Schedules on selected date
  const daySchedules = useMemo(() => {
    return schedules.filter(sch => sch.date === selectedDate);
  }, [schedules, selectedDate]);

  // Map trainer attendance by scheduleId or trainer
  const trainerAttendanceMap = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      if (r.date === selectedDate) {
        if (r.scheduleId) map[r.scheduleId] = r.status;
        if (r.studentId) map[r.studentId] = r.status;
        if (r.studentName) map[r.studentName.toLowerCase().trim()] = r.status;
      }
    });
    return map;
  }, [allRecords, selectedDate]);

  // Handler for trainer attendance toggle
  const handleSetTrainerAttendance = async (schedule, newStatus) => {
    const trainerUser = trainers.find(t => t.id === schedule.trainerId || t.name === schedule.trainer);
    const trainerId = schedule.trainerId || trainerUser?.id || schedule.trainer;
    const trainerName = schedule.trainer || trainerUser?.name || 'Trainer';

    const record = {
      scheduleId: schedule.id,
      studentId: trainerId,
      studentName: trainerName,
      courseId: schedule.courseId || schedule.course,
      batchId: schedule.batchId || schedule.batch,
      date: selectedDate,
      status: newStatus,
      recordedBy: 'Admin',
      remarks: 'Trainer Class Attendance'
    };

    try {
      const res = await recordAttendance(record);
      if (res.success) {
        setAllRecords(prev => {
          const filtered = prev.filter(r => !(r.date === selectedDate && (r.scheduleId === schedule.id || r.studentId === trainerId)));
          return [...filtered, res.data || { ...record, id: `att_trn_${Date.now()}` }];
        });
      }
    } catch (err) {
      console.error('Failed to update trainer attendance:', err);
    }
  };

  // Bulk actions for trainers
  const handleBulkTrainerAttendance = async (status) => {
    if (daySchedules.length === 0) return;
    setSaving(true);
    const records = daySchedules.map(sch => {
      const trainerUser = trainers.find(t => t.id === sch.trainerId || t.name === sch.trainer);
      const trainerId = sch.trainerId || trainerUser?.id || sch.trainer;
      const trainerName = sch.trainer || trainerUser?.name || 'Trainer';
      return {
        scheduleId: sch.id,
        studentId: trainerId,
        studentName: trainerName,
        courseId: sch.courseId || sch.course,
        batchId: sch.batchId || sch.batch,
        date: selectedDate,
        status,
        recordedBy: 'Admin',
        remarks: 'Trainer Class Attendance'
      };
    });

    try {
      const res = await recordBatchAttendance(records);
      if (res.success) {
        await showSuccess(`Marked all ${daySchedules.length} trainer sessions as ${status}`, 'Attendance Updated');
        const updated = await getAttendanceRecords();
        setAllRecords(updated.data || []);
      } else {
        await showError(res?.message || 'Failed to update trainer attendance', 'Update Failed');
      }
    } catch (err) {
      await showError(err?.message || 'Failed to update trainer attendance', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  // Export trainer attendance
  const handleExportTrainers = () => {
    const headers = ['Date', 'Trainer Name', 'Course', 'Batch', 'Session Time', 'Topic', 'Attendance Status'];
    const rows = daySchedules.map(sch => {
      const status = trainerAttendanceMap[sch.id] || trainerAttendanceMap[sch.trainerId] || trainerAttendanceMap[sch.trainer?.toLowerCase().trim()] || 'Absent';
      return [selectedDate, sch.trainer || 'Unassigned', sch.course || '', sch.batch || '', sch.time || '', sch.title || '', status];
    });
    exportToExcel(`Trainer_Attendance_${selectedDate}.xlsx`, 'Trainer Attendance', headers, rows);
  };

  // KPI Calculations
  const studentPresentCount = filteredStudents.filter(s => (studentAttendanceMap[s.id] || studentAttendanceMap[s.name?.toLowerCase().trim()] || '').toUpperCase() === 'PRESENT').length;
  const studentLateCount = filteredStudents.filter(s => (studentAttendanceMap[s.id] || studentAttendanceMap[s.name?.toLowerCase().trim()] || '').toUpperCase() === 'LATE').length;
  const studentAbsentCount = filteredStudents.length - studentPresentCount - studentLateCount;
  const studentRate = filteredStudents.length > 0 ? Math.round((studentPresentCount / filteredStudents.length) * 100) : 0;

  const trainerPresentCount = daySchedules.filter(sch => (trainerAttendanceMap[sch.id] || trainerAttendanceMap[sch.trainerId] || trainerAttendanceMap[sch.trainer?.toLowerCase().trim()] || '').toUpperCase() === 'PRESENT').length;
  const trainerAbsentCount = daySchedules.length - trainerPresentCount;
  const trainerRate = daySchedules.length > 0 ? Math.round((trainerPresentCount / daySchedules.length) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button 
            onClick={() => setActiveScreen ? setActiveScreen('admin-dash') : null}
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Dashboard</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Attendance Management</h1>
          <p className="text-xs text-slate-500 font-medium">Daily attendance tracking for Students and Trainers.</p>
        </div>

        {/* Export Button */}
        <div className="flex items-center space-x-3">
          {activeTab === 'students' ? (
            <button
              onClick={handleExportStudents}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 text-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Students (.xlsx)</span>
            </button>
          ) : (
            <button
              onClick={handleExportTrainers}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 text-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Trainers (.xlsx)</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP SWITCH: [Students | Trainers] */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex max-w-md">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 py-3 px-6 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0F52BA] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`flex-1 py-3 px-6 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'trainers'
              ? 'bg-[#0F52BA] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Trainers Attendance</span>
        </button>
      </div>

      {/* ===================== STUDENTS VIEW ===================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Attendance Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter by Course</span>
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedBatch('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter by Batch</span>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="">All Batches</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.name}>{b.name} ({b.courseName})</option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
              <div className="text-xs font-bold text-slate-500">Total Filtered Students</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{filteredStudents.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
              <div className="text-xs font-bold text-slate-500">Present Today</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{studentPresentCount}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{studentRate}% Attendance Rate</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
              <div className="text-xs font-bold text-slate-500">Late / Partial</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{studentLateCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
              <div className="text-xs font-bold text-slate-500">Absent</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{studentAbsentCount}</div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-700">
              Showing <strong className="text-blue-900">{filteredStudents.length}</strong> students for <strong>{selectedDate}</strong>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleBulkStudentAttendance('Present')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                disabled={saving || filteredStudents.length === 0}
                onClick={() => handleBulkStudentAttendance('Absent')}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">Loading attendance records...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">No students match the selected course / batch filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Course & Batch</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredStudents.map(student => {
                      const rawStatus = studentAttendanceMap[student.id] || studentAttendanceMap[student.name?.toLowerCase().trim()] || 'Absent';
                      const currentStatus = rawStatus.toUpperCase();

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {student.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">
                            {student.email}
                            {student.phone && <div className="text-[10px] text-slate-400">{student.phone}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            {student.courseBatches?.length > 0 ? (
                              <div className="space-y-0.5">
                                {student.courseBatches.map((cb, i) => (
                                  <span key={i} className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold mr-1">
                                    {cb.course} ({cb.batch || 'Unassigned'})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">{student.course || 'No course assigned'}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : currentStatus === 'LATE'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {currentStatus === 'PRESENT' ? 'Present' : currentStatus === 'LATE' ? 'Late' : 'Absent'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {['Present', 'Absent', 'Late'].map(statusOption => {
                              const isSelected = currentStatus === statusOption.toUpperCase();
                              return (
                                <button
                                  key={statusOption}
                                  onClick={() => handleSetStudentAttendance(student, statusOption)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? statusOption === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : statusOption === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {statusOption}
                                </button>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TRAINERS VIEW ===================== */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          {/* Date Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex-1 max-w-xs">
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Scheduled Class Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              />
            </div>

            {/* Bulk actions for trainers */}
            <div className="flex items-center space-x-2 self-start sm:self-end">
              <button
                disabled={saving || daySchedules.length === 0}
                onClick={() => handleBulkTrainerAttendance('Present')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Trainers Present</span>
              </button>

              <button
                disabled={saving || daySchedules.length === 0}
                onClick={() => handleBulkTrainerAttendance('Absent')}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                <span>Mark All Trainers Absent</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards for Trainers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
              <div className="text-xs font-bold text-slate-500">Scheduled Sessions Today</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{daySchedules.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
              <div className="text-xs font-bold text-slate-500">Trainers Present</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{trainerPresentCount}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{trainerRate}% Coverage Rate</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
              <div className="text-xs font-bold text-slate-500">Trainers Absent</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{trainerAbsentCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-purple-500">
              <div className="text-xs font-bold text-slate-500">Active Academy Trainers</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{trainers.length}</div>
            </div>
          </div>

          {/* Trainers Schedules Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">Loading trainer schedule attendance...</div>
            ) : daySchedules.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No trainer sessions scheduled for {selectedDate}</h3>
                <p className="text-xs text-slate-400">Trainers who have live classes scheduled in Schedule Management will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Trainer</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Scheduled Time</th>
                      <th className="py-3 px-4">Session Topic</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {daySchedules.map(sch => {
                      const trainerUser = trainers.find(t => t.id === sch.trainerId || t.name === sch.trainer);
                      const trainerName = sch.trainer || trainerUser?.name || 'Assigned Trainer';
                      const rawStatus = trainerAttendanceMap[sch.id] || trainerAttendanceMap[sch.trainerId] || trainerAttendanceMap[trainerName.toLowerCase().trim()] || 'Absent';
                      const currentStatus = rawStatus.toUpperCase();

                      return (
                        <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span>{trainerName}</span>
                            </div>
                            {trainerUser?.email && <div className="text-[10px] text-slate-400 font-normal pl-6">{trainerUser.email}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {sch.course || 'Course'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {sch.batch || 'All'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {sch.time || '10:00 AM'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {sch.title || 'Live Session'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {currentStatus === 'PRESENT' ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleSetTrainerAttendance(sch, 'Present')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              Present
                            </button>

                            <button
                              onClick={() => handleSetTrainerAttendance(sch, 'Absent')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus !== 'PRESENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
