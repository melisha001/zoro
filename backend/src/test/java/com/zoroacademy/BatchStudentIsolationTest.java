package com.zoroacademy;

import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.StudentCourseBatch;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.BatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BatchStudentIsolationTest {

    private BatchRepository batchRepository;
    private CourseRepository courseRepository;
    private UserRepository userRepository;
    private EnrollmentRepository enrollmentRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private StudentFeeRepository studentFeeRepository;
    private ScheduleRepository scheduleRepository;
    private AssignmentRepository assignmentRepository;

    private BatchService batchService;

    @BeforeEach
    void setUp() {
        batchRepository = mock(BatchRepository.class);
        courseRepository = mock(CourseRepository.class);
        userRepository = mock(UserRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);

        batchService = new BatchService(
                batchRepository,
                courseRepository,
                userRepository,
                enrollmentRepository,
                studentCourseBatchRepository,
                studentFeeRepository,
                scheduleRepository,
                assignmentRepository
        );
    }

    @Test
    @DisplayName("Students appear ONLY in their assigned batch: b1 lists student, b2 does not")
    void testStudentAppearsOnlyInOwnBatch() {
        String batch1Id = "btc_001";
        String batch2Id = "btc_002";

        User student1 = User.builder()
                .id("std_001")
                .name("Student One")
                .email("student1@test.com")
                .role("STUDENT")
                .status("Active")
                .build();

        StudentCourseBatch scb1 = new StudentCourseBatch(
                1L, "std_001", "English Course", "crs_100", "Morning Batch", batch1Id, LocalDateTime.now()
        );

        // When querying batch1, userRepository.findStudentsByBatchId returns student1
        when(userRepository.findStudentsByBatchId(batch1Id)).thenReturn(List.of(student1));
        // When querying batch2, userRepository.findStudentsByBatchId returns empty list
        when(userRepository.findStudentsByBatchId(batch2Id)).thenReturn(List.of());

        // When student1's course batches are populated
        when(studentCourseBatchRepository.findByStudentId("std_001")).thenReturn(List.of(scb1));

        // When counting students
        when(userRepository.countStudentsByBatchId(batch1Id)).thenReturn(1L);
        when(userRepository.countStudentsByBatchId(batch2Id)).thenReturn(0L);

        // Act & Assert for batch1
        List<UserDto> b1Students = batchService.getStudentsInBatch(batch1Id);
        assertEquals(1, b1Students.size());
        assertEquals("std_001", b1Students.get(0).getId());
        assertEquals("Student One", b1Students.get(0).getName());
        assertNotNull(b1Students.get(0).getCourseBatches());
        assertEquals(1, b1Students.get(0).getCourseBatches().size());
        assertEquals(batch1Id, b1Students.get(0).getCourseBatches().get(0).get("batchId"));
        assertEquals(1L, batchService.getStudentCountInBatch(batch1Id));

        // Act & Assert for batch2 (must be empty, zero leakage!)
        List<UserDto> b2Students = batchService.getStudentsInBatch(batch2Id);
        assertTrue(b2Students.isEmpty(), "Student in b1 must NOT appear under b2!");
        assertEquals(0L, batchService.getStudentCountInBatch(batch2Id));

        verify(userRepository).findStudentsByBatchId(batch1Id);
        verify(userRepository).findStudentsByBatchId(batch2Id);
    }
}
