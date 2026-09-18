import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Play, FileText, BookOpen, PlusCircle, Sparkles } from 'lucide-react';
import { getCourses, getCourseById } from '../../api/courseApi';
import { getStudentEnrolledCourses, enrollStudentInCourse } from '../../api/enrollmentApi';
import { useAuth } from '../../context/AuthContext';
import YouTubeVideo from '../common/YouTubeVideo';

export default function CourseLearningPage({ courseId: initialCourseId, setActiveScreen }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('my-courses'); // 'my-courses' | 'explore' | 'learn'
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [msg, setMsg] = useState('');

  const studentIdentifier = user?.email || user?.id || 'arjun@student.com';

  useEffect(() => {
    loadAllData();
  }, [studentIdentifier]);

  const loadAllData = async () => {
    try {
      const coursesRes = await getCourses();
      const allCourses = coursesRes.data || [];
      setAvailableCourses(allCourses);

      const enrolled = await getStudentEnrolledCourses(studentIdentifier);
      setEnrolledCourses(enrolled);

      if (initialCourseId) {
        const target = allCourses.find(c => c.id === initialCourseId) || enrolled[0] || allCourses[0];
        if (target) selectCourseToLearn(target);
      } else if (enrolled.length > 0) {
        selectCourseToLearn(enrolled[0]);
      } else if (allCourses.length > 0) {
        setSelectedCourse(allCourses[0]);
      }
    } catch (err) {
      console.error('Error loading LMS data:', err);
    }
  };

  const selectCourseToLearn = (course) => {
    setSelectedCourse(course);
    const firstMod = course.modules?.[0];
    const firstLes = firstMod?.lessons?.[0];
    setActiveLesson(firstLes || null);
    setActiveTab('learn');
  };

  const handleEnroll = async (courseId) => {
    try {
      const res = await enrollStudentInCourse(studentIdentifier, courseId);
      if (res.success) {
        setMsg('Successfully registered for course!');
        setTimeout(() => setMsg(''), 3000);
        await loadAllData();
      } else {
        setMsg(res.message || 'Already enrolled.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      setMsg('Enrollment failed.');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Zoro English Academy LMS
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Student Learning Portal</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'my-courses' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Enrolled Courses ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'explore' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Courses ({availableCourses.length})
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-[#0F52BA] text-xs font-bold rounded-xl">
          {msg}
        </div>
      )}

      {/* MY ENROLLED COURSES TAB */}
      {activeTab === 'my-courses' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Enrolled Courses</h2>
          {enrolledCourses.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">You have not enrolled in any courses yet.</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="bg-[#0F52BA] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
              >
                Browse Available Courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                      Enrolled & Active
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                    <div className="text-xs font-semibold text-slate-400">
                      {course.duration || '3 Months'} • {course.mode || 'Online'}
                    </div>
                  </div>
                  <div className="p-5 pt-0 border-t border-slate-100 mt-4 pt-4">
                    <button
                      onClick={() => selectCourseToLearn(course)}
                      className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Learning</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXPLORE & REGISTER AVAILABLE COURSES TAB */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Explore & Enroll in Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => {
              const isEnrolled = enrolledCourses.some(e => e.id === course.id);
              return (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                        {course.ageGroup || 'All Ages'}
                      </span>
                      <span className="text-xs font-bold text-slate-600">₹{course.fee || 3500}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="p-5 pt-0 border-t border-slate-100 mt-4 pt-4">
                    {isEnrolled ? (
                      <button
                        onClick={() => selectCourseToLearn(course)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Enrolled (Go to Class)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Enroll Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEARN PLAYER TAB */}
      {activeTab === 'learn' && selectedCourse && (
        <div className="space-y-6">
          <button
            onClick={() => setActiveTab('my-courses')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Courses</span>
          </button>

          <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title} - LMS Player</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Video & Lesson Content Player */}
            <div className="lg:col-span-8 space-y-6">
              <YouTubeVideo 
                url={activeLesson?.youtubeUrl || selectedCourse.youtubeUrl} 
                title={activeLesson?.title || selectedCourse.title}
                isProtected={true}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => setActiveScreen('public-login')}
              />

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {activeLesson ? activeLesson.title : 'Course Overview'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {activeLesson?.content || selectedCourse.overview || 'Welcome to this lesson! Follow the video instruction.'}
                </p>
              </div>
            </div>

            {/* Modules Sidebar */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Course Content ({selectedCourse.modules?.length || 0} Modules)
              </h3>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                  <p className="text-xs text-slate-400 font-semibold italic">Syllabus modules are currently being prepared.</p>
                ) : (
                  selectedCourse.modules.map((mod) => (
                    <div key={mod.id} className="space-y-2">
                      <div className="text-xs font-black text-slate-900 bg-slate-100 p-2.5 rounded-xl">
                        {mod.title}
                      </div>
                      <div className="space-y-1 pl-2">
                        {mod.lessons?.map((les) => {
                          const isActive = activeLesson?.id === les.id;
                          return (
                            <button
                              key={les.id}
                              onClick={() => setActiveLesson(les)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <Play className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{les.title}</span>
                              </div>
                              {isActive && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

