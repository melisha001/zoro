package com.zoroacademy;

import com.zoroacademy.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class FreshDatabaseCleanTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private StudentFeeRepository studentFeeRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Test
    @DisplayName("Verify fresh migrated database has zero demo business rows")
    void testFreshDatabaseHasZeroDemoBusinessRows() {
        assertEquals(0, userRepository.findAll().stream().filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole())).count(),
                "No student or trainer demo users should exist");
        assertEquals(0, courseRepository.count(), "No demo courses should exist");
        assertEquals(0, batchRepository.count(), "No demo batches should exist");
        assertEquals(0, enrollmentRepository.count(), "No demo enrollments should exist");
        assertEquals(0, scheduleRepository.count(), "No demo schedules should exist");
        assertEquals(0, studentFeeRepository.count(), "No demo student fees should exist");
        assertEquals(0, submissionRepository.count(), "No demo assignment submissions should exist");
    }
}
