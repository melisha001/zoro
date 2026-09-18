import { getItem, setItem, apiResponse } from './client';
import { getCourses, updateCourse } from './courseApi';

const ENROLLMENTS_KEY = 'student_enrollments_db';

const INITIAL_ENROLLMENTS = [
  {
    id: 'enr-1',
    studentId: 'std-1',
    studentEmail: 'arjun@student.com',
    courseId: 'english-comm',
    courseTitle: 'English Communication',
    enrolledDate: '2026-09-01',
    status: 'Active'
  },
  {
    id: 'enr-2',
    studentId: 'std-2',
    studentEmail: 'ananya@student.com',
    courseId: 'abacus-3',
    courseTitle: 'Abacus Level 3',
    enrolledDate: '2026-09-05',
    status: 'Active'
  }
];

export const getEnrollments = async () => {
  let enrollments = getItem(ENROLLMENTS_KEY, null);
  if (!enrollments) {
    enrollments = INITIAL_ENROLLMENTS;
    setItem(ENROLLMENTS_KEY, enrollments);
  }
  return apiResponse(enrollments);
};

export const enrollStudentInCourse = async (studentIdOrEmail, courseId) => {
  const { data: enrollments } = await getEnrollments();
  
  // Check if already enrolled
  const existing = enrollments.find(e => 
    (e.studentId === studentIdOrEmail || e.studentEmail === studentIdOrEmail) && 
    e.courseId === courseId
  );
  if (existing) {
    return { success: false, message: 'Student is already enrolled in this course.' };
  }

  const { data: courses } = await getCourses();
  const targetCourse = courses.find(c => c.id === courseId);

  const newEnrollment = {
    id: `enr_${Date.now()}`,
    studentId: studentIdOrEmail,
    studentEmail: studentIdOrEmail,
    courseId,
    courseTitle: targetCourse?.title || courseId,
    enrolledDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  const updatedEnrollments = [newEnrollment, ...enrollments];
  setItem(ENROLLMENTS_KEY, updatedEnrollments);

  // Increment enrolled count on target course
  if (targetCourse) {
    await updateCourse(courseId, { enrolled: (targetCourse.enrolled || 0) + 1 });
  }

  return { success: true, enrollment: newEnrollment, message: 'Enrolled successfully!' };
};

export const getStudentEnrolledCourses = async (studentEmailOrId) => {
  const { data: enrollments } = await getEnrollments();
  const { data: courses } = await getCourses();

  const userEnrollments = enrollments.filter(e => 
    e.studentId === studentEmailOrId || e.studentEmail === studentEmailOrId
  );

  const enrolledCourses = userEnrollments
    .map(e => courses.find(c => c.id === e.courseId))
    .filter(Boolean);

  // Fallback: If no enrollments exist for Arjun yet, auto-enroll in english-comm for demo consistency
  if (enrolledCourses.length === 0 && (studentEmailOrId.includes('arjun') || studentEmailOrId === 'std-1')) {
    const defaultCourse = courses.find(c => c.id === 'english-comm') || courses[0];
    if (defaultCourse) return [defaultCourse];
  }

  return enrolledCourses;
};
