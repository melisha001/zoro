import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Download, Users, CheckCircle2, XCircle, TrendingUp, RefreshCw, X } from 'lucide-react';
import { getAttendanceRecords } from '../../api/attendanceApi';
import { getStudents } from '../../api/userApi';

export default function AdminAttendancePage({ setActiveScreen }) {
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    date: '',
    course: '',
    studentName: '',
    status: ''
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
      if (stdRes.data && stdRes.data.length > 0) {
        setStudentsCount(stdRes.data.length);
      } else {
        setStudentsCount(recordsData.length);
      }
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
    if (filters.studentName) {
      result = result.filter(r => r.studentName?.toLowerCase().includes(filters.studentName.toLowerCase()));
    }
    if (filters.status) {
      result = result.filter(r => r.status?.toUpperCase() === filters.status.toUpperCase());
    }

    setFilteredRecords(result);
  };

  const handleResetFilters = () => {
    setFilters({ date: '', course: '', studentName: '', status: '' });
    setFilteredRecords(allRecords);
  };

  const totalStudents = studentsCount || filteredRecords.length || 1;
  const presentCount = filteredRecords.filter(r => r.status?.toUpperCase() === 'PRESENT').length;
  const absentCount = filteredRecords.filter(r => r.status?.toUpperCase() === 'ABSENT').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const uniqueCourses = Array.from(new Set(allRecords.map(r => r.course).filter(Boolean)));

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button 
        onClick={() => setActiveScreen('admin-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Attendance Reports</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time attendance tracking across all Zoro English Academy batches.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isFilterOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Data</span>
          </button>
        </div>
      </div>

      {/* FILTER DRAWER / PANEL */}
      {isFilterOpen && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filter Attendance Records
            </h3>
            <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Course</label>
              <select
                value={filters.course}
                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              >
                <option value="">All Courses</option>
                {uniqueCourses.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Student Name</label>
              <input
                type="text"
                placeholder="Search student..."
                value={filters.studentName}
                onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Attendance Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Attendance Summary Cards (Present / Total Students requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500">Present Today</p>
              <p className="text-xl font-black text-slate-900 mt-1">{presentCount} / {totalStudents} <span className="text-xs font-bold text-slate-500">Students</span></p>
              <p className="text-[10px] text-blue-600 font-bold mt-1">Verified Session Attendance</p>
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
              <p className="text-[10px] text-emerald-600 font-bold mt-1">({presentCount} / {totalStudents} Present)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-teal-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500">Present Count</p>
              <p className="text-2xl font-black text-teal-700 mt-1">{presentCount}</p>
              <p className="text-[10px] text-teal-600 font-bold mt-1">Out of {totalStudents} Total Enrolled</p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-5 h-5" />
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

      {/* Attendance Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Joined Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-black text-slate-900">{rec.studentName}</td>
                    <td className="py-4 px-4 font-bold text-blue-900">{rec.course}</td>
                    <td className="py-4 px-4 text-slate-600">{rec.topic}</td>
                    <td className="py-4 px-4 text-slate-500">{rec.date}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{rec.joinedAt}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        rec.status?.toUpperCase() === 'ABSENT' 
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">{rec.source || 'LMS System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

