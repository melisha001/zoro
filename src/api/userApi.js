import { getItem, setItem, apiResponse } from './client';

const STUDENTS_KEY = 'students_db';
const TRAINERS_KEY = 'trainers_db';

const INITIAL_STUDENTS = [
  { 
    id: 'std-1', 
    name: 'Arjun M', 
    username: 'arjun123',
    email: 'arjun@student.com', 
    password: 'password123', 
    phone: '+91 98765 43210', 
    course: 'English Communication', 
    courseBatches: [{ course: 'English Communication', batch: 'Batch A' }],
    joinedOn: '12 Jan 2026',
    status: 'Active' 
  },
  { 
    id: 'std-2', 
    name: 'Ananya R', 
    username: 'ananya123',
    email: 'ananya@student.com', 
    password: 'password123', 
    phone: '+91 98765 43211', 
    course: 'Abacus Level 3', 
    courseBatches: [{ course: 'Abacus Level 3', batch: 'Batch C' }],
    joinedOn: '01 Feb 2026',
    status: 'Active' 
  }
];

const INITIAL_TRAINERS = [
  { 
    id: 'trn-1', 
    name: 'Priya', 
    email: 'priya@trainer.com', 
    password: 'password123', 
    phone: '+91 98765 11111', 
    specialty: 'English Communication & Abacus', 
    code: 'ZA-TR-001',
    joinedOn: '2025-01-10',
    salaryAmount: 35000,
    salaryCreditDate: '25',
    status: 'Active' 
  },
  { 
    id: 'trn-2', 
    name: 'Rahul', 
    email: 'rahul@trainer.com', 
    password: 'password123', 
    phone: '+91 98765 22222', 
    specialty: 'Chess Mastery', 
    code: 'ZA-TR-002',
    joinedOn: '2025-03-15',
    salaryAmount: 28000,
    salaryCreditDate: '20',
    status: 'Active' 
  }
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
    password: data.password || 'password123',
    address: data.address || 'Chennai, India',
    joinedOn: data.joinedOn || data.dateOfJoining || new Date().toISOString().split('T')[0],
    ...data
  };
  const updated = [newStudent, ...students];
  setItem(STUDENTS_KEY, updated);
  return apiResponse(newStudent);
};

export const updateStudent = async (id, data) => {
  const { data: students } = await getStudents();
  const updated = students.map(s => (s.id === id || s.email === id || (s.username && s.username === id)) ? { ...s, ...data } : s);
  setItem(STUDENTS_KEY, updated);
  return apiResponse(updated.find(s => s.id === id || s.email === id || s.username === id));
};

export const updateStudentPassword = async (studentIdOrEmail, currentPassword, newPassword) => {
  const { data: students } = await getStudents();
  const student = students.find(s => s.id === studentIdOrEmail || s.email === studentIdOrEmail || s.username === studentIdOrEmail);
  if (!student) {
    return { success: false, message: 'Student account not found.' };
  }
  if (student.password !== currentPassword) {
    return { success: false, message: 'Current password is incorrect.' };
  }
  const updated = students.map(s => s.id === student.id ? { ...s, password: newPassword } : s);
  setItem(STUDENTS_KEY, updated);
  return { success: true, message: 'Password changed successfully.' };
};

export const deleteStudent = async (id) => {
  const { data: students } = await getStudents();
  const updated = students.filter(s => s.id !== id && s.email !== id && s.username !== id);
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
    password: data.password || 'password123',
    code: `ZA-TR-${String(trainers.length + 1).padStart(3, '0')}`,
    joinedOn: data.joinedOn || data.dateOfJoining || new Date().toISOString().split('T')[0],
    ...data
  };
  const updated = [newTrainer, ...trainers];
  setItem(TRAINERS_KEY, updated);
  return apiResponse(newTrainer);
};


export const updateTrainer = async (id, data) => {
  const { data: trainers } = await getTrainers();
  const updated = trainers.map(t => (t.id === id || t.email === id) ? { ...t, ...data } : t);
  setItem(TRAINERS_KEY, updated);
  return apiResponse(updated.find(t => t.id === id || t.email === id));
};

export const updateTrainerProfile = updateTrainer;
export const updateStudentProfile = updateStudent;


export const deleteTrainer = async (id) => {
  const { data: trainers } = await getTrainers();
  const updated = trainers.filter(t => t.id !== id && t.email !== id);
  setItem(TRAINERS_KEY, updated);
  return apiResponse(true);
};

// --- AUTHENTICATION API ---
export const authenticateUser = async (email, password) => {
  const lowerEmail = email.toLowerCase().trim();
  
  // 1. Admin Login
  if (lowerEmail === 'admin@zoro.com' || lowerEmail === 'admin@academy.com' || lowerEmail === 'admin') {
    if (password === 'admin123' || password === 'password123' || !password) {
      return { 
        success: true, 
        user: { id: 'admin-1', name: 'System Administrator', email: lowerEmail, role: 'ADMIN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' } 
      };
    } else {
      return { success: false, message: 'Invalid password for Admin account.' };
    }
  }

  // 2. Trainer Login
  const { data: trainers } = await getTrainers();
  const foundTrainer = trainers.find(t => t.email.toLowerCase() === lowerEmail);
  if (foundTrainer) {
    if (foundTrainer.password === password) {
      return { 
        success: true, 
        user: { 
          ...foundTrainer, 
          role: 'TRAINER',
          avatar: foundTrainer.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' 
        } 
      };
    } else {
      return { success: false, message: 'Invalid password for Trainer account.' };
    }
  }

  // 3. Student Login (Check both email and username)
  const { data: students } = await getStudents();
  const foundStudent = students.find(s => 
    s.email.toLowerCase() === lowerEmail || (s.username && s.username.toLowerCase() === lowerEmail)
  );
  if (foundStudent) {
    if (foundStudent.password === password) {
      return { 
        success: true, 
        user: { 
          ...foundStudent, 
          role: 'STUDENT',
          avatar: foundStudent.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' 
        } 
      };
    } else {
      return { success: false, message: 'Invalid password for Student account.' };
    }
  }

  return { success: false, message: 'Account not found. Please check your registered email or username.' };
};

// --- AUTO DETECT USER BY EMAIL / USERNAME (FALLBACK) ---
export const findUserByEmail = async (email) => {
  const lowerEmail = email.toLowerCase().trim();
  
  if (lowerEmail.includes('admin')) {
    return { name: 'System Administrator', email: lowerEmail, role: 'ADMIN' };
  }

  const { data: trainers } = await getTrainers();
  const foundTrainer = trainers.find(t => t.email.toLowerCase() === lowerEmail);
  if (foundTrainer) {
    return { ...foundTrainer, role: 'TRAINER' };
  }

  const { data: students } = await getStudents();
  const foundStudent = students.find(s => 
    s.email.toLowerCase() === lowerEmail || (s.username && s.username.toLowerCase() === lowerEmail)
  );
  if (foundStudent) {
    return { ...foundStudent, role: 'STUDENT' };
  }

  return { name: email.split('@')[0], email: lowerEmail, role: 'STUDENT' };
};
