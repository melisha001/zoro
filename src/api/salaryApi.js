import { getItem, setItem, apiResponse } from './client';
import { createNotification } from './notificationApi';

const SALARY_KEY = 'trainer_salaries_db';

const INITIAL_SALARIES = [
  {
    id: 'sal-1',
    trainerId: 'trn-1',
    trainerName: 'Priya',
    month: 'September 2026',
    date: '2026-09-10',
    amount: 25000,
    method: 'Bank Transfer',
    reference: 'TXN98421054',
    notes: 'Monthly salary for September',
    status: 'Paid'
  },
  {
    id: 'sal-2',
    trainerId: 'trn-2',
    trainerName: 'Rahul',
    month: 'September 2026',
    date: '2026-09-12',
    amount: 22000,
    method: 'UPI',
    reference: 'UPI77410982',
    notes: 'Monthly salary for September',
    status: 'Paid'
  }
];

export const getSalaryPayments = async () => {
  let salaries = getItem(SALARY_KEY, null);
  if (!salaries) {
    salaries = INITIAL_SALARIES;
    setItem(SALARY_KEY, salaries);
  }
  return apiResponse(salaries);
};

export const getSalaries = getSalaryPayments;


export const createSalaryPayment = async (data) => {
  const { data: salaries } = await getSalaryPayments();
  const newRecord = {
    id: `sal_${Date.now()}`,
    status: 'Paid',
    ...data
  };
  const updated = [newRecord, ...salaries];
  setItem(SALARY_KEY, updated);

  // Trigger persistent notification for trainer (Requirement 9)
  if (newRecord.trainerName) {
    await createNotification({
      trainerName: newRecord.trainerName,
      title: 'Salary Payment Recorded',
      desc: `Salary payment of ₹${Number(newRecord.amount).toLocaleString()} for ${newRecord.month || 'September 2026'} has been recorded.`,
      type: 'system'
    });
  }

  return apiResponse(newRecord);
};

export const updateSalaryPayment = async (id, data) => {
  const { data: salaries } = await getSalaryPayments();
  const updated = salaries.map(s => s.id === id ? { ...s, ...data } : s);
  setItem(SALARY_KEY, updated);
  return apiResponse(updated.find(s => s.id === id));
};

export const deleteSalaryPayment = async (id) => {
  const { data: salaries } = await getSalaryPayments();
  const updated = salaries.filter(s => s.id !== id);
  setItem(SALARY_KEY, updated);
  return apiResponse(true);
};

export const getSalaryStats = async () => {
  const { data: salaries } = await getSalaryPayments();
  const totalPaid = salaries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  
  const currentMonthStr = 'September 2026';
  const currentMonthPaid = salaries
    .filter(s => s.month === currentMonthStr)
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const uniqueTrainersPaid = new Set(salaries.map(s => s.trainerName)).size;

  return apiResponse({
    totalPaid,
    currentMonthPaid,
    uniqueTrainersPaid,
    totalRecords: salaries.length
  });
};
