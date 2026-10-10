package com.zoroacademy;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Enquiry;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.EnquiryRepository;
import com.zoroacademy.service.EnquiryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EnquiryPersistenceTest {

    private EnquiryRepository enquiryRepository;
    private CourseRepository courseRepository;
    private EnquiryService enquiryService;

    @BeforeEach
    void setUp() {
        enquiryRepository = mock(EnquiryRepository.class);
        courseRepository = mock(CourseRepository.class);
        enquiryService = new EnquiryService(enquiryRepository, courseRepository);

        when(enquiryRepository.save(any(Enquiry.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("createEnquiry with courseId populates courseInterest from CourseRepository")
    void createEnquiryWithCourseIdPopulatesCourseInterest() {
        Course course = new Course();
        course.setId("course-vedic");
        course.setTitle("Vedic Mathematics Mastery");
        when(courseRepository.findById("course-vedic")).thenReturn(Optional.of(course));

        Enquiry enquiry = Enquiry.builder()
                .name("Rohan Sharma")
                .phone("9876543210")
                .email("rohan@example.com")
                .courseId("course-vedic")
                .message("Interested in weekend batch")
                .build();

        Enquiry saved = enquiryService.createEnquiry(enquiry);

        assertNotNull(saved.getId());
        assertEquals("course-vedic", saved.getCourseId());
        assertEquals("Vedic Mathematics Mastery", saved.getCourseInterest());
        assertEquals("9876543210", saved.getPhone());
    }

    @Test
    @DisplayName("createEnquiry with courseInterest populates courseId from CourseRepository")
    void createEnquiryWithCourseInterestPopulatesCourseId() {
        Course course = new Course();
        course.setId("course-abacus");
        course.setTitle("Advanced Abacus");
        when(courseRepository.findByTitleIgnoreCase("Advanced Abacus")).thenReturn(Optional.of(course));

        Enquiry enquiry = Enquiry.builder()
                .name("Priya Patel")
                .phone("9876543211")
                .courseInterest("Advanced Abacus")
                .build();

        Enquiry saved = enquiryService.createEnquiry(enquiry);

        assertEquals("course-abacus", saved.getCourseId());
        assertEquals("Advanced Abacus", saved.getCourseInterest());
    }

    @Test
    @DisplayName("createEnquiry without course saves with null courseId and null courseInterest")
    void createEnquiryWithoutCourseSavesSuccessfully() {
        Enquiry enquiry = Enquiry.builder()
                .name("General Inquirer")
                .phone("9876543212")
                .message("Inquiring about upcoming sessions")
                .build();

        Enquiry saved = enquiryService.createEnquiry(enquiry);

        assertNull(saved.getCourseId());
        assertNull(saved.getCourseInterest());
        assertEquals("New", saved.getStatus());
    }

    @Test
    @DisplayName("createEnquiry with both courseId and courseInterest preserves both")
    void createEnquiryWithBothCourseIdAndInterest() {
        Enquiry enquiry = Enquiry.builder()
                .name("Ananya")
                .phone("9876543213")
                .courseId("course-robotics")
                .courseInterest("Robotics 101")
                .build();

        Enquiry saved = enquiryService.createEnquiry(enquiry);

        assertEquals("course-robotics", saved.getCourseId());
        assertEquals("Robotics 101", saved.getCourseInterest());
        verify(courseRepository, never()).findById(any());
        verify(courseRepository, never()).findByTitleIgnoreCase(any());
    }
}
