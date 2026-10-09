package com.zoroacademy;

import com.zoroacademy.dto.LoginRequest;
import com.zoroacademy.dto.LoginResponse;
import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.exception.ConflictException;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.AuthService;
import com.zoroacademy.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.net.Socket;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5433/zoro_academy",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.datasource.username=postgres",
    "spring.datasource.password=postgres",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true"
})
@EnabledIf("isPostgreSqlAvailable")
class StudentLifecycleIntegrationTest {

    static boolean isPostgreSqlAvailable() {
        try (Socket socket = new Socket("localhost", 5433)) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private com.zoroacademy.repository.CourseRepository courseRepository;

    @Test
    @DisplayName("End-to-end: Create student with 'Student@123', log in, verify role, toggle status to Inactive, verify login rejected")
    void testStudentCreationLoginAndInactiveToggle() {
        String testEmail = "test_student_" + UUID.randomUUID().toString().substring(0, 8) + "@zoro.com";
        String rawPassword = "Student@123";

        UserDto studentDto = UserDto.builder()
                .name("Test Student")
                .email(testEmail)
                .username("teststudent_" + UUID.randomUUID().toString().substring(0, 8))
                .password(rawPassword)
                .status("Active")
                .build();

        UserDto created = userService.saveStudent(studentDto);
        assertNotNull(created);
        assertNotNull(created.getId());
        assertNull(created.getTemporaryPassword());
        assertNull(created.getPassword(), "UserDto password must never be exposed");

        // Login as newly created student
        LoginRequest loginReq = LoginRequest.builder().email(testEmail).password(rawPassword).build();
        LoginResponse loginResp = authService.login(loginReq);
        assertNotNull(loginResp);
        assertNotNull(loginResp.getToken());
        assertEquals("STUDENT", loginResp.getUser().getRole());

        // Deactivate student via updateUserStatus
        userService.updateUserStatus(created.getId(), "Inactive");

        // Attempt login on Inactive account
        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(loginReq);
        });
        assertTrue(thrown.getMessage().toLowerCase().contains("inactive"), "Expected inactive account error message");

        // Cleanup
        userService.deleteUser(created.getId(), true);
    }

    @Test
    @DisplayName("End-to-end: Delete student with no data succeeds; student with active enrollment blocked without force, succeeds with force")
    void testStudentDeletionNormalAndForce() {
        // 1. Student with no data
        String cleanEmail = "clean_student_" + UUID.randomUUID().toString().substring(0, 8) + "@zoro.com";
        UserDto cleanStudent = userService.saveStudent(UserDto.builder()
                .name("Clean Student")
                .email(cleanEmail)
                .username("clean_" + UUID.randomUUID().toString().substring(0, 8))
                .password("Student@123")
                .status("Active")
                .build());

        assertNotNull(cleanStudent.getId());
        assertTrue(userRepository.findById(cleanStudent.getId()).isPresent());

        // Normal delete succeeds
        userService.deleteUser(cleanStudent.getId(), false);
        assertFalse(userRepository.findById(cleanStudent.getId()).isPresent(), "User row should be deleted from DB");

        // 2. Student with active enrollment
        com.zoroacademy.entity.Course course = courseRepository.save(com.zoroacademy.entity.Course.builder()
                .id("crs_" + UUID.randomUUID())
                .title("Test Course")
                .audience("student")
                .category("English")
                .price(java.math.BigDecimal.valueOf(1000))
                .status("Active")
                .build());

        String enrolledEmail = "enrolled_student_" + UUID.randomUUID().toString().substring(0, 8) + "@zoro.com";
        UserDto enrolledStudent = userService.saveStudent(UserDto.builder()
                .name("Enrolled Student")
                .email(enrolledEmail)
                .username("enrolled_" + UUID.randomUUID().toString().substring(0, 8))
                .password("Student@123")
                .status("Active")
                .build());

        String studentId = enrolledStudent.getId();
        Enrollment enr = Enrollment.builder()
                .id("enr_test_" + UUID.randomUUID())
                .studentId(studentId)
                .studentEmail(enrolledEmail)
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .status("Active")
                .build();
        enrollmentRepository.save(enr);

        // Attempt normal delete -> should throw ConflictException
        ConflictException conflict = assertThrows(ConflictException.class, () -> {
            userService.deleteUser(studentId, false);
        });
        assertTrue(conflict.getMessage().contains("active course enrollments"));
        assertTrue(userRepository.findById(studentId).isPresent(), "Student should still exist in DB after blocked delete");

        // Force delete -> should succeed in one transaction
        userService.deleteUser(studentId, true);
        assertFalse(userRepository.findById(studentId).isPresent(), "Student should be completely deleted from DB");
        assertTrue(enrollmentRepository.findByStudentId(studentId).isEmpty(), "Student enrollment should be removed");

        courseRepository.delete(course);
    }
}
