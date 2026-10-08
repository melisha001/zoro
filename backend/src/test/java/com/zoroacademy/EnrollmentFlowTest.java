package com.zoroacademy;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.StudentFee;
import com.zoroacademy.entity.User;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.ActivityLogService;
import com.zoroacademy.service.EnrollmentService;
import com.zoroacademy.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EnrollmentFlowTest {

    private EnrollmentRepository enrollmentRepository;
    private EnrollmentRequestRepository enrollmentRequestRepository;
    private CourseRepository courseRepository;
    private UserRepository userRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private StudentFeeRepository studentFeeRepository;
    private BatchRepository batchRepository;
    private NotificationService notificationService;
    private ActivityLogService activityLogService;

    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentRepository = mock(EnrollmentRepository.class);
        enrollmentRequestRepository = mock(EnrollmentRequestRepository.class);
        courseRepository = mock(CourseRepository.class);
        userRepository = mock(UserRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        batchRepository = mock(BatchRepository.class);
        notificationService = mock(NotificationService.class);
        activityLogService = mock(ActivityLogService.class);

        enrollmentService = new EnrollmentService(
                enrollmentRepository,
                enrollmentRequestRepository,
                courseRepository,
                userRepository,
                studentCourseBatchRepository,
                studentFeeRepository,
                batchRepository,
                notificationService,
                activityLogService
        );
    }

    @Test
    void testEnrollStudentSuccessCreatesFeeAndEnrollment() {
        Course course = Course.builder()
                .id("crs-101")
                .title("Spoken English Mastery")
                .price(new BigDecimal("4999.00"))
                .build();

        User student = User.builder()
                .id("std-101")
                .name("Rohan Sharma")
                .email("rohan@student.com")
                .role("STUDENT")
                .build();

        when(courseRepository.findById("crs-101")).thenReturn(Optional.of(course));
        when(userRepository.findById("std-101")).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentIdAndCourseId("std-101", "crs-101")).thenReturn(Optional.empty());
        when(studentCourseBatchRepository.findByStudentIdAndCourseId("std-101", "crs-101")).thenReturn(Optional.empty());
        when(studentFeeRepository.findByStudentIdAndCourseId("std-101", "crs-101")).thenReturn(Optional.empty());

        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Enrollment result = enrollmentService.enroll("std-101", "rohan@student.com", "crs-101", "Batch Morning Alpha");

        assertNotNull(result);
        assertEquals("crs-101", result.getCourseId());
        assertEquals("std-101", result.getStudentId());
        assertEquals("Active", result.getStatus());
        assertEquals("Spoken English Mastery", result.getCourseTitle());
        assertEquals("Batch Morning Alpha", result.getBatchName());

        // Verify fee record was auto-created with course price
        verify(studentFeeRepository, times(1)).save(argThat(fee ->
                fee.getTotalFee().compareTo(new BigDecimal("4999.00")) == 0
                && "Pending".equalsIgnoreCase(fee.getStatus())
                && "std-101".equals(fee.getStudentId())
                && "crs-101".equals(fee.getCourseId())
        ));

        // Verify student course batch mapping saved
        verify(studentCourseBatchRepository, times(1)).save(any());
    }

    @Test
    void testDeactivateEnrollment() {
        Enrollment activeEnr = Enrollment.builder()
                .id("enr-1")
                .studentId("std-101")
                .courseId("crs-101")
                .status("Active")
                .build();

        when(enrollmentRepository.findByStudentIdAndCourseId("std-101", "crs-101")).thenReturn(Optional.of(activeEnr));
        when(studentCourseBatchRepository.findByStudentIdAndCourseId("std-101", "crs-101")).thenReturn(Optional.empty());

        enrollmentService.deactivateEnrollment("std-101", "crs-101");

        assertEquals("Inactive", activeEnr.getStatus());
        verify(enrollmentRepository, times(1)).save(activeEnr);
    }
}
