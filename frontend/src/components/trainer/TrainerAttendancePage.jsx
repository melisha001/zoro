import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, BookOpen, Layers, Check, Calendar, AlertCircle } from 'lucide-react';
import { getBatches } from '../../api/batchApi';
import { getTrainerStudents } from '../../api/userApi';
import { getCourses, getTrainerCourseRequests } from '../../api/courseApi';
import { getAttendanceRecords, updateStudentRemark } from '../../api/attendanceApi';
import { getSchedules } from '../../api/scheduleApi';
import { useAuth } from '../../context/AuthContext';
import { getTrainerAllocatedCourses, getTrainerAllocatedBatches, filterStudentsByCourseAndBatch } from '../../utils/trainerFilterHelper';
import { getNowInKolkata, getSessionStartDateTime, getSessionEndDateTime, syncServerTime } from '../../utils/scheduleSortUtil';

export default function TrainerAttendancePage() {
  const { user } = useAuth();
  const trainerName = user?.name || '';
  const trainerId = user?.id || '';

  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [selectedCourseName, setSelectedCourseName] = useState('All');
  const [selectedBatchName, setSelectedBatchName] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [savedIndicator, setSavedIndicator] = useState({}); // key -> bool
  const debounceTimers = useRef({});

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      await syncServerTime();
      const [bRes, sRes, cRes, reqsRes, schRes, attRes] = await Promise.all([
        getBatches(),
        getTrainerStudents(),
        getCourses(),
        getTrainerCourseRequests(),
        getSchedules(),
        getAttendanceRecords()
      ]);

      const allCourses = cRes.data || [];
      const allBatches = bRes.data || [];
      const approvedReqs = reqsRes.data || [];

      // Only Online and Hybrid courses
      const liveCourses = allCourses.filter(c => {
        const mode = (c.mode || '').toLowerCase();
        return mode === 'online' || mode === 'hybrid';
      });

      const allocatedCrs = getTrainerAllocatedCourses(user, liveCourses, allBatches, approvedReqs);
      setCoursesList(allocatedCrs);

      const allocatedBtcs = getTrainerAllocatedBatches(user, 'All', allocatedCrs, allBatches);
      setBatchesList(allocatedBtcs);

      const loadedStudents = (sRes.data || []).filter(s => (s.status || '').toLowerCase() !== 'inactive' && !s.isDeleted);
      setStudents(loadedStudents);

      const schList = schRes.data || [];
      setSchedules(schList);

      const attList = attRes.data || [];
      setAllAttendance(attList);

      const rMap = {};
      attList.forEach(r => {
        if (r.studentId) {
          rMap[r.studentId] = r.remarks || r.remark || '';
        }
      });
      setRemarksMap(rMap);
    } catch (err) {
      console.error('Failed to load trainer attendance data:', err);
    }
  };

  const availableBatches = getTrainerAllocatedBatches(user, selectedCourseName, coursesList, batchesList);

  const handleCourseChange = (cTitle) => {
    setSelectedCourseName(cTitle);
    const newBatches = getTrainerAllocatedBatches(user, cTitle, coursesList, batchesList);
    const isCurrentValid = newBatches.some(b => (b.name || b.title) === selectedBatchName);
    if (!isCurrentValid) {
      setSelectedBatchName('All');
    }
  };

  const filteredStudents = filterStudentsByCourseAndBatch(students, selectedCourseName, selectedBatchName);
  const displayList = filteredStudents.length > 0 ? filteredStudents : [];

  const nowInKolkata = getNowInKolkata();
  const nowMs = nowInKolkata.getTime();

  // Find relevant schedule for the selected date, course, batch
  const currentSchedule = schedules.find(s => {
    const matchDate = !selectedDate || s.date === selectedDate;
    const matchCourse = selectedCourseName === 'All' || s.course === selectedCourseName;
    const matchBatch = selectedBatchName === 'All' || s.batch === selectedBatchName;
    return matchDate && matchCourse && matchBatch;
  }) || schedules[0] || null;

  // Determine automatic status
  const getStudentStatus = (student) => {
    const record = allAttendance.find(r => 
      (r.studentId === student.id || r.studentName?.toLowerCase() === student.name?.toLowerCase()) &&
      (!currentSchedule || r.scheduleId === currentSchedule.id || r.date === selectedDate)
    );

    if (record && (record.status || '').toUpperCase() === 'PRESENT') {
      let timeLabel = '';
      if (record.joinedAt) {
        try {
          timeLabel = new Date(record.joinedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } catch {}
      }
      return { status: 'PRESENT', record, timeLabel };
    }

    if (!currentSchedule) {
      return { status: record ? record.status : 'ABSENT', record };
    }

    const start = getSessionStartDateTime(currentSchedule.date, currentSchedule.time);
    const end = getSessionEndDateTime(currentSchedule.date, currentSchedule.time);
    const startMs = start ? start.getTime() : 0;
    const endMs = end ? end.getTime() : 0;

    if (nowMs < startMs) {
      return { status: 'UPCOMING', record };
    } else if (nowMs >= startMs && nowMs <= endMs) {
      return { status: 'IN_PROGRESS', record };
    } else {
      return { status: 'ABSENT', record };
    }
  };

  // Autosave remark handler
  const handleRemarkChange = (student, text) => {
    const sId = student.id;
    setRemarksMap(prev => ({ ...prev, [sId]: text }));

    if (debounceTimers.current[sId]) {
      clearTimeout(debounceTimers.current[sId]);
    }

    debounceTimers.current[sId] = setTimeout(async () => {
      try {
        const schId = currentSchedule ? currentSchedule.id : null;
        const res = await updateStudentRemark({
          scheduleId: schId,
          studentId: sId,
          remark: text
        });

        if (res.success) {
          setSavedIndicator(prev => ({ ...prev, [sId]: true }));
          setTimeout(() => {
            setSavedIndicator(prev => ({ ...prev, [sId]: false }));
          }, 2500);

          setAllAttendance(prev => {
            const idx = prev.findIndex(r => r.studentId === sId && (!schId || r.scheduleId === schId));
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = res.data;
              return updated;
            }
            return [...prev, res.data];
          });
        }
      } catch (err) {
        console.error('Failed to autosave student remark by trainer:', err);
      }
    }, 800);
  };

  const presentCount = displayList.filter(s => getStudentStatus(s).status === 'PRESENT').length;
  const totalCount = displayList.length || 0;
  const ratePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trainer Attendance & Student Remarks</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Automatic session attendance and bidirectional remarks synced with Administration.</p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-black inline-flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Batch Rate: {presentCount} / {totalCount} Present ({ratePct}%)</span>
        </div>
      </div>

      {/* Course, Batch & Date Selector Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Course (Online / Hybrid)
            </label>
            <select
              value={selectedCourseName}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="All">All Courses</option>
              {coursesList.map(c => (
                <option key={c.id || c.title} value={c.title}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" /> Batch
            </label>
            <select
              value={selectedBatchName}
              onChange={(e) => setSelectedBatchName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="All">All Batches</option>
              {availableBatches.map((b) => (
                <option key={b.id || b.name} value={b.name || b.title}>{b.name || b.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance & Remarks Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
          <span>Course: {selectedCourseName} • Batch: {selectedBatchName}</span>
          <span>Trainer: {trainerName}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Automatic Status</th>
                <th className="py-3.5 px-4">Attendance Remark (Autosaved & Shared with Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayList.length > 0 ? (
                displayList.map((std, idx) => {
                  const info = getStudentStatus(std);
                  const isPresent = info.status === 'PRESENT';
                  const isAbsent = info.status === 'ABSENT';
                  const currentRemark = remarksMap[std.id] !== undefined ? remarksMap[std.id] : (info.record?.remarks || '');
                  const isSaved = savedIndicator[std.id];

                  return (
                    <tr key={std.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm">{std.name}</div>
                        <div className="text-[10px] text-slate-400">{std.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Present {info.timeLabel ? `(${info.timeLabel})` : ''}</span>
                          </span>
                        ) : isAbsent ? (
                          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Absent</span>
                          </span>
                        ) : info.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            <span>In progress - not joined</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            <span>Upcoming</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 max-w-md">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder={isAbsent ? "Add reason for absence (autosaves)..." : "Add remark for admin (autosaves)..."}
                              value={currentRemark}
                              onChange={(e) => handleRemarkChange(std, e.target.value)}
                              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600 ${
                                isAbsent ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                              }`}
                            />
                            {isSaved && (
                              <span className="absolute right-2 text-emerald-600 text-[10px] font-extrabold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Saved
                              </span>
                            )}
                          </div>
                          {info.record?.remarkBy && (
                            <div className="text-[10px] text-slate-400 font-semibold pl-1">
                              by {info.record.remarkBy}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No active students match the selected Course and Batch filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
