package com.zoroacademy;

import com.zoroacademy.dto.UserDto;
import com.zoroacademy.entity.Batch;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.StudentCourseBatch;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.BatchRepository;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.StudentCourseBatchRepository;
import com.zoroacademy.repository.UserRepository;
import com.zoroacademy.service.BatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BatchMembershipTest {

    private BatchRepository batchRepository;
    private UserRepository userRepository;
    private EnrollmentRepository enrollmentRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private BatchService batchService;

    @BeforeEach
    void setUp() {
        batchRepository = mock(BatchRepository.class);
        userRepository = mock(UserRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);

        batchService = new BatchService(
                batchRepository,
                mock(com.zoroacademy.repository.CourseRepository.class),
                userRepository,
                enrollmentRepository,
                studentCourseBatchRepository,
                mock(com.zoroacademy.repository.StudentFeeRepository.class),
                mock(com.zoroacademy.repository.ScheduleRepository.class),
                mock(com.zoroacademy.repository.AssignmentRepository.class)
        );
    }

    @Test
    @DisplayName("getStudentsInBatch returns empty list when no students assigned")
    void testGetStudentsInBatchEmpty() {
        when(batchRepository.findById("btc-100")).thenReturn(Optional.of(Batch.builder().id("btc-100").name("Batch Morning").build()));
        when(studentCourseBatchRepository.findByBatchId("btc-100")).thenReturn(List.of());
        when(enrollmentRepository.findByBatchId("btc-100")).thenReturn(List.of());
        when(enrollmentRepository.findByBatchNameIgnoreCase("Batch Morning")).thenReturn(List.of());

        List<UserDto> students = batchService.getStudentsInBatch("btc-100");
        assertTrue(students.isEmpty());
    }

    @Test
    @DisplayName("getStudentsInBatch returns student objects assigned to batch by ID")
    void testGetStudentsInBatchReturnsAssignedStudents() {
        Batch batch = Batch.builder().id("btc-200").name("Batch Alpha").build();
        when(batchRepository.findById("btc-200")).thenReturn(Optional.of(batch));

        StudentCourseBatch scb = StudentCourseBatch.builder()
                .studentId("std-101")
                .batchId("btc-200")
                .courseId("crs-1")
                .build();
        when(studentCourseBatchRepository.findByBatchId("btc-200")).thenReturn(List.of(scb));

        Enrollment enr = Enrollment.builder()
                .studentId("std-101")
                .batchId("btc-200")
                .courseId("crs-1")
                .build();
        when(enrollmentRepository.findByBatchId("btc-200")).thenReturn(List.of(enr));

        User student = User.builder()
                .id("std-101")
                .name("Kavya N")
                .email("kavya@student.com")
                .role("STUDENT")
                .build();
        when(userRepository.findStudentsByBatchId("btc-200")).thenReturn(List.of(student));

        List<UserDto> result = batchService.getStudentsInBatch("btc-200");
        assertEquals(1, result.size());
        assertEquals("std-101", result.get(0).getId());
        assertEquals("Kavya N", result.get(0).getName());
    }
}
