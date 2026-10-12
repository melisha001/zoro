import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import realCourseFixture from './test/fixtures/real-course-module.json';
import { normalizeCourse, normalizeModule } from './api/courseApi';
import { getFileLink, openFileWithSignedLink } from './api/fileApi';

describe('Task 2: Course Modules Extended Files & Real Backend Fixture Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url?.url || '';
      if (urlStr.includes('/files/') && urlStr.includes('/link')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({
            success: true,
            data: {
              url: 'https://zoro-academy-files-cdn.b-cdn.net/private/notes/Test_Notes.pdf?token=mockToken&expires=999999999'
            }
          }),
          text: async () => JSON.stringify({
            success: true,
            data: {
              url: 'https://zoro-academy-files-cdn.b-cdn.net/private/notes/Test_Notes.pdf?token=mockToken&expires=999999999'
            }
          })
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
        text: async () => JSON.stringify({ success: true, data: {} })
      };
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Correctly normalizes real backend course JSON fixture', () => {
    expect(realCourseFixture.success).toBe(true);
    expect(realCourseFixture.data).toBeDefined();

    const normalizedCourse = normalizeCourse(realCourseFixture.data);
    expect(normalizedCourse).toBeDefined();
    expect(Array.isArray(normalizedCourse.modules)).toBe(true);

    const testModule = normalizedCourse.modules.find(m => m.title === 'Task 2 Test Module');
    expect(testModule).toBeDefined();

    // Verify thumbnail
    expect(testModule.thumbnailUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/public/test-thumb.jpg');
    expect(testModule.thumbnail).toBe('https://zoro-academy-files-cdn.b-cdn.net/public/test-thumb.jpg');

    // Verify notes file and name
    expect(testModule.notesFileName).toBe('Test_Notes.pdf');
    expect(testModule.notesFileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/notes/Test_Notes.pdf');
    expect(testModule.notesFile.name).toBe('Test_Notes.pdf');
    expect(testModule.notesFile.fileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/notes/Test_Notes.pdf');

    // Verify worksheet file and name
    expect(testModule.worksheetFileName).toBe('Test_Worksheet.pdf');
    expect(testModule.worksheetFileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/worksheet/Test_Worksheet.pdf');
    expect(testModule.worksheetFile.name).toBe('Test_Worksheet.pdf');
    expect(testModule.worksheetFile.fileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/worksheet/Test_Worksheet.pdf');

    // Verify assignment file and name
    expect(testModule.assignmentFileName).toBe('Test_Assignment.pdf');
    expect(testModule.assignmentFileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/assignment/Test_Assignment.pdf');
    expect(testModule.assignmentFile.name).toBe('Test_Assignment.pdf');
    expect(testModule.assignmentFile.fileUrl).toBe('https://zoro-academy-files-cdn.b-cdn.net/private/assignment/Test_Assignment.pdf');

    // Verify afterSessionAssessment
    expect(testModule.afterSessionAssessment).toBeDefined();
    expect(testModule.afterSessionAssessment.type).toBe('uploaded');
    expect(testModule.afterSessionAssessment.title).toBe('Session 1 Assessment Task');
    expect(testModule.afterSessionAssessment.file?.name).toBe('Test_Assessment.pdf');

    // Verify videoStorageRef is normalized object
    expect(typeof testModule.videoStorageRef).toBe('object');
    expect(testModule.videoStorageRef.videoId).toBe('test-vid-123');
    expect(testModule.videoStorageRef.status).toBe('ready');
  });

  it('2. getFileLink resolves signed download link without throwing', async () => {
    const fileUuid = '12345678-1234-1234-1234-123456789abc';
    const res = await getFileLink(fileUuid);
    expect(res).toBeDefined();
    expect(res.url).toContain('token=mockToken');
  });

  it('3. openFileWithSignedLink resolves signed download URL and triggers anchor click', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await openFileWithSignedLink(
      '12345678-1234-1234-1234-123456789abc',
      'Test_Notes.pdf'
    );
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
