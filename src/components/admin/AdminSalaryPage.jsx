import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Plus, Search, Eye, Edit2, Trash2, CheckCircle2, X, Calendar, User, FileText } from 'lucide-react';
import { getSalaryPayments, createSalaryPayment, updateSalaryPayment, deleteSalaryPayment, getSalaryStats } from '../../api/salaryApi';
import { getTrainers } from '../../api/userApi';

export default function AdminSalaryPage() {
  const [salaries, setSalaries] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [stats, setStats] = useState({ totalPaid: 0, currentMonthPaid: 0, uniqueTrainersPaid: 0, totalRecords: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [formData, setFormData] = useState({
    trainerId: '',
    trainerName: '',
    month: 'September 2026',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'Bank Transfer',
    reference: '',
    notes: ''
  });

  const loadData = async () => {
    const salRes = await getSalaryPayments();
    setSalaries(salRes.data);

    const trnRes = await getTrainers();
    setTrainers(trnRes.data);
    if (trnRes.data.length > 0 && !formData.trainerName) {
      setFormData(prev => ({ ...prev, trainerId: trnRes.data[0].id, trainerName: trnRes.data[0].name }));
    }

    const statRes = await getSalaryStats();
    setStats(statRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.trainerName) return;
    await createSalaryPayment({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setShowAddModal(false);
    resetForm();
    loadData();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRecord || !formData.amount) return;
    await updateSalaryPayment(editingRecord.id, {
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setEditingRecord(null);
    resetForm();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary payment record?')) {
      await deleteSalaryPayment(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      trainerId: trainers[0]?.id || '',
      trainerName: trainers[0]?.name || '',
      month: 'September 2026',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'Bank Transfer',
      reference: '',
      notes: ''
    });
  };

  const filteredSalaries = (salaries || []).filter(item => {
    if (!item) return false;
    const nameStr = item.trainerName || '';
    const refStr = item.reference || '';
    const monthStr = item.month || '';
    const query = (searchTerm || '').toLowerCase();

    const matchesSearch = nameStr.toLowerCase().includes(query) ||
                          refStr.toLowerCase().includes(query) ||
                          monthStr.toLowerCase().includes(query);
    const matchesMethod = selectedMethod === 'All' || item.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trainer Salary Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Record and track monthly salary payments, payment methods, and financial disbursements to trainers.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 text-xs sm:text-sm self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Salary Payment</span>
        </button>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Salary Paid</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹{(stats?.totalPaid || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">{stats?.totalRecords || 0} Disbursed Records</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Current Month Salary</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">₹{(stats?.currentMonthPaid || 0).toLocaleString()}</div>
          <div className="text-[10px] text-[#0F52BA] font-bold mt-1">September 2026</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Pending Salary Dues</div>
          <div className="text-2xl font-black text-amber-600 mt-1">₹0</div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">All dues clear</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Trainers Paid</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats?.uniqueTrainersPaid || 0} of {trainers.length || 2}</div>
          <div className="text-[10px] text-purple-700 font-bold mt-1">Active Staff</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Payment Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search trainer, month, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Salary History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Trainer</th>
                <th className="py-3.5 px-4">Salary Month</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                    No salary payment records found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{item.trainerName}</td>
                    <td className="py-4 px-4 text-slate-700 font-semibold">{item.month}</td>
                    <td className="py-4 px-4 font-black text-emerald-600">₹{parseFloat(item.amount).toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-600 font-mono">{item.date}</td>
                    <td className="py-4 px-4 text-slate-700 font-medium">{item.method}</td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{item.reference || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setViewingRecord(item)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRecord(item);
                          setFormData(item);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Salary Modal */}
      {(showAddModal || editingRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => { setShowAddModal(false); setEditingRecord(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingRecord ? 'Edit Salary Payment' : 'Record Trainer Salary Payment'}
            </h3>

            <form onSubmit={editingRecord ? handleUpdate : handleCreate} className="space-y-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Trainer</label>
                <select
                  required
                  value={formData.trainerName}
                  onChange={(e) => {
                    const found = trainers.find(t => t.name === e.target.value);
                    setFormData({
                      ...formData,
                      trainerName: e.target.value,
                      trainerId: found ? found.id : ''
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                >
                  {trainers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.specialty || 'Trainer'})</option>
                  ))}
                  {trainers.length === 0 && (
                    <>
                      <option value="Priya">Priya (English & Lead Trainer)</option>
                      <option value="Rahul">Rahul (Chess Mastery)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Month</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. September 2026"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Salary Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction / Reference ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN98421054"
                  value={formData.reference || ''}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Performance bonus included"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-colors text-xs mt-3 cursor-pointer"
              >
                {editingRecord ? 'Save Changes' : 'Confirm & Save Salary Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setViewingRecord(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Salary Payment Receipt</h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Trainer Name:</span>
                <span className="font-bold text-slate-900">{viewingRecord.trainerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Salary Month:</span>
                <span className="font-bold text-slate-900">{viewingRecord.month}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-emerald-600 text-sm">₹{parseFloat(viewingRecord.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-800">{viewingRecord.date}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold text-slate-800">{viewingRecord.method}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Ref ID:</span>
                <span className="font-mono text-slate-800">{viewingRecord.reference || 'None'}</span>
              </div>
              {viewingRecord.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Notes:</span>
                  <span className="text-slate-800 italic">{viewingRecord.notes}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingRecord(null)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
