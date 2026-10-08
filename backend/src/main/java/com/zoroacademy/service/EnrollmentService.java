package com.zoroacademy.service;

import com.zoroacademy.entity.Course;
import com.zoroacademy.entity.Enrollment;
import com.zoroacademy.entity.EnrollmentRequest;
import com.zoroacademy.repository.CourseRepository;
import com.zoroacademy.repository.EnrollmentRepository;
import com.zoroacademy.repository.EnrollmentRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentRequestRepository requestRepository;
    private final CourseRepository courseRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             EnrollmentRequestRepository requestRepository,
                             CourseRepository courseRepository,
                             com.zoroacademy.repository.UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.requestRepository = requestRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Enrollment> getStudentEnrollments(String studentIdOrEmail) {
        List<Enrollment> byId = enrollmentRepository.findByStudentId(studentIdOrEmail);
        if (byId.isEmpty()) {
            return enrollmentRepository.findByStudentEmailIgnoreCase(studentIdOrEmail);
        }
        return byId;
    }

    @Transactional
    public Enrollment enrollStudent(String studentId, String studentEmail, String courseId, String batchName) {
        String effectiveStudentId = studentId;
        String effectiveEmail = studentEmail;

        if (effectiveStudentId != null && effectiveStudentId.contains("@")) {
            effectiveEmail = effectiveStudentId;
            effectiveStudentId = userRepository.findByEmailIgnoreCase(effectiveEmail)
                    .map(com.zoroacademy.entity.User::getId)
                    .orElse(effectiveStudentId);
        } else if (effectiveEmail != null && (effectiveStudentId == null || effectiveStudentId.isBlank())) {
            effectiveStudentId = userRepository.findByEmailIgnoreCase(effectiveEmail)
                    .map(com.zoroacademy.entity.User::getId)
                    .orElse(effectiveEmail);
        } else if (effectiveStudentId != null && (effectiveEmail == null || effectiveEmail.isBlank())) {
            effectiveEmail = userRepository.findById(effectiveStudentId)
                    .map(com.zoroacademy.entity.User::getEmail)
                    .orElse(effectiveStudentId);
        }

        boolean exists = enrollmentRepository.existsByStudentIdAndCourseId(effectiveStudentId, courseId)
                || (effectiveEmail != null && enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId(effectiveEmail, courseId));

        if (exists) {
            throw new IllegalArgumentException("Student is already enrolled in this course.");
        }

        Optional<Course> courseOpt = courseRepository.findById(courseId);
        String courseTitle = courseOpt.map(Course::getTitle).orElse(courseId);

        Enrollment enrollment = Enrollment.builder()
                .id("enr_" + java.util.UUID.randomUUID())
                .studentId(effectiveStudentId)
                .studentEmail(effectiveEmail != null ? effectiveEmail : "")
                .courseId(courseId)
                .courseTitle(courseTitle)
                .batchName(batchName)
                .enrolledDate(LocalDate.now().toString())
                .status("Active")
                .build();

        enrollment = enrollmentRepository.save(enrollment);

        // Increment enrolled count on course
        courseOpt.ifPresent(course -> {
            course.setEnrolled((course.getEnrolled() != null ? course.getEnrolled() : 0) + 1);
            courseRepository.save(course);
        });

        return enrollment;
    }

    @Transactional(readOnly = true)
    public List<EnrollmentRequest> getAllEnrollmentRequests() {
        return requestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentRequest> getStudentEnrollmentRequests(String studentIdOrEmail) {
        List<EnrollmentRequest> byId = requestRepository.findByStudentId(studentIdOrEmail);
        if (byId.isEmpty()) {
            return requestRepository.findByStudentEmailIgnoreCase(studentIdOrEmail);
        }
        return byId;
    }

    @Transactional
    public EnrollmentRequest createEnrollmentRequest(EnrollmentRequest req) {
        String effectiveEmail = req.getStudentEmail() != null ? req.getStudentEmail() : req.getStudentId();
        
        // Prevent duplicate pending requests
        Optional<EnrollmentRequest> existing = requestRepository.findByStudentIdAndCourseIdAndStatus(req.getStudentId(), req.getCourseId(), "Pending")
                .or(() -> requestRepository.findByStudentEmailIgnoreCaseAndCourseIdAndStatus(effectiveEmail, req.getCourseId(), "Pending"));

        if (existing.isPresent()) {
            return existing.get();
        }

        if (req.getId() == null || req.getId().isBlank()) {
            req.setId("enr_req_" + java.util.UUID.randomUUID());
        }
        if (req.getStatus() == null || req.getStatus().isBlank()) {
            req.setStatus("Pending");
        }
        if (req.getRequestDate() == null || req.getRequestDate().isBlank()) {
            req.setRequestDate(LocalDate.now().toString());
        }

        return requestRepository.save(req);
    }

    @Transactional
    public EnrollmentRequest updateEnrollmentRequestStatus(String id, String status, String remarks) {
        EnrollmentRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment request not found: " + id));

        req.setStatus(status);
        if (remarks != null) req.setRemarks(remarks);

        // If approved, automatically enroll student
        if ("Approved".equalsIgnoreCase(status)) {
            try {
                enrollStudent(req.getStudentId(), req.getStudentEmail(), req.getCourseId(), req.getBatchName());
            } catch (Exception ignored) {
                // Ignore if already enrolled
            }
        }

        return requestRepository.save(req);
    }
}
