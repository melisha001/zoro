import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Search, Download, Send, CheckCircle2, Clock, AlertTriangle, Plus, X, Trash2 } from 'lucide-react';
import { getFeeRecords, recordStudentPayment, createFeeRecord, deleteFeeRecord } from '../../api/feesApi';
import { getStudents } from '../../api/userApi';
import { getCourses } from '../../api/courseApi';
import { logActivity } from '../../api/activityLogApi';
import { exportToExcel } from '../../utils/excelExporter';
import ConfirmModal from '../common/ConfirmModal';

export default function AdminFeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteFeeData, setDeleteFeeData] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [addFeeStudentId, setAddFeeStudentId] = useState('');
  const [selectedFeeCourses, setSelectedFeeCourses] = useState({});
  const [initialPayment, setInitialPayment] = useState('');

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setLoading(true);
    const [fRes, sRes, cRes] = await Promise.all([
      getFeeRecords(),
      getStudents(),
      getCourses()
    ]);
    setFeeRecords(fRes.data || []);
    setStudentsList(sRes.data || []);
    setCoursesList(cRes.data || []);
    setLoading(false);
  };

  const handleSelectStudentForFee = (sId) => {
    setAddFeeStudentId(sId);
    const targetStudent = studentsList.find(s => s.id === sId || s.email === sId);
    if (!targetStudent) {
      setSelectedFeeCourses({});
      return;
    }

    const cBatches = targetStudent.courseBatches || (targetStudent.course ? [{ course: targetStudent.course, batch: targetStudent.batch || 'Unassigned' }] : []);
    const initialMap = {};

    cBatches.forEach(cb => {
      const cTitle = typeof cb === 'string' ? cb : cb.course;
      const matchedCourse = coursesList.find(c => c.title?.toLowerCase().trim() === cTitle?.toLowerCase().trim() || c.id === cTitle);
      const feeVal = matchedCourse && matchedCourse.price != null && Number(matchedCourse.price) > 0 ? Number(matchedCourse.price) : 0;
      initialMap[cTitle] = feeVal;
    });

    setSelectedFeeCourses(initialMap);
  };

  const handleToggleFeeCourse = (cTitle, defaultFee = null) => {
    setSelectedFeeCourses(prev => {
      const updated = { ...prev };
      if (updated[cTitle] !== undefined) {
        delete updated[cTitle];
      } else {
        const matchedCourse = coursesList.find(c => c.title?.toLowerCase().trim() === cTitle?.toLowerCase().trim() || c.id === cTitle);
        const resolvedFee = defaultFee !== null ? defaultFee : (matchedCourse?.price != null ? Number(matchedCourse.price) : 0);
        updated[cTitle] = resolvedFee;
      }
      return updated;
    });
  };

  const handleFeeCourseAmountChange = (cTitle, amount) => {
    const val = parseFloat(amount) || 0;
    setSelectedFeeCourses(prev => ({
      ...prev,
      [cTitle]: val
    }));
  };

  const calculateAddFeeTotals = () => {
    const totalFee = Object.values(selectedFeeCourses).reduce((sum, f) => sum + (parseFloat(f) || 0), 0);
    const paid = Math.min(totalFee, Math.max(0, parseFloat(initialPayment) || 0));
    const due = Math.max(0, totalFee - paid);
    const status = due === 0 ? 'Paid' : 'Pending';
    return { totalFee, paid, due, status };
  };

  const handleAddFeeSubmit = async (e) => {
    e.preventDefault();
    const targetStudent = studentsList.find(s => s.id === addFeeStudentId || s.email === addFeeStudentId);
    if (!targetStudent) return;
    if (Object.keys(selectedFeeCourses).length === 0) return;

    const { totalFee, paid, due, status } = calculateAddFeeTotals();

    const courseSummary = Object.keys(selectedFeeCourses).join(', ');
    const batchSummary = targetStudent.courseBatches?.[0]?.batch || targetStudent.batch || 'Unassigned';

    await createFeeRecord({
      studentId: targetStudent.id,
      student: targetStudent.name,
      course: courseSummary,
      batch: batchSummary,
      courses: Object.entries(selectedFeeCourses).map(([cName, cFee]) => ({ course: cName, fee: cFee })),
      totalFee,
      paidAmount: paid,
      dueAmount: due,
      status,
      date: new Date().toISOString().split('T')[0]
    });

    await logActivity('Student Fees', 'Fee Record Created', `Created fee record of ₹${totalFee.toLocaleString()} for student "${targetStudent.name}" (${courseSummary})`);

    setShowAddFeeModal(false);
    setAddFeeStudentId('');
    setSelectedFeeCourses({});
    setInitialPayment('');
    loadFees();
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    
    await recordStudentPayment(selectedStudent.id, amount);
    await logActivity('Student Fees', 'Payment Recorded', `Recorded fee payment of ₹${amount.toLocaleString()} for student "${selectedStudent.student}"`);
    
    setShowPaymentModal(false);
    setSelectedStudent(null);
    setPaymentAmount('');
    loadFees();
  };

  const handleConfirmDeleteFee = async () => {
    if (deleteFeeData) {
      await deleteFeeRecord(deleteFeeData.id);
      await logActivity('Student Fees', 'Fee Record Deleted', `Deleted fee record for student "${deleteFeeData.student}" (${deleteFeeData.course})`);
      setDeleteFeeData(null);
      await loadFees();
    }
  };

  const handleExportFeesExcel = () => {
    const headers = ['Student Name', 'Course', 'Batch', 'Total Fee (₹)', 'Paid Amount (₹)', 'Due Amount (₹)', 'Status', 'Last Payment Date'];
    const rows = feeRecords.map(f => [
      f.student || '',
      f.course || '',
      f.batch || '',
      f.totalFee || 0,
      f.paidAmount || 0,
      f.dueAmount || 0,
      f.status || 'Pending',
      f.date || ''
    ]);
    exportToExcel(`Zoro_Academy_Student_Fees_${new Date().toISOString().split('T')[0]}.xlsx`, 'Student Fees', headers, rows);
  };

  const filteredRecords = feeRecords.filter(item => {
    const matchesSearch = (item.student || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.course || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const courseGroups = {};
  filteredRecords.forEach(record => {
    const cName = record.course || 'Other Courses';
    if (!courseGroups[cName]) courseGroups[cName] = [];
    courseGroups[cName].push(record);
  });

  const totalCollections = feeRecords.reduce((sum, item) => sum + (parseFloat(item.paidAmount) || 0), 0);
  const pendingDues = feeRecords.filter(i => i.dueAmount > 0 && i.status === 'Pending').reduce((sum, item) => sum + (parseFloat(item.dueAmount) || 0), 0);
  const overduePayments = feeRecords.filter(i => i.status === 'Overdue').reduce((sum, item) => sum + (parseFloat(item.dueAmount) || 0), 0);
  const paidCount = feeRecords.filter(i => i.status === 'Paid').length;
  const totalStudentsCount = feeRecords.length;
  const pendingStudentsCount = feeRecords.filter(i => i.dueAmount > 0 && i.status === 'Pending').length;
  const overdueStudentsCount = feeRecords.filter(i => i.status === 'Overdue').length;

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6 sm:p-8">
      {/* Header - Renamed to Student Fees */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Fees Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track student fee collections, manage course dues, and record payment receipts.</p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => setShowAddFeeModal(true)}
            className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Fee</span>
          </button>
          <button
            onClick={handleExportFeesExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Student Fees Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs font-semibold text-slate-500">Total Fee Collections</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollections.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">↑ Total Paid Income</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-slate-500">Pending Dues</div>
          <div className="text-2xl font-black text-amber-600 mt-1">₹{pendingDues.toLocaleString()}</div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">{pendingStudentsCount} Student{pendingStudentsCount !== 1 ? 's' : ''} pending</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
          <div className="text-xs font-semibold text-slate-500">Overdue Payments</div>
          <div className="text-2xl font-black text-rose-600 mt-1">₹{overduePayments.toLocaleString()}</div>
          <div className="text-[10px] text-rose-700 font-bold mt-1">{overdueStudentsCount} Student{overdueStudentsCount !== 1 ? 's' : ''} overdue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <div className="text-xs font-semibold text-slate-500">Paid Enrollees</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{paidCount} / {totalStudentsCount}</div>
          <div className="text-[10px] text-blue-700 font-bold mt-1">100% Cleared Accounts</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search student fees by name or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-500">Status:</span>
          {['All', 'Paid', 'Pending', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Course Group Tables */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
            Loading student fee records...
          </div>
        ) : Object.keys(courseGroups).length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
            No student fee records match your search.
          </div>
        ) : (
          Object.entries(courseGroups).map(([courseName, records]) => (
            <div key={courseName} className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-3">
              <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center text-xs font-black">
                <span className="text-sm">{courseName} — Student Fees</span>
                <span>{records.length} Student Record{records.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Total Fee (₹)</th>
                      <th className="py-3 px-4">Paid Amount (₹)</th>
                      <th className="py-3 px-4">Pending Due (₹)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Payment Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {records.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-900">{item.student}</td>
                        <td className="py-4 px-4 font-bold text-blue-600">{item.batch || 'Unassigned'}</td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-800">₹{item.totalFee.toLocaleString()}</td>
                        <td className="py-4 px-4 font-mono font-bold text-emerald-700">₹{item.paidAmount.toLocaleString()}</td>
                        <td className="py-4 px-4 font-mono font-bold text-rose-600">₹{item.dueAmount.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            item.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono">{item.date}</td>
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          {item.dueAmount > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedStudent(item);
                                setPaymentAmount(item.dueAmount.toString());
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Record Payment
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                              Fully Cleared ✓
                            </span>
                          )}
                          <button
                            onClick={() => setDeleteFeeData(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors inline-flex items-center"
                            title="Delete Fee Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Record Fee Payment</h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
              <div><strong>Student:</strong> {selectedStudent.student}</div>
              <div><strong>Course:</strong> {selectedStudent.course} ({selectedStudent.batch})</div>
              <div><strong>Current Pending Due:</strong> <span className="text-rose-600 font-black">₹{selectedStudent.dueAmount.toLocaleString()}</span></div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  max={selectedStudent.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md text-xs cursor-pointer"
              >
                Confirm Payment & Issue Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Fee Modal */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddFeeModal(false);
                setAddFeeStudentId('');
                setSelectedFeeCourses({});
                setInitialPayment('');
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Add Student Fee</h3>

            <form onSubmit={handleAddFeeSubmit} className="space-y-4">
              {/* 1. Student Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  required
                  value={addFeeStudentId}
                  onChange={(e) => handleSelectStudentForFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              {/* 2. Course Selection (Only courses allocated to student) */}
              {addFeeStudentId && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 border-b border-slate-200 pb-2 flex justify-between">
                    <span>Allocated Courses & Course-Specific Fees</span>
                    <span className="text-blue-600">{Object.keys(selectedFeeCourses).length} Selected</span>
                  </div>

                  {(() => {
                    const targetStudent = studentsList.find(s => s.id === addFeeStudentId);
                    const cBatches = targetStudent?.courseBatches || (targetStudent?.course ? [{ course: targetStudent.course }] : []);
                    
                    if (cBatches.length === 0) {
                      return <div className="text-xs text-slate-400 font-semibold italic">No courses allocated to this student.</div>;
                    }

                    return cBatches.map((cb, idx) => {
                      const cTitle = typeof cb === 'string' ? cb : cb.course;
                      const isSelected = selectedFeeCourses[cTitle] !== undefined;

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleFeeCourse(cTitle)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span>{cTitle}</span>
                          </label>

                          {isSelected && (
                            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                              <span className="text-[11px] font-bold text-slate-500">Fee (₹):</span>
                              <input
                                type="number"
                                required
                                min="0"
                                value={selectedFeeCourses[cTitle] || ''}
                                onChange={(e) => handleFeeCourseAmountChange(cTitle, e.target.value)}
                                className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:bg-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* 3. Automatic Calculation Summary */}
              {Object.keys(selectedFeeCourses).length > 0 && (() => {
                const { totalFee, paid, due, status } = calculateAddFeeTotals();
                return (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-400">Number of Selected Courses:</span>
                      <span className="font-bold">{Object.keys(selectedFeeCourses).length}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-400">Total Course Fee:</span>
                      <span className="font-black text-emerald-400 text-sm">₹{totalFee.toLocaleString()}</span>
                    </div>

                    {/* Initial Payment Field */}
                    <div className="space-y-1 pt-1">
                      <label className="block text-[11px] font-bold text-slate-300">Initial Payment Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        max={totalFee}
                        placeholder="Enter upfront payment (0, 3000, 5000, etc.)"
                        value={initialPayment}
                        onChange={(e) => setInitialPayment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Paid Amount</div>
                        <div className="font-black text-emerald-400">₹{paid.toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Due Amount</div>
                        <div className="font-black text-rose-400">₹{due.toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          status === 'Paid' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={!addFeeStudentId || Object.keys(selectedFeeCourses).length === 0}
                className="w-full bg-[#0F52BA] hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-md text-xs cursor-pointer"
              >
                Create Fee Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Fee Record Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteFeeData)}
        title="Delete Fee Record"
        message={`Are you sure you want to delete the fee record for student "${deleteFeeData?.student}" (${deleteFeeData?.course})? This will permanently remove the record and its payment history from the database.`}
        confirmText="Delete Fee Record"
        onConfirm={handleConfirmDeleteFee}
        onCancel={() => setDeleteFeeData(null)}
      />

    </div>
  );
}
