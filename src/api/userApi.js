import { getItem, setItem, apiResponse } from './client';

const STUDENTS_KEY = 'students_db';
const TRAINERS_KEY = 'trainers_db';

const INITIAL_STUDENTS = [
  { id: 'std-1', name: 'Arjun', email: 'arjun@student.com', password: 'password123', phone: '+91 98765 43210', course: 'English Communication', ageGroup: '7-12 Years', status: 'Active' },
  { id: 'std-2', name: 'Ananya', email: 'ananya@student.com', password: 'password123', phone: '+91 98765 43211', course: 'Abacus Level 3', ageGroup: '6-14 Years', status: 'Active' }
];

const INITIAL_TRAINERS = [
  { id: 'trn-1', name: 'Priya', email: 'priya@trainer.com', password: 'password123', phone: '+91 98765 11111', specialty: 'English Communication & Abacus', status: 'Active' },
  { id: 'trn-2', name: 'Rahul', email: 'rahul@trainer.com', password: 'password123', phone: '+91 98765 22222', specialty: 'Chess Mastery', status: 'Active' }
];

// --- STUDENTS CRUD ---
export const getStudents = async () => {
  let students = getItem(STUDENTS_KEY, null);
  if (!students) {
    students = INITIAL_STUDENTS;
    setItem(STUDENTS_KEY, students);
  }
  return apiResponse(students);
};

export const createStudent = async (data) => {
  const { data: students } = await getStudents();
  const newStudent = {
    id: `std_${Date.now()}`,
    status: 'Active',
    ...data
  };
  const updated = [newStudent, ...students];
  setItem(STUDENTS_KEY, updated);
  return apiResponse(newStudent);
};

export const updateStudent = async (id, data) => {
  const { data: students } = await getStudents();
  const updated = students.map(s => s.id === id ? { ...s, ...data } : s);
  setItem(STUDENTS_KEY, updated);
  return apiResponse(updated.find(s => s.id === id));
};

export const deleteStudent = async (id) => {
  const { data: students } = await getStudents();
  const updated = students.filter(s => s.id !== id);
  setItem(STUDENTS_KEY, updated);
  return apiResponse(true);
};

// --- TRAINERS CRUD ---
export const getTrainers = async () => {
  let trainers = getItem(TRAINERS_KEY, null);
  if (!trainers) {
    trainers = INITIAL_TRAINERS;
    setItem(TRAINERS_KEY, trainers);
  }
  return apiResponse(trainers);
};

export const createTrainer = async (data) => {
  const { data: trainers } = await getTrainers();
  const newTrainer = {
    id: `trn_${Date.now()}`,
    status: 'Active',
    ...data
  };
  const updated = [newTrainer, ...trainers];
  setItem(TRAINERS_KEY, updated);
  return apiResponse(newTrainer);
};

export const updateTrainer = async (id, data) => {
  const { data: trainers } = await getTrainers();
  const updated = trainers.map(t => t.id === id ? { ...t, ...data } : t);
  setItem(TRAINERS_KEY, updated);
  return apiResponse(updated.find(t => t.id === id));
};

export const deleteTrainer = async (id) => {
  const { data: trainers } = await getTrainers();
  const updated = trainers.filter(t => t.id !== id);
  setItem(TRAINERS_KEY, updated);
  return apiResponse(true);
};

// --- AUTO DETECT USER BY EMAIL ---
export const findUserByEmail = async (email) => {
  const lowerEmail = email.toLowerCase().trim();
  
  // Check Admin first
  if (lowerEmail.includes('admin')) {
    return { name: 'Admin', email: lowerEmail, role: 'ADMIN' };
  }

  // Check Trainers
  const { data: trainers } = await getTrainers();
  const foundTrainer = trainers.find(t => t.email.toLowerCase() === lowerEmail);
  if (foundTrainer) {
    return { ...foundTrainer, role: 'TRAINER' };
  }
  if (lowerEmail.includes('trainer')) {
    return { name: 'Trainer Priya', email: lowerEmail, role: 'TRAINER' };
  }

  // Check Students
  const { data: students } = await getStudents();
  const foundStudent = students.find(s => s.email.toLowerCase() === lowerEmail);
  if (foundStudent) {
    return { ...foundStudent, role: 'STUDENT' };
  }
  if (lowerEmail.includes('student')) {
    return { name: 'Arjun', email: lowerEmail, role: 'STUDENT' };
  }

  // Default fallback based on email domain or default to Student
  return { name: email.split('@')[0], email: lowerEmail, role: 'STUDENT' };
};
