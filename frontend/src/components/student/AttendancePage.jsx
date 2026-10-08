import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getStudentAttendance } from '../../api/attendanceApi';
import { getStudentEnrolledCourses } from '../../api/enrollmentApi';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendancePage({ setActiveScreen }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [isRecordedOnly, setIsRecordedOnly] = useState(false);

  const studentIdentifier = user?.id || user?.email;

  useEffect(() => {
    if (!studentIdentifier) return;
    getStudentAttendance(studentIdentifier).then(res => {
      setRecords(Array.isArray(res.data) ? res.data : []);
    });
    getStudentEnrolledCourses(studentIdentifier).then(enrolled => {
      if (enrolled && enrolled.length > 0 && enrolled.every(c => c.mode === 'Recorded')) {
        setIsRecordedOnly(true);
      }
    });
  }, [studentIdentifier]);

  const totalSessions = records.length;
  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'Present').length;
  const absentCount = Math.max(0, totalSessions - presentCount);
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button 
        onClick={() => setActiveScreen('student-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Attendance History</h1>
          <p className="text-xs text-slate-500 font-medium">Recorded live class session attendance for {user?.name || 'Student'}.</p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-black inline-flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Present: {presentCount} / {totalSessions} Sessions ({attendanceRate}%)</span>
        </div>
      </div>

      {isRecordedOnly && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-extrabold text-sm text-amber-950">Not Applicable for Recorded-Only Courses</p>
            <p className="font-medium text-amber-800 mt-0.5">
              Live attendance tracking is not applicable for Recorded-only courses. Your progress is measured through completed recorded video modules.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-slate-500">Present / Total Sessions</p>
          <p className="text-xl font-black text-slate-900 mt-1">{presentCount} / {totalSessions} <span className="text-xs font-bold text-slate-500">Present</span></p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">Live Class Attendance</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-500">Attendance Rate</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{attendanceRate}%</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">({presentCount} of {totalSessions} Attended)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-teal-500">
          <p className="text-xs font-bold text-slate-500">Present Count</p>
          <p className="text-xl font-black text-teal-700 mt-1">{presentCount} Sessions</p>
          <p className="text-[10px] text-teal-600 font-bold mt-0.5">Completed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
          <p className="text-xs font-bold text-slate-500">Absent / Missed</p>
          <p className="text-xl font-black text-rose-700 mt-1">{absentCount} Sessions</p>
          <p className="text-[10px] text-rose-600 font-bold mt-0.5">Missed Classes</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Remarks / Session</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-blue-900">{rec.courseName || rec.courseId || rec.course || '-'}</td>
                    <td className="py-4 px-4 text-slate-600">{rec.remarks || rec.topic || 'Live Session'}</td>
                    <td className="py-4 px-4 text-slate-500">{rec.date || '-'}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (rec.joinedAt || '-')}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        (rec.status === 'PRESENT' || rec.status === 'Present')
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">{rec.recordedBy || rec.source || 'Portal'}</td>
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
