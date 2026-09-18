import { getItem, setItem, apiResponse } from './client';

const ASSIGNMENTS_KEY = 'assignments_db';

const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'Worksheet 5: Public Speaking Draft',
    course: 'English Communication',
    topic: 'Speech Draft',
    assignedDate: '10 Sep 2026',
    dueDate: '15 Sep 2026',
    status: 'Pending',
    submissions: [
      { studentName: 'Arjun M', studentEmail: 'arjun@student.com', submittedOn: '14 Sep 2026', answerText: 'Speech draft attached.', status: 'Submitted' }
    ]
  },
  {
    id: 'asg-2',
    title: 'Vocabulary Quiz: Essential Daily Phrases',
    course: 'English Communication',
    topic: 'Essential Phrases',
    assignedDate: '12 Sep 2026',
    dueDate: '20 Sep 2026',
    status: 'Submitted',
    submissions: [
      { studentName: 'Arjun M', studentEmail: 'arjun@student.com', submittedOn: '13 Sep 2026', answerText: 'Completed quiz online.', status: 'Graded', score: '95/100' }
    ]
  },
  {
    id: 'asg-3',
    title: 'Abacus Speed Drill 3',
    course: 'Abacus Level 3',
    topic: 'Mental Math Division',
    assignedDate: '11 Sep 2026',
    dueDate: '18 Sep 2026',
    status: 'Pending',
    submissions: []
  }
];

export const getAssignments = async () => {
  let assignments = getItem(ASSIGNMENTS_KEY, null);
  if (!assignments) {
    assignments = INITIAL_ASSIGNMENTS;
    setItem(ASSIGNMENTS_KEY, assignments);
  }
  return apiResponse(assignments);
};

export const createAssignment = async (data) => {
  const { data: assignments } = await getAssignments();
  const newAssignment = {
    id: `asg_${Date.now()}`,
    assignedDate: new Date().toLocaleDateString('en-GB'),
    status: 'Pending',
    submissions: [],
    ...data
  };
  const updated = [newAssignment, ...assignments];
  setItem(ASSIGNMENTS_KEY, updated);
  return apiResponse(newAssignment);
};

export const submitAssignment = async (assignmentId, studentName, studentEmail, answerText = 'Completed assignment') => {
  const { data: assignments } = await getAssignments();
  const updated = assignments.map(a => {
    if (a.id === assignmentId) {
      const existingSubs = a.submissions || [];
      const newSub = {
        studentName,
        studentEmail,
        submittedOn: new Date().toLocaleDateString('en-GB'),
        answerText,
        status: 'Submitted'
      };
      return {
        ...a,
        status: 'Submitted',
        submissions: [newSub, ...existingSubs.filter(s => s.studentEmail !== studentEmail)]
      };
    }
    return a;
  });

  setItem(ASSIGNMENTS_KEY, updated);
  return apiResponse(updated.find(a => a.id === assignmentId));
};

export const gradeAssignment = async (assignmentId, studentEmail, score, feedback) => {
  const { data: assignments } = await getAssignments();
  const updated = assignments.map(a => {
    if (a.id === assignmentId) {
      const updatedSubs = (a.submissions || []).map(s => {
        if (s.studentEmail === studentEmail) {
          return { ...s, status: 'Graded', score, feedback };
        }
        return s;
      });
      return { ...a, submissions: updatedSubs };
    }
    return a;
  });

  setItem(ASSIGNMENTS_KEY, updated);
  return apiResponse(updated.find(a => a.id === assignmentId));
};
