import { getTrainerCourseRequests } from '../api/courseApi';

/**
 * Returns courses allocated to the given trainer.
 * A course is allocated if:
 * 1. c.audience === 'trainer'
 * 2. c.assignedTrainer === trainerName or c.trainerName === trainerName
 * 3. c.allocatedTrainers includes trainerName/trainerEmail
 * 4. An approved trainer_course_request exists for this trainer & course
 * 5. A batch for this course is handled by this trainer
 */
export function getTrainerAllocatedCourses(trainer, allCourses = [], allBatches = [], approvedRequests = []) {
  if (!trainer) return [];
  const trainerId = trainer.id;
  const trainerName = (trainer.name || '').toLowerCase().trim();
  const trainerEmail = (trainer.email || '').toLowerCase().trim();

  // Get course IDs / titles from approved requests
  const approvedTitles = approvedRequests
    .filter(r => (r.status === 'Approved') && (
      (trainerId && r.trainerId === trainerId) ||
      (r.trainerEmail && r.trainerEmail.toLowerCase().trim() === trainerEmail) ||
      (r.trainerName && r.trainerName.toLowerCase().trim() === trainerName)
    ))
    .map(r => (r.courseTitle || r.courseId || '').toLowerCase().trim());

  // Get course titles from batches handled by trainer
  const trainerBatchCourseIdsOrTitles = allBatches
    .filter(b => {
      const bTrainerId = b.trainerId;
      const bTrainer = (b.trainerName || b.trainer || b.assignedTrainer || '').toLowerCase().trim();
      const bEmail = (b.trainerEmail || '').toLowerCase().trim();
      return (trainerId && bTrainerId === trainerId) ||
             (trainerName && bTrainer.includes(trainerName)) ||
             (trainerEmail && bEmail === trainerEmail);
    })
    .map(b => (b.courseId || b.courseTitle || b.courseName || b.course || '').toLowerCase().trim());

  return allCourses.filter(c => {
    const cTitle = (c.title || '').toLowerCase().trim();
    const cId = (c.id || '').toLowerCase().trim();
    const cTrainerId = c.trainerId;
    const cAssigned = (c.assignedTrainer || c.trainerName || c.trainer || '').toLowerCase().trim();
    const cTrainers = Array.isArray(c.allocatedTrainers) 
      ? c.allocatedTrainers.map(t => t.toLowerCase().trim()) 
      : [];

    if (trainerId && cTrainerId === trainerId) return true;
    if (trainerName && cAssigned && (cAssigned === trainerName || cAssigned.includes(trainerName))) return true;
    if (trainerEmail && cAssigned.includes(trainerEmail)) return true;
    if (cTrainers.includes(trainerName) || cTrainers.includes(trainerEmail)) return true;
    if (approvedTitles.includes(cTitle) || approvedTitles.includes(cId)) return true;
    if (trainerBatchCourseIdsOrTitles.includes(cId) || trainerBatchCourseIdsOrTitles.includes(cTitle)) return true;

    return false;
  });
}

/**
 * Returns batches belonging to the selected course AND handled by the trainer.
 * If selectedCourseTitle is 'All' (or 'All Courses'), returns batches for all allocated courses.
 */
export function getTrainerAllocatedBatches(trainer, selectedCourseTitle, allocatedCourses = [], allBatches = []) {
  if (!trainer) return [];
  const trainerId = trainer.id;
  const trainerName = (trainer.name || '').toLowerCase().trim();
  const trainerEmail = (trainer.email || '').toLowerCase().trim();

  const allocatedTitles = allocatedCourses.map(c => (c.title || '').toLowerCase().trim());
  const allocatedIds = allocatedCourses.map(c => (c.id || '').toLowerCase().trim());

  return allBatches.filter(b => {
    const bCourseTitle = (b.courseTitle || b.courseName || b.course || '').toLowerCase().trim();
    const bCourseId = (b.courseId || '').toLowerCase().trim();
    const bTrainerId = b.trainerId;
    const bTrainer = (b.trainerName || b.trainer || b.assignedTrainer || '').toLowerCase().trim();
    const bEmail = (b.trainerEmail || '').toLowerCase().trim();

    const isDirectTrainer = (trainerId && bTrainerId === trainerId) ||
                            (trainerName && bTrainer.includes(trainerName)) || 
                            (trainerEmail && bEmail === trainerEmail);
    const isCourseMatch = allocatedTitles.includes(bCourseTitle) || (bCourseId && allocatedIds.includes(bCourseId));

    const isTrainerBatch = isDirectTrainer || (isCourseMatch && (!bTrainerId || bTrainerId === trainerId) && (!bTrainer || bTrainer.includes(trainerName)));

    if (!isTrainerBatch) return false;

    if (!selectedCourseTitle || selectedCourseTitle === 'All' || selectedCourseTitle === 'All Courses') {
      return true;
    }

    return bCourseTitle === selectedCourseTitle.toLowerCase().trim();
  });
}

/**
 * Filters students by course and batch matching rules.
 */
export function filterStudentsByCourseAndBatch(students = [], selectedCourse = 'All', selectedBatch = 'All') {
  return students.filter(student => {
    if ((student.status || '').toLowerCase() === 'inactive' || student.isDeleted) return false;

    const cMatches = selectedCourse === 'All' || selectedCourse === 'All Courses' ||
      (student.course || '').toLowerCase().trim() === selectedCourse.toLowerCase().trim() ||
      (student.courseBatches && student.courseBatches.some(cb => (cb.course || '').toLowerCase().trim() === selectedCourse.toLowerCase().trim()));

    const bMatches = selectedBatch === 'All' || selectedBatch === 'All Batches' ||
      (student.batch || '').toLowerCase().trim() === selectedBatch.toLowerCase().trim() ||
      (student.courseBatches && student.courseBatches.some(cb => (cb.batch || '').toLowerCase().trim() === selectedBatch.toLowerCase().trim()));

    if (selectedCourse !== 'All' && selectedCourse !== 'All Courses' && selectedBatch !== 'All' && selectedBatch !== 'All Batches') {
      if (student.courseBatches && student.courseBatches.length > 0) {
        return student.courseBatches.some(cb => 
          (cb.course || '').toLowerCase().trim() === selectedCourse.toLowerCase().trim() &&
          (cb.batch || '').toLowerCase().trim() === selectedBatch.toLowerCase().trim()
        );
      }
    }

    return cMatches && bMatches;
  });
}
