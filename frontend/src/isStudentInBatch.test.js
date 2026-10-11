import { describe, it, expect } from 'vitest';
import { isStudentInBatch } from './components/admin/ManageStudentsPage';

describe('isStudentInBatch — Batch ID Isolation Unit Tests', () => {
  const batch1 = {
    id: 'btc_001',
    name: 'Morning Batch',
    courseId: 'crs_100',
    courseName: 'English Communication'
  };

  const batch2 = {
    id: 'btc_002',
    name: 'Morning Batch', // identical batch name!
    courseId: 'crs_200',  // different course
    courseName: 'Advanced Grammar'
  };

  const batch3 = {
    id: 'btc_003',
    name: 'Evening Batch',
    courseId: 'crs_100',  // same course as batch1, but different batch
    courseName: 'English Communication'
  };

  it('returns true when student is enrolled in the exact batch by batchId', () => {
    const student = {
      id: 'std_01',
      name: 'Alice',
      courseBatches: [
        {
          course: 'English Communication',
          courseId: 'crs_100',
          batch: 'Morning Batch',
          batchId: 'btc_001'
        }
      ]
    };

    expect(isStudentInBatch(student, batch1)).toBe(true);
  });

  it('returns false when student is in a different batch, even if batch names are identical across courses', () => {
    const student = {
      id: 'std_01',
      name: 'Alice',
      courseBatches: [
        {
          course: 'English Communication',
          courseId: 'crs_100',
          batch: 'Morning Batch',
          batchId: 'btc_001'
        }
      ]
    };

    // batch2 also named "Morning Batch" but has id "btc_002"
    expect(isStudentInBatch(student, batch2)).toBe(false);
  });

  it('returns false for another batch within the SAME course (never bleeds across batches of the same course)', () => {
    const student = {
      id: 'std_01',
      name: 'Alice',
      courseBatches: [
        {
          course: 'English Communication',
          courseId: 'crs_100',
          batch: 'Morning Batch',
          batchId: 'btc_001'
        }
      ]
    };

    // batch3 is in the same course 'English Communication' but has id "btc_003"
    expect(isStudentInBatch(student, batch3)).toBe(false);
  });

  it('handles multi-batch enrollments correctly', () => {
    const student = {
      id: 'std_02',
      name: 'Bob',
      courseBatches: [
        {
          course: 'English Communication',
          courseId: 'crs_100',
          batch: 'Morning Batch',
          batchId: 'btc_001'
        },
        {
          course: 'Advanced Grammar',
          courseId: 'crs_200',
          batch: 'Morning Batch',
          batchId: 'btc_002'
        }
      ]
    };

    expect(isStudentInBatch(student, batch1)).toBe(true);
    expect(isStudentInBatch(student, batch2)).toBe(true);
    expect(isStudentInBatch(student, batch3)).toBe(false);
  });

  it('does NOT fall back to string includes on student.course', () => {
    const student = {
      id: 'std_03',
      name: 'Charlie',
      course: 'English Communication (Morning Batch)', // legacy string only, no courseBatches
    };

    // Without courseBatches containing batchId, strictly returns false (no string includes false positive)
    expect(isStudentInBatch(student, batch1)).toBe(false);
  });

  it('returns false safely for invalid/empty inputs', () => {
    expect(isStudentInBatch(null, batch1)).toBe(false);
    expect(isStudentInBatch({}, batch1)).toBe(false);
    expect(isStudentInBatch({ courseBatches: [] }, batch1)).toBe(false);
    expect(isStudentInBatch({ courseBatches: [{ batch: 'Morning Batch' }] }, batch1)).toBe(false); // missing batchId
    expect(isStudentInBatch({ courseBatches: [{ batchId: 'btc_001' }] }, null)).toBe(false);
    expect(isStudentInBatch({ courseBatches: [{ batchId: 'btc_001' }] }, {})).toBe(false);
  });
});
