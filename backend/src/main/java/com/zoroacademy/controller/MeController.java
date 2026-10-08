package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentCourseBatchRepository studentCourseBatchRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final ScheduleRepository scheduleRepository;
    private final TrainerCourseRequestRepository trainerCourseRequestRepository;

    public MeController(UserRepository userRepository,
                        CourseRepository courseRepository,
                        BatchRepository batchRepository,
                        EnrollmentRepository enrollmentRepository,
                        StudentCourseBatchRepository studentCourseBatchRepository,
                        AssignmentRepository assignmentRepository,
                        AssignmentSubmissionRepository assignmentSubmissionRepository,
                        ScheduleRepository scheduleRepository,
                        TrainerCourseRequestRepository trainerCourseRequestRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.scheduleRepository = scheduleRepository;
        this.trainerCourseRequestRepository = trainerCourseRequestRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        String identifier;
        if (auth.getPrincipal() instanceof UserPrincipal up) {
            identifier = up.getId();
        } else if (auth.getPrincipal() instanceof UserDetails ud) {
            identifier = ud.getUsername();
        } else {
            identifier = auth.getName();
        }

        return userRepository.findById(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found: " + identifier));
    }

    @GetMapping("/courses")
    public ApiResponse<List<Course>> getMyCourses() {
        User user = getCurrentUser();
        String role = user.getRole().toUpperCase();

        if ("ADMIN".equals(role)) {
            return ApiResponse.ok(courseRepository.findAll());
        }

        if ("TRAINER".equals(role)) {
            List<Course> courses = new ArrayList<>(courseRepository.findByTrainerIdOrAssignedTrainerIgnoreCase(user.getId(), user.getName()));
            Set<String> courseIds = courses.stream().map(Course::getId).collect(Collectors.toSet());

            // Include courses where trainer has an approved request
            List<TrainerCourseRequest> approvedReqs = trainerCourseRequestRepository.findByTrainerIdAndStatusIgnoreCase(user.getId(), "Approved");
            for (TrainerCourseRequest req : approvedReqs) {
                if (!courseIds.contains(req.getCourseId())) {
                    courseRepository.findById(req.getCourseId()).ifPresent(c -> {
                        courses.add(c);
                        courseIds.add(c.getId());
                    });
                }
            }
            return ApiResponse.ok(courses);
        }

        // STUDENT
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(user.getId()).stream()
                .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                .toList();
        List<String> courseIds = enrollments.stream().map(Enrollment::getCourseId).distinct().toList();
        List<Course> enrolledCourses = courseRepository.findAllById(courseIds);
        return ApiResponse.ok(enrolledCourses);
    }

    @GetMapping("/batches")
    public ApiResponse<List<Batch>> getMyBatches() {
        User user = getCurrentUser();
        String role = user.getRole().toUpperCase();

        if ("ADMIN".equals(role)) {
            return ApiResponse.ok(batchRepository.findAll());
        }

        if ("TRAINER".equals(role)) {
            return ApiResponse.ok(batchRepository.findByTrainerIdOrTrainerNameIgnoreCase(user.getId(), user.getName()));
        }

        // STUDENT
        Set<String> batchIds = studentCourseBatchRepository.findByStudentId(user.getId()).stream()
                .map(StudentCourseBatch::getBatchId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Batch> batches = batchRepository.findAllById(batchIds);
        return ApiResponse.ok(batches);
    }

    @GetMapping("/assignments")
    public ApiResponse<List<Assignment>> getMyAssignments() {
        User user = getCurrentUser();
        String role = user.getRole().toUpperCase();

        if ("ADMIN".equals(role)) {
            return ApiResponse.ok(assignmentRepository.findAll());
        }

        if ("TRAINER".equals(role)) {
            return ApiResponse.ok(assignmentRepository.findByTrainerIdOrTrainerIgnoreCase(user.getId(), user.getName()));
        }

        // STUDENT: assignments matching student's enrolled courses and batches
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(user.getId()).stream()
                .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                .toList();

        Set<String> courseIds = enrollments.stream().map(Enrollment::getCourseId).collect(Collectors.toSet());
        Set<String> courseTitles = enrollments.stream().map(Enrollment::getCourseTitle).filter(Objects::nonNull).map(String::toLowerCase).collect(Collectors.toSet());
        Set<String> batchIds = enrollments.stream().map(Enrollment::getBatchId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<String> batchNames = enrollments.stream().map(Enrollment::getBatchName).filter(Objects::nonNull).map(String::toLowerCase).collect(Collectors.toSet());

        List<Assignment> matching = assignmentRepository.findAll().stream()
                .filter(a -> {
                    boolean courseMatch = (a.getCourseId() != null && courseIds.contains(a.getCourseId()))
                            || (a.getCourse() != null && courseTitles.contains(a.getCourse().toLowerCase()));
                    if (!courseMatch) return false;

                    if (a.getBatchId() != null && !a.getBatchId().isBlank() && !"All".equalsIgnoreCase(a.getBatchId())) {
                        return batchIds.contains(a.getBatchId()) || (a.getBatch() != null && batchNames.contains(a.getBatch().toLowerCase()));
                    }
                    if (a.getBatch() != null && !a.getBatch().isBlank() && !"All".equalsIgnoreCase(a.getBatch())) {
                        return batchNames.contains(a.getBatch().toLowerCase()) || (a.getBatchId() != null && batchIds.contains(a.getBatchId()));
                    }
                    return true;
                })
                .toList();

        return ApiResponse.ok(matching);
    }

    @GetMapping("/submissions")
    public ApiResponse<List<AssignmentSubmission>> getMySubmissions() {
        User user = getCurrentUser();
        String role = user.getRole().toUpperCase();

        if ("ADMIN".equals(role)) {
            return ApiResponse.ok(assignmentSubmissionRepository.findAll());
        }

        if ("TRAINER".equals(role)) {
            return ApiResponse.ok(assignmentSubmissionRepository.findByTrainerIdOrAssignedTrainerIgnoreCase(user.getId(), user.getName()));
        }

        // STUDENT
        return ApiResponse.ok(assignmentSubmissionRepository.findByStudentIdOrStudentEmailIgnoreCase(user.getId(), user.getEmail()));
    }

    @GetMapping("/schedules")
    public ApiResponse<List<Schedule>> getMySchedules() {
        User user = getCurrentUser();
        String role = user.getRole().toUpperCase();

        if ("ADMIN".equals(role)) {
            return ApiResponse.ok(scheduleRepository.findAll());
        }

        if ("TRAINER".equals(role)) {
            return ApiResponse.ok(scheduleRepository.findByTrainerIdOrTrainerIgnoreCaseOrderByDateAsc(user.getId(), user.getName()));
        }

        // STUDENT
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(user.getId()).stream()
                .filter(e -> "Active".equalsIgnoreCase(e.getStatus()))
                .toList();

        Set<String> courseIds = enrollments.stream().map(Enrollment::getCourseId).collect(Collectors.toSet());
        Set<String> courseTitles = enrollments.stream().map(Enrollment::getCourseTitle).filter(Objects::nonNull).map(String::toLowerCase).collect(Collectors.toSet());
        Set<String> batchIds = enrollments.stream().map(Enrollment::getBatchId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<String> batchNames = enrollments.stream().map(Enrollment::getBatchName).filter(Objects::nonNull).map(String::toLowerCase).collect(Collectors.toSet());

        List<Schedule> matching = scheduleRepository.findAll().stream()
                .filter(s -> {
                    boolean courseMatch = (s.getCourseId() != null && courseIds.contains(s.getCourseId()))
                            || (s.getCourse() != null && courseTitles.contains(s.getCourse().toLowerCase()));
                    if (!courseMatch) return false;

                    if (s.getBatchId() != null && !s.getBatchId().isBlank() && !"All".equalsIgnoreCase(s.getBatchId())) {
                        return batchIds.contains(s.getBatchId()) || (s.getBatch() != null && batchNames.contains(s.getBatch().toLowerCase()));
                    }
                    if (s.getBatch() != null && !s.getBatch().isBlank() && !"All".equalsIgnoreCase(s.getBatch())) {
                        return batchNames.contains(s.getBatch().toLowerCase()) || (s.getBatchId() != null && batchIds.contains(s.getBatchId()));
                    }
                    return true;
                })
                .toList();

        return ApiResponse.ok(matching);
    }
}
