import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { getCourseById, updateCourse } from '../../api/courseApi';
import FileUploader from '../common/FileUploader';

export default function EditCoursePage({ courseId, setActiveScreen }) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId).then(res => {
        if (res.data) setFormData(res.data);
      });
    }
  }, [courseId]);

  if (!formData) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading course details...</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateCourse(courseId, formData);
    setSaving(false);
    setActiveScreen('admin-manage-courses');
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

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Course: {formData.title}</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Video URL</label>
            <input
              type="url"
              value={formData.youtubeUrl || ''}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Update Course'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
