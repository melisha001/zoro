import React, { useState, useEffect } from 'react';
import { UserCheck, Edit, Trash2, X, Plus, Search } from 'lucide-react';
import { getTrainers, createTrainer, updateTrainer, deleteTrainer } from '../../api/userApi';

export default function ManageTrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: 'English Communication'
  });

  const loadData = async () => {
    const res = await getTrainers();
    setTrainers(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createTrainer(formData);
    setFormData({ name: '', email: '', password: '', phone: '', specialty: 'English Communication' });
    setShowAddModal(false);
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingTrainer) {
      await updateTrainer(editingTrainer.id, formData);
      setEditingTrainer(null);
      loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trainer account?')) {
      await deleteTrainer(id);
      loadData();
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      (trainer.name && trainer.name.toLowerCase().includes(query)) ||
      (trainer.email && trainer.email.toLowerCase().includes(query)) ||
      (trainer.phone && trainer.phone.toLowerCase().includes(query)) ||
      (trainer.id && String(trainer.id).toLowerCase().includes(query)) ||
      (trainer.specialty && trainer.specialty.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trainer Management</h1>
          <p className="text-xs text-slate-500 font-medium">Add trainer accounts and assign specialized teaching subjects.</p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: 'password123', phone: '', specialty: 'English Communication' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Trainer</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search trainers by name, email, phone, specialty or ID..."
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
                <th className="py-3 px-4">Trainer Name</th>
                <th className="py-3 px-4">Email (Login ID)</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Specialty / Subject</th>
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
                    <td className="py-4 px-4 font-mono text-slate-500">{trainer.password}</td>
                    <td className="py-4 px-4 text-slate-600">{trainer.specialty}</td>
                    <td className="py-4 px-4 text-slate-500">{trainer.phone}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingTrainer(trainer);
                          setFormData(trainer);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trainer.id)}
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
                    No trainers found
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => { setShowAddModal(false); setEditingTrainer(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
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
                  placeholder="priya@trainer.com"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform text-xs mt-2"
              >
                {editingTrainer ? 'Update Account' : 'Create & Issue Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
