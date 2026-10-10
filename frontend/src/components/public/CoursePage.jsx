import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { getCourses } from '../../api/courseApi';
import { resolveFileUrl } from '../../api/fileApi';

export default function CoursePage({ onOpenEnquire }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses();
        if (res.success && Array.isArray(res.data)) {
          // Filter ONLY Student courses for Public Course Page
          const studentCourses = res.data.filter(c => (c.audience || 'student') === 'student');
          setCourses(studentCourses);
          if (studentCourses.length > 0) {
            setSelectedCourseId(studentCourses[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses on course page', err);
      }
    }
    loadCourses();
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0] || {};

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Left Sidebar + Right Course Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Course Selector Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <h3 className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">All Courses</h3>
              {courses.map((course) => {
                const isActive = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{course.title}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Course View */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Header & Main Info */}
            {selectedCourse.id ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Text Content */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-block bg-blue-100 text-blue-700 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      Featured Course
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {selectedCourse.title}
                    </h1>

                    {/* Course Details Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                      <div>
                        <div className="text-slate-400 font-semibold">Base Fee</div>
                        <div className="font-black text-emerald-600 text-sm mt-0.5">₹{Number(selectedCourse.fee || selectedCourse.fees || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Duration</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.duration || 'Flexible'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Mode</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.mode || 'Online'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Age Group</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.ageGroup || 'Kids'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Certificate</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.certificate || 'Certified'}</div>
                      </div>
                    </div>

                    {selectedCourse.feeBreakdown && (
                      <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl text-xs font-semibold text-blue-900 leading-relaxed">
                        <span className="font-extrabold text-blue-700">Fee Options & Structure: </span>
                        {selectedCourse.feeBreakdown}
                      </div>
                    )}

                    <button
                      onClick={onOpenEnquire}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      Enquire Now
                    </button>
                  </div>

                  {/* Video Preview Card */}
                  <div className="md:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200 group bg-slate-900">
                      <img
                        src={resolveFileUrl(selectedCourse.thumbnail || selectedCourse.videoUrl) || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800'}
                        alt={selectedCourse.title}
                        className="w-full h-56 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <button className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 fill-current ml-1" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-center text-xs font-bold text-white bg-slate-900/80 backdrop-blur-sm py-1.5 px-3 rounded-lg">
                        Watch Course Demo & Syllabus Overview
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                Loading courses...
              </div>
            )}

            {/* Course Overview Direct Render */}
            {selectedCourse.id && Boolean((selectedCourse.description || selectedCourse.overview)?.trim()) && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-extrabold text-slate-900">Course Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedCourse.description || selectedCourse.overview}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
