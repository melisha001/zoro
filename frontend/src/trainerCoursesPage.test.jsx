import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainerCoursesPage from './components/trainer/TrainerCoursesPage';
import * as courseApi from './api/courseApi';
import * as authContext from './context/AuthContext';

vi.mock('./context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('./api/courseApi', () => ({
  getMyTrainerCourses: vi.fn(),
  createTrainerCourseRequest: vi.fn()
}));

describe('TrainerCoursesPage (Phase 5)', () => {
  const mockUser = {
    id: 'tr_123',
    name: 'Don Trainer',
    email: 'don@zoroacademy.com',
    role: 'TRAINER'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authContext.useAuth.mockReturnValue({ user: mockUser });
  });

  it('renders "You are not enrolled in any course yet" when enrolled list is empty', async () => {
    courseApi.getMyTrainerCourses.mockResolvedValue({
      success: true,
      data: {
        enrolled: [],
        pending: [],
        available: [
          { id: 'c1', title: 'Vedic Math Masterclass', description: 'Advanced trainer course', modules: [] }
        ]
      }
    });

    render(<TrainerCoursesPage />);

    await waitFor(() => {
      expect(screen.getByText('You are not enrolled in any course yet')).toBeDefined();
    });

    expect(screen.getByText('Explore Available Courses')).toBeDefined();
    expect(screen.getByText('Enrolled / Active (0)')).toBeDefined();
    expect(screen.getByText('Available Courses (1)')).toBeDefined();
  });

  it('switches to Available tab and displays pending and available courses properly', async () => {
    courseApi.getMyTrainerCourses.mockResolvedValue({
      success: true,
      data: {
        enrolled: [],
        pending: [
          { id: 'c_pending', title: 'Abacus Pedagogy', description: 'Pedagogy training', modules: [] }
        ],
        available: [
          { id: 'c_avail', title: 'Rubiks Cube Coaching', description: 'Speedcubing method', modules: [] }
        ]
      }
    });

    render(<TrainerCoursesPage />);

    await waitFor(() => {
      expect(screen.getByText('You are not enrolled in any course yet')).toBeDefined();
    });

    // Click "Explore Available Courses"
    fireEvent.click(screen.getByText('Explore Available Courses'));

    // Both courses should be visible in Available tab
    expect(screen.getByText('Abacus Pedagogy')).toBeDefined();
    expect(screen.getByText('Rubiks Cube Coaching')).toBeDefined();

    // Pending course has "Pending Approval" disabled button
    const pendingButton = screen.getByRole('button', { name: /Pending Approval/i });
    expect(pendingButton).toBeDefined();
    expect(pendingButton.hasAttribute('disabled')).toBe(true);

    // Available course has "Request Access / Enquire" button
    const requestButton = screen.getByRole('button', { name: /Request Access \/ Enquire/i });
    expect(requestButton).toBeDefined();
  });

  it('calls createTrainerCourseRequest when clicking Request Access', async () => {
    courseApi.getMyTrainerCourses.mockResolvedValue({
      success: true,
      data: {
        enrolled: [],
        pending: [],
        available: [
          { id: 'c_avail', title: 'Rubiks Cube Coaching', description: 'Speedcubing method', modules: [] }
        ]
      }
    });
    courseApi.createTrainerCourseRequest.mockResolvedValue({
      success: true,
      data: { id: 'req_1', status: 'Pending' }
    });

    render(<TrainerCoursesPage />);

    await waitFor(() => {
      expect(screen.getByText('Enrolled / Active (0)')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Available Courses (1)'));

    const requestButton = screen.getByRole('button', { name: /Request Access \/ Enquire/i });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(courseApi.createTrainerCourseRequest).toHaveBeenCalledWith({
        trainerId: 'tr_123',
        trainerName: 'Don Trainer',
        trainerEmail: 'don@zoroacademy.com',
        courseId: 'c_avail',
        courseTitle: 'Rubiks Cube Coaching'
      });
    });
  });

  it('renders enrolled courses with access badges when enrolled data is present', async () => {
    courseApi.getMyTrainerCourses.mockResolvedValue({
      success: true,
      data: {
        enrolled: [
          { id: 'c_enrolled', title: 'Certified Mental Math Coach', description: 'Certified curriculum', modules: [{ id: 'm1', title: 'Intro' }] }
        ],
        pending: [],
        available: []
      }
    });

    render(<TrainerCoursesPage />);

    await waitFor(() => {
      expect(screen.getByText('Certified Mental Math Coach')).toBeDefined();
    });

    expect(screen.getByText('Enrolled / Active Access')).toBeDefined();
    expect(screen.getByText('Go to Classroom')).toBeDefined();
  });
});
