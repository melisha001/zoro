package com.zoroacademy;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.controller.MeController;
import com.zoroacademy.controller.UserController;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SecurityRbacIntegrationTest {

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

    private MeController meController;

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
                attendanceRecordRepository
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String id, String email, String role, String name) {
        User user = User.builder()
                .id(id)
                .email(email)
                .role(role)
                .name(name)
                .status("Active")
                .build();
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
    }

    @Test
    void testAdminCanAccessAllStudentsViaMeEndpoint() {
        authenticate("admin-1", "admin@zoro.com", "ADMIN", "Administrator");

        UserDto s1 = UserDto.builder().id("std-1").email("std1@zoro.com").name("Student One").role("STUDENT").build();
        UserDto s2 = UserDto.builder().id("std-2").email("std2@zoro.com").name("Student Two").role("STUDENT").build();
        when(userService.getStudents()).thenReturn(List.of(s1, s2));

        ApiResponse<List<UserDto>> response = meController.getMyStudents();
        assertTrue(response.isSuccess());
        assertEquals(2, response.getData().size());
        verify(userService, times(1)).getStudents();
    }

    @Test
    void testTrainerGetsOnlyAssignedStudentsViaMeEndpoint() {
        authenticate("trn-1", "trainer@zoro.com", "TRAINER", "Trainer Zoro");

        Batch b1 = Batch.builder().id("batch-101").name("Morning Batch").trainerId("trn-1").build();
        when(batchRepository.findByTrainerIdOrTrainerNameIgnoreCase("trn-1", "Trainer Zoro"))
                .thenReturn(List.of(b1));

        Course c1 = Course.builder().id("crs-1").title("Full Stack Web").assignedTrainer("Trainer Zoro").build();
        c1.setTrainerId("trn-1");
        when(courseRepository.findByTrainerIdOrAssignedTrainerIgnoreCase("trn-1", "Trainer Zoro"))
                .thenReturn(List.of(c1));

        when(trainerCourseRequestRepository.findByTrainerIdAndStatusIgnoreCase("trn-1", "Approved"))
                .thenReturn(Collections.emptyList());

        StudentCourseBatch scb1 = StudentCourseBatch.builder()
                .studentId("std-1")
                .batchId("batch-101")
                .courseId("crs-1")
                .build();
        when(studentCourseBatchRepository.findByBatchId("batch-101")).thenReturn(List.of(scb1));
        when(enrollmentRepository.findByBatchId("batch-101")).thenReturn(Collections.emptyList());
        when(studentCourseBatchRepository.findByCourseId("crs-1")).thenReturn(List.of(scb1));
        when(enrollmentRepository.findByCourseId("crs-1")).thenReturn(Collections.emptyList());

        User studentUser = User.builder().id("std-1").email("student1@zoro.com").name("Student One").role("STUDENT").status("Active").build();
        when(userRepository.findAllById(any())).thenReturn(List.of(studentUser));

        UserDto expectedDto = UserDto.builder().id("std-1").email("student1@zoro.com").name("Student One").role("STUDENT").build();
        when(userService.convertUserToDto(studentUser)).thenReturn(expectedDto);

        ApiResponse<List<UserDto>> response = meController.getMyStudents();
        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());
        assertEquals("std-1", response.getData().get(0).getId());
    }

    @Test
    void testStudentCannotAccessStudentsListViaMeEndpoint() {
        authenticate("std-1", "student@zoro.com", "STUDENT", "Student User");

        assertThrows(AccessDeniedException.class, () -> meController.getMyStudents());
    }

    @Test
    void testProfileRetrievalAndUpdateViaMeEndpoint() {
        authenticate("trn-1", "trainer@zoro.com", "TRAINER", "Trainer Zoro");

        UserDto existingDto = UserDto.builder().id("trn-1").name("Trainer Zoro").email("trainer@zoro.com").role("TRAINER").phone("9876543210").build();
        when(userService.convertUserToDto(any())).thenReturn(existingDto);

        ApiResponse<UserDto> profileResp = meController.getMyProfile();
        assertTrue(profileResp.isSuccess());
        assertEquals("Trainer Zoro", profileResp.getData().getName());

        UserDto updateInput = UserDto.builder().name("Trainer Zoro Updated").phone("9876543211").build();
        UserDto updatedDto = UserDto.builder().id("trn-1").name("Trainer Zoro Updated").phone("9876543211").role("TRAINER").build();
        when(userService.updateProfile(eq("trn-1"), any())).thenReturn(updatedDto);

        ApiResponse<UserDto> updateResp = meController.updateMyProfile(updateInput);
        assertTrue(updateResp.isSuccess());
        assertEquals("Trainer Zoro Updated", updateResp.getData().getName());
        verify(userService, times(1)).updateProfile(eq("trn-1"), any());
    }

    @Test
    void testStudentFeesIsolationViaMeEndpoint() {
        authenticate("std-1", "student@zoro.com", "STUDENT", "Student User");

        StudentFee fee = new StudentFee();
        fee.setId("fee-1");
        fee.setStudentId("std-1");
        fee.setStudentName("Student User");
        fee.setCourse("Full Stack");
        fee.setTotalFee(BigDecimal.valueOf(15000));
        fee.setDueAmount(BigDecimal.valueOf(5000));

        when(studentFeeRepository.findByStudentId("std-1")).thenReturn(List.of(fee));
        when(studentFeeRepository.findByStudentId("student@zoro.com")).thenReturn(Collections.emptyList());

        ApiResponse<List<StudentFee>> resp = meController.getMyFees();
        assertTrue(resp.isSuccess());
        assertEquals(1, resp.getData().size());
        assertEquals(BigDecimal.valueOf(5000), resp.getData().get(0).getDueAmount());
    }

    @Test
    void testStudentAttendanceIsolationViaMeEndpoint() {
        authenticate("std-1", "student@zoro.com", "STUDENT", "Student User");

        AttendanceRecord rec = new AttendanceRecord("att-1", "sch-1", "std-1", "Student User", "crs-1", "btc-1", "2026-10-10", "PRESENT", "On time", "Teacher", null);
        when(attendanceRecordRepository.findByStudentId("std-1")).thenReturn(List.of(rec));
        when(attendanceRecordRepository.findByStudentId("student@zoro.com")).thenReturn(Collections.emptyList());

        ApiResponse<List<AttendanceRecord>> resp = meController.getMyAttendance();
        assertTrue(resp.isSuccess());
        assertEquals(1, resp.getData().size());
        assertEquals("PRESENT", resp.getData().get(0).getStatus());
    }

    @Test
    void testAdminResetPasswordSetsTemporaryPasswordAndMustChangePassword() {
        UserController userController = new UserController(userService);
        UserDto resetResult = UserDto.builder()
                .id("std-1")
                .email("student@zoro.com")
                .name("Student User")
                .temporaryPassword("TempPass987!")
                .mustChangePassword(true)
                .build();

        when(userService.resetUserPassword("std-1")).thenReturn(resetResult);

        ApiResponse<UserDto> response = userController.resetPassword("std-1");
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals("TempPass987!", response.getData().getTemporaryPassword());
        assertTrue(response.getData().getMustChangePassword());
        verify(userService).resetUserPassword("std-1");
    }
}
