package com.zoroacademy;

import com.zoroacademy.dto.VideoPlaybackResponse;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.service.BunnyStreamService;
import com.zoroacademy.service.BunnyTokenService;
import com.zoroacademy.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TrainerLmsSequentialLockTest {

    private CourseRepository courseRepository;
    private CourseModuleRepository moduleRepository;
    private CourseResourceRepository resourceRepository;
    private UserRepository userRepository;
    private BatchRepository batchRepository;
    private EnrollmentRepository enrollmentRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private StudentFeeRepository studentFeeRepository;
    private ScheduleRepository scheduleRepository;
    private AssignmentRepository assignmentRepository;
    private DoubtRepository doubtRepository;
    private BunnyStreamService bunnyStreamService;
    private VideoRepository videoRepository;
    private StudentProgressRepository studentProgressRepository;
    private StudentModuleProgressRepository studentModuleProgressRepository;
    private AssignmentSubmissionRepository submissionRepository;
    private TrainerCourseRequestRepository trainerCourseRequestRepository;
    private BunnyTokenService tokenService;
    private BunnyStreamProperties streamProperties;

    private CourseService courseService;

    private User trainerUser;
    private Course trainerCourse;
    private CourseModule module1;
    private CourseModule module2;

    @BeforeEach
    void setUp() {
        courseRepository = mock(CourseRepository.class);
        moduleRepository = mock(CourseModuleRepository.class);
        resourceRepository = mock(CourseResourceRepository.class);
        userRepository = mock(UserRepository.class);
        batchRepository = mock(BatchRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        doubtRepository = mock(DoubtRepository.class);
        videoRepository = mock(VideoRepository.class);
        studentProgressRepository = mock(StudentProgressRepository.class);
        studentModuleProgressRepository = mock(StudentModuleProgressRepository.class);
        submissionRepository = mock(AssignmentSubmissionRepository.class);
        trainerCourseRequestRepository = mock(TrainerCourseRequestRepository.class);
        tokenService = mock(BunnyTokenService.class);
        streamProperties = new BunnyStreamProperties();
        streamProperties.setCdnHost("test.b-cdn.net");
        streamProperties.setLibraryId("12345");
        streamProperties.setTokenExpirationSeconds(3600);

        when(tokenService.generateToken(anyString(), anyLong(), any())).thenReturn("mock-stream-token");
        when(tokenService.generateEmbedToken(anyString(), anyLong())).thenReturn("mock-embed-token");

        bunnyStreamService = new BunnyStreamService(
                streamProperties,
                tokenService,
                videoRepository,
                enrollmentRepository,
                moduleRepository,
                submissionRepository,
                studentModuleProgressRepository,
                studentProgressRepository
        );

        // Inject CourseRepository, TrainerCourseRequestRepository, and UserRepository into bunnyStreamService via reflection
        try {
            var crField = BunnyStreamService.class.getDeclaredField("courseRepository");
            crField.setAccessible(true);
            crField.set(bunnyStreamService, courseRepository);

            var trField = BunnyStreamService.class.getDeclaredField("trainerCourseRequestRepository");
            trField.setAccessible(true);
            trField.set(bunnyStreamService, trainerCourseRequestRepository);

            var urField = BunnyStreamService.class.getDeclaredField("userRepository");
            urField.setAccessible(true);
            urField.set(bunnyStreamService, userRepository);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        courseService = new CourseService(
                courseRepository,
                moduleRepository,
                resourceRepository,
                userRepository,
                batchRepository,
                enrollmentRepository,
                studentCourseBatchRepository,
                studentFeeRepository,
                scheduleRepository,
                assignmentRepository,
                doubtRepository,
                bunnyStreamService,
                null,
                videoRepository,
                studentProgressRepository,
                studentModuleProgressRepository,
                submissionRepository
        );

        trainerUser = new User();
        trainerUser.setId("trn_123");
        trainerUser.setEmail("trainer1@zoro.com");
        trainerUser.setRole("TRAINER");

        when(userRepository.findById("trn_123")).thenReturn(Optional.of(trainerUser));
        when(userRepository.findByEmailIgnoreCase("trainer1@zoro.com")).thenReturn(Optional.of(trainerUser));

        trainerCourse = new Course();
        trainerCourse.setId("course_tr_1");
        trainerCourse.setTitle("Advanced Pedagogy for Trainers");
        trainerCourse.setAudience("Trainer");
        trainerCourse.setMode("Recorded");

        module1 = new CourseModule();
        module1.setId("mod_1");
        module1.setModuleOrder(1);
        module1.setTitle("Module 1 - Intro");
        module1.setDuration("10:00");
        module1.setVideoStorageRef("{\"videoId\":\"vid-1\"}");
        module1.setAssignmentFileName("mod1-assignment.pdf");
        module1.setAssignmentFileUrl("https://storage/mod1-assignment.pdf");
        module1.setNotesFileUrl("https://storage/mod1-notes.pdf");
        module1.setCourse(trainerCourse);

        module2 = new CourseModule();
        module2.setId("mod_2");
        module2.setModuleOrder(2);
        module2.setTitle("Module 2 - Deep Dive");
        module2.setDuration("15:00");
        module2.setVideoStorageRef("{\"videoId\":\"vid-2\"}");
        module2.setAssignmentFileName("mod2-assignment.pdf");
        module2.setAssignmentFileUrl("https://storage/mod2-assignment.pdf");
        module2.setNotesFileUrl("https://storage/mod2-notes.pdf");
        module2.setCourse(trainerCourse);

        trainerCourse.setModules(new ArrayList<>(List.of(module1, module2)));

        when(courseRepository.findById("course_tr_1")).thenReturn(Optional.of(trainerCourse));
        when(moduleRepository.findByCourseIdOrderByModuleOrderAsc("course_tr_1")).thenReturn(List.of(module1, module2));
        when(moduleRepository.findById("mod_1")).thenReturn(Optional.of(module1));
        when(moduleRepository.findById("mod_2")).thenReturn(Optional.of(module2));

        // Trainer course request approved
        TrainerCourseRequest req = new TrainerCourseRequest();
        req.setCourseId("course_tr_1");
        req.setTrainerId("trn_123");
        req.setStatus("Approved");
        when(trainerCourseRequestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("trn_123", "course_tr_1", "Approved"))
                .thenReturn(Optional.of(req));
    }

    @Test
    @DisplayName("1. Module 1 is unlocked by default, Module 2 is locked when Module 1 not completed")
    void testModule2LockedByDefault() {
        Course result = courseService.getCourseForStudent("course_tr_1", "trn_123", "trainer1@zoro.com");

        assertNotNull(result);
        assertEquals(2, result.getModules().size());

        CourseModule resMod1 = result.getModules().get(0);
        CourseModule resMod2 = result.getModules().get(1);

        assertFalse(resMod1.getLocked(), "Module 1 must be unlocked");
        assertNotNull(resMod1.getNotesFileUrl(), "Unlocked module must have file URLs");
        assertNotNull(resMod1.getVideoStorageRef(), "Unlocked module must have videoStorageRef");

        assertTrue(resMod2.getLocked(), "Module 2 must be locked initially");
        assertNull(resMod2.getNotesFileUrl(), "Locked module must never leak notes file URL");
        assertNull(resMod2.getAssignmentFileUrl(), "Locked module must never leak assignment file URL");
        assertNull(resMod2.getVideoStorageRef(), "Locked module must never leak videoStorageRef");
    }

    @Test
    @DisplayName("2. Module 2 remains locked when Module 1 video is watched >= 95% but assignment is NOT submitted")
    void testModule2RemainsLockedWhenAssignmentMissing() {
        StudentModuleProgress smp = StudentModuleProgress.builder()
                .studentId("trn_123")
                .moduleId("mod_1")
                .courseId("course_tr_1")
                .watchedSeconds(600)
                .durationSeconds(600)
                .videoCompleted(true)
                .completed(false)
                .build();

        when(studentModuleProgressRepository.findByStudentIdAndModuleId("trn_123", "mod_1"))
                .thenReturn(Optional.of(smp));
        when(submissionRepository.findBySourceTypeAndSourceIdAndStudentId("module", "mod_1", "trn_123"))
                .thenReturn(Collections.emptyList());

        Course result = courseService.getCourseForStudent("course_tr_1", "trn_123", "trainer1@zoro.com");

        assertTrue(result.getModules().get(1).getLocked(), "Module 2 must remain locked until assignment is submitted");
    }

    @Test
    @DisplayName("3. Module 2 unlocks when Module 1 video is watched >= 95% AND assignment is submitted by trainer")
    void testModule2UnlocksWhenVideoAndAssignmentCompleted() {
        StudentModuleProgress smp = StudentModuleProgress.builder()
                .studentId("trn_123")
                .moduleId("mod_1")
                .courseId("course_tr_1")
                .watchedSeconds(580)
                .durationSeconds(600)
                .videoCompleted(true)
                .completed(false)
                .build();

        when(studentModuleProgressRepository.findByStudentIdAndModuleId("trn_123", "mod_1"))
                .thenReturn(Optional.of(smp));

        AssignmentSubmission sub = AssignmentSubmission.builder()
                .id("sub_1")
                .studentId("trn_123")
                .studentEmail("trainer1@zoro.com")
                .sourceType("module")
                .sourceId("mod_1")
                .submitterRole("TRAINER")
                .reviewer("ADMIN")
                .build();

        when(submissionRepository.findBySourceTypeAndSourceIdAndStudentId("module", "mod_1", "trn_123"))
                .thenReturn(List.of(sub));

        Course result = courseService.getCourseForStudent("course_tr_1", "trn_123", "trainer1@zoro.com");

        assertFalse(result.getModules().get(1).getLocked(), "Module 2 must unlock after video watched and assignment submitted");
        assertNotNull(result.getModules().get(1).getVideoStorageRef(), "Unlocked Module 2 must have videoStorageRef");
    }

    @Test
    @DisplayName("4. Playback authorization denies locked Module 2 and authorizes unlocked Module 1 for trainer learner")
    void testPlaybackAuthorizationForTrainerLearner() {
        // Module 1 is unlocked -> authorized
        VideoPlaybackResponse resp1 = bunnyStreamService.getPlaybackAuthorization(
                "mod_1", "course_tr_1", "trn_123", "trainer1@zoro.com", "TRAINER", "127.0.0.1"
        );
        assertTrue(resp1.isAuthorized(), "Trainer must be authorized for unlocked Module 1");
        assertNotNull(resp1.getEmbedUrl(), "Authorized response must include embedUrl");
        assertNotNull(resp1.getToken(), "Authorized response must include token");

        // Module 2 is locked (no completion for module 1) -> denied
        VideoPlaybackResponse resp2 = bunnyStreamService.getPlaybackAuthorization(
                "mod_2", "course_tr_1", "trn_123", "trainer1@zoro.com", "TRAINER", "127.0.0.1"
        );
        assertFalse(resp2.isAuthorized(), "Trainer must be denied playback for locked Module 2");
        assertTrue(resp2.getMessage().contains("Complete previous module assignment to unlock"));
    }
}
