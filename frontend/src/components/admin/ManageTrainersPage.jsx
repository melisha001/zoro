import React, { useState, useEffect } from 'react';
import { UserCheck, Edit, Trash2, X, Plus, Search, Calendar, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, Copy, Check } from 'lucide-react';
import { getTrainers, createTrainer, updateTrainer, deleteTrainer, updateUserStatus, getTrainerDependencies, replaceTrainer } from '../../api/userApi';
import { logActivity } from '../../api/activityLogApi';
import { sanitizePhone, validatePhone, formatPhone } from '../../utils/phoneValidator';
import ConfirmModal from '../common/ConfirmModal';

export default function ManageTrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [deleteTrainerData, setDeleteTrainerData] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdTrainerModalData, setCreatedTrainerModalData] = useState(null);
  const [trainerDepModalData, setTrainerDepModalData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
    setFormError('');
    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError('');

    if (!validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setPhoneError('');

    if (formData.password && formData.password.trim().length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: sanitizePhone(formData.phone)
    };
    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    } else {
      delete payload.password;
    }

    const res = await createTrainer(payload);
    if (!res.success) {
      setFormError(res.message || 'Failed to create trainer.');
      return;
    }

    if (res.data?.temporaryPassword) {
      setCreatedTrainerModalData({
        trainerName: payload.name,
        email: payload.email,
        temporaryPassword: res.data.temporaryPassword
      });
    }

    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingTrainer) {
      setFormError('');
      const emailErr = validateEmail(formData.email);
      if (emailErr) {
        setEmailError(emailErr);
        return;
      }
      setEmailError('');

      if (!validatePhone(formData.phone)) {
        setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
        return;
      }
      setPhoneError('');

      if (formData.password && formData.password.trim().length < 8) {
        setFormError('Password must be at least 8 characters long.');
        return;
      }

      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: sanitizePhone(formData.phone)
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      } else {
        delete payload.password;
      }

      const res = await updateTrainer(editingTrainer.id, payload);
      if (!res.success) {
        setFormError(res.message || 'Failed to update trainer.');
        return;
      }
      setEditingTrainer(null);
      resetForm();
      loadData();
    }
  };

  const handleInitiateDelete = async (trainer) => {
    setDeleteError(null);
    try {
      const depRes = await getTrainerDependencies(trainer.id);
      if (depRes.success && depRes.data?.hasDependencies) {
        setTrainerDepModalData({
          isOpen: true,
          trainer,
          dependencies: depRes.data,
          action: 'DELETE',
          replacementTrainerId: ''
        });
      } else {
        setDeleteTrainerData(trainer);
      }
    } catch (err) {
      setDeleteTrainerData(trainer);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTrainerData) {
      const res = await deleteTrainer(deleteTrainerData.id);
      if (!res.success) {
        setDeleteError(res.message || 'Failed to delete trainer');
        return;
      }
      setDeleteTrainerData(null);
      setDeleteError(null);
      loadData();
    }
  };

  const handleToggleStatus = async (trainer) => {
    if (trainer.status !== 'Inactive') {
      try {
        const depRes = await getTrainerDependencies(trainer.id);
        if (depRes.success && depRes.data?.hasDependencies) {
          setTrainerDepModalData({
            isOpen: true,
            trainer,
            dependencies: depRes.data,
            action: 'INACTIVATE',
            replacementTrainerId: ''
          });
          return;
        }
      } catch (err) {
        console.error('Failed to verify trainer dependencies:', err);
      }
    }
    const newStatus = trainer.status === 'Inactive' ? 'Active' : 'Inactive';
    const res = await updateUserStatus(trainer.id, newStatus);
    if (!res.success) {
      alert(res.message || 'Failed to update trainer status');
      return;
    }
    logActivity('Trainer Status Changed', `Changed status of trainer "${trainer.name}" to ${newStatus}`, 'Trainer');
    loadData();
  };

  const handleConfirmReplacement = async () => {
    if (!trainerDepModalData?.replacementTrainerId) {
      alert('Please select an active trainer from the dropdown to reassign courses and batches to.');
      return;
    }
    const { trainer, replacementTrainerId, action } = trainerDepModalData;
    let res;
    if (action === 'DELETE') {
      res = await deleteTrainer(trainer.id, replacementTrainerId);
    } else {
      res = await replaceTrainer(trainer.id, {
        newTrainerId: replacementTrainerId,
        action
      });
    }
    if (res.success) {
      logActivity(
        action === 'DELETE' ? 'Trainer Replaced & Deleted' : 'Trainer Replaced & Inactivated',
        `Reassigned courses and batches of "${trainer.name}" to trainer ID "${replacementTrainerId}" and executed ${action}`,
        'Trainer'
      );
      setTrainerDepModalData(null);
      loadData();
    } else {
      alert(res.message || 'Failed to replace trainer.');
    }
  };

  const resetForm = () => {
    setEmailError('');
    setPhoneError('');
    setFormError('');
    setFormData({
      name: '',
      email: '',
      password: '',
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
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Monthly Salary</th>
                <th className="py-3 px-4">Salary Credit Date</th>
                <th className="py-3 px-4">Date of Joining</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => {
                  const isActive = trainer.status !== 'Inactive';
                  return (
                    <tr key={trainer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900">{trainer.name}</td>
                      <td className="py-4 px-4 text-blue-900 font-bold">{trainer.email}</td>
                      <td className="py-4 px-4 text-slate-600">{trainer.specialty}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(trainer)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-4 font-black text-emerald-600">₹{parseFloat(trainer.salaryAmount || 25000).toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-blue-700">{trainer.salaryCreditDate || '25'}th of every month</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{trainer.joinedOn || trainer.dateOfJoining || ''}</td>
                      <td className="py-4 px-4 text-slate-500 font-mono">{formatPhone(trainer.phone) || 'N/A'}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingTrainer(trainer);
                          setFormError('');
                          setEmailError('');
                          setPhoneError('');
                          setFormData({
                            name: trainer.name || '',
                            email: trainer.email || '',
                            password: '',
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
                        onClick={() => handleInitiateDelete(trainer)}
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
                  <td colSpan="9" className="py-8 text-center text-slate-500 font-bold text-xs">
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
                  placeholder="e.g. Jane Doe"
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
                  placeholder="trainer@example.com"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 characters)</label>
                  <input
                    type="text"
                    placeholder={editingTrainer ? "Leave blank to keep existing password" : "Leave blank to generate temporary password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (formError) setFormError('');
                    }}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
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
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${phoneError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl text-xs font-medium focus:bg-white focus:outline-none`}
                />
                {phoneError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{phoneError}</p>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

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

      {/* Credentials Modal when temporary password generated */}
      {createdTrainerModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setCreatedTrainerModalData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 text-emerald-600">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900">Trainer Created Successfully!</h3>
                <p className="text-slate-500 text-[11px] font-medium">Account created for {createdTrainerModalData.email}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl space-y-2 border border-slate-800 font-mono text-[11px]">
              <p>Trainer: <strong>{createdTrainerModalData.trainerName}</strong></p>
              <p>Email: <strong>{createdTrainerModalData.email}</strong></p>
              {createdTrainerModalData.temporaryPassword && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-amber-300 my-2">
                  <div>
                    <span className="text-[10px] text-amber-400 block font-bold uppercase tracking-wider">Temporary Password</span>
                    <span className="font-mono font-bold text-sm text-white select-all">{createdTrainerModalData.temporaryPassword}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdTrainerModalData.temporaryPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {copiedPassword ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCreatedTrainerModalData(null)}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-md text-xs cursor-pointer hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Standard for zero dependencies) */}
      <ConfirmModal
        isOpen={Boolean(deleteTrainerData)}
        title="Delete Trainer Account"
        message={`Are you sure you want to delete account for "${deleteTrainerData?.name}" (${deleteTrainerData?.email})?`}
        confirmText="Delete Trainer"
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTrainerData(null);
          setDeleteError(null);
        }}
      />

      {/* Trainer Dependency & Replacement Modal */}
      {trainerDepModalData?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setTrainerDepModalData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {trainerDepModalData.action === 'DELETE' ? 'Cannot Delete Active Trainer' : 'Active Assignments Detected'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Trainer "{trainerDepModalData.trainer?.name}" is currently assigned to courses and batches.
                </p>
              </div>
            </div>

            {/* Dependency Summary Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-bold text-amber-900 block uppercase tracking-wider text-[10px]">
                Currently Assigned Dependencies:
              </span>
              
              {trainerDepModalData.dependencies?.courses?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700">Courses ({trainerDepModalData.dependencies.courses.length}):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {trainerDepModalData.dependencies.courses.map((c) => (
                      <span key={c.id} className="bg-white border border-amber-200 text-amber-950 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trainerDepModalData.dependencies?.batches?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700">Batches ({trainerDepModalData.dependencies.batches.length}):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {trainerDepModalData.dependencies.batches.map((b) => (
                      <span key={b.id} className="bg-white border border-amber-200 text-amber-950 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {b.name} ({b.courseName})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trainerDepModalData.dependencies?.schedules?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700">Live Schedules ({trainerDepModalData.dependencies.schedules.length}):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {trainerDepModalData.dependencies.schedules.map((s) => (
                      <span key={s.id} className="bg-white border border-amber-200 text-amber-950 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {s.title} ({s.date})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Replacement Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Select Replacement Trainer to Reassign Courses & Batches *
              </label>
              {trainers.filter(t => t.id !== trainerDepModalData.trainer?.id && t.status !== 'Inactive').length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                  No other active trainer is available in the system. You must create or activate another trainer first before deleting or deactivating this trainer.
                </div>
              ) : (
                <select
                  value={trainerDepModalData.replacementTrainerId}
                  onChange={(e) => setTrainerDepModalData({ ...trainerDepModalData, replacementTrainerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Active Trainer to Inherit Courses & Batches --</option>
                  {trainers
                    .filter(t => t.id !== trainerDepModalData.trainer?.id && t.status !== 'Inactive')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email}) - {t.specialty}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setTrainerDepModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!trainerDepModalData.replacementTrainerId}
                onClick={handleConfirmReplacement}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Reassign & {trainerDepModalData.action === 'DELETE' ? 'Delete Trainer' : 'Set Inactive'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

