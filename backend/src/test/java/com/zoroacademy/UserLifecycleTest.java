package com.zoroacademy;

import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.User;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.ActivityLogService;
import com.zoroacademy.service.EnrollmentService;
import com.zoroacademy.service.NotificationService;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserLifecycleTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private EnrollmentRepository enrollmentRepository;
    private CourseRepository courseRepository;
    private BatchRepository batchRepository;
    private ScheduleRepository scheduleRepository;
    private StudentFeeRepository studentFeeRepository;
    private EnrollmentService enrollmentService;
    private NotificationService notificationService;
    private ActivityLogService activityLogService;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        courseRepository = mock(CourseRepository.class);
        batchRepository = mock(BatchRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        enrollmentService = mock(EnrollmentService.class);
        notificationService = mock(NotificationService.class);
        activityLogService = mock(ActivityLogService.class);

        when(passwordEncoder.encode(any())).thenAnswer(inv -> "encoded_" + inv.getArgument(0));

        userService = new UserService(
                userRepository,
                passwordEncoder,
                studentCourseBatchRepository,
                enrollmentRepository,
                courseRepository,
                batchRepository,
                scheduleRepository,
                studentFeeRepository,
                enrollmentService,
                notificationService,
                activityLogService
        );
    }

    @Test
    void testCreateStudentGeneratesTemporaryPasswordAndEnforcesValidation() {
        UserDto dto = UserDto.builder()
                .name("Ananya Iyer")
                .email("ananya@student.com")
                .phone("+91 9876543210")
                .username("ananya_i")
                .build();

        when(userRepository.findByEmailIgnoreCase("ananya@student.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("ananya_i")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId("std-new-1");
            return u;
        });

        UserDto created = userService.saveStudent(dto);

        assertNotNull(created);
        assertNotNull(created.getTemporaryPassword());
        assertTrue(created.getTemporaryPassword().length() >= 10, "Temporary password must be at least 10 chars");
        assertEquals("STUDENT", created.getRole());
        assertEquals("9876543210", created.getPhone());
    }

    @Test
    void testCreateStudentRejectsInvalidPhone() {
        UserDto dto = UserDto.builder()
                .name("Invalid Phone User")
                .email("user@test.com")
                .phone("12345")
                .build();

        assertThrows(IllegalArgumentException.class, () -> userService.saveStudent(dto));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreateStudentDuplicateEmailThrowsConflict() {
        UserDto dto = UserDto.builder()
                .name("Duplicate User")
                .email("existing@zoro.com")
                .phone("+91 9876543210")
                .build();

        when(userRepository.findByEmailIgnoreCase("existing@zoro.com")).thenReturn(Optional.of(new User()));

        assertThrows(ConflictException.class, () -> userService.saveStudent(dto));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCannotDeleteLastAdmin() {
        User admin = User.builder()
                .id("admin-1")
                .role("ADMIN")
                .build();

        when(userRepository.findById("admin-1")).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleIgnoreCase("ADMIN")).thenReturn(1L);

        assertThrows(IllegalStateException.class, () -> userService.deleteUser("admin-1"));
        verify(userRepository, never()).delete(any());
    }

    @Test
    void testPasswordUpdateRequiresCurrentPasswordMatch() {
        User student = User.builder()
                .id("std-1")
                .email("student@test.com")
                .password("encoded_tempPass123")
                .build();

        when(userRepository.findById("student@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("student@test.com")).thenReturn(Optional.of(student));
        when(passwordEncoder.matches("wrongPass", "encoded_tempPass123")).thenReturn(false);

        boolean updated = userService.updatePassword("student@test.com", "wrongPass", "newSecretPassword123");
        assertFalse(updated, "Password update must return false when current password does not match");
    }
}
