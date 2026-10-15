package com.zoroacademy;

import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.service.ActivityLogService;
import com.zoroacademy.service.BunnyStreamService;
import com.zoroacademy.service.CourseService;
import com.zoroacademy.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RenamePropagationTest {

    private CourseRepository courseRepository;
    private CourseModuleRepository courseModuleRepository;
    private CourseResourceRepository courseResourceRepository;
    private UserRepository userRepository;
    private BatchRepository batchRepository;
    private EnrollmentRepository enrollmentRepository;
    private StudentCourseBatchRepository studentCourseBatchRepository;
    private StudentFeeRepository studentFeeRepository;
    private ScheduleRepository scheduleRepository;
    private AssignmentRepository assignmentRepository;
    private DoubtRepository doubtRepository;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseRepository = mock(CourseRepository.class);
        courseModuleRepository = mock(CourseModuleRepository.class);
        courseResourceRepository = mock(CourseResourceRepository.class);
        userRepository = mock(UserRepository.class);
        batchRepository = mock(BatchRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        studentCourseBatchRepository = mock(StudentCourseBatchRepository.class);
        studentFeeRepository = mock(StudentFeeRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        doubtRepository = mock(DoubtRepository.class);

        BunnyStreamService bunnyStreamService = mock(BunnyStreamService.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        VideoRepository videoRepository = mock(VideoRepository.class);

        courseService = new CourseService(
                courseRepository,
                courseModuleRepository,
                courseResourceRepository,
                userRepository,
                batchRepository,
                enrollmentRepository,
                studentCourseBatchRepository,
                studentFeeRepository,
                scheduleRepository,
                assignmentRepository,
                doubtRepository,
                bunnyStreamService,
                fileStorageService,
                videoRepository
        );
    }

    @Test
    void testRenameCoursePropagatesToDependentEntitiesAndGeneratesSlug() {
        Course existing = Course.builder()
                .id("crs-101")
                .title("Old Course Title")
                .slug("old-course-title")
                .mode("Online")
                .googleMeetUrl("https://meet.google.com/abc-defg-hij")
                .price(new BigDecimal("1500.00"))
                .build();

        Batch batch = Batch.builder().id("b-1").courseId("crs-101").courseName("Old Course Title").build();
        Schedule schedule = Schedule.builder().id("sch-1").courseId("crs-101").course("Old Course Title").build();
        Enrollment enrollment = Enrollment.builder().id("enr-1").courseId("crs-101").courseTitle("Old Course Title").build();
        StudentFee fee = StudentFee.builder().id("fee-1").courseId("crs-101").course("Old Course Title").build();

        when(courseRepository.findById("crs-101")).thenReturn(Optional.of(existing));
        when(courseRepository.findBySlug("new-advanced-grammar")).thenReturn(Optional.empty());
        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> inv.getArgument(0));

        when(batchRepository.findByCourseId("crs-101")).thenReturn(List.of(batch));
        when(scheduleRepository.findByCourseId("crs-101")).thenReturn(List.of(schedule));
        when(enrollmentRepository.findByCourseId("crs-101")).thenReturn(List.of(enrollment));
        when(studentFeeRepository.findByCourseId("crs-101")).thenReturn(List.of(fee));
        when(doubtRepository.findByCourseId("crs-101")).thenReturn(Collections.emptyList());
        when(studentCourseBatchRepository.findByCourseId("crs-101")).thenReturn(Collections.emptyList());

        Course updateReq = Course.builder()
                .title("New Advanced Grammar")
                .mode("Online")
                .googleMeetUrl("https://meet.google.com/abc-defg-hij")
                .price(new BigDecimal("2000.00"))
                .build();

        Course updated = courseService.updateCourse("crs-101", updateReq);

        assertEquals("New Advanced Grammar", updated.getTitle());
        assertEquals("new-advanced-grammar", updated.getSlug());

        // Verify propagation saves
        verify(batchRepository, times(1)).save(batch);
        assertEquals("New Advanced Grammar", batch.getCourseName());

        verify(scheduleRepository, times(1)).save(schedule);
        assertEquals("New Advanced Grammar", schedule.getCourse());

        verify(enrollmentRepository, times(1)).save(enrollment);
        assertEquals("New Advanced Grammar", enrollment.getCourseTitle());

        verify(studentFeeRepository, times(1)).save(fee);
        assertEquals("New Advanced Grammar", fee.getCourse());
    }
}
