import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit, Layers, Trash2, User } from 'lucide-react';
import { getCourses, deleteCourse } from '../../api/courseApi';

export default function ManageCoursesPage({ setActiveScreen, setSelectedCourseIdForEdit }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = () => {
    setLoading(true);
    getCourses().then(res => {
      setCourses(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDeleteCourse = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete course "${title}"?`)) {
      await deleteCourse(id);
      loadCourses();
    }
  };

  return (
    <div className="p-[#16px] sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Management</h1>
          <p className="text-xs text-slate-500 font-medium">Create, edit, delete, and assign trainers to Zoro English Academy courses.</p>
        </div>

        <button
          onClick={() => setActiveScreen('admin-add-course')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400">Loading courses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow">
                    {course.mode}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                    {course.duration} • {course.ageGroup}
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{course.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{course.description}</p>
                  
                  <div className="pt-2 text-xs font-bold text-slate-600 flex flex-wrap items-center gap-2">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                      {(course.modules || []).length} Modules
                    </span>
                    <span className="bg-[#0F52BA]/10 text-[#0F52BA] px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Trainer: {course.assignedTrainer || 'Ms. Priya'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                <button
                  onClick={() => {
                    setSelectedCourseIdForEdit(course.id);
                    setActiveScreen('admin-course-content');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Modules</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCourseIdForEdit(course.id);
                      setActiveScreen('admin-edit-course');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
