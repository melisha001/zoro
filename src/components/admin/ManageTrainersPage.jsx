import React, { useState, useEffect } from 'react';
import { UserCheck, Edit, Trash2, X, Plus, Search, Calendar } from 'lucide-react';
import { getTrainers, createTrainer, updateTrainer, deleteTrainer } from '../../api/userApi';
import { logActivity } from '../../api/activityLogApi';
import ConfirmModal from '../common/ConfirmModal';

export default function ManageTrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [deleteTrainerData, setDeleteTrainerData] = useState(null);
  const [emailError, setEmailError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: '',
    specialty: 'English Communication',
    salaryAmount: '25000',
    salaryCreditDate: '25',
    joinedOn: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const res = await getTrainers();
    setTrainers(res.data || []);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError('');
    await createTrainer({
      ...formData,
      email: formData.email.trim()
    });
    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingTrainer) {
      const emailErr = validateEmail(formData.email);
      if (emailErr) {
        setEmailError(emailErr);
        return;
      }
      setEmailError('');
      await updateTrainer(editingTrainer.id, {
        ...formData,
        email: formData.email.trim()
      });
      setEditingTrainer(null);
      resetForm();
      loadData();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTrainerData) {
      await deleteTrainer(deleteTrainerData.id);
      setDeleteTrainerData(null);
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
      specialty: 'English Communication',
      salaryAmount: '25000',
      salaryCreditDate: '25',
      joinedOn: new Date().toISOString().split('T')[0]
    });
  };

  const filteredTrainers = trainers.filter(trainer => {
    // 1. Text Search Filter
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      const matchesSearch = (
        (trainer.name && trainer.name.toLowerCase().includes(query)) ||
        (trainer.email && trainer.email.toLowerCase().includes(query)) ||
        (trainer.phone && trainer.phone.toLowerCase().includes(query)) ||
        (trainer.id && String(trainer.id).toLowerCase().includes(query)) ||
        (trainer.specialty && trainer.specialty.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    // 2. Joined Date Filter (Exact match)
    if (joinedDate) {
      const tDate = trainer.joinedOn || trainer.dateOfJoining;
      if (!tDate) return false;
      if (tDate !== joinedDate) return false;
    }

    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trainer Management</h1>
          <p className="text-xs text-slate-500 font-medium">Add trainer accounts, set joining dates, and assign specialized subjects.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Trainer</span>
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
              placeholder="🔍 Search trainers by name, email, phone, specialty or ID..."
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
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Trainer Name</th>
                <th className="py-3 px-4">Email (Login ID)</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Monthly Salary</th>
                <th className="py-3 px-4">Salary Credit Date</th>
                <th className="py-3 px-4">Date of Joining</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-black text-slate-900">{trainer.name}</td>
                    <td className="py-4 px-4 text-blue-900 font-bold">{trainer.email}</td>
                    <td className="py-4 px-4 text-slate-600">{trainer.specialty}</td>
                    <td className="py-4 px-4 font-black text-emerald-600">₹{parseFloat(trainer.salaryAmount || 25000).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-blue-700">{trainer.salaryCreditDate || '25'}th of every month</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{trainer.joinedOn || trainer.dateOfJoining || '10 Jan 2025'}</td>
                    <td className="py-4 px-4 text-slate-500">{trainer.phone}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingTrainer(trainer);
                          setFormData({
                            name: trainer.name || '',
                            email: trainer.email || '',
                            password: trainer.password || 'password123',
                            phone: trainer.phone || '',
                            specialty: trainer.specialty || 'English Communication',
                            salaryAmount: trainer.salaryAmount || '25000',
                            salaryCreditDate: trainer.salaryCreditDate || '25',
                            joinedOn: trainer.joinedOn || new Date().toISOString().split('T')[0]
                          });
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTrainerData(trainer)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 font-bold text-xs">
                    No trainers found matching your search or date filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingTrainer) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowAddModal(false); setEditingTrainer(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingTrainer ? 'Edit Trainer Account' : 'Create Trainer Account'}
            </h3>

            <form onSubmit={editingTrainer ? handleUpdate : handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trainer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trainer Email (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="priya@gmail.com"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={formData.salaryAmount}
                    onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Credit Date</label>
                  <select
                    value={formData.salaryCreditDate}
                    onChange={(e) => setFormData({ ...formData, salaryCreditDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1}th of every month</option>
                    ))}
                  </select>
                </div>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty Subject</label>
                <input
                  type="text"
                  placeholder="e.g. English Communication & Debate"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 11111"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform text-xs mt-2 cursor-pointer"
              >
                {editingTrainer ? 'Update Account' : 'Create & Issue Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement #8) */}
      <ConfirmModal
        isOpen={Boolean(deleteTrainerData)}
        title="Delete Trainer Account"
        message={`Are you sure you want to delete account for "${deleteTrainerData?.name}" (${deleteTrainerData?.email})?`}
        confirmText="Delete Trainer"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTrainerData(null)}
      />

    </div>
  );
}

