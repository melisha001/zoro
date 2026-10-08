import React, { useState, useEffect } from 'react';
import { 
  Trophy, Search, Filter, Calendar, Users, DollarSign, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Layers, ShieldCheck, Download, Eye, X 
} from 'lucide-react';
import { getCompetitionRegistrations, updateRegistrationStatus } from '../../api/competitionRegistrationApi';
import { getCompetitions } from '../../api/competitionApi';
import ConfirmModal from '../common/ConfirmModal';

export default function AdminCompetitionRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompFilter, setSelectedCompFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  const [viewingReg, setViewingReg] = useState(null);
  const [cancelModalReg, setCancelModalReg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const regRes = await getCompetitionRegistrations();
      setRegistrations(regRes.data || []);

      const compRes = await getCompetitions();
      setCompetitions(compRes.data || []);
    } catch (err) {
      console.error('Failed to load competition registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmCancelReg = async () => {
    if (cancelModalReg) {
      await updateRegistrationStatus(cancelModalReg.id, 'Cancelled', cancelModalReg.paymentStatus);
      setCancelModalReg(null);
      loadData();
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = !searchTerm || (
      r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.competitionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesComp = selectedCompFilter === 'All' || r.competitionName === selectedCompFilter || r.competitionId === selectedCompFilter;
    const matchesStatus = selectedStatusFilter === 'All' || r.paymentStatus === selectedStatusFilter || r.registrationStatus === selectedStatusFilter;

    return matchesSearch && matchesComp && matchesStatus;
  });

  // Calculate Revenue Stats
  const paidRegistrations = registrations.filter(r => r.paymentStatus === 'Paid' && r.registrationStatus !== 'Cancelled');
  const totalRevenue = paidRegistrations.reduce((sum, r) => sum + Number(r.registrationFee || 0), 0);
  const totalRegCount = registrations.filter(r => r.registrationStatus !== 'Cancelled').length;

  // Group by Competition Name -> Batch Name -> Array of Students
  const groupedByCompetition = filteredRegistrations.reduce((acc, reg) => {
    const compKey = reg.competitionName || 'General Competition';
    const batchKey = reg.batchName || 'General Batch';

    if (!acc[compKey]) {
      acc[compKey] = {};
    }
    if (!acc[compKey][batchKey]) {
      acc[compKey][batchKey] = [];
    }
    acc[compKey][batchKey].push(reg);
    return acc;
  }, {});

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>Competition Registrations & Revenue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track student registrations, batch breakdown, online Razorpay transactions, and competition revenue.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Registrations</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalRegCount} Students</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-600 font-semibold">Total Competition Revenue</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-blue-600 font-semibold">Verified Online Payments</div>
          <div className="text-3xl font-black text-blue-600 mt-1">{paidRegistrations.length} Paid</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search registrations by student, email, batch, competition, payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={selectedCompFilter}
              onChange={(e) => setSelectedCompFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              <option value="All">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Not Required">Not Required</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch-wise & Competition-wise Grouped Registrations Display */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
          Loading competition registrations...
        </div>
      ) : Object.keys(groupedByCompetition).length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No competition registrations found</h3>
          <p className="text-xs text-slate-400">Registered students will appear here automatically grouped by competition and batch.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCompetition).map(([compName, batchesMap]) => (
            <div key={compName} className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4">
              
              {/* Competition Group Header */}
              <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{compName}</h2>
                    <span className="text-slate-400 text-xs font-medium">
                      {Object.values(batchesMap).reduce((s, arr) => s + arr.length, 0)} Registered Participants
                    </span>
                  </div>
                </div>
              </div>

              {/* Batches Sub-Sections */}
              <div className="p-6 pt-2 space-y-6">
                {Object.entries(batchesMap).map(([batchName, studentList]) => (
                  <div key={batchName} className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-black text-blue-900 uppercase tracking-wider bg-blue-50/70 p-2.5 px-4 rounded-xl border border-blue-200/60">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>{batchName} ({studentList.length} Students)</span>
                    </div>

                    {/* Table of Registered Students */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Email & Phone</th>
                            <th className="py-3 px-4">Reg Date</th>
                            <th className="py-3 px-4">Fee (₹)</th>
                            <th className="py-3 px-4">Payment Status</th>
                            <th className="py-3 px-4">Razorpay Txn ID</th>
                            <th className="py-3 px-4">Reg Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {studentList.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-black text-slate-900">
                                {student.studentName}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800">{student.studentEmail}</div>
                                <div className="text-[11px] text-slate-400">{student.studentPhone}</div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-700">
                                {student.registrationDate}
                              </td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                ₹{student.registrationFee}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  student.paymentStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : student.paymentStatus === 'Not Required'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {student.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-bold">
                                {student.razorpayPaymentId || 'N/A'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  student.registrationStatus === 'Registered'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {student.registrationStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setViewingReg(student)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {student.registrationStatus !== 'Cancelled' && (
                                  <button
                                    onClick={() => setCancelModalReg(student)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Cancel Registration"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* VIEW REGISTRATION DETAILS MODAL */}
      {viewingReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setViewingReg(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900">Registration Details</h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-slate-700 font-semibold">
              <div><strong>Student Name:</strong> {viewingReg.studentName}</div>
              <div><strong>Email:</strong> {viewingReg.studentEmail}</div>
              <div><strong>Phone:</strong> {viewingReg.studentPhone}</div>
              <div><strong>Competition:</strong> {viewingReg.competitionName}</div>
              <div><strong>Batch:</strong> {viewingReg.batchName}</div>
              <div><strong>Registration Date:</strong> {viewingReg.registrationDate}</div>
              <div><strong>Registration Fee:</strong> ₹{viewingReg.registrationFee}</div>
              <div><strong>Payment Status:</strong> <span className="font-bold text-emerald-700">{viewingReg.paymentStatus}</span></div>
              <div><strong>Razorpay Payment ID:</strong> <span className="font-mono text-xs">{viewingReg.razorpayPaymentId || 'None'}</span></div>
              <div><strong>Payment Date/Time:</strong> {viewingReg.paymentDate || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL REGISTRATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(cancelModalReg)}
        onClose={() => setCancelModalReg(null)}
        onConfirm={handleConfirmCancelReg}
        title="Cancel Competition Registration"
        message={`Are you sure you want to cancel ${cancelModalReg?.studentName}'s registration for "${cancelModalReg?.competitionName}"?`}
        confirmText="Cancel Registration"
        cancelText="Keep Active"
      />

    </div>
  );
}
