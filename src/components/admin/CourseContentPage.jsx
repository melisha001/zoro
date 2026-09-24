import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Video, FileText, Layers, Trash2, Edit, X, 
  ExternalLink, Upload, File, Image as ImageIcon, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { getCourseById, addModule, updateModule, deleteModule } from '../../api/courseApi';
import ConfirmModal from '../common/ConfirmModal';

export default function CourseContentPage({ courseId, setActiveScreen }) {
  const [course, setCourse] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [fileErrors, setFileErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    notesPdf: null,
    activitySheetPdf: null,
    assignmentPdf: null
  });

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
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading course modules...</div>;
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      notesPdf: null,
      activitySheetPdf: null,
      assignmentPdf: null
    });
    setFileErrors({});
  };

  const handlePdfUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileErrors(prev => ({ ...prev, [fieldName]: 'Only PDF files are accepted.' }));
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      setFileErrors(prev => ({ ...prev, [fieldName]: 'File size must be 100 MB or less.' }));
      e.target.value = '';
      return;
    }

    setFileErrors(prev => ({ ...prev, [fieldName]: '' }));
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadedAt: new Date().toLocaleDateString('en-GB')
      }
    }));
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImage = validTypes.includes(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isImage) {
      setFileErrors(prev => ({ ...prev, thumbnail: 'Only JPG, JPEG, PNG, or WebP images are accepted.' }));
      e.target.value = '';
      return;
    }

    setFileErrors(prev => ({ ...prev, thumbnail: '' }));
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      thumbnail: previewUrl
    }));
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingModule) {
      await updateModule(course.id, editingModule.id, formData);
      setEditingModule(null);
    } else {
      await addModule(course.id, formData);
      setShowAddModal(false);
    }
    resetForm();
    loadCourse();
  };

  const handleConfirmDelete = async () => {
    if (deleteModalData) {
      await deleteModule(course.id, deleteModalData.id);
      setDeleteModalData(null);
      loadCourse();
    }
  };

  const openEditModal = (mod) => {
    setEditingModule(mod);
    setFormData({
      title: mod.title || '',
      description: mod.description || '',
      url: mod.url || '',
      thumbnail: mod.thumbnail || '',
      notesPdf: mod.notesPdf || null,
      activitySheetPdf: mod.activitySheetPdf || null,
      assignmentPdf: mod.assignmentPdf || null
    });
    setFileErrors({});
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <button
        onClick={() => setActiveScreen('admin-manage-courses')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Management</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Modules: {course.title}</h1>
          <p className="text-xs text-slate-500 font-medium">Add, edit, and organize individual modules and study resources for this course.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Module</span>
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {(!course.modules || course.modules.length === 0) ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800">No modules created yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click <strong className="text-blue-600">"Add New Module"</strong> above to upload notes, activity sheets, assignments, and video links for {course.title}.
            </p>
          </div>
        ) : (
          course.modules.map((mod, index) => (
            <div key={mod.id || index} className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden space-y-4">
              
              {/* Module Header Bar */}
              <div className="bg-slate-900 text-white p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">{mod.title}</h3>
                    {mod.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{mod.description}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => openEditModal(mod)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteModalData(mod)}
                    className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Module Body Content */}
              <div className="p-6 pt-2 space-y-4">
                
                {/* Thumbnail Preview & URL Link Row */}
                <div className="flex flex-col md:flex-row gap-4 items-start border-b border-slate-100 pb-4">
                  {mod.thumbnail ? (
                    <div className="w-32 h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={mod.thumbnail} alt={mod.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 h-24 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px] font-semibold shrink-0">
                      <ImageIcon className="w-5 h-5 mb-1" />
                      No Thumbnail
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-xs">
                    {mod.url && (
                      <div className="flex items-center space-x-2 text-blue-600 font-bold">
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <a href={mod.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                          {mod.url}
                        </a>
                      </div>
                    )}
                    {mod.description && (
                      <p className="text-slate-600 leading-relaxed font-medium">{mod.description}</p>
                    )}
                  </div>
                </div>

                {/* Module PDF Resources Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Notes PDF */}
                  <div className={`p-4 rounded-2xl border ${mod.notesPdf ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FileText className={`w-4 h-4 ${mod.notesPdf ? 'text-emerald-600' : 'text-slate-400'}`} />
                        Notes PDF
                      </span>
                      {mod.notesPdf && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                    </div>
                    {mod.notesPdf ? (
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        📄 {mod.notesPdf.name} ({mod.notesPdf.size})
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium italic">No Notes PDF attached</div>
                    )}
                  </div>

                  {/* Activity Sheet PDF */}
                  <div className={`p-4 rounded-2xl border ${mod.activitySheetPdf ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FileText className={`w-4 h-4 ${mod.activitySheetPdf ? 'text-blue-600' : 'text-slate-400'}`} />
                        Activity Sheet PDF
                      </span>
                      {mod.activitySheetPdf && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                    </div>
                    {mod.activitySheetPdf ? (
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        📑 {mod.activitySheetPdf.name} ({mod.activitySheetPdf.size})
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium italic">No Activity Sheet attached</div>
                    )}
                  </div>

                  {/* Assignment PDF */}
                  <div className={`p-4 rounded-2xl border ${mod.assignmentPdf ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <FileText className={`w-4 h-4 ${mod.assignmentPdf ? 'text-purple-600' : 'text-slate-400'}`} />
                        Assignment PDF
                      </span>
                      {mod.assignmentPdf && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                    </div>
                    {mod.assignmentPdf ? (
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        📝 {mod.assignmentPdf.name} ({mod.assignmentPdf.size})
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-medium italic">No Assignment attached</div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Module Modal */}
      {(showAddModal || editingModule) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => { setShowAddModal(false); setEditingModule(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingModule ? `Edit Module: ${editingModule.title}` : `Add Module to ${course.title}`}
            </h3>

            <form onSubmit={handleSaveModule} className="space-y-4">
              
              {/* 1. Module Title */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Introduction to Communication"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* 2. Module Description */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Module Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of topics and objectives covered in this module..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* 3. URL Link */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">URL Link (Video or Class Material)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* 4. Thumbnail Image Upload */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Thumbnail Image (JPG/JPEG/PNG/WebP)</label>
                <div className="flex items-center gap-3">
                  {formData.thumbnail && (
                    <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnail: '' })}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full"
                        title="Remove Image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleThumbnailUpload}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                  />
                </div>
                {fileErrors.thumbnail && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.thumbnail}
                  </p>
                )}
              </div>

              {/* 5. Notes PDF */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-extrabold text-slate-800">Notes PDF (Max 100 MB)</label>
                {formData.notesPdf ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📄 {formData.notesPdf.name} ({formData.notesPdf.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, notesPdf: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handlePdfUpload(e, 'notesPdf')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.notesPdf && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.notesPdf}
                  </p>
                )}
              </div>

              {/* 6. Activity Sheet PDF */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-extrabold text-slate-800">Activity Sheet PDF (Max 100 MB)</label>
                {formData.activitySheetPdf ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📑 {formData.activitySheetPdf.name} ({formData.activitySheetPdf.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, activitySheetPdf: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handlePdfUpload(e, 'activitySheetPdf')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.activitySheetPdf && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.activitySheetPdf}
                  </p>
                )}
              </div>

              {/* 7. Assignment PDF */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-extrabold text-slate-800">Assignment PDF (Max 100 MB)</label>
                {formData.assignmentPdf ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📝 {formData.assignmentPdf.name} ({formData.assignmentPdf.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignmentPdf: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handlePdfUpload(e, 'assignmentPdf')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.assignmentPdf && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.assignmentPdf}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform text-xs mt-2 cursor-pointer"
              >
                {editingModule ? 'Save Changes' : 'Save Module'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalData)}
        title="Delete Module"
        message={`Are you sure you want to delete module "${deleteModalData?.title}"? All attached files and links for this module will be removed.`}
        confirmText="Delete Module"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalData(null)}
      />

    </div>
  );
}
