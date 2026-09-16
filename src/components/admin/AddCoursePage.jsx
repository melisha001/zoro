import React, { useState } from 'react';
import { ArrowLeft, Save, Upload, Video } from 'lucide-react';
import { createCourse } from '../../api/courseApi';
import FileUploader from '../common/FileUploader';

export default function AddCoursePage({ setActiveScreen }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    duration: '3 Months',
    mode: 'Online',
    ageGroup: '7-12 Years',
    certificate: 'Yes',
    assignedTrainer: 'Ms. Priya',
    youtubeUrl: '',
    overview: '',
    thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await createCourse(formData);
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Course</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced English Grammar"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Tagline</label>
              <input
                type="text"
                placeholder="e.g. Master Writing. Speak Confidently."
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Description</label>
            <textarea
              rows={3}
              required
              placeholder="Short course description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Online / Offline">Online / Offline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age Group</label>
              <input
                type="text"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Trainer</label>
              <select
                value={formData.assignedTrainer}
                onChange={(e) => setFormData({ ...formData, assignedTrainer: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              >
                <option value="Ms. Priya">Ms. Priya (English)</option>
                <option value="Mr. Rajesh">Mr. Rajesh (Grammar)</option>
                <option value="Ms. Anitha">Ms. Anitha (Spoken English)</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Video URL</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Thumbnail</label>
            <FileUploader 
              label="Click to upload course thumbnail image" 
              accept=".png,.jpg,.jpeg"
              onFileSelect={(file) => {
                if (file) {
                  const fakeUrl = URL.createObjectURL(file);
                  setFormData({ ...formData, thumbnail: fakeUrl });
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Course...' : 'Save & Publish Course'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
