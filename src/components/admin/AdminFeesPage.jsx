import React, { useState } from 'react';
import { DollarSign, CreditCard, Search, Download, Send, CheckCircle2, Clock, AlertTriangle, Plus, X } from 'lucide-react';

export default function AdminFeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [feeRecords, setFeeRecords] = useState([
    { id: 1, student: 'S.J. Abhishek', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '10 Sep 2026' },
    { id: 2, student: 'Nivetha R', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 10000, dueAmount: 5000, status: 'Pending', date: '01 Sep 2026' },
    { id: 3, student: 'Tharun K', course: 'English Communication', batch: 'EN-L1', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '05 Sep 2026' },
    { id: 4, student: 'Divya S', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 5000, dueAmount: 10000, status: 'Overdue', date: '15 Aug 2026' },
    { id: 5, student: 'Arjun M', course: 'Abacus Level 3', batch: 'AB-L3', totalFee: 12000, paidAmount: 12000, dueAmount: 0, status: 'Paid', date: '08 Sep 2026' },
    { id: 6, student: 'Keerthana P', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '12 Sep 2026' },
  ]);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedStudent || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    setFeeRecords(feeRecords.map(item => {
      if (item.id === selectedStudent.id) {
        const newPaid = item.paidAmount + amount;
        const newDue = Math.max(0, item.totalFee - newPaid);
        return {
          ...item,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newDue === 0 ? 'Paid' : 'Pending',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      }
      return item;
    }));
    setShowPaymentModal(false);
    setSelectedStudent(null);
    setPaymentAmount('');
  };

  const filteredRecords = feeRecords.filter(item => {
    const matchesSearch = item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Fees & Finance Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track student fee payments, pending dues, and issue payment receipts.</p>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Collections</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹77,000</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">↑ 14% vs last month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Pending Dues</div>
          <div className="text-2xl font-black text-amber-600 mt-1">₹15,000</div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">2 Students pending</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Overdue Payments</div>
          <div className="text-2xl font-black text-rose-600 mt-1">₹10,000</div>
          <div className="text-[10px] text-rose-700 font-bold mt-1">1 Student overdue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Paid Enrollees</div>
          <div className="text-2xl font-black text-[#0F52BA] mt-1">4 of 6</div>
          <div className="text-[10px] text-[#0F52BA] font-bold mt-1">66.7% collection rate</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Course / Batch</th>
                <th className="py-3.5 px-4">Total Fee</th>
                <th className="py-3.5 px-4">Paid Amount</th>
                <th className="py-3.5 px-4">Due Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">{item.student}</td>
                  <td className="py-4 px-4 text-slate-600 font-semibold">{item.course} ({item.batch})</td>
                  <td className="py-4 px-4 font-bold text-slate-900">₹{item.totalFee.toLocaleString()}</td>
                  <td className="py-4 px-4 font-bold text-emerald-600">₹{item.paidAmount.toLocaleString()}</td>
                  <td className="py-4 px-4 font-bold text-slate-700">
                    {item.dueAmount > 0 ? (
                      <span className="text-rose-600">₹{item.dueAmount.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">₹0</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      item.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-mono">{item.date}</td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {item.dueAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedStudent(item);
                          setPaymentAmount(item.dueAmount.toString());
                          setShowPaymentModal(true);
                        }}
                        className="bg-[#0F52BA] text-white hover:bg-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Record Fee
                      </button>
                    )}
                    <button
                      onClick={() => alert(`Receipt downloaded for ${item.student}`)}
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Record Payment</h3>
            <p className="text-slate-500 font-medium">Updating fees for <strong className="text-slate-900">{selectedStudent.student}</strong> ({selectedStudent.course})</p>

            <form onSubmit={handleRecordPayment} className="space-y-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Due Amount</label>
                <div className="text-lg font-black text-rose-600">₹{selectedStudent.dueAmount.toLocaleString()}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Receiving (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-colors text-xs mt-2 cursor-pointer"
              >
                Confirm Payment & Generate Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
