package com.zoroacademy;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.TrainerCourseRequest;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.TrainerCourseRequestRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.ActivityLogService;
import com.zoroacademy.service.NotificationService;
import com.zoroacademy.service.TrainerCourseRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TrainerCourseRequestFlowTest {

    private TrainerCourseRequestRepository requestRepository;
    private CourseRepository courseRepository;
    private UserRepository userRepository;
    private ActivityLogService activityLogService;
    private NotificationService notificationService;
    private TrainerCourseRequestService requestService;

    private User trainer;
    private Course course;

    @BeforeEach
    void setUp() {
        requestRepository = mock(TrainerCourseRequestRepository.class);
        courseRepository = mock(CourseRepository.class);
        userRepository = mock(UserRepository.class);
        activityLogService = mock(ActivityLogService.class);
        notificationService = mock(NotificationService.class);

        requestService = new TrainerCourseRequestService(
                requestRepository,
                courseRepository,
                userRepository,
                notificationService,
                activityLogService
        );

        trainer = new User();
        trainer.setId("tr_123");
        trainer.setName("Trainer Bob");
        trainer.setEmail("bob@zoro.com");
        trainer.setRole("TRAINER");

        course = new Course();
        course.setId("c_english");
        course.setTitle("Advanced English Mastery");
        course.setAudience("trainer");

        when(userRepository.findById("tr_123")).thenReturn(Optional.of(trainer));
        when(userRepository.findByEmailIgnoreCase("bob@zoro.com")).thenReturn(Optional.of(trainer));
        when(courseRepository.findById("c_english")).thenReturn(Optional.of(course));
        when(requestRepository.save(any(TrainerCourseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Approve -> Reject -> Request again works properly without false conflict")
    void testApproveRejectRequestAgainFlow() {
        // Step 1: Initial request creates a Pending request
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Approved"))
                .thenReturn(Optional.empty());
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Pending"))
                .thenReturn(Optional.empty());
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Rejected"))
                .thenReturn(Optional.empty());

        TrainerCourseRequest initialReq = TrainerCourseRequest.builder()
                .trainerId("tr_123")
                .courseId("c_english")
                .courseTitle("Advanced English Mastery")
                .build();

        TrainerCourseRequest created = requestService.createRequest(initialReq);
        assertNotNull(created);
        assertEquals("Pending", created.getStatus());

        // Step 2: Admin approves request -> assigns trainer to course
        when(requestRepository.findById(created.getId())).thenReturn(Optional.of(created));
        TrainerCourseRequest approved = requestService.updateStatus(created.getId(), "Approved");
        assertEquals("Approved", approved.getStatus());
        assertEquals("tr_123", course.getTrainerId());
        assertEquals("Trainer Bob", course.getAssignedTrainer());

        // Step 3: Admin later rejects request -> revokes access, clears trainer from course
        TrainerCourseRequest rejected = requestService.updateStatus(created.getId(), "Rejected");
        assertEquals("Rejected", rejected.getStatus());
        assertNull(course.getTrainerId(), "Trainer ID must be cleared upon rejection");
        assertNull(course.getAssignedTrainer(), "Assigned trainer name must be cleared upon rejection");

        // Step 4: Trainer requests again -> should succeed and set status back to Pending
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Approved"))
                .thenReturn(Optional.empty());
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Pending"))
                .thenReturn(Optional.empty());
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Rejected"))
                .thenReturn(Optional.of(rejected));

        TrainerCourseRequest reqAgain = requestService.createRequest(initialReq);
        assertNotNull(reqAgain);
        assertEquals("Pending", reqAgain.getStatus(), "Requesting again after rejection must update status to Pending");
        verify(activityLogService, atLeastOnce()).logAction(eq("tr_123"), any(), eq("TRAINER_COURSE_REQUEST"), contains("Trainer requested access again"), any());
    }

    @Test
    @DisplayName("Approved + request again -> throws clear conflict message")
    void testApprovedRequestAgainThrowsConflict() {
        TrainerCourseRequest approvedReq = TrainerCourseRequest.builder()
                .id("tcr_1")
                .trainerId("tr_123")
                .courseId("c_english")
                .status("Approved")
                .build();

        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Approved"))
                .thenReturn(Optional.of(approvedReq));

        TrainerCourseRequest incoming = TrainerCourseRequest.builder()
                .trainerId("tr_123")
                .courseId("c_english")
                .build();

        ConflictException ex = assertThrows(ConflictException.class, () -> requestService.createRequest(incoming));
        assertTrue(ex.getMessage().contains("already have approved access"), "Should explain that access is already approved");
    }

    @Test
    @DisplayName("Pending + request again -> throws clear conflict message")
    void testPendingRequestAgainThrowsConflict() {
        TrainerCourseRequest pendingReq = TrainerCourseRequest.builder()
                .id("tcr_2")
                .trainerId("tr_123")
                .courseId("c_english")
                .status("Pending")
                .build();

        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Approved"))
                .thenReturn(Optional.empty());
        when(requestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("tr_123", "c_english", "Pending"))
                .thenReturn(Optional.of(pendingReq));

        TrainerCourseRequest incoming = TrainerCourseRequest.builder()
                .trainerId("tr_123")
                .courseId("c_english")
                .build();

        ConflictException ex = assertThrows(ConflictException.class, () -> requestService.createRequest(incoming));
        assertTrue(ex.getMessage().contains("already pending approval"), "Should explain that request is already pending approval");
    }
}
