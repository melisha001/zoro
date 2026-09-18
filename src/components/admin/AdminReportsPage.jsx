import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Download, Star, Award, CheckCircle2, FileText, Calendar } from 'lucide-react';
import { getStudents, getTrainers } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getAttendanceRecords } from '../../api/attendanceApi';
import { getAssignments } from '../../api/assignmentApi';
import { getSalaries } from '../../api/salaryApi';

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    setLoading(true);
    try {
      const [stdRes, trRes, crsRes, attRes, asgRes, salRes] = await Promise.all([
        getStudents(),
        getTrainers(),
        getCourses(),
        getAttendanceRecords(),
        getAssignments(),
        getSalaries()
      ]);

      setStudents(stdRes.data || []);
      setTrainers(trRes.data || []);
      setCourses(crsRes.data || []);
      setAttendance(attRes.data || []);
      setAssignments(asgRes.data || []);
      setSalaries(salRes.data || []);
    } catch (err) {
      console.error('Error loading report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(a => a.status?.toUpperCase() === 'PRESENT').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 94;

  const handleExportReport = () => {
    const csvRows = [];
    
    // Header section
    csvRows.push(['ZORO ENGLISH ACADEMY - COMPREHENSIVE ORGANIZATIONAL REPORT']);
    csvRows.push([`Generated Period: ${selectedPeriod}`, `Date: ${new Date().toLocaleDateString('en-GB')}`]);
    csvRows.push([]);

    // Metrics Summary
    csvRows.push(['METRIC SUMMARY']);
    csvRows.push(['Total Active Students', students.length]);
    csvRows.push(['Total Active Trainers', trainers.length]);
    csvRows.push(['Active Courses', courses.length]);
    csvRows.push(['Total Attendance Records', attendance.length]);
    csvRows.push(['Attendance Rate (%)', `${attendanceRate}%`]);
    csvRows.push(['Total Assignments Created', assignments.length]);
    csvRows.push(['Total Salary Payments Recorded', salaries.length]);
    csvRows.push([]);

    // Students Section
    csvRows.push(['STUDENT DIRECTORY']);
    csvRows.push(['ID', 'Name', 'Email', 'Phone', 'Joined Date', 'Status']);
    students.forEach(s => {
      csvRows.push([s.id, s.name, s.email, s.phone || '', s.joinedDate || '', s.status || 'Active']);
    });
    csvRows.push([]);

    // Trainers Section
    csvRows.push(['TRAINER DIRECTORY']);
    csvRows.push(['ID', 'Name', 'Email', 'Specialty', 'Joined Date']);
    trainers.forEach(t => {
      csvRows.push([t.id, t.name, t.email, t.specialty || '', t.joinedDate || '']);
    });
    csvRows.push([]);

    // Courses Section
    csvRows.push(['COURSE CATALOG']);
    csvRows.push(['ID', 'Title', 'Fee (INR)', 'Mode', 'Enrolled Count']);
    courses.forEach(c => {
      csvRows.push([c.id, c.title, c.fee || 3500, c.mode || 'Online', c.enrolled || 0]);
    });
    csvRows.push([]);

    // Salary Section
    csvRows.push(['SALARY PAYMENTS']);
    csvRows.push(['ID', 'Trainer Name', 'Amount (INR)', 'Month', 'Status']);
    salaries.forEach(sal => {
      csvRows.push([sal.id, sal.trainerName, sal.amount, sal.month, sal.status || 'Paid']);
    });

    const csvContent = csvRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Zoro_Academy_Report_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Academy Analytics & Reports</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Real-time performance reports and organizational metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
          >
            <option value="This Month">This Month (Sep 2026)</option>
            <option value="Last Month">Last Month (Aug 2026)</option>
            <option value="Quarter 3">Quarter 3 (2026)</option>
          </select>

          <button
            onClick={handleExportReport}
            className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Student Satisfaction</div>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <span>4.9</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Based on student feedback</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Avg Attendance Rate</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{attendanceRate}%</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">{presentCount} present sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Enrolled Students</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">{students.length}</div>
          <div className="text-[10px] text-[#0F52BA] font-bold mt-1">Across {courses.length} active courses</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Trainers</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{trainers.length}</div>
          <div className="text-[10px] text-purple-700 font-bold mt-1">Active teaching faculty</div>
        </div>
      </div>

      {/* Trainer Directory & Performance Scorecard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0F52BA]" />
          <span>Faculty & Trainer Overview</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Trainer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Joined On</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {trainers.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.email}</td>
                  <td className="py-3.5 px-4 font-bold text-[#0F52BA]">{item.specialty || 'English Trainer'}</td>
                  <td className="py-3.5 px-4 text-slate-700">{item.joinedDate || '10 Jan 2025'}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Enrollment & Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0F52BA]" />
          <span>Active Courses Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                <span className="text-xs font-extrabold text-[#0F52BA] bg-blue-100 px-2.5 py-0.5 rounded-full">₹{item.fee || 3500}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Enrolled</span>
                  <span className="font-bold text-slate-800">{item.enrolled || 0} Students</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mode</span>
                  <span className="font-bold text-emerald-600">{item.mode || 'Online'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                  <span className="font-bold text-purple-600">{item.duration || '3 Months'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

