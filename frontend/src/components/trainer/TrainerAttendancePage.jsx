import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Save, BookOpen, Layers } from 'lucide-react';
import { getBatches } from '../../api/batchApi';
import { getStudents } from '../../api/userApi';
import { getCourses, getTrainerCourseRequests } from '../../api/courseApi';
import { getAttendanceRemarks, saveAttendanceRemark, recordBatchAttendance } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import { getTrainerAllocatedCourses, getTrainerAllocatedBatches, filterStudentsByCourseAndBatch } from '../../utils/trainerFilterHelper';

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
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [saveToast, setSaveToast] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      const [bRes, sRes, cRes, reqsRes] = await Promise.all([
        getBatches(),
        getStudents(),
        getCourses(),
        getTrainerCourseRequests()
      ]);

      const allCourses = cRes.data || [];
      const allBatches = bRes.data || [];
      const approvedReqs = reqsRes.data || [];

      const allocatedCrs = getTrainerAllocatedCourses(user, allCourses, allBatches, approvedReqs);
      setCoursesList(allocatedCrs);

      const allocatedBtcs = getTrainerAllocatedBatches(user, 'All', allocatedCrs, allBatches);
      setBatchesList(allocatedBtcs);

      const loadedStudents = (sRes.data || []).filter(s => (s.status || '').toLowerCase() !== 'inactive' && !s.isDeleted);
      setStudents(loadedStudents);
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

  useEffect(() => {
    loadBatchRemarks();
  }, [selectedCourseName, selectedBatchName, students]);

  const loadBatchRemarks = async () => {
    const remRes = await getAttendanceRemarks();
    const allRemarks = remRes.data || [];

    const rMap = {};
    const aMap = {};

    students.forEach(s => {
      const foundRem = allRemarks.find(
        r => (r.studentName || '').toLowerCase().trim() === (s.name || '').toLowerCase().trim() &&
             (selectedBatchName === 'All' || r.batch === selectedBatchName || r.batchId === selectedBatchName)
      );
      rMap[s.name] = foundRem ? (foundRem.remark || foundRem.remarks || '') : '';
      aMap[s.name] = 'Present';
    });

    setRemarksMap(rMap);
    setAttendanceMap(aMap);
  };

  const filteredStudents = filterStudentsByCourseAndBatch(students, selectedCourseName, selectedBatchName);
  const displayList = filteredStudents.length > 0 ? filteredStudents : [];

  const toggleAttendanceStatus = (sName) => {
    setAttendanceMap(prev => ({
      ...prev,
      [sName]: prev[sName] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleRemarkChange = (sName, value) => {
    setRemarksMap(prev => ({
      ...prev,
      [sName]: value
    }));
  };

  const handleSaveSingleRemark = async (studentObj) => {
    const sName = studentObj.name;
    const remarkText = remarksMap[sName] || '';
    const courseTitle = selectedCourseName !== 'All' ? selectedCourseName : (studentObj.course || (studentObj.courseBatches?.[0]?.course) || '');
    const courseId = studentObj.courseId || (studentObj.courseBatches?.[0]?.courseId) || '';
    const batchName = selectedBatchName !== 'All' ? selectedBatchName : (studentObj.batch || (studentObj.courseBatches?.[0]?.batch) || 'Unassigned');
    const batchId = studentObj.batchId || (studentObj.courseBatches?.[0]?.batchId) || '';

    const res = await saveAttendanceRemark({
      studentId: studentObj.id || studentObj.email,
      studentName: sName,
      course: courseTitle,
      courseId: courseId,
      batch: batchName,
      batchId: batchId,
      date: selectedDate,
      remark: remarkText,
      addedByName: trainerName || trainerId
    });

    if (res?.success) {
      setSaveToast(`Attendance remark saved for ${sName}`);
    } else {
      setSaveToast(res?.message || `Failed to save remark for ${sName}`);
    }
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleSaveAllAttendance = async () => {
    const recordsToSave = displayList.map(std => {
      const status = attendanceMap[std.name] || 'Present';
      const rText = remarksMap[std.name] || '';
      const courseTitle = selectedCourseName !== 'All' ? selectedCourseName : (std.course || (std.courseBatches?.[0]?.course) || '');
      const courseId = std.courseId || (std.courseBatches?.[0]?.courseId) || '';
      const batchName = selectedBatchName !== 'All' ? selectedBatchName : (std.batch || (std.courseBatches?.[0]?.batch) || 'Unassigned');
      const batchId = std.batchId || (std.courseBatches?.[0]?.batchId) || '';

      return {
        studentId: std.id || std.email,
        studentName: std.name,
        courseId: courseId,
        batchId: batchId,
        date: selectedDate,
        status: status.toUpperCase(),
        remarks: rText,
        recordedBy: trainerName || trainerId
      };
    });

    const res = await recordBatchAttendance(recordsToSave);
    if (res?.success) {
      setSaveToast('Attendance & remarks saved successfully!');
    } else {
      setSaveToast(res?.message || 'Failed to save attendance');
    }
    setTimeout(() => setSaveToast(''), 3000);
  };

  const presentCount = displayList.filter(s => (attendanceMap[s.name] || 'Present') === 'Present').length;
  const totalCount = displayList.length || 0;
  const ratePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 sm:p-8">
      
      {saveToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-between">
          <span>{saveToast}</span>
          <button onClick={() => setSaveToast('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trainer Attendance & Student Remarks</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Mark daily batch attendance and record individual student performance remarks for Admin report sync.</p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-black inline-flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Batch Rate: {presentCount} / {totalCount} Present ({ratePct}%)</span>
        </div>
      </div>

      {/* Course, Batch & Date Selector Bar (Requirement 9) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white"
            />
          </div>

          {/* Course Filter Dropdown (Requirement 9) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Course
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

          {/* Batch Selector (Requirement 9: displays ONLY batch name) */}
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

        <div className="flex justify-end pt-2">
          <button 
            onClick={handleSaveAllAttendance}
            className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md text-xs flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Batch Attendance & Remarks</span>
          </button>
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
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Attendance Remark (Shared with Admin)</th>
                <th className="py-3.5 px-4 text-right">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayList.length > 0 ? (
                displayList.map((std, idx) => {
                  const status = attendanceMap[std.name] || 'Present';
                  const isPresent = status === 'Present';
                  const currentRemark = remarksMap[std.name] || '';

                  return (
                    <tr key={std.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm">{std.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          isPresent 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleAttendanceStatus(std.name)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-colors cursor-pointer ${
                            isPresent
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          Mark {isPresent ? 'Absent' : 'Present'}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          placeholder="Add remark for admin (e.g. Excellent active participation)..."
                          value={currentRemark}
                          onChange={(e) => handleRemarkChange(std.name, e.target.value)}
                          className="w-full max-w-md px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#0F52BA]"
                        />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRemark(std)}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0F52BA] font-extrabold text-[11px] rounded-xl border border-blue-200 inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
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
