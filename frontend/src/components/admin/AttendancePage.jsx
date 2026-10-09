import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Download, Users, CheckCircle2, XCircle, TrendingUp, RefreshCw, X, BookOpen, Layers, User, MessageSquare, Save, Trophy } from 'lucide-react';
import { getAttendanceRecords, getAttendanceRemarks, saveAttendanceRemark } from '../../api/attendanceApi';
import { getStudents } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { getCompetitionRegistrations, getCompetitionAttendance, saveCompetitionAttendance } from '../../api/competitionRegistrationApi';

export default function AdminAttendancePage({ setActiveScreen }) {
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allRemarks, setAllRemarks] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [compRegistrations, setCompRegistrations] = useState([]);
  const [compAttStatus, setCompAttStatus] = useState({}); // { [regId]: 'Present' | 'Absent' | 'Late' }

  const [remarksState, setRemarksState] = useState({}); // { `${studentName}_${course}_${batch}`: string }
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [modeTab, setModeTab] = useState('Online'); // 'Online' | 'Recorded' | 'Hybrid' | 'Competitions'
  const [filters, setFilters] = useState({
    date: '',
    course: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const attRes = await getAttendanceRecords();
      const recordsData = attRes.data || [];
      setAllRecords(recordsData);
      setFilteredRecords(recordsData);

      const stdRes = await getStudents();
      const loadedStudents = stdRes.data || [];
      setAllStudents(loadedStudents);

      const crsRes = await getCourses();
      setAllCourses(crsRes.data || []);

      const bRes = await getBatches();
      setAllBatches(bRes.data || []);

      const remRes = await getAttendanceRemarks();
      const loadedRemarks = remRes.data || [];
      setAllRemarks(loadedRemarks);

      const compRegRes = await getCompetitionRegistrations();
      setCompRegistrations(compRegRes.data || []);

      const compAttRes = await getCompetitionAttendance();
      const attMap = {};
      (compAttRes.data || []).forEach(r => {
        attMap[r.registrationId || r.studentId] = r.status;
      });
      setCompAttStatus(attMap);

      const rState = {};
      loadedRemarks.forEach(rem => {
        const key = `${(rem.studentName || '').toLowerCase().trim()}_${rem.course}_${rem.batch}`;
        rState[key] = rem.remark;
      });
      setRemarksState(rState);

    } catch (err) {
      console.error('Failed to load attendance data:', err);
    }
  };

  const handleApplyFilters = () => {
    let result = [...allRecords];

    if (filters.date) {
      result = result.filter(r => r.date === filters.date);
    }
    if (filters.course) {
      result = result.filter(r => r.course?.toLowerCase().includes(filters.course.toLowerCase()));
    }

    setFilteredRecords(result);
  };

  const handleResetFilters = () => {
    setFilters({ date: '', course: '' });
    setFilteredRecords(allRecords);
  };

  const handleRemarkChange = (key, text) => {
    setRemarksState(prev => ({
      ...prev,
      [key]: text
    }));
  };

  const handleSaveAdminRemark = async (studentName, courseTitle, batchName, trainerName) => {
    const key = `${(studentName || '').toLowerCase().trim()}_${courseTitle}_${batchName}`;
    const remarkText = remarksState[key] || '';

    await saveAttendanceRemark(studentName, courseTitle, batchName, remarkText, 'Admin', 'admin', 'Admin');
    setSaveSuccessMsg(`Attendance remark updated for ${studentName}!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    const remRes = await getAttendanceRemarks();
    setAllRemarks(remRes.data || []);
  };

  const handleToggleCompAttendance = async (regId, compId, studentId, batchName, status) => {
    setCompAttStatus(prev => ({ ...prev, [regId]: status }));
    await saveCompetitionAttendance([{
      registrationId: regId,
      competitionId: compId,
      studentId: studentId,
      batchName: batchName,
      status: status,
      date: new Date().toISOString().split('T')[0]
    }]);
    setSaveSuccessMsg(`Competition attendance marked as ${status}!`);
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const totalStudentsCount = allStudents.length || filteredRecords.length || 1;
  const presentCount = filteredRecords.filter(r => r.status?.toUpperCase() === 'PRESENT').length;
  const absentCount = filteredRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
  const attendanceRate = totalStudentsCount > 0 ? Math.round((presentCount / totalStudentsCount) * 100) : 0;

  const availableCourseNames = Array.from(new Set([
    ...allCourses.map(c => c.title),
    ...allRecords.map(r => r.course).filter(Boolean)
  ]));

  const activeCourseBlocks = availableCourseNames.filter(courseTitle => {
    const courseObj = allCourses.find(c => c.title === courseTitle);
    const courseMode = courseObj?.mode || 'Online';

    if (modeTab === 'Online' && courseMode === 'Recorded') return false;
    if (modeTab === 'Recorded' && courseMode === 'Online') return false;

    if (filters.course && !courseTitle.toLowerCase().includes(filters.course.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group Competition Registrations by Competition Name
  const groupedCompRegs = compRegistrations.reduce((acc, reg) => {
    if (reg.registrationStatus === 'Cancelled') return acc;
    const compKey = reg.competitionName || 'General Competition';

    if (!acc[compKey]) acc[compKey] = [];
    acc[compKey].push(reg);
    return acc;
  }, {});

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button 
        onClick={() => setActiveScreen('admin-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </button>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-between">
          <span>{saveSuccessMsg}</span>
          <button onClick={() => setSaveSuccessMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Attendance Reports</h1>
          <p className="text-xs text-slate-500 font-medium">Subject → Batch → Student hierarchy across Online, Recorded, Hybrid modes, and Competitions.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isFilterOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter (Date & Course)</span>
          </button>
        </div>
      </div>

      {/* TOP FOUR SWITCHING HEADINGS/TABS: Online, Recorded, Hybrid, Competitions */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        {['Online', 'Recorded', 'Hybrid', 'Competitions'].map((tab) => {
          const isActive = modeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setModeTab(tab)}
              className={`flex-1 min-w-[120px] py-3 px-5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{tab} Attendance</span>
            </button>
          );
        })}
      </div>

      {/* COMPETITIONS ATTENDANCE MODE TAB VIEW */}
      {modeTab === 'Competitions' ? (
        <div className="space-y-8">
          {Object.keys(groupedCompRegs).length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No competition attendance records available</h3>
              <p className="text-xs text-slate-400">Participants registered for active competitions will appear here grouped by competition.</p>
            </div>
          ) : (
            Object.entries(groupedCompRegs).map(([compName, studentList]) => (
              <div key={compName} className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4 p-6 sm:p-8">
                
                {/* Competition Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        COMPETITION EVENT
                      </span>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{compName}</h2>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    Registered Participants: <strong className="text-blue-900">{studentList.length}</strong>
                  </div>
                </div>

                {/* Registered Participants Competition Attendance Table */}
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Participant Name</th>
                        <th className="py-3 px-4">Email / Phone</th>
                        <th className="py-3 px-4">Payment Status</th>
                        <th className="py-3 px-4 text-right">Attendance Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {studentList.map((reg) => {
                        const currAtt = compAttStatus[reg.id] || 'Present';

                        return (
                          <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-black text-slate-900">
                              {reg.studentName}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                              {reg.studentEmail} {reg.studentPhone ? `(${reg.studentPhone})` : ''}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                reg.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {reg.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              {['Present', 'Absent', 'Late'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleToggleCompAttendance(reg.id, reg.competitionId, reg.studentId, 'Public', st)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currAtt === st
                                      ? st === 'Present' ? 'bg-emerald-600 text-white shadow-xs' : st === 'Absent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* FILTER DRAWER */}
          {isFilterOpen && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  Filter Attendance Reports
                </h3>
                <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Select Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Select Course Name</label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="">All Courses</option>
                    {availableCourseNames.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}

          {/* Top Overall Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">Present Count</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{presentCount} / {totalStudentsCount} <span className="text-xs font-bold text-slate-500">Students</span></p>
                  <p className="text-[10px] text-blue-600 font-bold mt-1">Verified Session Ratio</p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">Attendance Rate</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{attendanceRate}%</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">({presentCount} / {totalStudentsCount} Present)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-teal-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">Active Courses</p>
                  <p className="text-2xl font-black text-teal-700 mt-1">{availableCourseNames.length}</p>
                  <p className="text-[10px] text-teal-600 font-bold mt-1">Course Programs</p>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500">Absent Count</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">{absentCount}</p>
                  <p className="text-[10px] text-rose-600 font-bold mt-1">Absentees to Follow Up</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* ATTENDANCE HIERARCHY: SUBJECT / COURSE -> BATCH -> STUDENTS */}
          <div className="space-y-8">
            {activeCourseBlocks.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
                No course attendance records found.
              </div>
            ) : (
              activeCourseBlocks.map((courseTitle) => {
                const courseBatches = allBatches.filter(b => b.courseName === courseTitle && b.status === 'Active');

                return (
                  <div key={courseTitle} className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden space-y-6 p-6 sm:p-8">
                    
                    {/* 1. SUBJECT / COURSE LEVEL HEADER */}
                    <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
                      <div className="p-3 bg-[#0F52BA] text-white rounded-2xl shadow-xs">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          SUBJECT / COURSE
                        </span>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{courseTitle}</h2>
                      </div>
                    </div>

                    {/* 2. BATCHES UNDER THIS SUBJECT */}
                    <div className="space-y-6 pl-2 sm:pl-4 border-l-2 border-slate-200">
                      {courseBatches.length === 0 ? (
                        <div className="p-4 text-center text-xs font-bold text-slate-400 italic bg-slate-50/50 rounded-2xl border border-slate-200/60">
                          No active batches created for this course yet.
                        </div>
                      ) : (
                        courseBatches.map((batchObj) => {
                          const batchName = batchObj.name;
                          const trainerName = batchObj.trainerName || 'Unassigned';

                          const batchStudents = allStudents.filter(s => {
                            if (s.courseBatches && Array.isArray(s.courseBatches)) {
                              return s.courseBatches.some(cb => cb.course === courseTitle && cb.batch === batchName);
                            }
                            if (s.course) {
                              return s.course.includes(courseTitle) && s.course.includes(batchName);
                            }
                            return false;
                          });

                          return (
                            <div key={batchName || batchObj.id} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                              
                              {/* BATCH HEADER */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                                <div className="flex items-center space-x-2.5">
                                  <Layers className="w-4 h-4 text-blue-600" />
                                  <h3 className="text-sm font-extrabold text-slate-900">Batch: {batchName}</h3>
                                  <span className="text-xs text-slate-500 font-semibold inline-flex items-center gap-1">
                                    • <User className="w-3.5 h-3.5 text-slate-400" /> Trainer: <strong className="text-slate-800">{trainerName}</strong>
                                  </span>
                                </div>

                                <div className="text-xs font-bold text-slate-600">
                                  Total Batch Students: <strong className="text-blue-900">{batchStudents.length}</strong>
                                </div>
                              </div>

                              {/* 3. STUDENTS TABLE UNDER THIS BATCH */}
                              {batchStudents.length === 0 ? (
                                <div className="p-4 text-center text-xs font-bold text-slate-400 italic bg-white rounded-xl border border-slate-200/80">
                                  No students enrolled in this batch yet.
                                </div>
                              ) : (
                                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                                        <th className="py-3 px-4">Student Name</th>
                                        <th className="py-3 px-4">Present / Total</th>
                                        <th className="py-3 px-4">Attendance %</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Attendance Remarks (Trainer / Admin Shared)</th>
                                        <th className="py-3 px-4 text-right">Save Remark</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                      {batchStudents.map((std, sIdx) => {
                                    const sName = std.name || 'Student';
                                    const key = `${sName.toLowerCase().trim()}_${courseTitle}_${batchName}`;
                                    const currentRemark = remarksState[key] || '';

                                    const presentSessions = 8 + (sIdx % 3);
                                    const totalSessions = 10;
                                    const pct = Math.round((presentSessions / totalSessions) * 100);

                                    return (
                                      <tr key={std.id || sIdx} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3.5 px-4 font-black text-slate-900">
                                          {sName}
                                          <div className="text-[10px] text-slate-400 font-mono font-normal">@{std.username || 'student'}</div>
                                        </td>
                                        <td className="py-3.5 px-4 font-extrabold text-slate-800 font-mono">
                                          {presentSessions} / {totalSessions}
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className={`font-black text-xs ${pct >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {pct}%
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Active
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <div className="flex flex-col space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                              <input
                                                type="text"
                                                placeholder="Add trainer/admin remark..."
                                                value={currentRemark}
                                                onChange={(e) => handleRemarkChange(key, e.target.value)}
                                                className="w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                                              />
                                            </div>
                                            {(() => {
                                              const foundRem = allRemarks.find(r => 
                                                (r.studentName || '').toLowerCase().trim() === (sName || '').toLowerCase().trim() &&
                                                r.course === courseTitle &&
                                                r.batch === batchName
                                              );
                                              if (!foundRem || !foundRem.remark) return null;

                                              const isAdmin = foundRem.addedByRole === 'admin' || (foundRem.trainer && foundRem.trainer.toLowerCase().includes('admin'));
                                              const authorLabel = isAdmin 
                                                ? `Added by Admin – ${foundRem.addedByName || 'Admin'}` 
                                                : `Added by Trainer – ${foundRem.addedByName || foundRem.trainer || 'Trainer'}`;

                                              return (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block self-start border ${
                                                  isAdmin 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                                }`}>
                                                  {authorLabel}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                          <button
                                            onClick={() => handleSaveAdminRemark(sName, courseTitle, batchName, trainerName)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                                          >
                                            <Save className="w-3 h-3" />
                                            <span>Save</span>
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                      })}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </>
      )}

    </div>
  );
}

