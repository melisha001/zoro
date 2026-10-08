import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Video, FileText, Layers, Trash2, Edit, X, 
  ExternalLink, Image as ImageIcon, AlertCircle, CheckCircle2,
  Music, Download
} from 'lucide-react';
import { getCourseById, addModule, updateModule, deleteModule } from '../../api/courseApi';
import ConfirmModal from '../common/ConfirmModal';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'avi', 'webm',
  'mp3', 'wav', 'm4a'
];

export default function CourseContentPage({ courseId: propCourseId, setActiveScreen }) {
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();
  const courseId = propCourseId || paramCourseId;
  const [course, setCourse] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [fileErrors, setFileErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    videoStorageKey: '',
    videoFileName: '',
    videoFileSize: '',
    videoDuration: '',
    thumbnail: '',
    notesFile: null,
    worksheetFile: null,
    assignmentFile: null,
    afterSessionAssessmentEnabled: false,
    assessmentType: 'uploaded',
    assessmentTitle: '',
    assessmentGoogleFormUrl: '',
    assessmentFile: null
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
      videoStorageKey: '',
      videoFileName: '',
      videoFileSize: '',
      videoDuration: '',
      thumbnail: '',
      notesFile: null,
      worksheetFile: null,
      assignmentFile: null,
      afterSessionAssessmentEnabled: false,
      assessmentType: 'uploaded',
      assessmentTitle: '',
      assessmentGoogleFormUrl: '',
      assessmentFile: null
    });
    setFileErrors({});
  };

  const getFileCategoryLabel = (fieldName) => {
    if (fieldName === 'notesFile') return 'Notes';
    if (fieldName === 'worksheetFile') return 'Worksheet';
    if (fieldName === 'assignmentFile') return 'Assignment';
    if (fieldName === 'assessmentFile') return 'Assessment';
    return 'Resource';
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileErrors(prev => ({ 
        ...prev, 
        [fieldName]: `Unsupported file type (.${ext}). Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}` 
      }));
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
    const objectUrl = URL.createObjectURL(file);
    const category = getFileCategoryLabel(fieldName);

    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: ext,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
        fileUrl: objectUrl,
        category
      }
    }));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFormData(prev => ({
      ...prev,
      videoFileName: file.name,
      videoFileSize: `${sizeMb} MB`,
      videoStorageKey: `cloud_storage_vids/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      videoDuration: prev.videoDuration || '15:30'
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

    let afterSessionAssessment = null;
    if (formData.afterSessionAssessmentEnabled) {
      afterSessionAssessment = {
        type: formData.assessmentType,
        title: formData.assessmentTitle.trim() || `${formData.title} Assessment`,
        googleFormUrl: formData.assessmentType === 'google_form' ? formData.assessmentGoogleFormUrl.trim() : '',
        file: formData.assessmentType === 'uploaded' ? formData.assessmentFile : null
      };
    }

    const payload = {
      ...formData,
      afterSessionAssessment
    };

    if (editingModule) {
      await updateModule(course.id, editingModule.id, payload);
      setEditingModule(null);
    } else {
      await addModule(course.id, payload);
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
    const asa = mod.afterSessionAssessment || null;
    setFormData({
      title: mod.title || '',
      description: mod.description || '',
      url: mod.url || '',
      videoStorageKey: mod.videoStorageKey || mod.storageKey || '',
      videoFileName: mod.videoFileName || mod.fileName || '',
      videoFileSize: mod.videoFileSize || mod.fileSize || '',
      videoDuration: mod.videoDuration || mod.duration || '',
      thumbnail: mod.thumbnail || '',
      notesFile: mod.notesFile || mod.notesPdf || null,
      worksheetFile: mod.worksheetFile || mod.activitySheetPdf || null,
      assignmentFile: mod.assignmentFile || mod.assignmentPdf || null,
      afterSessionAssessmentEnabled: Boolean(asa),
      assessmentType: asa?.type || 'uploaded',
      assessmentTitle: asa?.title || '',
      assessmentGoogleFormUrl: asa?.googleFormUrl || '',
      assessmentFile: asa?.file || null
    });
    setFileErrors({});
  };

  const isOnlineMode = course.mode === 'Online';

  const renderFileIcon = (type) => {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(type)) return <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />;
    if (['mp4', 'mov', 'avi', 'webm'].includes(type)) return <Video className="w-4 h-4 text-blue-600 shrink-0" />;
    if (['mp3', 'wav', 'm4a'].includes(type)) return <Music className="w-4 h-4 text-emerald-600 shrink-0" />;
    return <FileText className="w-4 h-4 text-amber-600 shrink-0" />;
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <button
        onClick={() => {
          if (setActiveScreen) setActiveScreen('admin-manage-courses');
          navigate('/admin/courses');
        }}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Management</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Modules: {course.title}</h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              course.mode === 'Online' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              course.mode === 'Recorded' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
              'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {course.mode || 'Online'} Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Add, edit, and organize individual modules and study resources for this course.</p>
        </div>

        {!isOnlineMode && (
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
        )}
      </div>

      {/* Online Mode Notice Banner */}
      {isOnlineMode && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900 text-xs font-semibold flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <strong className="block text-sm font-extrabold text-amber-950">Modules are not available for Online mode courses (Live sessions only).</strong>
            <span>Online mode courses use live Google Meet schedules. Switch the course mode to <strong>Recorded</strong> or <strong>Hybrid</strong> in Edit Course if you wish to attach recorded modules and files.</span>
          </div>
        </div>
      )}

      {/* Modules List */}
      {!isOnlineMode && (
        <div className="space-y-6">
          {(!course.modules || course.modules.length === 0) ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">No modules created yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong className="text-blue-600">"Add New Module"</strong> above to upload notes, worksheets, assignments, and video links for {course.title}.
              </p>
            </div>
          ) : (
            course.modules.map((mod, index) => {
              const notes = mod.notesFile || mod.notesPdf;
              const worksheet = mod.worksheetFile || mod.activitySheetPdf;
              const assignment = mod.assignmentFile || mod.assignmentPdf;

              return (
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

                    {/* Module Resources Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      
                      {/* Notes */}
                      <div className={`p-4 rounded-2xl border ${notes ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            {renderFileIcon(notes?.type)}
                            Notes
                          </span>
                          {notes && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                        </div>
                        {notes ? (
                          <div className="text-[11px] font-bold text-slate-700 truncate space-y-1">
                            <div>📄 {notes.name} ({notes.size})</div>
                            {notes.fileUrl && (
                              <a href={notes.fileUrl} download={notes.name} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[10px]">
                                <Download className="w-3 h-3" /> Download / View
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium italic">No Notes attached</div>
                        )}
                      </div>

                      {/* Worksheet */}
                      <div className={`p-4 rounded-2xl border ${worksheet ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            {renderFileIcon(worksheet?.type)}
                            Worksheet
                          </span>
                          {worksheet && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                        </div>
                        {worksheet ? (
                          <div className="text-[11px] font-bold text-slate-700 truncate space-y-1">
                            <div>📑 {worksheet.name} ({worksheet.size})</div>
                            {worksheet.fileUrl && (
                              <a href={worksheet.fileUrl} download={worksheet.name} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[10px]">
                                <Download className="w-3 h-3" /> Download / View
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium italic">No Worksheet attached</div>
                        )}
                      </div>

                      {/* Assignment */}
                      <div className={`p-4 rounded-2xl border ${assignment ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            {renderFileIcon(assignment?.type)}
                            Assignment
                          </span>
                          {assignment && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Attached</span>}
                        </div>
                        {assignment ? (
                          <div className="text-[11px] font-bold text-slate-700 truncate space-y-1">
                            <div>📝 {assignment.name} ({assignment.size})</div>
                            {assignment.fileUrl && (
                              <a href={assignment.fileUrl} download={assignment.name} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[10px]">
                                <Download className="w-3 h-3" /> Download / View
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium italic">No Assignment attached</div>
                        )}
                      </div>

                      {/* After Session Assessment */}
                      <div className={`p-4 rounded-2xl border ${mod.afterSessionAssessment ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                            Assessment
                          </span>
                          {mod.afterSessionAssessment && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                              {mod.afterSessionAssessment.type === 'google_form' ? 'Google Form' : 'File'}
                            </span>
                          )}
                        </div>
                        {mod.afterSessionAssessment ? (
                          <div className="text-[11px] font-bold text-slate-700 truncate space-y-1">
                            <div className="line-clamp-1">📋 {mod.afterSessionAssessment.title || 'Post-Session Evaluation'}</div>
                            {mod.afterSessionAssessment.type === 'google_form' ? (
                              <a href={mod.afterSessionAssessment.googleFormUrl || '#'} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1 text-[10px] font-bold">
                                <ExternalLink className="w-3 h-3" /> Open Form URL
                              </a>
                            ) : mod.afterSessionAssessment.file?.fileUrl ? (
                              <a href={mod.afterSessionAssessment.file.fileUrl} download={mod.afterSessionAssessment.file.name} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1 text-[10px] font-bold">
                                <Download className="w-3 h-3" /> Download / View File
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium">Uploaded File attached</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium italic">No Assessment configured</div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Module Modal */}
      {(showAddModal || editingModule) && !isOnlineMode && (
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

              {/* 3. Video Stream & Storage Reference */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block font-extrabold text-slate-800">Lesson Video Stream & Storage Reference</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Direct Video Stream URL</label>
                    <input
                      type="url"
                      placeholder="https://commondatastorage.googleapis.com/..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Cloud Storage Reference Key</label>
                    <input
                      type="text"
                      placeholder="cloud_storage_vids/lesson_01.mp4"
                      value={formData.videoStorageKey}
                      onChange={(e) => setFormData({ ...formData, videoStorageKey: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Upload / Select MP4 Video File</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/mkv"
                    onChange={handleVideoSelect}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                  />
                  {formData.videoFileName && (
                    <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                      ✓ Selected: {formData.videoFileName} ({formData.videoFileSize}) — Key: {formData.videoStorageKey}
                    </p>
                  )}
                </div>
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

              {/* 5. Notes */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800">Notes (Max 100 MB, All Formats)</label>
                  <span className="text-[10px] text-slate-400 font-semibold">.pdf, .doc, .docx, .ppt, .xls, .jpg, .png, .mp4, etc.</span>
                </div>
                {formData.notesFile ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📄 {formData.notesFile.name} ({formData.notesFile.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, notesFile: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'notesFile')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.notesFile && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.notesFile}
                  </p>
                )}
              </div>

              {/* 6. Worksheet */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800">Worksheet (Max 100 MB, All Formats)</label>
                  <span className="text-[10px] text-slate-400 font-semibold">.pdf, .doc, .docx, .ppt, .xls, .jpg, .png, .mp4, etc.</span>
                </div>
                {formData.worksheetFile ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📑 {formData.worksheetFile.name} ({formData.worksheetFile.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, worksheetFile: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'worksheetFile')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.worksheetFile && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.worksheetFile}
                  </p>
                )}
              </div>

              {/* 7. Assignment */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800">Assignment (Max 100 MB, All Formats)</label>
                  <span className="text-[10px] text-slate-400 font-semibold">.pdf, .doc, .docx, .ppt, .xls, .jpg, .png, .mp4, etc.</span>
                </div>
                {formData.assignmentFile ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <span>📝 {formData.assignmentFile.name} ({formData.assignmentFile.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignmentFile: null })}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'assignmentFile')}
                    className="w-full text-xs font-medium cursor-pointer"
                  />
                )}
                {fileErrors.assignmentFile && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.assignmentFile}
                  </p>
                )}
              </div>

              {/* 8. After-Session Assessment Section */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableAssessment"
                      checked={formData.afterSessionAssessmentEnabled}
                      onChange={(e) => setFormData({ ...formData, afterSessionAssessmentEnabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="enableAssessment" className="font-extrabold text-purple-950 text-xs cursor-pointer">
                      Attach After-Session Assessment
                    </label>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
                    Student Assessment
                  </span>
                </div>

                {formData.afterSessionAssessmentEnabled && (
                  <div className="space-y-3 pt-2 border-t border-purple-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Assessment Title / Instructions *</label>
                      <input
                        type="text"
                        placeholder="e.g. Module 1 Post-Session Evaluation"
                        value={formData.assessmentTitle}
                        onChange={(e) => setFormData({ ...formData, assessmentTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Assessment Mode / Type</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-700">
                          <input
                            type="radio"
                            name="assessmentType"
                            value="uploaded"
                            checked={formData.assessmentType === 'uploaded'}
                            onChange={() => setFormData({ ...formData, assessmentType: 'uploaded' })}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>Uploaded Assessment File</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-700">
                          <input
                            type="radio"
                            name="assessmentType"
                            value="google_form"
                            checked={formData.assessmentType === 'google_form'}
                            onChange={() => setFormData({ ...formData, assessmentType: 'google_form' })}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>Google Form URL</span>
                        </label>
                      </div>
                    </div>

                    {formData.assessmentType === 'google_form' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Google Form URL *</label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/forms/d/e/.../viewform"
                          value={formData.assessmentGoogleFormUrl}
                          onChange={(e) => setFormData({ ...formData, assessmentGoogleFormUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-purple-600"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Upload Assessment File (PDF, DOCX, PPTX, XLSX, MP4, MP3, Images, etc.)</label>
                        {formData.assessmentFile ? (
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                            <span>📝 {formData.assessmentFile.name} ({formData.assessmentFile.size})</span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, assessmentFile: null })}
                              className="text-rose-600 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, 'assessmentFile')}
                            className="w-full text-xs font-medium cursor-pointer"
                          />
                        )}
                        {fileErrors.assessmentFile && (
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {fileErrors.assessmentFile}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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

