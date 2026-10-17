import { describe, it, expect } from 'vitest';

describe('Trainer Attendance Filter Rules and Timing Window', () => {
  const trainer = {
    id: 'trn_donisha',
    name: 'Donisha',
    email: 'd@gmail.com'
  };

  const allCourses = [
    { id: 'crs_1', title: 'student course 1', mode: 'Hybrid', audience: 'student' },
    { id: 'crs_2', title: 'student course-2', mode: 'Online', audience: 'student' },
    { id: 'crs_3', title: 'stduent course-3', mode: 'Recorded', audience: 'student' },
    { id: 'crs_tr1', title: 'TRAINER-1', mode: 'Online', audience: 'trainer' },
    { id: 'crs_tr2', title: 'TRAINER-2', mode: 'Recorded', audience: 'trainer' },
    { id: 'crs_tr3', title: 'trainer-3', mode: 'Hybrid', audience: 'trainer' }
  ];

  const allBatches = [
    {
      id: 'btc_1',
      name: 'batch-1',
      courseId: 'crs_1',
      courseName: 'student course 1',
      trainerId: 'trn_donisha',
      trainerName: 'Donisha'
    },
    {
      id: 'btc_2',
      name: 'batch-2',
      courseId: 'crs_2',
      courseName: 'student course-2',
      trainerId: 'trn_other',
      trainerName: 'Other Trainer'
    }
  ];

  const allSchedules = [
    {
      id: 'sch_1',
      title: 'Session 1',
      course: 'student course 1',
      courseId: 'crs_1',
      batch: 'batch-1',
      batchId: 'btc_1',
      trainerId: 'trn_donisha',
      date: '2026-10-16',
      time: '10:00 AM - 11:00 AM',
      audience: 'STUDENT'
    }
  ];

  it('filters courses to ONLY taught student Online/Hybrid courses and excludes trainer-audience courses', () => {
    const taughtCourses = allCourses.filter(c => {
      const mode = (c.mode || '').toLowerCase().trim();
      if (mode !== 'online' && mode !== 'hybrid') return false;

      const audience = (c.audience || 'student').toLowerCase().trim();
      if (audience !== 'student') return false;

      const hasTaughtBatch = allBatches.some(b => {
        const matchesCourse = b.courseId === c.id || b.courseName === c.title;
        return matchesCourse && (b.trainerId === trainer.id || b.trainerName === trainer.name);
      });

      const hasTaughtSchedule = allSchedules.some(s => {
        const matchesCourse = s.courseId === c.id || s.course === c.title;
        return matchesCourse && s.trainerId === trainer.id;
      });

      return hasTaughtBatch || hasTaughtSchedule;
    });

    // Should include 'student course 1' (Hybrid, student, taught by Donisha)
    expect(taughtCourses.map(c => c.title)).toContain('student course 1');

    // Should NOT include 'student course-2' (taught by other trainer)
    expect(taughtCourses.map(c => c.title)).not.toContain('student course-2');

    // Should NOT include 'stduent course-3' (Recorded)
    expect(taughtCourses.map(c => c.title)).not.toContain('stduent course-3');

    // Should NEVER include trainer-audience courses
    expect(taughtCourses.map(c => c.title)).not.toContain('TRAINER-1');
    expect(taughtCourses.map(c => c.title)).not.toContain('TRAINER-2');
    expect(taughtCourses.map(c => c.title)).not.toContain('trainer-3');
  });

  it('filters batches to only those of the selected course taught by this trainer', () => {
    const selectedCourseTitle = 'student course 1';
    const taughtBatches = allBatches.filter(b => {
      const matchesCourse = b.courseName === selectedCourseTitle;
      return matchesCourse && (b.trainerId === trainer.id || b.trainerName === trainer.name);
    });

    expect(taughtBatches).toHaveLength(1);
    expect(taughtBatches[0].name).toBe('batch-1');
  });

  it('evaluates 60-minute correction window correctly after session end', () => {
    const sessionEndMs = new Date('2026-10-16T11:00:00+05:30').getTime();
    const windowMinutes = 60;
    const windowEndMs = sessionEndMs + (windowMinutes * 60 * 1000);

    // 10:30 AM (Session is live) -> correction window is not open (session not finished)
    const liveTimeMs = new Date('2026-10-16T10:30:00+05:30').getTime();
    const isLive = liveTimeMs >= new Date('2026-10-16T10:00:00+05:30').getTime() && liveTimeMs <= sessionEndMs;
    expect(isLive).toBe(true);

    // 11:25 AM (25 minutes after end) -> correction window is OPEN
    const after25mMs = new Date('2026-10-16T11:25:00+05:30').getTime();
    const isOpenAt25m = after25mMs > sessionEndMs && after25mMs <= windowEndMs;
    expect(isOpenAt25m).toBe(true);
    const minutesRemainingAt25 = Math.ceil((windowEndMs - after25mMs) / 60000);
    expect(minutesRemainingAt25).toBe(35);

    // 12:05 PM (65 minutes after end) -> correction window is CLOSED (read-only)
    const after65mMs = new Date('2026-10-16T12:05:00+05:30').getTime();
    const isOpenAt65m = after65mMs > sessionEndMs && after65mMs <= windowEndMs;
    expect(isOpenAt65m).toBe(false);
  });
});
