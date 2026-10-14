package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.DoubtController;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.DoubtService;
import com.zoroacademy.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DoubtWorkflowIntegrationTest {

    private DoubtRepository doubtRepository;
    private UserRepository userRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private NotificationRepository notificationRepository;
    private NotificationService notificationService;
    private DoubtService doubtService;
    private DoubtController doubtController;

    private User student;
    private User trainerDon;
    private User trainerAbi;
    private User adminUser;

    @BeforeEach
    void setUp() {
        doubtRepository = mock(DoubtRepository.class);
        userRepository = mock(UserRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        notificationRepository = mock(NotificationRepository.class);

        notificationService = new NotificationService(notificationRepository);
        doubtService = new DoubtService(
                doubtRepository,
                userRepository,
                courseRepository,
                batchRepository,
                studentCourseBatchRepository,
                notificationService
        );
        doubtController = new DoubtController(doubtService);

        student = User.builder().id("std_1").name("Jain Student").email("jain@example.com").role("STUDENT").build();
        trainerDon = User.builder().id("trn_don").name("Don Trainer").email("don@example.com").role("TRAINER").build();
        trainerAbi = User.builder().id("trn_abi").name("Abi Trainer").email("abi@example.com").role("TRAINER").build();
        adminUser = User.builder().id("adm_1").name("Admin User").email("admin@example.com").role("ADMIN").build();

        when(userRepository.findById("std_1")).thenReturn(Optional.of(student));
        when(userRepository.findById("trn_don")).thenReturn(Optional.of(trainerDon));
        when(userRepository.findById("trn_abi")).thenReturn(Optional.of(trainerAbi));
        when(userRepository.findById("adm_1")).thenReturn(Optional.of(adminUser));

        when(doubtRepository.save(any(Doubt.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Case 1: Recorded course with assigned trainer routes to course trainer & admin")
    void testRecordedCourseWithTrainer() {
        Course recordedCourse = Course.builder()
                .id("crs_rec")
                .title("Recorded Python")
                .mode("Recorded")
                .assignedTrainer("Don Trainer")
                .build();
        recordedCourse.setTrainerId("trn_don");
        when(courseRepository.findById("crs_rec")).thenReturn(Optional.of(recordedCourse));

        Doubt doubt = Doubt.builder()
                .studentId("std_1")
                .courseId("crs_rec")
                .question("How does list comprehension work?")
                .build();

        Doubt saved = doubtService.createDoubt(doubt);

        assertEquals("crs_rec", saved.getCourseId());
        assertEquals("Recorded", saved.getCourseMode());
        assertEquals("trn_don", saved.getTrainerId());
        assertEquals("Don Trainer", saved.getTrainerName());

        // Notifications: 1 for ADMIN, 1 for TRAINER
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(2)).save(captor.capture());
        List<Notification> notifs = captor.getAllValues();
        assertTrue(notifs.stream().anyMatch(n -> "ADMIN".equalsIgnoreCase(n.getRecipientRole())));
        assertTrue(notifs.stream().anyMatch(n -> "TRAINER".equalsIgnoreCase(n.getRecipientRole()) && "trn_don".equals(n.getRecipientId())));
    }

    @Test
    @DisplayName("Case 1b: Recorded course throws exception if invalid trainer is selected")
    void testRecordedCourseMismatchTrainerFails() {
        Course recordedCourse = Course.builder()
                .id("crs_rec")
                .title("Recorded Python")
                .mode("Recorded")
                .assignedTrainer("Don Trainer")
                .build();
        recordedCourse.setTrainerId("trn_don");
        when(courseRepository.findById("crs_rec")).thenReturn(Optional.of(recordedCourse));

        Doubt doubt = Doubt.builder()
                .studentId("std_1")
                .courseId("crs_rec")
                .trainerId("trn_abi") // Abi is not the course trainer
                .question("Mismatched trainer doubt")
                .build();

        assertThrows(IllegalArgumentException.class, () -> doubtService.createDoubt(doubt));
    }

    @Test
    @DisplayName("Case 2: Recorded course without assigned trainer routes to Admin only")
    void testRecordedCourseWithoutTrainer() {
        Course recordedCourse = Course.builder()
                .id("crs_rec_notrainer")
                .title("Self Paced Java")
                .mode("Recorded")
                .assignedTrainer(null)
                .build();
        recordedCourse.setTrainerId(null);
        when(courseRepository.findById("crs_rec_notrainer")).thenReturn(Optional.of(recordedCourse));

        Doubt doubt = Doubt.builder()
                .studentId("std_1")
                .courseId("crs_rec_notrainer")
                .question("Java memory model doubt")
                .build();

        Doubt saved = doubtService.createDoubt(doubt);

        assertEquals("Recorded", saved.getCourseMode());
        assertNull(saved.getTrainerId());
        assertEquals("Admin", saved.getTrainerName());

        // Notifications: Only ADMIN notification created
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());
        Notification notif = captor.getValue();
        assertEquals("ADMIN", notif.getRecipientRole());
    }

    @Test
    @DisplayName("Case 3: Online course validates batch membership and selected batch trainer")
    void testOnlineCourseWithValidBatchTrainer() {
        Course onlineCourse = Course.builder()
                .id("crs_online")
                .title("Live Phonics")
                .mode("Online")
                .build();
        when(courseRepository.findById("crs_online")).thenReturn(Optional.of(onlineCourse));

        Batch batch = Batch.builder()
                .id("btc_1")
                .name("Batch Morning")
                .courseId("crs_online")
                .build();
        batch.setTrainerIds(new HashSet<>(Set.of("trn_don", "trn_abi")));
        when(batchRepository.findById("btc_1")).thenReturn(Optional.of(batch));

        StudentCourseBatch scb = StudentCourseBatch.builder()
                .studentId("std_1")
                .courseId("crs_online")
                .batchId("btc_1")
                .build();
        when(studentCourseBatchRepository.findByStudentIdAndCourseId("std_1", "crs_online"))
                .thenReturn(Optional.of(scb));

        // Doubt choosing trainer Don from the batch
        Doubt doubt = Doubt.builder()
                .studentId("std_1")
                .courseId("crs_online")
                .trainerId("trn_don")
                .question("Pronunciation question on vowel sounds")
                .build();

        Doubt saved = doubtService.createDoubt(doubt);

        assertEquals("Online", saved.getCourseMode());
        assertEquals("btc_1", saved.getBatchId());
        assertEquals("trn_don", saved.getTrainerId());
        assertEquals("Don Trainer", saved.getTrainerName());

        // Dual notification: Admin and Trainer Don
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(2)).save(captor.capture());
        List<Notification> notifs = captor.getAllValues();
        assertTrue(notifs.stream().anyMatch(n -> "ADMIN".equalsIgnoreCase(n.getRecipientRole())));
        assertTrue(notifs.stream().anyMatch(n -> "TRAINER".equalsIgnoreCase(n.getRecipientRole()) && "trn_don".equals(n.getRecipientId())));
    }

    @Test
    @DisplayName("Case 3b: Online course rejects trainer who is not assigned to the batch")
    void testOnlineCourseRejectsInvalidTrainer() {
        Course onlineCourse = Course.builder()
                .id("crs_online")
                .title("Live Phonics")
                .mode("Online")
                .build();
        when(courseRepository.findById("crs_online")).thenReturn(Optional.of(onlineCourse));

        Batch batch = Batch.builder()
                .id("btc_1")
                .name("Batch Morning")
                .courseId("crs_online")
                .build();
        batch.setTrainerIds(new HashSet<>(Set.of("trn_don"))); // Only Don is in this batch
        when(batchRepository.findById("btc_1")).thenReturn(Optional.of(batch));

        StudentCourseBatch scb = StudentCourseBatch.builder()
                .studentId("std_1")
                .courseId("crs_online")
                .batchId("btc_1")
                .build();
        when(studentCourseBatchRepository.findByStudentIdAndCourseId("std_1", "crs_online"))
                .thenReturn(Optional.of(scb));

        // Student tries to select Abi who is NOT in this batch
        Doubt doubt = Doubt.builder()
                .studentId("std_1")
                .courseId("crs_online")
                .trainerId("trn_abi")
                .question("Question for Abi")
                .build();

        assertThrows(IllegalArgumentException.class, () -> doubtService.createDoubt(doubt));
    }

    @Test
    @DisplayName("Replying to a doubt updates record and notifies student")
    void testReplyToDoubt() {
        Doubt existing = Doubt.builder()
                .id("dbt_100")
                .studentId("std_1")
                .courseId("crs_online")
                .courseTitle("Live Phonics")
                .trainerId("trn_don")
                .trainerName("Don Trainer")
                .question("Vowel question")
                .status("Pending")
                .build();
        when(doubtRepository.findById("dbt_100")).thenReturn(Optional.of(existing));

        Doubt replied = doubtService.replyToDoubt("dbt_100", "Here is the explanation for vowels.", "Don Trainer");

        assertEquals("Resolved", replied.getStatus());
        assertEquals("Here is the explanation for vowels.", replied.getReply());
        assertNotNull(replied.getReplyDate());

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notif = captor.getValue();
        assertEquals("std_1", notif.getRecipientId());
        assertEquals("STUDENT", notif.getRecipientRole());
        assertEquals("Doubt Answered", notif.getTitle());
    }

    @Test
    @DisplayName("RBAC: Trainer only sees doubts assigned to them; Admin sees all")
    void testRbacFiltering() {
        Doubt d1 = Doubt.builder().id("d1").trainerId("trn_don").trainerName("Don Trainer").build();
        Doubt d2 = Doubt.builder().id("d2").trainerId("trn_abi").trainerName("Abi Trainer").build();

        when(doubtRepository.findByTrainerIdOrTrainerNameIgnoreCase("trn_don", "Don Trainer"))
                .thenReturn(List.of(d1));
        when(doubtRepository.findAll()).thenReturn(List.of(d1, d2));

        UserPrincipal trainerPrincipal = UserPrincipal.create(trainerDon);
        ApiResponse<List<Doubt>> trainerResp = doubtController.getDoubts(trainerPrincipal);
        assertEquals(1, trainerResp.getData().size());
        assertEquals("d1", trainerResp.getData().get(0).getId());

        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);
        ApiResponse<List<Doubt>> adminResp = doubtController.getDoubts(adminPrincipal);
        assertEquals(2, adminResp.getData().size());
    }
}
