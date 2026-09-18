import { getItem, setItem, apiResponse } from './client';

const FEES_KEY = 'student_fees_db';

const INITIAL_FEES = [
  { id: 'fee-1', studentId: 'std-1', student: 'S.J. Abhishek', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '2026-09-10' },
  { id: 'fee-2', studentId: 'std-2', student: 'Nivetha R', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 10000, dueAmount: 5000, status: 'Pending', date: '2026-09-01' },
  { id: 'fee-3', studentId: 'std-3', student: 'Tharun K', course: 'English Communication', batch: 'EN-L1', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '2026-09-05' },
  { id: 'fee-4', studentId: 'std-4', student: 'Divya S', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 5000, dueAmount: 10000, status: 'Overdue', date: '2026-08-15' },
  { id: 'fee-5', studentId: 'std-5', student: 'Arjun M', course: 'Abacus Level 3', batch: 'AB-L3', totalFee: 12000, paidAmount: 12000, dueAmount: 0, status: 'Paid', date: '2026-09-08' },
  { id: 'fee-6', studentId: 'std-6', student: 'Keerthana P', course: 'English Communication', batch: 'EN-L2', totalFee: 15000, paidAmount: 15000, dueAmount: 0, status: 'Paid', date: '2026-09-12' },
];

export const getFeeRecords = async () => {
  let records = getItem(FEES_KEY, null);
  if (!records) {
    records = INITIAL_FEES;
    setItem(FEES_KEY, records);
  }
  return apiResponse(records);
};

export const recordStudentPayment = async (id, amount) => {
  const { data: records } = await getFeeRecords();
  const payVal = parseFloat(amount);
  const updated = records.map(item => {
    if (item.id === id || item.studentId === id) {
      const newPaid = item.paidAmount + payVal;
      const newDue = Math.max(0, item.totalFee - newPaid);
      return {
        ...item,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newDue === 0 ? 'Paid' : 'Pending',
        date: new Date().toISOString().split('T')[0]
      };
    }
    return item;
  });
  setItem(FEES_KEY, updated);
  return apiResponse(updated.find(item => item.id === id || item.studentId === id));
};

export const getFeeStats = async () => {
  const { data: records } = await getFeeRecords();
  const totalCollections = records.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
  const pendingDues = records.reduce((acc, curr) => acc + (parseFloat(curr.dueAmount) || 0), 0);
  const paidCount = records.filter(r => r.status === 'Paid').length;
  
  return apiResponse({
    totalCollections,
    pendingDues,
    paidCount,
    totalRecords: records.length
  });
};
