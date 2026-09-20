import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Key, CheckCircle, X, Calendar, Filter } from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import ConfirmModal from '../common/ConfirmModal';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudentData, setDeleteStudentData] = useState(null);
  const [emailError, setEmailError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: '',
    selectedCourses: ['English Communication'],
    joinedOn: new Date().toISOString().split('T')[0],
    ageGroup: '7-12 Years'
  });

  const loadData = async () => {
    const res = await getStudents();
    setStudents(res.data || []);
    const crsRes = await getCourses();
    setCoursesList(crsRes.data || []);
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

  const handleToggleCourse = (title) => {
    const current = formData.selectedCourses || [];
    if (current.includes(title)) {
      if (current.length === 1) return; // keep at least 1 course
      setFormData({ ...formData, selectedCourses: current.filter(c => c !== title) });
    } else {
      setFormData({ ...formData, selectedCourses: [...current, title] });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError('');
    const courseString = (formData.selectedCourses || []).join(', ');
    await createStudent({
      ...formData,
      email: formData.email.trim(),
      course: courseString || 'English Communication'
    });
    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingStudent) {
      const emailErr = validateEmail(formData.email);
      if (emailErr) {
        setEmailError(emailErr);
        return;
      }
      setEmailError('');
      const courseString = (formData.selectedCourses || []).join(', ');
      await updateStudent(editingStudent.id, {
        ...formData,
        email: formData.email.trim(),
        course: courseString || 'English Communication'
      });
      setEditingStudent(null);
      resetForm();
      loadData();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteStudentData) {
      await deleteStudent(deleteStudentData.id);
      setDeleteStudentData(null);
      loadData();
    }
  };

  const resetForm = () => {
    setEmailError('');
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      phone: '',
      selectedCourses: ['English Communication'],
      joinedOn: new Date().toISOString().split('T')[0],
      ageGroup: '7-12 Years'
    });
  };

  const filteredStudents = students.filter(student => {
    // 1. Text Search Filter
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      const matchesSearch = (
        (student.name && student.name.toLowerCase().includes(query)) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.phone && student.phone.toLowerCase().includes(query)) ||
        (student.id && String(student.id).toLowerCase().includes(query)) ||
        (student.course && student.course.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    // 2. Joined Date Filter (Exact match)
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
          <p className="text-xs text-slate-500 font-medium">Create student accounts, assign multiple courses, and set joining dates.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Search students by name, email, phone, course or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Single Joined Date Filter */}
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
              title="Select Joined Date"
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

        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email (Login ID)</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Enrolled Courses</th>
                <th className="py-3 px-4">Date of Joining</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const courseItems = (student.course ? student.course.split(',') : ['English Communication'])
                    .map(c => c.trim())
                    .filter(Boolean);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900">{student.name}</td>
                      <td className="py-4 px-4 text-blue-900 font-bold">{student.email}</td>
                      <td className="py-4 px-4 font-mono text-slate-500">{student.password}</td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {courseItems.map((crsName, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#0F52BA] border border-blue-200/80 whitespace-normal"
                            >
                              {crsName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{student.joinedOn || student.dateOfJoining || '12 Jan 2026'}</td>
                      <td className="py-4 px-4 text-slate-500">{student.phone}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            const existingCourses = student.course ? student.course.split(',').map(c => c.trim()) : ['English Communication'];
                            setFormData({
                              name: student.name || '',
                              email: student.email || '',
                              password: student.password || 'password123',
                              phone: student.phone || '',
                              selectedCourses: existingCourses,
                              joinedOn: student.joinedOn || new Date().toISOString().split('T')[0],
                              ageGroup: student.ageGroup || '7-12 Years'
                            });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteStudentData(student)}
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

      {/* Add / Edit Modal */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Email (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="arjun@gmail.com"
                  value={formData.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, email: val });
                    if (emailError) setEmailError(validateEmail(val));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${emailError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl text-xs font-medium focus:bg-white`}
                />
                {emailError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{emailError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Generated Password</label>
                  <input
                    type="text"
                    required
                    placeholder="password123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={formData.joinedOn}
                    onChange={(e) => setFormData({ ...formData, joinedOn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                  />
                </div>
              </div>

              {/* Multiple Course Selection (Requirement #10 - No Trainer mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enrolled Courses (Select One or Multiple)
                </label>
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {(coursesList.length > 0 ? coursesList : [
                    { id: '1', title: 'English Communication' },
                    { id: '2', title: 'Abacus Level 3' },
                    { id: '3', title: 'Chess Mastery' }
                  ]).map((crs) => {
                    const isChecked = (formData.selectedCourses || []).includes(crs.title);
                    return (
                      <label 
                        key={crs.id} 
                        className="flex items-center space-x-2.5 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCourse(crs.title)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-800">{crs.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform text-xs mt-2 cursor-pointer"
              >
                {editingStudent ? 'Update Account' : 'Create & Issue Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement #8) */}
      <ConfirmModal
        isOpen={Boolean(deleteStudentData)}
        title="Delete Student Account"
        message={`Are you sure you want to delete account for "${deleteStudentData?.name}" (${deleteStudentData?.email})?`}
        confirmText="Delete Student"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteStudentData(null)}
      />

    </div>
  );
}

