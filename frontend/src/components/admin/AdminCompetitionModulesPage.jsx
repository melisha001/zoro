import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Video, FileText, Layers, Trash2, Edit, X, 
  ExternalLink, Upload, File, Image as ImageIcon, AlertCircle, CheckCircle2,
  FileCode, Music, Download, Eye, Link as LinkIcon
} from 'lucide-react';
import { getCompetitions } from '../../api/competitionApi';
import { 
  getCompetitionModules, 
  addCompetitionModule, 
  updateCompetitionModule, 
  deleteCompetitionModule 
} from '../../api/competitionModuleApi';
import ConfirmModal from '../common/ConfirmModal';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'avi', 'webm',
  'mp3', 'wav', 'm4a'
];

export default function AdminCompetitionModulesPage({ competitionId: propCompetitionId, setActiveScreen }) {
  const { competitionId: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const competitionId = propCompetitionId || paramCompetitionId;
  const [competition, setCompetition] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [fileErrors, setFileErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    notesFile: null,
    worksheetFile: null,
    assignmentFile: null
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const compRes = await getCompetitions();
      const allComps = compRes.data || [];
      const current = allComps.find(c => c.id === competitionId) || allComps[0];
      setCompetition(current);

      if (current) {
        const modRes = await getCompetitionModules(current.id);
        setModules(modRes.data || []);
      }
    } catch (err) {
      console.error('Error loading competition modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [competitionId]);

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading competition modules...</div>;
  }

  if (!competition) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-sm font-bold text-slate-600">Competition not found</div>
        <button
          onClick={() => {
            if (setActiveScreen) setActiveScreen('admin-competition');
            navigate('/admin/competitions');
          }}
          className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Return to Competitions
        </button>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      notesFile: null,
      worksheetFile: null,
      assignmentFile: null
    });
    setFileErrors({});
    setEditingModule(null);
  };

  const getFileCategoryLabel = (fieldName) => {
    if (fieldName === 'notesFile') return 'Notes';
    if (fieldName === 'worksheetFile') return 'Worksheet';
    if (fieldName === 'assignmentFile') return 'Assignment';
    return 'Resource';
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileErrors(prev => ({ 
        ...prev, 
        [fieldName]: `Unsupported file type (.${ext}). Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}` 
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
    const category = getFileCategoryLabel(fieldName);

    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: category,
        extension: ext
      }
    }));
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (mod) => {
    setEditingModule(mod);
    setFormData({
      title: mod.title || '',
      description: mod.description || '',
      url: mod.url || '',
      thumbnail: mod.thumbnail || '',
      notesFile: mod.notesFile || null,
      worksheetFile: mod.worksheetFile || null,
      assignmentFile: mod.assignmentFile || null
    });
    setShowAddModal(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingModule) {
      await updateCompetitionModule(editingModule.id, formData);
    } else {
      await addCompetitionModule(competition.id, formData);
    }

    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (deleteModalData) {
      await deleteCompetitionModule(deleteModalData.id);
      setDeleteModalData(null);
      loadData();
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => {
              if (setActiveScreen) setActiveScreen('admin-competition');
              navigate('/admin/competitions');
            }}
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Competitions</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Modules: {competition.name}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage practice modules, guidelines, worksheets, and resources for this competition.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-md flex items-center space-x-2 shrink-0 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Competition Module</span>
        </button>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Competition Modules Added Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Click "Add Competition Module" above to attach study guides, rules, worksheets, and reference links to {competition.name}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod, index) => (
            <div key={mod.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{mod.title}</h3>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openEditModal(mod)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Edit Module"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModalData(mod)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 font-medium leading-relaxed">{mod.description}</p>

                {/* Optional Resource Link */}
                {mod.url && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <a href={mod.url} target="_blank" rel="noreferrer" className="font-bold underline truncate hover:text-blue-800">
                      {mod.url}
                    </a>
                  </div>
                )}

                {/* Attachments Section */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Attached Materials</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['notesFile', 'worksheetFile', 'assignmentFile'].map((field) => {
                      const fileObj = mod[field];
                      const label = getFileCategoryLabel(field);
                      return (
                        <div key={field} className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-1 ${fileObj ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'}`}>
                          <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                            <File className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{label}</span>
                          </div>
                          {fileObj ? (
                            <div className="text-[11px] font-extrabold text-slate-800 truncate" title={fileObj.name}>
                              {fileObj.name}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium italic">None</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-400 flex justify-between items-center">
                <span>Module ID: {mod.id}</span>
                <span>Added: {mod.createdAt || 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingModule ? 'Edit Competition Module' : 'Add New Competition Module'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Root Word Phonetics & Practice"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of module content and instructions for participants..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">External Resource URL / Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/practice-guide"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Attachments Upload Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="font-extrabold text-slate-900">Module File Attachments</div>

                {['notesFile', 'worksheetFile', 'assignmentFile'].map((field) => {
                  const label = getFileCategoryLabel(field);
                  const currentFile = formData[field];
                  const error = fileErrors[field];

                  return (
                    <div key={field} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{label} File</span>
                        {currentFile && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, [field]: null }))}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {currentFile ? (
                        <div className="flex items-center space-x-2 text-emerald-700 font-bold bg-white p-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{currentFile.name} ({currentFile.size})</span>
                        </div>
                      ) : (
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, field)}
                          className="w-full text-slate-500 font-medium text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-100 file:text-emerald-800 file:font-bold hover:file:bg-emerald-200 cursor-pointer"
                        />
                      )}

                      {error && <div className="text-rose-600 font-bold text-[10px] mt-1">{error}</div>}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {editingModule ? 'Save Module Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalData)}
        title="Delete Competition Module"
        message={`Are you sure you want to delete "${deleteModalData?.title}"? This action cannot be undone.`}
        confirmText="Delete Module"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalData(null)}
      />

    </div>
  );
}
