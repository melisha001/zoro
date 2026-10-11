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
    void testCreateStudentRequiresExplicitPassword() {
        UserDto dto = UserDto.builder()
                .name("Ananya Iyer")
                .email("ananya@student.com")
                .phone("+91 9876543210")
                .username("ananya_i")
                .build();

        when(userRepository.findByEmailIgnoreCase("ananya@student.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("ananya_i")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.saveStudent(dto));
        verify(userRepository, never()).save(any());
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

    @Test
    void testCreateStudentWithExplicitValidPassword() {
        UserDto dto = UserDto.builder()
                .name("Student User")
                .email("student_new@test.com")
                .password("Student@123")
                .build();

        when(userRepository.findByEmailIgnoreCase("student_new@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("student_new@test.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto created = userService.saveStudent(dto);

        assertNotNull(created);
        verify(passwordEncoder).encode("Student@123");
    }

    @Test
    void testCreateStudentWithShortPasswordThrowsException() {
        UserDto dto = UserDto.builder()
                .name("Student User")
                .email("student_short@test.com")
                .password("short")
                .build();

        when(userRepository.findByEmailIgnoreCase("student_short@test.com")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.saveStudent(dto));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testUpdateStudentPreservesExistingPasswordWhenBlank() {
        User existing = User.builder()
                .id("std-100")
                .email("student100@test.com")
                .password("encoded_existingSecret")
                .role("STUDENT")
                .build();

        when(userRepository.findById("std-100")).thenReturn(Optional.of(existing));
        when(userRepository.findByEmailIgnoreCase("student100@test.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto updateDto = UserDto.builder()
                .id("std-100")
                .name("Updated Name")
                .email("student100@test.com")
                .password("")
                .build();

        UserDto updated = userService.saveStudent(updateDto);

        assertNotNull(updated);
        assertEquals("encoded_existingSecret", existing.getPassword());
    }

    @Test
    void testUpdateUserStatus() {
        User existing = User.builder()
                .id("std-200")
                .email("student200@test.com")
                .status("Active")
                .role("STUDENT")
                .build();

        when(userRepository.findById("std-200")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto res = userService.updateUserStatus("std-200", "Inactive");

        assertEquals("Inactive", res.getStatus());
        assertEquals("Inactive", existing.getStatus());
    }

    @Test
    void testDeleteStudentWithActiveEnrollmentThrowsConflictIfNotForced() {
        User student = User.builder()
                .id("std-300")
                .role("STUDENT")
                .build();

        com.zoroacademy.entity.Enrollment enrollment = com.zoroacademy.entity.Enrollment.builder()
                .id("enr-1")
                .studentId("std-300")
                .status("Active")
                .build();

        when(userRepository.findById("std-300")).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentId("std-300")).thenReturn(java.util.List.of(enrollment));

        assertThrows(ConflictException.class, () -> userService.deleteUser("std-300", false));
        verify(userRepository, never()).delete(any());
    }

    @Test
    void testDeleteStudentForceTrueDeletesSuccessfully() {
        User student = User.builder()
                .id("std-300")
                .role("STUDENT")
                .email("student300@test.com")
                .build();

        com.zoroacademy.entity.Enrollment enrollment = com.zoroacademy.entity.Enrollment.builder()
                .id("enr-1")
                .studentId("std-300")
                .status("Active")
                .build();

        when(userRepository.findById("std-300")).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentId("std-300")).thenReturn(java.util.List.of(enrollment));

        userService.deleteUser("std-300", true);

        verify(enrollmentRepository, atLeastOnce()).deleteAll(anyList());
        verify(studentCourseBatchRepository).deleteByStudentId("std-300");
        verify(userRepository).delete(student);
    }

    @Test
    void testAdminSetAndGetAdminPassword() {
        User user = User.builder()
                .id("usr-reset-1")
                .email("user1@zoro.com")
                .role("STUDENT")
                .password("encoded_oldPassword123")
                .build();

        when(userRepository.findById("usr-reset-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.setAdminPassword("usr-reset-1", "AdminSetPass123!");

        assertNotNull(user.getAdminVisiblePassword());
        verify(passwordEncoder).encode("AdminSetPass123!");
        verify(userRepository).save(user);

        String revealed = userService.getAdminVisiblePassword("usr-reset-1");
        assertEquals("AdminSetPass123!", revealed);
    }

    @Test
    void testUpdatePasswordUpdatesBothHashAndAdminVisiblePassword() {
        User user = User.builder()
                .id("usr-update-1")
                .email("user2@zoro.com")
                .password("encoded_tempPassword123")
                .build();

        when(userRepository.findById("usr-update-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("tempPassword123", "encoded_tempPassword123")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean updated = userService.updatePassword("usr-update-1", "tempPassword123", "brandNewPassword123!");

        assertTrue(updated);
        verify(passwordEncoder).encode("brandNewPassword123!");
        verify(userRepository).save(user);
        assertEquals("brandNewPassword123!", userService.getAdminVisiblePassword("usr-update-1"));
    }
}
