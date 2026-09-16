import { getItem, setItem, apiResponse } from './client';
import { INITIAL_COURSES } from '../data/mockData';

const COURSES_KEY = 'courses_db';

export const getCourses = async () => {
  let courses = getItem(COURSES_KEY, null);
  if (!courses || courses.length === 0) {
    courses = INITIAL_COURSES;
    setItem(COURSES_KEY, courses);
  }
  return apiResponse(courses);
};

export const getCourseById = async (id) => {
  const { data: courses } = await getCourses();
  const course = courses.find(c => c.id === id);
  return apiResponse(course || null);
};

export const createCourse = async (newCourseData) => {
  const { data: courses } = await getCourses();
  const id = newCourseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const course = {
    id,
    rating: 5.0,
    enrolled: 0,
    assignedTrainer: newCourseData.assignedTrainer || 'Ms. Priya',
    modules: [],
    ...newCourseData
  };
  const updatedCourses = [course, ...courses];
  setItem(COURSES_KEY, updatedCourses);
  return apiResponse(course);
};

export const updateCourse = async (id, updatedData) => {
  const { data: courses } = await getCourses();
  const updatedCourses = courses.map(c => c.id === id ? { ...c, ...updatedData } : c);
  setItem(COURSES_KEY, updatedCourses);
  return apiResponse(updatedCourses.find(c => c.id === id));
};

export const deleteCourse = async (id) => {
  const { data: courses } = await getCourses();
  const updatedCourses = courses.filter(c => c.id !== id);
  setItem(COURSES_KEY, updatedCourses);
  return apiResponse(true);
};

export const addModule = async (courseId, moduleData) => {
  const { data: courses } = await getCourses();
  const newModule = {
    id: `mod_${Date.now()}`,
    lessons: [],
    ...moduleData
  };
  
  const updatedCourses = courses.map(c => {
    if (c.id === courseId) {
      return { ...c, modules: [...(c.modules || []), newModule] };
    }
    return c;
  });
  
  setItem(COURSES_KEY, updatedCourses);
  return apiResponse(newModule);
};

export const addLesson = async (courseId, moduleId, lessonData) => {
  const { data: courses } = await getCourses();
  const newLesson = {
    id: `les_${Date.now()}`,
    ...lessonData
  };

  const updatedCourses = courses.map(c => {
    if (c.id === courseId) {
      const updatedModules = (c.modules || []).map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: [...(m.lessons || []), newLesson] };
        }
        return m;
      });
      return { ...c, modules: updatedModules };
    }
    return c;
  });

  setItem(COURSES_KEY, updatedCourses);
  return apiResponse(newLesson);
};
