import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit, Trash2, Key, CheckCircle, X, Calendar, 
  Download, Layers, User, Mail, CheckCircle2, AlertCircle, FileSpreadsheet, ChevronDown, ChevronUp, Users as UsersIcon,
  Copy, Check
} from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, updateUserStatus } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { getBatches } from '../../api/batchApi';
import { logActivity } from '../../api/activityLogApi';
import { exportToExcel } from '../../utils/excelExporter';
import { sanitizePhone, validatePhone, formatPhone } from '../../utils/phoneValidator';
import ConfirmModal from '../common/ConfirmModal';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [viewMode, setViewMode] = useState('batch-wise'); // 'batch-wise' or 'table'

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudentData, setDeleteStudentData] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showForceOption, setShowForceOption] = useState(false);
  
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdEmailModalData, setCreatedEmailModalData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    status: 'Active',
    selectedCourses: [],
    courseBatchMap: {},
    joinedOn: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const sRes = await getStudents();
    setStudents(sRes.data || []);
    
    const cRes = await getCourses();
    setCoursesList(cRes.data || []);

    const bRes = await getBatches();
    setBatchesList(bRes.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateEmail = (emailStr) => {
    const trimmed = (emailStr || '').trim();
    if (!trimmed) return 'Email address is required.';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) return 'Please enter a valid email address.';
    return '';
  };

  const validateUsername = (unameStr, currentStudentId = null) => {
    const trimmed = (unameStr || '').trim();
    if (!trimmed) return 'Username is required.';
    const exists = students.some(
      s => (s.username || '').toLowerCase() === trimmed.toLowerCase() && s.id !== currentStudentId
    );
    if (exists) return 'This username is already in use. Please choose another username.';
    return '';
  };

  const resetForm = () => {
    setUsernameError('');
    setEmailError('');
    setPhoneError('');
    setFormError('');
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      status: 'Active',
      selectedCourses: [],
      courseBatchMap: {},
      joinedOn: new Date().toISOString().split('T')[0]
    });
  };

  const handleToggleCourse = (courseTitle) => {
    const current = formData.selectedCourses || [];
    const currentMap = { ...(formData.courseBatchMap || {}) };

    if (current.includes(courseTitle)) {
      const updatedCourses = current.filter(c => c !== courseTitle);
      delete currentMap[courseTitle];
      setFormData({ ...formData, selectedCourses: updatedCourses, courseBatchMap: currentMap });
    } else {
      const updatedCourses = [...current, courseTitle];
      const crsObj = coursesList.find(c => c.title === courseTitle);
      const courseBatches = batchesList.filter(b => 
        ((crsObj && b.courseId === crsObj.id) || b.courseName === courseTitle) && b.status === 'Active'
      );
      currentMap[courseTitle] = courseBatches.length > 0 ? courseBatches[0].name : '';
      setFormData({ ...formData, selectedCourses: updatedCourses, courseBatchMap: currentMap });
    }
  };

  const handleBatchChangeForCourse = (courseTitle, batchName) => {
    setFormData(prev => ({
      ...prev,
      courseBatchMap: {
        ...(prev.courseBatchMap || {}),
        [courseTitle]: batchName
      }
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    const uErr = validateUsername(formData.username, null);
    if (uErr) {
      setUsernameError(uErr);
      return;
    }
    setUsernameError('');

    const eErr = validateEmail(formData.email);
    if (eErr) {
      setEmailError(eErr);
      return;
    }
    setEmailError('');

    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setPhoneError('');

    if (formData.password && formData.password.trim().length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    const courseBatches = (formData.selectedCourses || []).map(crs => {
      const crsObj = coursesList.find(c => c.title === crs || c.id === crs);
      const bName = (formData.courseBatchMap && formData.courseBatchMap[crs]) || '';
      const bObj = batchesList.find(b => b.name === bName && ((crsObj && b.courseId === crsObj.id) || b.courseName === crs));
      return {
        course: crsObj ? crsObj.title : crs,
        courseId: crsObj ? crsObj.id : null,
        batch: bName || (bObj ? bObj.name : 'Unassigned'),
        batchId: bObj ? bObj.id : null
      };
    });

    const courseString = courseBatches.map(cb => `${cb.course} (${cb.batch})`).join(', ');

    const newStudentObj = {
      name: formData.name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: sanitizePhone(formData.phone),
      status: formData.status || 'Active',
      joinedOn: formData.joinedOn,
      course: courseString,
      courseBatches
    };
    if (formData.password && formData.password.trim()) {
      newStudentObj.password = formData.password.trim();
    }

    const res = await createStudent(newStudentObj);
    if (!res.success) {
      setFormError(res.message || 'Failed to create student');
      return;
    }

    logActivity('Student Created', `Added student "${newStudentObj.name}" (@${newStudentObj.username}) enrolled in ${courseString}`, 'Student');

    setCreatedEmailModalData({
      studentName: newStudentObj.name,
      username: newStudentObj.username,
      email: newStudentObj.email,
      joiningDate: newStudentObj.joinedOn,
      courseBatches,
      temporaryPassword: res.data?.temporaryPassword || null
    });

    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setFormError('');

    const uErr = validateUsername(formData.username, editingStudent.id);
    if (uErr) {
      setUsernameError(uErr);
      return;
    }
    setUsernameError('');

    const eErr = validateEmail(formData.email);
    if (eErr) {
      setEmailError(eErr);
      return;
    }
    setEmailError('');

    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setPhoneError('');

    if (formData.password && formData.password.trim().length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    const courseBatches = (formData.selectedCourses || []).map(crs => {
      const crsObj = coursesList.find(c => c.title === crs || c.id === crs);
      const bName = (formData.courseBatchMap && formData.courseBatchMap[crs]) || '';
      const bObj = batchesList.find(b => b.name === bName && ((crsObj && b.courseId === crsObj.id) || b.courseName === crs));
      return {
        course: crsObj ? crsObj.title : crs,
        courseId: crsObj ? crsObj.id : null,
        batch: bName || (bObj ? bObj.name : 'Unassigned'),
        batchId: bObj ? bObj.id : null
      };
    });

    const courseString = courseBatches.map(cb => `${cb.course} (${cb.batch})`).join(', ');

    const updatePayload = {
      name: formData.name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: sanitizePhone(formData.phone),
      status: formData.status || 'Active',
      joinedOn: formData.joinedOn,
      course: courseString,
      courseBatches
    };
    if (formData.password && formData.password.trim()) {
      updatePayload.password = formData.password.trim();
    }

    const res = await updateStudent(editingStudent.id, updatePayload);
    if (!res.success) {
      setFormError(res.message || 'Failed to update student');
      return;
    }

    logActivity('Student Updated', `Updated student details for "${formData.name}" (@${formData.username})`, 'Student');

    setEditingStudent(null);
    resetForm();
    loadData();
  };

  const handleToggleStudentStatus = async (student) => {
    const newStatus = student.status === 'Inactive' ? 'Active' : 'Inactive';
    const res = await updateUserStatus(student.id, newStatus);
    if (!res.success) {
      alert(res.message || 'Failed to update student status');
      return;
    }
    logActivity('Student Status Changed', `Changed status of student "${student.name}" to ${newStatus}`, 'Student');
    loadData();
  };

  const handleConfirmDelete = async (force = false) => {
    if (deleteStudentData) {
      const res = await deleteStudent(deleteStudentData.id, force);
      if (!res.success) {
        setDeleteError(res.message || 'Failed to delete student');
        setShowForceOption(true);
        return;
      }
      logActivity('Student Deleted', `Deleted student account for "${deleteStudentData.name}"`, 'Student');
      setDeleteStudentData(null);
      setDeleteError(null);
      setShowForceOption(false);
      loadData();
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setUsernameError('');
    setEmailError('');
    setPhoneError('');
    setFormError('');

    let selectedCourses = [];
    let courseBatchMap = {};

    if (student.courseBatches && Array.isArray(student.courseBatches) && student.courseBatches.length > 0) {
      selectedCourses = student.courseBatches.map(cb => cb.course);
      student.courseBatches.forEach(cb => {
        courseBatchMap[cb.course] = cb.batch || '';
      });
    } else if (student.course) {
      selectedCourses = student.course.split(',').map(c => c.split('(')[0].trim()).filter(Boolean);
      selectedCourses.forEach(crs => {
        const match = student.course.split(',').find(cStr => cStr.includes(crs));
        if (match && match.includes('(')) {
          courseBatchMap[crs] = match.split('(')[1].replace(')', '').trim();
        }
      });
    }

    setFormData({
      name: student.name || '',
      username: student.username || student.email.split('@')[0] || '',
      email: student.email || '',
      password: '',
      phone: student.phone || '',
      status: student.status || 'Active',
      selectedCourses,
      courseBatchMap,
      joinedOn: student.joinedOn || student.dateOfJoining || new Date().toISOString().split('T')[0]
    });
  };

  // Requirement: Excel (.xlsx) Export for All Students
  const handleDownloadAllStudents = () => {
    const headers = ['Student Name', 'Username', 'Email', 'Phone', 'Enrolled Courses & Batches', 'Date of Joining', 'Status'];
    const rows = students.map(s => {
      let cStr = s.course;
      if (s.courseBatches && Array.isArray(s.courseBatches)) {
        cStr = s.courseBatches.map(cb => `${cb.course} (${cb.batch})`).join('; ');
      }
      return [
        s.name || '',
        s.username || '',
        s.email || '',
        s.phone || '',
        cStr || '',
        s.joinedOn || s.dateOfJoining || '',
        s.status || 'Active'
      ];
    });
    const filename = `Zoro_Academy_All_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(filename, 'All Students', headers, rows);
  };

  // Requirement: Excel (.xlsx) Export for Batch-wise Students
  const handleDownloadBatchStudents = (batchObj, batchStudentList) => {
    const headers = ['Student Name', 'Username', 'Email', 'Phone', 'Course', 'Batch Name', 'Trainer', 'Date of Joining', 'Status'];
    const rows = batchStudentList.map(s => [
      s.name || '',
      s.username || '',
      s.email || '',
      s.phone || '',
      batchObj.courseName || '',
      batchObj.name || '',
      batchObj.trainerName || '',
      s.joinedOn || s.dateOfJoining || '',
      s.status || 'Active'
    ]);
    const safeBatchName = (batchObj.name || 'Batch').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Zoro_Students_${safeBatchName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(filename, safeBatchName, headers, rows);
  };

  // Helper to determine if student belongs to batch
  const isStudentInBatch = (student, batchObj) => {
    if (student.courseBatches && Array.isArray(student.courseBatches)) {
      return student.courseBatches.some(cb => cb.batch === batchObj.name || cb.course === batchObj.courseName);
    }
    if (student.course) {
      return student.course.includes(batchObj.name) || student.course.includes(batchObj.courseName);
    }
    return false;
  };

  const filteredStudents = students.filter(student => {
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      const matchesSearch = (
        (student.name && student.name.toLowerCase().includes(query)) ||
        (student.username && student.username.toLowerCase().includes(query)) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.phone && student.phone.toLowerCase().includes(query)) ||
        (student.id && String(student.id).toLowerCase().includes(query)) ||
        (student.course && student.course.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    if (joinedDate) {
      const sDate = student.joinedOn || student.dateOfJoining;
      if (!sDate) return false;
      if (sDate !== joinedDate) return false;
    }

    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 font-medium">Batch-wise student organization, multi-batch support, unique usernames, and CSV exports.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Requirement #6.2: Download All Students Button */}
          <button
            onClick={handleDownloadAllStudents}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download All Students</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Search & View Mode Toggle Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Search students by name, username, email, phone, course, batch or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Joined Date Filter */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center space-x-1 text-slate-500 font-bold px-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Joined Date:</span>
            </div>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            />
            {joinedDate && (
              <button
                onClick={() => setJoinedDate('')}
                className="px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-extrabold text-[10px] cursor-pointer"
              >
                Clear Date
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('batch-wise')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'batch-wise' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch-Wise View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Table View
            </button>
          </div>

        </div>
      </div>

      {/* Requirement #5: BATCH-WISE STUDENT DISPLAY */}
      {viewMode === 'batch-wise' ? (
        <div className="space-y-6">
          {(batchesList.length === 0) ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
              No batches created yet. Go to Batch Management to create batches.
            </div>
          ) : (
            batchesList.map((batchObj) => {
              // Find all students in this batch (Multi-batch students will appear under ALL their batches)
              const batchStudents = filteredStudents.filter(s => isStudentInBatch(s, batchObj));

              return (
                <div key={batchObj.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4">
                  
                  {/* Batch Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <UsersIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-black text-slate-900">{batchObj.name}</h3>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${
                            batchObj.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {batchObj.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs font-medium mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Course: <strong className="text-slate-900">{batchObj.courseName}</strong></span>
                          <span>•</span>
                          <span>Trainer: <strong className="text-[#0F52BA]">{batchObj.trainerName}</strong></span>
                          <span>•</span>
                          <span>Days: <strong className="text-slate-800">{batchObj.day || (batchObj.days && batchObj.days.join(', '))}</strong> ({batchObj.session})</span>
                        </div>
                      </div>
                    </div>

                    {/* Excel Batch Download Button */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDownloadBatchStudents(batchObj, batchStudents)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 self-start sm:self-auto cursor-pointer transition-colors shadow-xs"
                        title={`Download Excel for ${batchObj.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Excel ({batchStudents.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Batch Students Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Joining Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {batchStudents.length > 0 ? (
                          batchStudents.map((student) => {
                            const isActive = student.status !== 'Inactive';
                            return (
                              <tr key={`${batchObj.id}-${student.id}`} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 font-black text-slate-900">{student.name}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">@{student.username || 'n/a'}</td>
                                <td className="py-3.5 px-4 text-blue-900 font-bold">{student.email}</td>
                                <td className="py-3.5 px-4 text-slate-500">{student.phone}</td>
                                <td className="py-3.5 px-4 text-slate-600 font-medium">{student.joinedOn || student.dateOfJoining || '12 Jan 2026'}</td>
                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => handleToggleStudentStatus(student)}
                                    className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                      isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                  </button>
                                </td>
                                <td className="py-3.5 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => openEditModal(student)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                    title="Edit Account"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteStudentData(student);
                                      setDeleteError(null);
                                      setShowForceOption(false);
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400 font-semibold italic whitespace-normal">
                              No students currently assigned to {batchObj.name}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Global Table View */
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email (Login ID)</th>
                  <th className="py-3 px-4">Courses & Assigned Batches</th>
                  <th className="py-3 px-4">Date of Joining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isActive = student.status !== 'Inactive';

                    let displayCourseBatches = [];
                    if (student.courseBatches && Array.isArray(student.courseBatches)) {
                      displayCourseBatches = student.courseBatches;
                    } else if (student.course) {
                      displayCourseBatches = student.course.split(',').map(cStr => {
                        const parts = cStr.trim().split('(');
                        const cName = parts[0].trim();
                        const bName = parts[1] ? parts[1].replace(')', '').trim() : 'Unassigned';
                        return { course: cName, batch: bName };
                      });
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-900">{student.name}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 font-mono">@{student.username || 'n/a'}</td>
                        <td className="py-4 px-4 text-blue-900 font-bold">{student.email}</td>
                        <td className="py-4 px-4 text-slate-700">
                          <div className="flex flex-col gap-1.5 max-w-xs">
                            {displayCourseBatches.map((cb, idx) => (
                              <div 
                                key={idx} 
                                className="inline-flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#0F52BA] border border-blue-200/80"
                              >
                                <span>{cb.course}</span>
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-mono ml-2">
                                  → {cb.batch}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">{student.joinedOn || student.dateOfJoining || '12 Jan 2026'}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleStudentStatus(student)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit Account"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteStudentData(student);
                              setDeleteError(null);
                              setShowForceOption(false);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 font-bold text-xs">
                      No students found matching your search or date filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requirement #7: ADD / EDIT STUDENT MODAL WITH COURSE-SPECIFIC BATCH DROPDOWN */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingStudent ? 'Edit Student Account' : 'Create Student Account'}
            </h3>

            <form onSubmit={editingStudent ? handleUpdate : handleCreate} className="space-y-4">
              
              {/* Student Name */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Melisha"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Username & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Unique Username Requirement */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Username (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. melisha123"
                    value={formData.username}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, username: val });
                      if (usernameError) setUsernameError(validateUsername(val, editingStudent?.id));
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${usernameError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl font-semibold text-slate-900 focus:bg-white`}
                  />
                  {usernameError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {usernameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="melisha@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, email: val });
                      if (emailError) setEmailError(validateEmail(val));
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${emailError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl font-semibold text-slate-900 focus:bg-white`}
                  />
                  {emailError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {emailError}
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile Phone (10-Digit Indian Mobile) */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Mobile Phone (10 Digits) *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const sanitized = sanitizePhone(e.target.value);
                    setFormData({ ...formData, phone: sanitized });
                    if (phoneError) setPhoneError('');
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${phoneError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl font-semibold text-slate-900 focus:bg-white`}
                />
                {phoneError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {phoneError}
                  </p>
                )}
              </div>

              {/* Password & Joined On Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Password (min 8 characters)</label>
                  <input
                    type="text"
                    placeholder={editingStudent ? "Leave blank to keep existing password" : "Leave blank to generate temporary password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (formError) setFormError('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    required
                    value={formData.joinedOn}
                    onChange={(e) => setFormData({ ...formData, joinedOn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  />
                </div>
              </div>

              {/* Requirement #7.1 & 7.2: Course Selection & Course-Specific Batch Dropdowns */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Enrolled Courses & Course-Specific Batches *
                </label>
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl max-h-56 overflow-y-auto">
                  {coursesList.length === 0 ? (
                    <div className="p-4 text-center text-sm font-semibold text-slate-500">
                      No courses available. Please create a course in Course Management first.
                    </div>
                  ) : (
                    coursesList.map((crs) => {
                      const isChecked = (formData.selectedCourses || []).includes(crs.title);
                      
                      // Filter ACTIVE batches created specifically for this course in Batch Management
                      const courseBatches = batchesList.filter(b => 
                        ((b.courseId && b.courseId === crs.id) || b.courseName === crs.title) && b.status === 'Active'
                      );
                      const selectedBatchForCourse = (formData.courseBatchMap && formData.courseBatchMap[crs.title]) || (courseBatches[0]?.name || '');

                      return (
                        <div 
                          key={crs.id} 
                          className={`p-3 rounded-xl border transition-colors ${isChecked ? 'bg-white border-blue-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200'}`}
                        >
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(crs.title)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-black text-slate-900">{crs.title}</span>
                          </label>

                          {isChecked && (
                            <div className="mt-2.5 pl-6 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-slate-500">Select Batch:</span>
                                <select
                                  value={selectedBatchForCourse}
                                  onChange={(e) => handleBatchChangeForCourse(crs.title, e.target.value)}
                                  disabled={courseBatches.length === 0}
                                  className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-[#0F52BA] focus:outline-none"
                                >
                                  {courseBatches.length > 0 ? (
                                    courseBatches.map(b => (
                                      <option key={b.id} value={b.name}>
                                        {b.name} ({b.day} {b.session})
                                      </option>
                                    ))
                                  ) : (
                                    <option value="">No batches available</option>
                                  )}
                                </select>
                              </div>

                              {courseBatches.length === 0 && (
                                <p className="text-[10px] text-amber-600 font-bold">
                                  ⚠️ No batches available for this course. Please create a batch in Batch Management first.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform text-xs mt-2 cursor-pointer"
              >
                {editingStudent ? 'Update Student Account' : 'Create Student & Send Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Welcome Email Sent Confirmation Modal */}
      {createdEmailModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setCreatedEmailModalData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 text-emerald-600">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900">Student Created & Welcome Email Issued!</h3>
                <p className="text-slate-500 text-[11px] font-medium">Welcome email successfully sent to {createdEmailModalData.email}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl space-y-2 border border-slate-800 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold border-b border-slate-800 pb-2">
                Subject: Welcome to Zoro English Academy
              </div>
              <p>Hello <strong>{createdEmailModalData.studentName}</strong>,</p>
              <p>Your student account has been created successfully.</p>
              <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 my-2">
                <div><strong>Username:</strong> {createdEmailModalData.username}</div>
                <div><strong>Email:</strong> {createdEmailModalData.email}</div>
                <div><strong>Date of Joining:</strong> {createdEmailModalData.joiningDate}</div>
              </div>
              {createdEmailModalData.temporaryPassword && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-amber-300 my-2">
                  <div>
                    <span className="text-[10px] text-amber-400 block font-bold uppercase tracking-wider">Temporary Password</span>
                    <span className="font-mono font-bold text-sm text-white select-all">{createdEmailModalData.temporaryPassword}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdEmailModalData.temporaryPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {copiedPassword ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              )}
              <div><strong>Enrolled Courses & Batches:</strong></div>
              <ul className="list-disc pl-5 space-y-0.5 text-blue-300">
                {createdEmailModalData.courseBatches.map((cb, i) => (
                  <li key={i}>{cb.course} — <strong>{cb.batch}</strong></li>
                ))}
              </ul>
              <p className="pt-2 text-[10px] text-slate-400">You can use these details to access your student portal.</p>
              <div className="text-slate-500 font-bold">Regards,<br />Zoro English Academy</div>
            </div>

            <button
              onClick={() => setCreatedEmailModalData(null)}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-md text-xs cursor-pointer hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteStudentData)}
        title="Delete Student Account"
        message={`Are you sure you want to delete student account for "${deleteStudentData?.name}" (@${deleteStudentData?.username})?`}
        confirmText="Delete Student"
        error={deleteError}
        onConfirm={() => handleConfirmDelete(false)}
        onCancel={() => {
          setDeleteStudentData(null);
          setDeleteError(null);
          setShowForceOption(false);
        }}
      >
        {showForceOption && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <div className="text-amber-800 text-xs font-bold">
              ⚠️ Warning: Force deleting will permanently remove:
            </div>
            <ul className="list-disc pl-5 text-[11px] text-amber-700 space-y-1">
              <li>All active and past course enrollments & batch assignments</li>
              <li>All pending and recorded fee records & payment history</li>
              <li>All attendance records</li>
              <li>All assignment submissions & doubts</li>
              <li>All student notifications & learning progress</li>
            </ul>
            <button
              type="button"
              onClick={() => handleConfirmDelete(true)}
              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Remove from all courses and delete
            </button>
          </div>
        )}
      </ConfirmModal>

    </div>
  );
}
