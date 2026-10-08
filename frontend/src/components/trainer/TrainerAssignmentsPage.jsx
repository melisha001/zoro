import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, AlertTriangle, X, Eye, Users, Layers, Check, Edit, Trash2, FileText } from 'lucide-react';
import { getWebsiteSettings } from '../../api/websiteSettingsApi';
import { getCreatedAssignments, createExtraAssignment, updateAssignment, deleteAssignment } from '../../api/assignmentApi';
import { getCourses, getTrainerCourseRequests } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { getStudents } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { getTrainerAllocatedCourses, getTrainerAllocatedBatches, filterStudentsByCourseAndBatch } from '../../utils/trainerFilterHelper';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';

export default function TrainerAssignmentsPage() {
  const { user } = useAuth();
  const trainerName = user?.name || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [allowCreation, setAllowCreation] = useState(true);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [savingAsg, setSavingAsg] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Student selection state inside modal
  const [selectedStudentObjects, setSelectedStudentObjects] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentBatchFilter, setStudentBatchFilter] = useState('All');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    targetType: 'batch', // 'batch' | 'course' | 'student'
    targetBatch: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    attachmentName: '',
    attachmentUrl: '',
    attachmentType: 'application/pdf',
    attachmentSize: ''
  });

  const loadAllData = async () => {
    try {
      const sRes = await getWebsiteSettings();
      if (sRes.success && sRes.data?.portalControls?.trainerPortal) {
        setAllowCreation(sRes.data.portalControls.trainerPortal.allowAssignmentCreation !== false);
      }

      const asgRes = await getCreatedAssignments();
      setAssignments(asgRes.data || []);

      const [cRes, bRes, stdRes, reqsRes] = await Promise.all([
        getCourses(),
        getBatches(),
        getStudents(),
        getTrainerCourseRequests()
      ]);

      const allCourses = cRes.data || [];
      const allBatches = bRes.data || [];
      const approvedReqs = reqsRes.data || [];

      const allocatedCrs = getTrainerAllocatedCourses(user, allCourses, allBatches, approvedReqs);
      setCoursesList(allocatedCrs);

      if (allocatedCrs.length > 0 && !formData.course) {
        setFormData(prev => ({ ...prev, course: allocatedCrs[0].title }));
      }

      const allocatedBtcs = getTrainerAllocatedBatches(user, 'All', allocatedCrs, allBatches);
      setBatchesList(allocatedBtcs);

      const activeStudents = (stdRes.data || []).filter(s => (s.status || '').toLowerCase() !== 'inactive' && !s.isDeleted);
      setStudentsList(activeStudents);
    } catch (err) {
      console.error('Failed to load assignments page data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const availableBatches = getTrainerAllocatedBatches(user, selectedCourse, coursesList, batchesList);

  const handleCourseChange = (courseTitle) => {
    setSelectedCourse(courseTitle);
    const newBatches = getTrainerAllocatedBatches(user, courseTitle, coursesList, batchesList);
    const isCurrentBatchValid = newBatches.some(b => (b.name || b.title) === selectedBatch);
    if (!isCurrentBatchValid) {
      setSelectedBatch('All');
    }
  };

  const handleFileUploadMock = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        attachmentName: file.name,
        attachmentUrl: reader.result,
        attachmentType: file.type || 'application/octet-stream',
        attachmentSize: `${(file.size / 1024).toFixed(1)} KB`
      }));
    };
    reader.readAsDataURL(file);
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudentObjects(prev => {
      const exists = prev.some(s => s.id === student.id || s.email === student.email);
      if (exists) {
        return prev.filter(s => s.id !== student.id && s.email !== student.email);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleOpenCreateModal = () => {
    const firstCourse = coursesList.length > 0 ? coursesList[0].title : '';
    const firstCourseBatches = firstCourse ? getTrainerAllocatedBatches(user, firstCourse, coursesList, batchesList) : [];
    const firstBatch = firstCourseBatches.length > 0 ? (firstCourseBatches[0].name || firstCourseBatches[0].title) : '';

    setFormData({
      title: '',
      description: '',
      course: firstCourse,
      targetType: 'batch',
      targetBatch: firstBatch,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      attachmentName: '',
      attachmentUrl: '',
      attachmentType: 'application/pdf',
      attachmentSize: ''
    });
    setEditingAssignmentId(null);
    setSelectedStudentObjects([]);
    setShowCreateModal(true);
    setShowPreviewModal(false);
  };

  const handleEditAssignment = (item) => {
    setEditingAssignmentId(item.id);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      course: item.course || '',
      targetType: item.targetType || 'batch',
      targetBatch: item.batch || '',
      dueDate: item.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      attachmentName: item.attachment?.name || '',
      attachmentUrl: item.attachment?.url || '',
      attachmentType: item.attachment?.type || 'application/pdf',
      attachmentSize: item.attachment?.size || ''
    });
    setSelectedStudentObjects([]);
    setShowCreateModal(true);
    setShowPreviewModal(false);
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    const res = await deleteAssignment(id);
    if (res.success) {
      setToastMsg('Assignment deleted successfully');
      setTimeout(() => setToastMsg(''), 3000);
      loadAllData();
    }
  };

  const handleFormNextOrSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (formData.targetType === 'student' && selectedStudentObjects.length === 0) {
      alert('Please select at least one student when target is Specific Student.');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleConfirmAssignmentSubmit = async () => {
    setSavingAsg(true);

    let targetName = formData.targetBatch;
    let targetStudentEmail = null;
    let targetStudentIds = [];
    let targetStudentNames = [];
    let targetStudentEmails = [];

    if (formData.targetType === 'course') {
      targetName = `All Enrolled Students (${formData.course})`;
    } else if (formData.targetType === 'student') {
      targetStudentIds = selectedStudentObjects.map(s => s.id || s.email);
      targetStudentNames = selectedStudentObjects.map(s => s.name);
      targetStudentEmails = selectedStudentObjects.map(s => s.email);
      targetStudentEmail = targetStudentEmails[0] || null;

      if (selectedStudentObjects.length === 1) {
        targetName = selectedStudentObjects[0].name;
      } else {
        targetName = `${selectedStudentObjects.length} Students (${selectedStudentObjects.map(s => s.name).join(', ')})`;
      }
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      course: formData.course,
      targetType: formData.targetType,
      targetName,
      batch: formData.targetType === 'batch' ? formData.targetBatch : 'General',
      targetStudentEmail,
      targetStudentIds,
      targetStudentNames,
      targetStudentEmails,
      createdBy: trainerName,
      creatorRole: 'TRAINER',
      dueDate: formData.dueDate,
      attachment: formData.attachmentName ? {
        name: formData.attachmentName,
        url: formData.attachmentUrl || '',
        type: formData.attachmentType,
        size: formData.attachmentSize || ''
      } : null
    };

    if (editingAssignmentId) {
      await updateAssignment(editingAssignmentId, payload);
      setToastMsg('Assignment updated successfully!');
    } else {
      await createExtraAssignment(payload);
      setToastMsg('Extra Assignment created successfully & synced to Admin Portal!');
    }
    setSavingAsg(false);
    setShowPreviewModal(false);
    setShowCreateModal(false);
    setTimeout(() => setToastMsg(''), 3000);
    loadAllData();
  };

  // Requirement 7: Batches in student selection dialog MUST belong ONLY to the selected Course in form
  const modalAvailableBatches = getTrainerAllocatedBatches(user, formData.course || 'All', coursesList, batchesList);

  const modalFilteredStudents = filterStudentsByCourseAndBatch(studentsList, formData.course || 'All', studentBatchFilter)
    .filter(s => (s.name || '').toLowerCase().includes(studentSearchTerm.toLowerCase()));

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.course || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'All' || item.course === selectedCourse;
    const matchesBatch = selectedBatch === 'All' || item.batch === selectedBatch;
    return matchesSearch && matchesCourse && matchesBatch;
  });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      
      {toastMsg && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      {!allowCreation && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-bold shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Assignment creation is currently disabled by administrator.</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Extra Assignment</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Upload and assign extra assignments to entire batches, course groups, or specific individual students.</p>
        </div>
        <button 
          disabled={!allowCreation}
          onClick={() => allowCreation && handleOpenCreateModal()}
          className={`inline-flex items-center justify-center gap-2 font-extrabold px-5 py-3 rounded-xl shadow-md text-xs transition-all ${
            allowCreation 
              ? 'bg-[#0F52BA] hover:bg-blue-700 text-white cursor-pointer' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{allowCreation ? 'Create Extra Assignment' : 'Creation Disabled'}</span>
        </button>
      </div>

      {/* Filter and Search Bar (Requirement 6: Course Filter + Dependent Batch Filter) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Course Filter */}
          <div className="flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <select 
              value={selectedCourse} 
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Courses</option>
              {coursesList.map(c => (
                <option key={c.id || c.title} value={c.title}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Dependent Batch Filter */}
          <div className="flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              {availableBatches.map(b => (
                <option key={b.id || b.name} value={b.name || b.title}>{b.name || b.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by assignment title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20"
          />
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">Title & Description</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Target Audience</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Attachment / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-900 text-sm">{item.title}</div>
                      <div className="text-[11px] font-medium text-slate-500 line-clamp-1">{item.description || 'No instructions provided.'}</div>
                    </td>
                    <td className="py-4 px-4 text-blue-900 font-bold">{item.course}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block max-w-[200px] truncate ${
                        item.targetType === 'student'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : item.targetType === 'course'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {(item.targetName || item.batch || 'Unassigned').replace(/\s*\([^)]*@[^)]*\)/gi, '')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div>{item.createdBy || trainerName}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{item.creatorRole || 'TRAINER'}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-bold">{item.dueDate}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.attachment && (
                          <button
                            onClick={() => setViewerFile(item.attachment)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-blue-200 inline-flex items-center space-x-1 cursor-pointer"
                            title="View Attachment"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditAssignment(item)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-amber-200 inline-flex items-center space-x-1 cursor-pointer"
                          title="Edit Assignment"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-2 py-1.5 rounded-xl border border-rose-200 inline-flex items-center cursor-pointer"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No assignments found for the current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXTRA ASSIGNMENT MODAL */}
      {showCreateModal && !showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Extra Assignment</span>
              <h3 className="text-xl font-black text-slate-900">{editingAssignmentId ? 'Edit Assignment' : 'Create New Assignment'}</h3>
              <p className="text-xs text-slate-500 font-semibold">Assign tasks to an entire batch, all students in a course, or specific individual students.</p>
            </div>

            <form onSubmit={handleFormNextOrSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Speech Transcript & Pronunciation Practice"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter detailed assignment guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Requirement 5: Course dropdown MUST show ONLY courses allocated to current trainer */}
              <div>
                <label className="block mb-1">Select Course *</label>
                <select
                  value={formData.course}
                  onChange={(e) => {
                    const newCourse = e.target.value;
                    const cBatches = getTrainerAllocatedBatches(user, newCourse, coursesList, batchesList);
                    const newBatch = cBatches.length > 0 ? (cBatches[0].name || cBatches[0].title) : '';
                    setFormData({ ...formData, course: newCourse, targetBatch: newBatch });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 cursor-pointer"
                >
                  {coursesList.map(c => (
                    <option key={c.id || c.title} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* TARGET AUDIENCE SELECTION */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-900 font-extrabold">Assign Target Audience *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'batch' })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.targetType === 'batch'
                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Entire Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'course' })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.targetType === 'course'
                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Course Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'student' })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.targetType === 'student'
                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Specific Student
                  </button>
                </div>

                {formData.targetType === 'batch' && (
                  <div>
                    <label className="block text-[11px] mb-1 text-slate-500">Choose Batch</label>
                    <select
                      value={formData.targetBatch}
                      onChange={(e) => setFormData({ ...formData, targetBatch: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold cursor-pointer"
                    >
                      {getTrainerAllocatedBatches(user, formData.course, coursesList, batchesList).length > 0 ? (
                        getTrainerAllocatedBatches(user, formData.course, coursesList, batchesList).map(b => (
                          <option key={b.id || b.name} value={b.name || b.title}>{b.name || b.title}</option>
                        ))
                      ) : (
                        <option value="">No batches available</option>
                      )}
                    </select>
                  </div>
                )}

                {formData.targetType === 'student' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] text-slate-500">Select Specific Students ({formData.course})</label>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {selectedStudentObjects.length} Selected
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowStudentSelector(true)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Users className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate">
                          {selectedStudentObjects.length > 0
                            ? selectedStudentObjects.map(s => s.name).join(', ')
                            : 'Click to select students...'}
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 font-extrabold shrink-0 ml-2">Choose &rarr;</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1">Attach Reference File (PDF, Image, Video, Audio, Doc, Spreadsheet)</label>
                <input
                  type="file"
                  onChange={handleFileUploadMock}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {formData.attachmentName && (
                  <div className="text-[11px] text-emerald-700 font-bold mt-1">
                    Attached: {formData.attachmentName} ({formData.attachmentSize})
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Preview & Confirm &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SELECTOR MODAL (Requirement 7: Batch filter inside dialog uses ONLY selected Course) */}
      {showStudentSelector && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900">Select Target Students</h4>
                <p className="text-[11px] text-slate-500 font-semibold">Course: <strong className="text-blue-900">{formData.course}</strong></p>
              </div>
              <button
                onClick={() => setShowStudentSelector(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters inside modal */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student name..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Batch dropdown ONLY shows batches belonging to formData.course */}
                <select
                  value={studentBatchFilter}
                  onChange={(e) => setStudentBatchFilter(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="All">All Batches ({formData.course})</option>
                  {modalAvailableBatches.map(b => (
                    <option key={b.id || b.name} value={b.name || b.title}>{b.name || b.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 px-1">
                <span>Selected: <strong className="text-purple-700">{selectedStudentObjects.length}</strong> student(s)</span>
                {selectedStudentObjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentObjects([])}
                    className="text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Students List (NO EMAIL DISPLAY) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {modalFilteredStudents.length > 0 ? (
                modalFilteredStudents.map((std) => {
                  const isChecked = selectedStudentObjects.some(s => s.id === std.id || s.email === std.email);
                  return (
                    <div
                      key={std.id || std.email}
                      onClick={() => toggleStudentSelection(std)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs">{std.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {formData.course} • {std.batch || (std.courseBatches?.find(cb => cb.course === formData.course)?.batch) || 'Unassigned'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No active students match your search filter for {formData.course}.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentSelector(false)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Apply Selection ({selectedStudentObjects.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT PREVIEW & CONFIRMATION MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 relative">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Preview & Confirm</span>
              <h3 className="text-xl font-black text-slate-900">Assignment Summary</h3>
              <p className="text-xs text-slate-500 font-semibold">Review details before sending to target audience.</p>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Title</span>
                <div className="font-black text-slate-900 text-sm">{formData.title}</div>
              </div>

              {formData.description && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Instructions</span>
                  <div className="font-medium text-slate-600 line-clamp-3">{formData.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Course</span>
                  <div className="font-bold text-blue-900">{formData.course}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Due Date</span>
                  <div className="font-bold text-slate-900">{formData.dueDate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Target Audience</span>
                <div className="font-extrabold text-purple-900 mt-0.5">
                  {formData.targetType === 'batch' && `Entire Batch: ${formData.targetBatch}`}
                  {formData.targetType === 'course' && `All Course Students (${formData.course})`}
                  {formData.targetType === 'student' && (
                    <span>
                      Specific Students ({selectedStudentObjects.length}): {selectedStudentObjects.map(s => s.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {formData.attachmentName && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center space-x-2 text-blue-700 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Attachment: {formData.attachmentName} ({formData.attachmentSize})</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                &larr; Back to Edit
              </button>
              <button
                type="button"
                disabled={savingAsg}
                onClick={handleConfirmAssignmentSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
              >
                {savingAsg ? 'Assigning...' : 'Confirm & Assign Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL FILE VIEWER MODAL */}
      <UniversalFileViewerModal
        isOpen={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
      />

    </div>
  );
}
