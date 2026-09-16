import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Video, FileText, Layers, Trash, CheckCircle2 } from 'lucide-react';
import { getCourseById, addModule, addLesson } from '../../api/courseApi';

export default function CourseContentPage({ courseId, setActiveScreen }) {
  const [course, setCourse] = useState(null);
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [showAddMod, setShowAddMod] = useState(false);
  const [activeModIdForLesson, setActiveModIdForLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');

  const loadCourse = async () => {
    if (courseId) {
      const res = await getCourseById(courseId);
      if (res.data) setCourse(res.data);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  if (!course) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading course syllabus...</div>;
  }

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModTitle) return;
    await addModule(course.id, { title: newModTitle, description: newModDesc });
    setNewModTitle('');
    setNewModDesc('');
    setShowAddMod(false);
    loadCourse();
  };

  const handleCreateLesson = async (e, moduleId) => {
    e.preventDefault();
    if (!newLessonTitle) return;
    await addLesson(course.id, moduleId, {
      title: newLessonTitle,
      youtubeUrl: newLessonUrl,
      content: newLessonContent
    });
    setNewLessonTitle('');
    setNewLessonUrl('');
    setNewLessonContent('');
    setActiveModIdForLesson(null);
    loadCourse();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button
        onClick={() => setActiveScreen('admin-manage-courses')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Syllabus: {course.title}</h1>
          <p className="text-xs text-slate-500 font-medium">Add structured modules and video lessons for students.</p>
        </div>

        <button
          onClick={() => setShowAddMod(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Module</span>
        </button>
      </div>

      {/* Add Module Modal/Form */}
      {showAddMod && (
        <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-xl space-y-4 max-w-2xl">
          <h3 className="text-sm font-extrabold text-slate-900">Create New Syllabus Module</h3>
          <form onSubmit={handleCreateModule} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Module Title (e.g. Module 1: Basics of Communication)"
              value={newModTitle}
              onChange={(e) => setNewModTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
            />
            <textarea
              rows={2}
              placeholder="Module description..."
              value={newModDesc}
              onChange={(e) => setNewModDesc(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddMod(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white font-extrabold px-5 py-2 rounded-xl text-xs"
              >
                Save Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-6">
        {(!course.modules || course.modules.length === 0) ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center space-y-2">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-700">No modules created yet</h3>
            <p className="text-xs text-slate-400">Click Add Module above to start building the course syllabus.</p>
          </div>
        ) : (
          course.modules.map((mod) => (
            <div key={mod.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{mod.title}</h3>
                  <p className="text-xs text-slate-500">{mod.description}</p>
                </div>
                <button
                  onClick={() => setActiveModIdForLesson(activeModIdForLesson === mod.id ? null : mod.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lesson</span>
                </button>
              </div>

              {/* Add Lesson Form */}
              {activeModIdForLesson === mod.id && (
                <form onSubmit={(e) => handleCreateLesson(e, mod.id)} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-extrabold text-blue-900">New Lesson in {mod.title}</h4>
                  <input
                    type="text"
                    required
                    placeholder="Lesson Title (e.g. Lesson 1: Introduction)"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="url"
                    placeholder="YouTube Video URL (https://www.youtube.com/watch?v=...)"
                    value={newLessonUrl}
                    onChange={(e) => setNewLessonUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <textarea
                    rows={2}
                    placeholder="Lesson text notes..."
                    value={newLessonContent}
                    onChange={(e) => setNewLessonContent(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveModIdForLesson(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                    >
                      Save Lesson
                    </button>
                  </div>
                </form>
              )}

              {/* Lessons List */}
              <div className="space-y-2">
                {(!mod.lessons || mod.lessons.length === 0) ? (
                  <p className="text-xs text-slate-400 font-semibold italic">No lessons in this module yet.</p>
                ) : (
                  mod.lessons.map((les) => (
                    <div key={les.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 font-bold text-slate-800">
                        <Video className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{les.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{les.youtubeUrl ? 'YouTube Video' : 'Text Lesson'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
