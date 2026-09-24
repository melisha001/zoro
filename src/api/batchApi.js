import { getItem, setItem, apiResponse } from './client';

const BATCHES_KEY = 'batches_db';

const INITIAL_BATCHES = [
  {
    id: 'btc-1',
    name: 'Batch A',
    courseName: 'English Communication',
    days: ['Monday', 'Wednesday', 'Friday'],
    day: 'Monday, Wednesday, Friday',
    session: 'Morning',
    trainerName: 'Priya',
    status: 'Active'
  },
  {
    id: 'btc-2',
    name: 'Batch B',
    courseName: 'English Communication',
    days: ['Tuesday', 'Thursday'],
    day: 'Tuesday, Thursday',
    session: 'Evening',
    trainerName: 'Priya',
    status: 'Active'
  },
  {
    id: 'btc-3',
    name: 'Batch C',
    courseName: 'Abacus Level 3',
    days: ['Friday', 'Saturday'],
    day: 'Friday, Saturday',
    session: 'Morning',
    trainerName: 'Rahul',
    status: 'Active'
  },
  {
    id: 'btc-4',
    name: 'Batch D',
    courseName: 'Chess Mastery',
    days: ['Saturday', 'Sunday'],
    day: 'Saturday, Sunday',
    session: 'Evening',
    trainerName: 'Rahul',
    status: 'Inactive'
  }
];

export const getBatches = async () => {
  let batches = getItem(BATCHES_KEY, null);
  if (!batches || batches.length === 0) {
    batches = INITIAL_BATCHES;
    setItem(BATCHES_KEY, batches);
  }
  // Ensure every batch has days array and day string
  const normalized = (batches || []).map(b => {
    const daysArr = Array.isArray(b.days) && b.days.length > 0 
      ? b.days 
      : (b.day ? b.day.split(',').map(d => d.trim()) : ['Monday']);
    return {
      ...b,
      days: daysArr,
      day: daysArr.join(', ')
    };
  });
  return apiResponse(normalized);
};

export const createBatch = async (newBatchData) => {
  const { data: batches } = await getBatches();
  const daysArr = Array.isArray(newBatchData.days) && newBatchData.days.length > 0
    ? newBatchData.days
    : [newBatchData.day || 'Monday'];

  const newBatch = {
    id: `btc_${Date.now()}`,
    status: newBatchData.status || 'Active',
    ...newBatchData,
    days: daysArr,
    day: daysArr.join(', ')
  };
  const updatedBatches = [newBatch, ...batches];
  setItem(BATCHES_KEY, updatedBatches);
  return apiResponse(newBatch);
};

export const updateBatch = async (id, updatedData) => {
  const { data: batches } = await getBatches();
  const updatedBatches = batches.map(b => {
    if (b.id === id) {
      const merged = { ...b, ...updatedData };
      if (updatedData.days) {
        merged.days = updatedData.days;
        merged.day = updatedData.days.join(', ');
      }
      return merged;
    }
    return b;
  });
  setItem(BATCHES_KEY, updatedBatches);
  return apiResponse(updatedBatches.find(b => b.id === id));
};

export const deleteBatch = async (id) => {
  const { data: batches } = await getBatches();
  const updatedBatches = batches.filter(b => b.id !== id);
  setItem(BATCHES_KEY, updatedBatches);
  return apiResponse(true);
};
