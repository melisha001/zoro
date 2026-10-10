import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Layers } from 'lucide-react';
import { getTrainerStudents } from '../../api/userApi';
import { getCourses, getTrainerCourseRequests } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { useAuth } from '../../context/AuthContext';
import { getTrainerAllocatedCourses, getTrainerAllocatedBatches, filterStudentsByCourseAndBatch } from '../../utils/trainerFilterHelper';

export default function TrainerStudentsPage() {
  const { user } = useAuth();
  const trainerName = user?.name || '';

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const [stdRes, crsRes, btcRes, reqsRes] = await Promise.all([
          getTrainerStudents(),
          getCourses(),
          getBatches(),
          getTrainerCourseRequests()
        ]);

        const allCourses = crsRes.data || [];
        const allBatches = btcRes.data || [];
        const approvedReqs = reqsRes.data || [];

        const allocatedCrs = getTrainerAllocatedCourses(user, allCourses, allBatches, approvedReqs);
        setCourses(allocatedCrs);

        const allocatedBtcs = getTrainerAllocatedBatches(user, 'All', allocatedCrs, allBatches);
        setBatches(allocatedBtcs);

        if (stdRes.success && Array.isArray(stdRes.data)) {
          const activeStudents = stdRes.data.filter(s => (s.status || '').toLowerCase() !== 'inactive' && !s.isDeleted);
          setStudents(activeStudents);
        }
      } catch (err) {
        console.error('Failed to load trainer students page data:', err);
      }
    }
    loadData();
  }, [user]);

  const availableBatches = getTrainerAllocatedBatches(user, selectedCourse, courses, batches);

  const handleCourseChange = (courseTitle) => {
    setSelectedCourse(courseTitle);
    const newBatches = getTrainerAllocatedBatches(user, courseTitle, courses, batches);
    const isCurrentBatchValid = newBatches.some(b => (b.name || b.title) === selectedBatch);
    if (!isCurrentBatchValid) {
      setSelectedBatch('All');
    }
  };

  const filteredStudents = filterStudentsByCourseAndBatch(students, selectedCourse, selectedBatch)
    .filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Students</h1>
          <p className="text-xs text-slate-500 font-medium">Manage and view active students assigned to your courses and batches for {trainerName}.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          />
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center space-x-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <select 
            value={selectedCourse} 
            onChange={(e) => handleCourseChange(e.target.value)}
            className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none border border-slate-200 cursor-pointer"
          >
            <option value="All">All Courses</option>
            {courses.map((c) => (
              <option key={c.id || c.title} value={c.title}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Batch Filter Dropdown */}
        <div className="flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-purple-600" />
          <select 
            value={selectedBatch} 
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none border border-slate-200 cursor-pointer"
          >
            <option value="All">All Batches</option>
            {availableBatches.map((b) => (
              <option key={b.id || b.name || b.title} value={b.name || b.title}>{b.name || b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => {
                  const cBatches = s.courseBatches || (s.course ? [{ course: s.course, batch: s.batch || 'Unassigned' }] : []);
                  let displayBatches = cBatches;
                  if (selectedCourse !== 'All') {
                    const filtered = cBatches.filter(cb => (cb.course || '').toLowerCase().trim() === selectedCourse.toLowerCase().trim());
                    if (filtered.length > 0) displayBatches = filtered;
                  }

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4 font-black text-slate-900">{s.name}</td>
                      <td className="py-4 px-4 font-bold text-slate-800 space-y-1">
                        {displayBatches.map((cb, i) => (
                          <div key={i} className="text-xs font-bold text-slate-800">{cb.course}</div>
                        ))}
                      </td>
                      <td className="py-4 px-4 font-bold text-purple-900 space-y-1">
                        {displayBatches.map((cb, i) => (
                          <div key={i} className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mr-1">
                            {cb.batch}
                          </div>
                        ))}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {s.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
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
