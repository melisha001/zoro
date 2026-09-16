import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Play, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { getCourseById } from '../../api/courseApi';
import { useAuth } from '../../context/AuthContext';
import YouTubeVideo from '../common/YouTubeVideo';

export default function CourseLearningPage({ courseId, setActiveScreen }) {
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId).then(res => {
        if (res.data) {
          setCourse(res.data);
          // Set initial lesson
          const firstMod = res.data.modules?.[0];
          const firstLes = firstMod?.lessons?.[0];
          if (firstLes) setActiveLesson(firstLes);
        }
      });
    }
  }, [courseId]);

  if (!course) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading course syllabus...</div>;
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button
        onClick={() => setActiveScreen('public-course')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Info</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Zoro English Academy LMS
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{course.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Video & Lesson Content Player (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <YouTubeVideo 
            url={activeLesson?.youtubeUrl || course.youtubeUrl} 
            title={activeLesson?.title || course.title}
            isProtected={true}
            isAuthenticated={isAuthenticated}
            onLoginClick={() => setActiveScreen('public-login')}
          />

          {isAuthenticated && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {activeLesson ? activeLesson.title : 'Course Introduction'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {activeLesson?.content || course.overview || 'Welcome to this lesson! Please follow along with the video instruction.'}
              </p>
            </div>
          )}
        </div>

        {/* Modules Sidebar (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Course Content ({course.modules?.length || 0} Modules)
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {(!course.modules || course.modules.length === 0) ? (
              <p className="text-xs text-slate-400 font-semibold italic">Syllabus modules are currently being prepared.</p>
            ) : (
              course.modules.map((mod, mIdx) => (
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
  );
}
