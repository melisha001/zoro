package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.MeController;
import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.CourseModule;
import com.zoroacademy.entity.TrainerCourseRequest;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TrainerCoursesEndpointTest {

    private UserRepository userRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private EnrollmentRepository enrollmentRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private AssignmentRepository assignmentRepository;
    private AssignmentSubmissionRepository assignmentSubmissionRepository;
    private ScheduleRepository scheduleRepository;
    private TrainerCourseRequestRepository trainerCourseRequestRepository;
    private UserService userService;
    private StudentFeeRepository studentFeeRepository;
    private AttendanceRecordRepository attendanceRecordRepository;
    private NotificationRepository notificationRepository;
    private EnquiryRepository enquiryRepository;

    private MeController meController;

    private User trainer1;
    private User trainer2;
    private Course courseA;
    private Course courseB;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        assignmentSubmissionRepository = mock(AssignmentSubmissionRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        trainerCourseRequestRepository = mock(TrainerCourseRequestRepository.class);
        userService = mock(UserService.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        attendanceRecordRepository = mock(AttendanceRecordRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        enquiryRepository = mock(EnquiryRepository.class);

        meController = new MeController(
                userRepository,
                courseRepository,
                batchRepository,
                enrollmentRepository,
                studentCourseBatchRepository,
                assignmentRepository,
                assignmentSubmissionRepository,
                scheduleRepository,
                trainerCourseRequestRepository,
                userService,
                studentFeeRepository,
                attendanceRecordRepository,
                notificationRepository,
                enquiryRepository
        );

        trainer1 = User.builder()
                .id("tr_001")
                .name("Alice Trainer")
                .email("alice@zoroacademy.com")
                .role("TRAINER")
                .build();

        trainer2 = User.builder()
                .id("tr_002")
                .name("Bob Trainer")
                .email("bob@zoroacademy.com")
                .role("TRAINER")
                .build();

        CourseModule mod1 = CourseModule.builder()
                .id("mod_1")
                .title("Module 1")
                .build();
        mod1.setLocked(true);

        courseA = Course.builder()
                .id("crs_vedic")
                .title("Vedic Math Pedagogy")
                .audience("trainer")
                .modules(new ArrayList<>(List.of(mod1)))
                .build();

        courseB = Course.builder()
                .id("crs_abacus")
                .title("Abacus Trainer Certification")
                .audience("trainer")
                .modules(new ArrayList<>())
                .build();

        when(userRepository.findById("tr_001")).thenReturn(Optional.of(trainer1));
        when(userRepository.findByEmailIgnoreCase("alice@zoroacademy.com")).thenReturn(Optional.of(trainer1));
        when(userRepository.findById("tr_002")).thenReturn(Optional.of(trainer2));
        when(userRepository.findByEmailIgnoreCase("bob@zoroacademy.com")).thenReturn(Optional.of(trainer2));

        when(courseRepository.findByAudienceIgnoreCase("trainer")).thenReturn(List.of(courseA, courseB));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                user.getId(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_TRAINER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1. No requests -> enrolled is empty, all courses in available")
    void testNoRequests_EnrolledIsEmpty() {
        authenticateAs(trainer1);

        when(trainerCourseRequestRepository.findByTrainerId("tr_001")).thenReturn(Collections.emptyList());
        when(trainerCourseRequestRepository.findByTrainerEmailIgnoreCase("alice@zoroacademy.com")).thenReturn(Collections.emptyList());

        ApiResponse<Map<String, Object>> response = meController.getMyTrainerCourses();

        assertNotNull(response);
        assertTrue(response.isSuccess());
        Map<String, Object> data = response.getData();

        @SuppressWarnings("unchecked")
        List<Course> enrolled = (List<Course>) data.get("enrolled");
        @SuppressWarnings("unchecked")
        List<Course> pending = (List<Course>) data.get("pending");
        @SuppressWarnings("unchecked")
        List<Course> available = (List<Course>) data.get("available");

        assertTrue(enrolled.isEmpty(), "Enrolled must be empty when trainer has no approved requests");
        assertTrue(pending.isEmpty(), "Pending must be empty when trainer has no pending requests");
        assertEquals(2, available.size(), "Both trainer audience courses must be in available");
    }

    @Test
    @DisplayName("2. Pending request -> in pending, not in enrolled")
    void testPendingRequest_InPending() {
        authenticateAs(trainer1);

        TrainerCourseRequest pendingReq = TrainerCourseRequest.builder()
                .id("req_101")
                .trainerId("tr_001")
                .trainerEmail("alice@zoroacademy.com")
                .courseId("crs_vedic")
                .courseTitle("Vedic Math Pedagogy")
                .status("Pending")
                .build();

        when(trainerCourseRequestRepository.findByTrainerId("tr_001")).thenReturn(List.of(pendingReq));
        when(trainerCourseRequestRepository.findByTrainerEmailIgnoreCase("alice@zoroacademy.com")).thenReturn(List.of(pendingReq));

        ApiResponse<Map<String, Object>> response = meController.getMyTrainerCourses();

        assertNotNull(response);
        assertTrue(response.isSuccess());
        Map<String, Object> data = response.getData();

        @SuppressWarnings("unchecked")
        List<Course> enrolled = (List<Course>) data.get("enrolled");
        @SuppressWarnings("unchecked")
        List<Course> pending = (List<Course>) data.get("pending");
        @SuppressWarnings("unchecked")
        List<Course> available = (List<Course>) data.get("available");

        assertTrue(enrolled.isEmpty(), "Pending request must not appear in enrolled");
        assertEquals(1, pending.size(), "Pending request must appear in pending");
        assertEquals("crs_vedic", pending.get(0).getId());
        assertEquals(1, available.size(), "Only unrequested courses remain in available");
        assertEquals("crs_abacus", available.get(0).getId());
    }

    @Test
    @DisplayName("3. Approved request -> in enrolled, modules unlocked")
    void testApprovedRequest_InEnrolled() {
        authenticateAs(trainer1);

        TrainerCourseRequest approvedReq = TrainerCourseRequest.builder()
                .id("req_102")
                .trainerId("tr_001")
                .trainerEmail("alice@zoroacademy.com")
                .courseId("crs_vedic")
                .courseTitle("Vedic Math Pedagogy")
                .status("Approved")
                .build();

        when(trainerCourseRequestRepository.findByTrainerId("tr_001")).thenReturn(List.of(approvedReq));
        when(trainerCourseRequestRepository.findByTrainerEmailIgnoreCase("alice@zoroacademy.com")).thenReturn(List.of(approvedReq));

        ApiResponse<Map<String, Object>> response = meController.getMyTrainerCourses();

        assertNotNull(response);
        assertTrue(response.isSuccess());
        Map<String, Object> data = response.getData();

        @SuppressWarnings("unchecked")
        List<Course> enrolled = (List<Course>) data.get("enrolled");
        @SuppressWarnings("unchecked")
        List<Course> pending = (List<Course>) data.get("pending");
        @SuppressWarnings("unchecked")
        List<Course> available = (List<Course>) data.get("available");

        assertEquals(1, enrolled.size(), "Approved course must be in enrolled");
        assertEquals("crs_vedic", enrolled.get(0).getId());
        assertFalse(enrolled.get(0).getModules().get(0).isLocked(), "Module must be unlocked for enrolled course");

        assertTrue(pending.isEmpty());
        assertEquals(1, available.size());
        assertEquals("crs_abacus", available.get(0).getId());
    }

    @Test
    @DisplayName("4. Another trainer's approval does NOT affect this trainer")
    void testAnotherTrainerApproval_DoesNotAffectThisTrainer() {
        // Bob Trainer was approved for Course A, and Course A has trainerId set to Bob
        courseA.setTrainerId("tr_002");
        courseA.setAssignedTrainer("Bob Trainer");

        TrainerCourseRequest bobApprovedReq = TrainerCourseRequest.builder()
                .id("req_bob")
                .trainerId("tr_002")
                .trainerEmail("bob@zoroacademy.com")
                .courseId("crs_vedic")
                .courseTitle("Vedic Math Pedagogy")
                .status("Approved")
                .build();

        // When Bob queries: Bob sees it enrolled
        when(trainerCourseRequestRepository.findByTrainerId("tr_002")).thenReturn(List.of(bobApprovedReq));
        when(trainerCourseRequestRepository.findByTrainerEmailIgnoreCase("bob@zoroacademy.com")).thenReturn(List.of(bobApprovedReq));

        // When Alice queries: Alice has NO request
        when(trainerCourseRequestRepository.findByTrainerId("tr_001")).thenReturn(Collections.emptyList());
        when(trainerCourseRequestRepository.findByTrainerEmailIgnoreCase("alice@zoroacademy.com")).thenReturn(Collections.emptyList());

        // Authenticate as Alice
        authenticateAs(trainer1);

        ApiResponse<Map<String, Object>> response = meController.getMyTrainerCourses();

        assertNotNull(response);
        assertTrue(response.isSuccess());
        Map<String, Object> data = response.getData();

        @SuppressWarnings("unchecked")
        List<Course> enrolled = (List<Course>) data.get("enrolled");
        @SuppressWarnings("unchecked")
        List<Course> available = (List<Course>) data.get("available");

        assertTrue(enrolled.isEmpty(), "Alice must NOT be enrolled even if Bob is assigned or approved");
        assertEquals(2, available.size(), "Both courses must remain available for Alice");
        assertTrue(available.stream().anyMatch(c -> "crs_vedic".equals(c.getId())));
        assertTrue(available.stream().anyMatch(c -> "crs_abacus".equals(c.getId())));
    }
}
