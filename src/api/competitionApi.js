import { getItem, setItem, apiResponse } from './client';
import { logActivity } from './activityLogApi';

const COMPETITIONS_KEY = 'competitions_db';

const INITIAL_COMPETITIONS = [
  {
    id: 'comp-1',
    name: 'Zoro National Public Speaking Championship 2026',
    description: 'Premier national speed communication and public speaking showdown for young prodigies.',
    date: '2026-10-20',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    regStartDate: '2026-09-20',
    regEndDate: '2026-10-10',
    deadline: '2026-10-10',
    courseName: 'English Communication',
    eligibleBatch: 'Batch A',
    venue: 'Online (Google Meet & Zoro Portal)',
    status: 'Registration Open',
    instructions: 'Webcam required. 50 speed questions to be answered in 5 minutes.',
    contactDetails: '+91 98765 43210 | competition@zoro.com',
    banner: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
    rulesPdf: { name: 'Competition_Rules_2026.pdf', size: '1.2 MB' },
    registrationDocPdf: { name: 'Registration_Form_Instructions.pdf', size: '0.8 MB' }
  },
  {
    id: 'comp-2',
    name: 'Abacus Speed Calculation Challenge Level 3',
    description: 'Mental math and soroban speed calculation tournament.',
    date: '2026-11-05',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    regStartDate: '2026-10-01',
    regEndDate: '2026-10-28',
    deadline: '2026-10-28',
    courseName: 'Abacus Level 3',
    eligibleBatch: 'Batch C',
    venue: 'Offline Branch A',
    status: 'Upcoming',
    instructions: 'Bring your soroban abacus. 100 multi-digit operations.',
    contactDetails: '+91 98765 11111 | abacus@zoro.com',
    banner: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    rulesPdf: { name: 'Abacus_Tournament_Rules.pdf', size: '1.5 MB' },
    registrationDocPdf: null
  }
];

export const getCompetitions = async () => {
  let competitions = getItem(COMPETITIONS_KEY, null);
  if (!competitions || competitions.length === 0) {
    competitions = INITIAL_COMPETITIONS;
    setItem(COMPETITIONS_KEY, competitions);
  }
  return apiResponse(competitions);
};

export const createCompetition = async (newCompData) => {
  const { data: competitions } = await getCompetitions();
  const newComp = {
    id: `comp_${Date.now()}`,
    status: newCompData.status || 'Upcoming',
    ...newCompData
  };
  const updated = [newComp, ...competitions];
  setItem(COMPETITIONS_KEY, updated);
  await logActivity('Competitions', 'Competition Created', `New competition "${newComp.name}" created.`);
  return apiResponse(newComp);
};

export const updateCompetition = async (id, updatedData) => {
  const { data: competitions } = await getCompetitions();
  const updated = competitions.map(c => c.id === id ? { ...c, ...updatedData } : c);
  setItem(COMPETITIONS_KEY, updated);
  await logActivity('Competitions', 'Competition Updated', `Competition "${updatedData.name || id}" updated.`);
  return apiResponse(updated.find(c => c.id === id));
};

export const deleteCompetition = async (id) => {
  const { data: competitions } = await getCompetitions();
  const target = competitions.find(c => c.id === id);
  const updated = competitions.filter(c => c.id !== id);
  setItem(COMPETITIONS_KEY, updated);
  await logActivity('Competitions', 'Competition Deleted', `Competition "${target?.name || id}" deleted.`);
  return apiResponse(true);
};
