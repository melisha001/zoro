import { getItem, setItem, apiResponse } from './client';

const DOUBTS_KEY = 'doubts_db';

const INITIAL_DOUBTS = [
  {
    id: 'DBT-00124',
    studentName: 'Arjun M',
    studentEmail: 'arjun@student.com',
    course: 'English Communication',
    topic: 'Pronunciation & Pitch',
    question: 'How do I reduce my native accent when presenting in public?',
    status: 'RESOLVED',
    trainerName: 'Priya',
    answer: 'Focus on syllable stress, pause after key ideas, and record your speech daily.',
    createdOn: '15 Sep 2026'
  },
  {
    id: 'DBT-00123',
    studentName: 'Ananya R',
    studentEmail: 'ananya@student.com',
    course: 'Abacus Level 3',
    topic: 'Soroban Rods',
    question: 'Should we clear lower beads first in 3x2 digit multiplication?',
    status: 'RESOLVED',
    trainerName: 'Rahul',
    answer: 'Yes, always clear multiplier units before shifting to tens.',
    createdOn: '14 Sep 2026'
  },
  {
    id: 'DBT-00125',
    studentName: 'Arjun M',
    studentEmail: 'arjun@student.com',
    course: 'English Communication',
    topic: 'Debate Opening',
    question: 'What is a strong hook sentence for an opening debate statement?',
    status: 'OPEN',
    trainerName: 'Priya',
    answer: '',
    createdOn: '17 Sep 2026'
  }
];

export const getDoubts = async () => {
  let doubts = getItem(DOUBTS_KEY, null);
  if (!doubts) {
    doubts = INITIAL_DOUBTS;
    setItem(DOUBTS_KEY, doubts);
  }
  return apiResponse(doubts);
};

export const createDoubt = async (doubtData) => {
  const { data: doubts } = await getDoubts();
  const newDoubt = {
    id: `DBT-${Math.floor(10000 + Math.random() * 90000)}`,
    status: 'OPEN',
    answer: '',
    createdOn: new Date().toLocaleDateString('en-GB'),
    ...doubtData
  };
  const updated = [newDoubt, ...doubts];
  setItem(DOUBTS_KEY, updated);
  return apiResponse(newDoubt);
};

export const resolveDoubt = async (doubtId, trainerName, answerText) => {
  const { data: doubts } = await getDoubts();
  const updated = doubts.map(d => {
    if (d.id === doubtId) {
      return {
        ...d,
        status: 'RESOLVED',
        trainerName: trainerName || d.trainerName || 'Trainer',
        answer: answerText,
        resolvedOn: new Date().toLocaleDateString('en-GB')
      };
    }
    return d;
  });

  setItem(DOUBTS_KEY, updated);
  return apiResponse(updated.find(d => d.id === doubtId));
};
