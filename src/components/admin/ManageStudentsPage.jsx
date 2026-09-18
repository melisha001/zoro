import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Key, CheckCircle, X } from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../api/userApi';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    course: 'English Communication',
    ageGroup: '7-12 Years'
  });

  const loadData = async () => {
    const res = await getStudents();
    setStudents(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createStudent(formData);
    setFormData({ name: '', email: '', password: '', phone: '', course: 'English Communication', ageGroup: '7-12 Years' });
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
      setEditingStudent(null);
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student account?')) {
      await deleteStudent(id);
      loadData();
    }
  };

  const filteredStudents = students.filter(student => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      (student.name && student.name.toLowerCase().includes(query)) ||
      (student.email && student.email.toLowerCase().includes(query)) ||
      (student.phone && student.phone.toLowerCase().includes(query)) ||
      (student.id && String(student.id).toLowerCase().includes(query)) ||
      (student.course && student.course.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 font-medium">Create student accounts and generate login credentials.</p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: 'password123', phone: '', course: 'English Communication', ageGroup: '7-12 Years' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search students by name, email, phone, course or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
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
                <th className="py-3 px-4">Enrolled Course</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-black text-slate-900">{student.name}</td>
                    <td className="py-4 px-4 text-blue-900 font-bold">{student.email}</td>
                    <td className="py-4 px-4 font-mono text-slate-500">{student.password}</td>
                    <td className="py-4 px-4 text-slate-600">{student.course}</td>
                    <td className="py-4 px-4 text-slate-500">{student.phone}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setFormData(student);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-bold text-xs">
                    No students found
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingStudent ? 'Edit Student Account' : 'Create Student Account'}
            </h3>

            <form onSubmit={editingStudent ? handleUpdate : handleCreate} className="space-y-3">
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
                  placeholder="arjun@student.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

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
                <label className="block text-xs font-bold text-slate-700 mb-1">Enrolled Course</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                >
                  <option value="English Communication">English Communication</option>
                  <option value="Abacus Level 3">Abacus Level 3</option>
                  <option value="Chess Mastery">Chess Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Trainer</label>
                <select
                  value={formData.assignedTrainer || 'Ms. Priya'}
                  onChange={(e) => setFormData({ ...formData, assignedTrainer: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                >
                  <option value="Ms. Priya">Ms. Priya</option>
                  <option value="Mr. Rajesh">Mr. Rajesh</option>
                  <option value="Ms. Anitha">Ms. Anitha</option>
                </select>
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

    </div>
  );
}
