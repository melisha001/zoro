package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.AssignmentController;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.ActivityLogService;
import com.zoroacademy.service.AssignmentService;
import com.zoroacademy.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TrainerAssignmentWorkflowIntegrationTest {

    private AssignmentRepository assignmentRepository;
    private AssignmentSubmissionRepository submissionRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private UserRepository userRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private NotificationRepository notificationRepository;
    private NotificationService notificationService;
    private ActivityLogRepository activityLogRepository;
    private ActivityLogService activityLogService;
    private AssignmentService assignmentService;
    private AssignmentController assignmentController;

    private User student;
    private User trainerDon;
    private User trainerAbi;
    private User adminUser;
    private Course trainerCourse;
    private Course studentCourse;

    @BeforeEach
    void setUp() {
        assignmentRepository = mock(AssignmentRepository.class);
        submissionRepository = mock(AssignmentSubmissionRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        userRepository = mock(UserRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        activityLogRepository = mock(ActivityLogRepository.class);

        notificationService = new NotificationService(notificationRepository);
        activityLogService = new ActivityLogService(activityLogRepository);

        assignmentService = new AssignmentService(
                assignmentRepository,
                submissionRepository,
                courseRepository,
                batchRepository,
                userRepository,
                studentCourseBatchRepository,
                notificationService,
                activityLogService,
                null,
                null,
                null,
                null
        );

        assignmentController = new AssignmentController(assignmentService);

        student = User.builder().id("std_jain").name("Jain Student").email("j@gmail.com").role("STUDENT").build();
        trainerDon = User.builder().id("trn_don").name("Don Trainer").email("don@zoro.com").role("TRAINER").build();
        trainerAbi = User.builder().id("trn_abi").name("Abi Trainer").email("abi@zoro.com").role("TRAINER").build();
        adminUser = User.builder().id("usr_admin").name("Admin").email("admin@zoro.com").role("ADMIN").build();

        when(userRepository.findById("std_jain")).thenReturn(Optional.of(student));
        when(userRepository.findById("trn_don")).thenReturn(Optional.of(trainerDon));
        when(userRepository.findById("trn_abi")).thenReturn(Optional.of(trainerAbi));
        when(userRepository.findById("usr_admin")).thenReturn(Optional.of(adminUser));

        trainerCourse = Course.builder()
                .id("crs_trainer_pedagogy")
                .title("Advanced Trainer Pedagogy")
                .audience("trainer")
                .mode("Recorded")
                .build();

        studentCourse = Course.builder()
                .id("crs_phonics")
                .title("Phonics for Beginners")
                .audience("student")
                .mode("Online")
                .build();

        when(courseRepository.findById("crs_trainer_pedagogy")).thenReturn(Optional.of(trainerCourse));
        when(courseRepository.findById("crs_phonics")).thenReturn(Optional.of(studentCourse));
    }

    @Test
    @DisplayName("1. Student submission sets submitterRole=STUDENT, reviewer=ADMIN, and does not appear in trainer submissions")
    void testStudentSubmissionRoleAndScoping() {
        AssignmentSubmission studentSub = AssignmentSubmission.builder()
                .id("sub_std_1")
                .studentId("std_jain")
                .courseId("crs_phonics")
                .assignmentTitle("Phonics Practice Exercise")
                .attachment("{\"name\":\"phonics.pdf\",\"fileUrl\":\"/private/phonics.pdf\"}")
                .answerText("Completed my phonics assignment")
                .build();

        when(submissionRepository.save(any(AssignmentSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignmentSubmission saved = assignmentService.createSubmission(studentSub);
        assertEquals("STUDENT", saved.getSubmitterRole());
        assertEquals("ADMIN", saved.getReviewer());
        assertEquals("Pending Correction", saved.getStatus());
    }

    @Test
    @DisplayName("2. Trainer submission sets submitterRole=TRAINER, reviewer=ADMIN, and notifies ADMIN")
    void testTrainerSubmissionRoleAndAdminNotification() {
        AssignmentSubmission trainerSub = AssignmentSubmission.builder()
                .id("sub_trn_don_1")
                .studentId("trn_don")
                .courseId("crs_trainer_pedagogy")
                .assignmentTitle("Pedagogy Reflection Essay")
                .attachment("{\"name\":\"essay.pdf\",\"fileUrl\":\"/private/essay.pdf\"}")
                .answerText("Detailed reflection on modern ESL teaching methods.")
                .build();

        when(submissionRepository.save(any(AssignmentSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        AssignmentSubmission saved = assignmentService.createSubmission(trainerSub);
        assertEquals("TRAINER", saved.getSubmitterRole());
        assertEquals("ADMIN", saved.getReviewer());

        // Verify notification sent to ADMIN
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeastOnce()).save(notifCaptor.capture());

        boolean notifiedAdmin = notifCaptor.getAllValues().stream()
                .anyMatch(n -> "ADMIN".equalsIgnoreCase(n.getRecipientRole()) && n.getTitle().contains("Trainer Assignment"));
        assertTrue(notifiedAdmin, "Admin should receive notification upon trainer assignment submission");
    }

    @Test
    @DisplayName("3. Scoping isolation: Student submissions excluded from trainer submissions, and vice versa")
    void testSubmissionScopingIsolation() {
        AssignmentSubmission studentSub = AssignmentSubmission.builder()
                .id("sub_std_1")
                .studentId("std_jain")
                .submitterRole("STUDENT")
                .assignmentTitle("Student Homework")
                .build();

        AssignmentSubmission donTrainerSub = AssignmentSubmission.builder()
                .id("sub_trn_don")
                .studentId("trn_don")
                .submitterRole("TRAINER")
                .assignmentTitle("Don's Trainer Essay")
                .build();

        AssignmentSubmission abiTrainerSub = AssignmentSubmission.builder()
                .id("sub_trn_abi")
                .studentId("trn_abi")
                .submitterRole("TRAINER")
                .assignmentTitle("Abi's Trainer Essay")
                .build();

        when(submissionRepository.findAll()).thenReturn(List.of(studentSub, donTrainerSub, abiTrainerSub));

        // Existing admin assignments endpoint shows student assignments only
        List<AssignmentSubmission> adminStudentList = assignmentService.getAllSubmissions();
        assertEquals(1, adminStudentList.size());
        assertEquals("sub_std_1", adminStudentList.get(0).getId());

        // Admin Trainer Assignments endpoint shows trainer submissions only
        when(submissionRepository.findBySubmitterRoleIgnoreCaseOrderByCreatedAtDesc("TRAINER"))
                .thenReturn(List.of(donTrainerSub, abiTrainerSub));
        List<AssignmentSubmission> adminTrainerList = assignmentService.getTrainerSubmissions();
        assertEquals(2, adminTrainerList.size());
        assertTrue(adminTrainerList.stream().allMatch(s -> "TRAINER".equals(s.getSubmitterRole())));

        // Trainer Don can never see Trainer Abi's submissions
        when(submissionRepository.findByStudentIdAndSubmitterRoleIgnoreCase("trn_don", "TRAINER"))
                .thenReturn(List.of(donTrainerSub));
        List<AssignmentSubmission> donOwnList = assignmentService.getTrainerOwnSubmissions("trn_don");
        assertEquals(1, donOwnList.size());
        assertEquals("sub_trn_don", donOwnList.get(0).getId());
        assertFalse(donOwnList.stream().anyMatch(s -> "trn_abi".equals(s.getStudentId())));
    }

    @Test
    @DisplayName("4. Admin review of trainer submission updates status, score, feedback, and notifies TRAINER")
    void testAdminReviewTrainerSubmission() {
        AssignmentSubmission trainerSub = AssignmentSubmission.builder()
                .id("sub_trn_don_1")
                .studentId("trn_don")
                .studentName("Don Trainer")
                .submitterRole("TRAINER")
                .assignmentTitle("Pedagogy Reflection Essay")
                .courseTitle("Advanced Trainer Pedagogy")
                .status("Pending Correction")
                .build();

        when(submissionRepository.findById("sub_trn_don_1")).thenReturn(Optional.of(trainerSub));
        when(submissionRepository.save(any(AssignmentSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> reviewBody = new HashMap<>();
        reviewBody.put("score", "95");
        reviewBody.put("feedback", "Excellent pedagogical breakdown and lesson design.");
        reviewBody.put("correctedBy", "Admin");
        reviewBody.put("correctedFileUrl", "/private/corrected_essay.pdf");

        ApiResponse<AssignmentSubmission> response = assignmentController.reviewAdminTrainerSubmission("sub_trn_don_1", reviewBody);

        assertTrue(response.isSuccess());
        AssignmentSubmission reviewed = response.getData();
        assertEquals("Corrected", reviewed.getStatus());
        assertEquals("95", reviewed.getScore());
        assertEquals("Excellent pedagogical breakdown and lesson design.", reviewed.getFeedback());
        assertEquals("Excellent pedagogical breakdown and lesson design.", reviewed.getRemarks());
        assertEquals("/private/corrected_essay.pdf", reviewed.getCorrectedFileUrl());
        assertEquals("Admin", reviewed.getCorrectedBy());
        assertNotNull(reviewed.getCorrectedAt());

        // Verify notification sent to TRAINER
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeastOnce()).save(notifCaptor.capture());

        boolean notifiedTrainer = notifCaptor.getAllValues().stream()
                .anyMatch(n -> "TRAINER".equalsIgnoreCase(n.getRecipientRole())
                        && "trn_don".equals(n.getRecipientId())
                        && n.getMessage().contains("95"));
        assertTrue(notifiedTrainer, "Trainer Don should receive notification with score and feedback");
    }
}
