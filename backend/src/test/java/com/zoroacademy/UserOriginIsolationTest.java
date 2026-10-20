package com.zoroacademy;

import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class UserOriginIsolationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    private User learningStudent;
    private User compOnlyStudent;
    private User dualStudent;
    private Enrollment dualEnrollment;

    @BeforeEach
    void setUp() {
        // 1. Learning portal regular student (origin null or 'LEARNING')
        learningStudent = new User();
        learningStudent.setId("usr_test_learn_" + UUID.randomUUID());
        learningStudent.setName("Learning Test Student");
        learningStudent.setEmail("learn_std_" + UUID.randomUUID() + "@test.com");
        learningStudent.setRole("STUDENT");
        learningStudent.setOrigin("LEARNING");
        learningStudent.setPassword("pass123");
        userRepository.save(learningStudent);

        // 2. Competition-only student (origin = 'COMPETITION', no enrollments)
        compOnlyStudent = new User();
        compOnlyStudent.setId("usr_test_comp_" + UUID.randomUUID());
        compOnlyStudent.setName("Comp Only Test Student");
        compOnlyStudent.setEmail("comp_std_" + UUID.randomUUID() + "@test.com");
        compOnlyStudent.setRole("STUDENT");
        compOnlyStudent.setOrigin("COMPETITION");
        compOnlyStudent.setPassword("pass123");
        userRepository.save(compOnlyStudent);

        // 3. Dual-portal student (origin = 'COMPETITION', but has an ACTIVE enrollment)
        dualStudent = new User();
        dualStudent.setId("usr_test_dual_" + UUID.randomUUID());
        dualStudent.setName("Dual Test Student");
        dualStudent.setEmail("dual_std_" + UUID.randomUUID() + "@test.com");
        dualStudent.setRole("STUDENT");
        dualStudent.setOrigin("COMPETITION");
        dualStudent.setPassword("pass123");
        userRepository.save(dualStudent);

        dualEnrollment = new Enrollment();
        dualEnrollment.setId("enr_test_" + UUID.randomUUID());
        dualEnrollment.setStudentId(dualStudent.getId());
        dualEnrollment.setStudentEmail(dualStudent.getEmail());
        dualEnrollment.setCourseId("test_course_id");
        dualEnrollment.setStatus("ACTIVE");
        enrollmentRepository.save(dualEnrollment);
    }

    @AfterEach
    void tearDown() {
        if (dualEnrollment != null) enrollmentRepository.delete(dualEnrollment);
        if (learningStudent != null) userRepository.delete(learningStudent);
        if (compOnlyStudent != null) userRepository.delete(compOnlyStudent);
        if (dualStudent != null) userRepository.delete(dualStudent);
    }

    @Test
    @DisplayName("Competition-only account without enrollments is excluded from Learning Portal student queries")
    void testCompetitionOnlyAccountExcludedFromLearningPortal() {
        List<User> learningStudents = userRepository.findLearningStudents();

        boolean containsLearning = learningStudents.stream().anyMatch(u -> u.getId().equals(learningStudent.getId()));
        boolean containsDual = learningStudents.stream().anyMatch(u -> u.getId().equals(dualStudent.getId()));
        boolean containsCompOnly = learningStudents.stream().anyMatch(u -> u.getId().equals(compOnlyStudent.getId()));

        assertTrue(containsLearning, "Regular learning student must be present in findLearningStudents()");
        assertTrue(containsDual, "Dual student with ACTIVE enrollment must be present in findLearningStudents()");
        assertFalse(containsCompOnly, "Competition-only student without enrollment must NEVER appear in findLearningStudents()");
    }

    @Test
    @DisplayName("countLearningStudents() strictly ignores competition-only students without enrollments")
    void testCountLearningStudentsIgnoresCompetitionOnly() {
        long count = userRepository.countLearningStudents();
        List<User> list = userRepository.findLearningStudents();
        assertEquals(list.size(), count, "Count must match the size of filtered learning students list");
    }
}
