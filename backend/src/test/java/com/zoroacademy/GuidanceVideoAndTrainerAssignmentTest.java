package com.zoroacademy;

import com.zoroacademy.config.BunnyStreamProperties;
import com.zoroacademy.entity.*;
import com.zoroacademy.exception.ForbiddenException;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GuidanceVideoAndTrainerAssignmentTest {

    // --- Guidance Video mocks ---
    private CompetitionRepository competitionRepository;
    private CompetitionGuidanceVideoRepository guidanceVideoRepository;
    private BunnyStreamProperties bunnyStreamProperties;
    private BunnyStreamService bunnyStreamService;
    private CompetitionService competitionService;

    // --- Assignment mocks ---
    private AssignmentRepository assignmentRepository;
    private AssignmentSubmissionRepository submissionRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private UserRepository userRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private NotificationService notificationService;
    private ActivityLogService activityLogService;
    private TrainerCourseRequestRepository trainerCourseRequestRepository;
    private AssignmentService assignmentService;

    @BeforeEach
    void setUp() {
        competitionRepository = mock(CompetitionRepository.class);
        guidanceVideoRepository = mock(CompetitionGuidanceVideoRepository.class);

        bunnyStreamProperties = new BunnyStreamProperties();
        bunnyStreamProperties.setLibraryId("lib_test_123");
        bunnyStreamProperties.setApiKey("sec_key_xyz");
        bunnyStreamProperties.setCdnHost("video.bunnycdn.com");

        bunnyStreamService = mock(BunnyStreamService.class);

        CompetitionModuleRepository moduleRepository = mock(CompetitionModuleRepository.class);
        CompetitionRegistrationRepository registrationRepository = mock(CompetitionRegistrationRepository.class);
        userRepository = mock(UserRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        CompetitionSetRepository setRepository = mock(CompetitionSetRepository.class);
        CompetitionSetMemberRepository setMemberRepository = mock(CompetitionSetMemberRepository.class);
        CompetitionSyllabusRepository syllabusRepository = mock(CompetitionSyllabusRepository.class);
        CompetitionStudyMaterialRepository studyMaterialRepository = mock(CompetitionStudyMaterialRepository.class);
        CompetitionAssessmentRepository assessmentRepository = mock(CompetitionAssessmentRepository.class);
        AssessmentQuestionRepository questionRepository = mock(AssessmentQuestionRepository.class);
        QuestionOptionRepository questionOptionRepository = mock(QuestionOptionRepository.class);
        AssessmentEvaluationCriteriaRepository evaluationCriteriaRepository = mock(AssessmentEvaluationCriteriaRepository.class);
        StoredFileRepository storedFileRepository = mock(StoredFileRepository.class);

        competitionService = new CompetitionService(
                competitionRepository,
                moduleRepository,
                registrationRepository,
                userRepository,
                fileStorageService,
                setRepository,
                setMemberRepository,
                syllabusRepository,
                guidanceVideoRepository,
                studyMaterialRepository,
                assessmentRepository,
                questionRepository,
                questionOptionRepository,
                evaluationCriteriaRepository,
                storedFileRepository
        );

        // Inject bunnyStreamService and bunnyStreamProperties into competitionService via reflection
        try {
            java.lang.reflect.Field propField = CompetitionService.class.getDeclaredField("bunnyStreamProperties");
            propField.setAccessible(true);
            propField.set(competitionService, bunnyStreamProperties);

            java.lang.reflect.Field streamField = CompetitionService.class.getDeclaredField("bunnyStreamService");
            streamField.setAccessible(true);
            streamField.set(competitionService, bunnyStreamService);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Assignment Service Setup
        assignmentRepository = mock(AssignmentRepository.class);
        submissionRepository = mock(AssignmentSubmissionRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        notificationService = mock(NotificationService.class);
        activityLogService = mock(ActivityLogService.class);
        trainerCourseRequestRepository = mock(TrainerCourseRequestRepository.class);

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

        try {
            java.lang.reflect.Field field = AssignmentService.class.getDeclaredField("trainerCourseRequestRepository");
            field.setAccessible(true);
            field.set(assignmentService, trainerCourseRequestRepository);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // =========================================================================
    // PART 1: GUIDANCE VIDEOS TESTS
    // =========================================================================

    @Test
    @DisplayName("Guidance Video: Idempotent save prevents duplication of identical bunnyVideoId")
    void testGuidanceVideoSaveIsIdempotent() {
        String compId = "comp_olympiad_2026";
        Competition comp = new Competition();
        comp.setId(compId);
        comp.setTitle("2026 National English Olympiad");
        when(competitionRepository.findById(compId)).thenReturn(Optional.of(comp));

        // Existing entry with GUID "bunny_guid_001"
        CompetitionGuidanceVideo existing = new CompetitionGuidanceVideo();
        existing.setId("vid_existing_1");
        existing.setCompetitionId(compId);
        existing.setBunnyVideoId("bunny_guid_001");
        existing.setCaption("Original Caption");
        existing.setTitle("Original Title");
        existing.setSortOrder(1);

        when(guidanceVideoRepository.findByCompetitionIdAndBunnyVideoId(compId, "bunny_guid_001"))
                .thenReturn(Optional.of(existing));
        when(guidanceVideoRepository.save(any(CompetitionGuidanceVideo.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Attempt to save again with the same bunnyVideoId
        CompetitionGuidanceVideo incoming = new CompetitionGuidanceVideo();
        incoming.setBunnyVideoId("bunny_guid_001");
        incoming.setCaption("Updated Guidance Caption");
        incoming.setTitle("Updated Guidance Caption");

        CompetitionGuidanceVideo result = competitionService.saveGuidanceVideo(compId, incoming);

        assertNotNull(result);
        assertEquals("vid_existing_1", result.getId(), "Should update the existing record rather than insert a duplicate");
        assertEquals("Updated Guidance Caption", result.getCaption());
        assertEquals("Updated Guidance Caption", result.getTitle());
        assertTrue(result.getEmbedUrl().contains("bunny_guid_001"));
        assertTrue(result.getPlaybackUrl().contains("playlist.m3u8"));

        // Verify save was called on the existing entity
        verify(guidanceVideoRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("Guidance Video: Direct URL construction populates embed and HLS URLs from CDN hostname")
    void testGuidanceVideoUrlConstruction() {
        String compId = "comp_olympiad_2026";
        Competition comp = new Competition();
        comp.setId(compId);
        when(competitionRepository.findById(compId)).thenReturn(Optional.of(comp));
        when(guidanceVideoRepository.findByCompetitionIdAndBunnyVideoId(any(), any())).thenReturn(Optional.empty());
        when(guidanceVideoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CompetitionGuidanceVideo incoming = new CompetitionGuidanceVideo();
        incoming.setBunnyVideoId("guid_stream_456");
        incoming.setCaption("Speaking Test Overview");

        CompetitionGuidanceVideo video = competitionService.saveGuidanceVideo(compId, incoming);

        assertEquals("https://iframe.mediadelivery.net/embed/lib_test_123/guid_stream_456", video.getEmbedUrl());
        assertEquals("https://video.bunnycdn.com/guid_stream_456/playlist.m3u8", video.getPlaybackUrl());
    }

    // =========================================================================
    // PART 2: TRAINER ASSIGNMENT AUTHORIZATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Trainer Assignment: Throws ForbiddenException when course mode is Recorded")
    void testCreateAssignmentFailsForRecordedCourse() {
        // Authenticate trainer
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("trainer_alex@zoro.com", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_TRAINER")))
        );

        User trainer = new User();
        trainer.setId("trn_alex");
        trainer.setName("Alex Trainer");
        trainer.setEmail("trainer_alex@zoro.com");
        trainer.setRole("TRAINER");
        when(userRepository.findByEmailIgnoreCase("trainer_alex@zoro.com")).thenReturn(Optional.of(trainer));

        Course recordedCourse = new Course();
        recordedCourse.setId("crs_rec_1");
        recordedCourse.setTitle("Self-paced Recorded Pronunciation");
        recordedCourse.setMode("Recorded"); // Mode is Recorded
        recordedCourse.setAssignedTrainer("Alex Trainer");
        recordedCourse.setTrainerId("trn_alex");

        when(courseRepository.findById("crs_rec_1")).thenReturn(Optional.of(recordedCourse));

        Assignment assignment = new Assignment();
        assignment.setTitle("Extra Listening Homework");
        assignment.setCourseId("crs_rec_1");
        assignment.setTargetType("batch");
        assignment.setBatch("Batch 1");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                assignmentService.createAssignment(assignment)
        );

        assertTrue(ex.getMessage().contains("Recorded courses are excluded"));
    }

    @Test
    @DisplayName("Trainer Assignment: Throws ForbiddenException when course is not allocated to the trainer")
    void testCreateAssignmentFailsForUnallocatedCourse() {
        // Authenticate trainer
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("trainer_sarah@zoro.com", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_TRAINER")))
        );

        User trainer = new User();
        trainer.setId("trn_sarah");
        trainer.setName("Sarah Trainer");
        trainer.setEmail("trainer_sarah@zoro.com");
        trainer.setRole("TRAINER");
        when(userRepository.findByEmailIgnoreCase("trainer_sarah@zoro.com")).thenReturn(Optional.of(trainer));

        Course unallocatedCourse = new Course();
        unallocatedCourse.setId("crs_online_unallocated");
        unallocatedCourse.setTitle("Advanced Grammar Masterclass");
        unallocatedCourse.setMode("Online");
        unallocatedCourse.setAssignedTrainer("Other Trainer");
        unallocatedCourse.setTrainerId("trn_other");

        when(courseRepository.findById("crs_online_unallocated")).thenReturn(Optional.of(unallocatedCourse));
        when(trainerCourseRequestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase("trn_sarah", "crs_online_unallocated", "Approved"))
                .thenReturn(Optional.empty());
        when(batchRepository.findByCourseId("crs_online_unallocated")).thenReturn(Collections.emptyList());

        Assignment assignment = new Assignment();
        assignment.setTitle("Tenses Review");
        assignment.setCourseId("crs_online_unallocated");
        assignment.setTargetType("batch");
        assignment.setBatch("Batch 1");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                assignmentService.createAssignment(assignment)
        );

        assertTrue(ex.getMessage().contains("You are not allocated to teach course"));
    }

    @Test
    @DisplayName("Trainer Assignment: Succeeds for allocated Online/Hybrid course")
    void testCreateAssignmentSucceedsForAllocatedOnlineCourse() {
        // Authenticate trainer
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("trainer_sarah@zoro.com", "pass",
                        List.of(new SimpleGrantedAuthority("ROLE_TRAINER")))
        );

        User trainer = new User();
        trainer.setId("trn_sarah");
        trainer.setName("Sarah Trainer");
        trainer.setEmail("trainer_sarah@zoro.com");
        trainer.setRole("TRAINER");
        when(userRepository.findByEmailIgnoreCase("trainer_sarah@zoro.com")).thenReturn(Optional.of(trainer));

        Course allocatedCourse = new Course();
        allocatedCourse.setId("crs_online_sarah");
        allocatedCourse.setTitle("Spoken English Fluency");
        allocatedCourse.setMode("Online");
        allocatedCourse.setAssignedTrainer("Sarah Trainer");
        allocatedCourse.setTrainerId("trn_sarah");

        Batch batch = new Batch();
        batch.setId("btc_sarah_1");
        batch.setName("Evening Batch 1");
        batch.setCourseId("crs_online_sarah");
        batch.setTrainerId("trn_sarah");

        when(courseRepository.findById("crs_online_sarah")).thenReturn(Optional.of(allocatedCourse));
        when(batchRepository.findById("btc_sarah_1")).thenReturn(Optional.of(batch));
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> {
            Assignment a = inv.getArgument(0);
            a.setId("asg_new_123");
            return a;
        });

        Assignment assignment = new Assignment();
        assignment.setTitle("Pronunciation Drill 1");
        assignment.setCourseId("crs_online_sarah");
        assignment.setTargetType("batch");
        assignment.setBatchId("btc_sarah_1");
        assignment.setBatch("Evening Batch 1");

        Assignment created = assignmentService.createAssignment(assignment);

        assertNotNull(created);
        assertEquals("asg_new_123", created.getId());
        assertEquals("crs_online_sarah", created.getCourseId());
        assertEquals("trn_sarah", created.getTrainerId());
        verify(assignmentRepository, times(1)).save(any(Assignment.class));
    }
}
