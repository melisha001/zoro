import { apiGet, apiPost, apiPut, apiDelete, apiResponse } from './client';
import { logActivity } from './activityLogApi';
import { getSalaryPayments } from './salaryApi';

export const getExpenses = async () => {
  let manualExpenses = [];
  const res = await apiGet('/expenses');
  if (res && res.success && Array.isArray(res.data)) {
    manualExpenses = res.data.map(e => ({
      id: e.id,
      title: e.description || e.category || 'Expense',
      category: e.category || 'General',
      description: e.description || '',
      amount: parseFloat(e.amount || 0),
      date: e.date || (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : ''),
      paymentMethod: 'Bank Transfer',
      paidTo: e.category || 'Vendor',
      referenceNo: e.id,
      notes: e.description || '',
      source: 'Manual Expense',
      isAutoSalary: false
    }));
  }

  // Fetch dynamic paid trainer salaries from central salaryApi
  let autoSalaryExpenses = [];
  try {
    const salRes = await getSalaryPayments();
    const paidSalaries = (salRes.data || []).filter(s => s.status?.toUpperCase() === 'PAID');
    autoSalaryExpenses = paidSalaries.map(sal => ({
      id: `auto-sal-${sal.id}`,
      originalSalaryId: sal.id,
      title: `${sal.trainerName || 'Trainer'} - Salary`,
      category: 'Salary',
      description: sal.notes || `Trainer salary disbursement for ${sal.month || ''}`,
      amount: parseFloat(sal.amount || 0),
      date: sal.date || new Date().toISOString().split('T')[0],
      paymentMethod: sal.method || 'Bank Transfer',
      paidTo: sal.trainerName || 'Trainer',
      referenceNo: sal.reference || sal.id,
      notes: sal.notes || '',
      source: 'Trainer Salary',
      isAutoSalary: true
    }));
  } catch (err) {
    console.error('Error fetching salary expenses in expenseApi:', err);
  }

  const combined = [...manualExpenses, ...autoSalaryExpenses];
  combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return apiResponse(combined);
};

export const createExpense = async (newExpData) => {
  const payload = {
    category: newExpData.category || 'General',
    amount: parseFloat(newExpData.amount || 0),
    date: newExpData.date || new Date().toISOString().split('T')[0],
    description: newExpData.title ? `${newExpData.title}: ${newExpData.description || ''}`.trim() : (newExpData.description || '')
  };

  const res = await apiPost('/expenses', payload);
  if (res && res.success) {
    await logActivity('Expenses', 'Expense Recorded', `Added expense "${payload.description}" (₹${payload.amount.toLocaleString()})`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to create expense');
};

export const updateExpense = async (id, updatedData) => {
  const payload = {
    category: updatedData.category,
    amount: parseFloat(updatedData.amount || 0),
    date: updatedData.date,
    description: updatedData.title ? `${updatedData.title}: ${updatedData.description || ''}`.trim() : updatedData.description
  };

  const res = await apiPut(`/expenses/${id}`, payload);
  if (res && res.success) {
    await logActivity('Expenses', 'Expense Updated', `Updated expense "${payload.description || id}"`);
    return apiResponse(res.data);
  }
  return apiResponse(null, false, res?.message || 'Failed to update expense');
};

export const deleteExpense = async (id) => {
  const res = await apiDelete(`/expenses/${id}`);
  if (res && res.success) {
    await logActivity('Expenses', 'Expense Deleted', `Deleted expense "${id}"`);
    return apiResponse(true);
  }
  return apiResponse(false, false, res?.message || 'Failed to delete expense');
};
