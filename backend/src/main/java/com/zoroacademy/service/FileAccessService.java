package com.zoroacademy.service;

import com.zoroacademy.entity.*;
import com.zoroacademy.repository.*;
import com.zoroacademy.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class FileAccessService {

    private final StoredFileRepository storedFileRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CourseRepository courseRepository;
    private final ScheduleRepository scheduleRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CourseResourceRepository courseResourceRepository;
    private final CompetitionRepository competitionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentCourseBatchRepository studentCourseBatchRepository;
    private final BatchRepository batchRepository;
    private final TrainerCourseRequestRepository trainerCourseRequestRepository;
    private final UserRepository userRepository;
    private final CourseService courseService;
    private final ScheduleService scheduleService;

    @Autowired
    public FileAccessService(
            StoredFileRepository storedFileRepository,
            CourseModuleRepository courseModuleRepository,
            CourseRepository courseRepository,
            ScheduleRepository scheduleRepository,
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository assignmentSubmissionRepository,
            CourseResourceRepository courseResourceRepository,
            CompetitionRepository competitionRepository,
            EnrollmentRepository enrollmentRepository,
            StudentCourseBatchRepository studentCourseBatchRepository,
            BatchRepository batchRepository,
            TrainerCourseRequestRepository trainerCourseRequestRepository,
            UserRepository userRepository,
            CourseService courseService,
            ScheduleService scheduleService
    ) {
        this.storedFileRepository = storedFileRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.courseRepository = courseRepository;
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.courseResourceRepository = courseResourceRepository;
        this.competitionRepository = competitionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentCourseBatchRepository = studentCourseBatchRepository;
        this.batchRepository = batchRepository;
        this.trainerCourseRequestRepository = trainerCourseRequestRepository;
        this.userRepository = userRepository;
        this.courseService = courseService;
        this.scheduleService = scheduleService;
    }

    @Transactional(readOnly = true)
    public FileAccessResult checkAccess(StoredFile file, UserPrincipal currentUser) {
        if (file == null) {
            return FileAccessResult.notFound("File not found");
        }

        // Public files are accessible to everyone
        if (Boolean.TRUE.equals(file.getIsPublic())) {
            return FileAccessResult.allowed();
        }

        // Private file requires authentication
        if (currentUser == null) {
            return FileAccessResult.authRequired("Authentication required to access private file");
        }

        String userId = currentUser.getId();
        String userEmail = currentUser.getEmail() != null ? currentUser.getEmail().trim().toLowerCase() : "";
        String roleUpper = currentUser.getRole() != null ? currentUser.getRole().toUpperCase() : "";

        // Admin always has full access
        if ("ADMIN".equals(roleUpper) || "SUPER_ADMIN".equals(roleUpper)) {
            return FileAccessResult.allowed();
        }

        // The file owner always has full access
        if (userId != null && userId.equals(file.getOwnerId())) {
            return FileAccessResult.allowed();
        }

        String fileId = file.getId();

        // Find all records that reference this file
        List<CourseModule> modules = courseModuleRepository.findByAnyFileUrlContaining(fileId);
        List<Schedule> schedules = scheduleRepository.findByAnyFileUrlContaining(fileId);
        List<Assignment> assignments = assignmentRepository.findByAnyFileUrlContaining(fileId);
        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAnyFileUrlContaining(fileId);
        List<CourseResource> courseResources = courseResourceRepository.findByFileUrlContaining(fileId);
        List<Competition> competitions = competitionRepository.findByRulesPdfUrlContaining(fileId);

        boolean hasReferences = !modules.isEmpty() || !schedules.isEmpty() || !assignments.isEmpty()
                || !submissions.isEmpty() || !courseResources.isEmpty() || !competitions.isEmpty();

        // A private file referenced nowhere is denied with a clear reason
        if (!hasReferences) {
            return FileAccessResult.forbidden("Access denied: Private file is not referenced by any course, schedule, or assignment");
        }

        // Competitions: if referenced in a competition, access is allowed
        if (!competitions.isEmpty()) {
            return FileAccessResult.allowed();
        }

        // STUDENT access authorization
        if ("STUDENT".equals(roleUpper)) {
            // Submissions: submissions/corrections only for the submitter, assigned reviewer and admin
            if (!submissions.isEmpty()) {
                boolean isSubmitter = submissions.stream().anyMatch(sub ->
                        (userId != null && userId.equalsIgnoreCase(sub.getStudentId()))
                                || (userEmail != null && userEmail.equalsIgnoreCase(sub.getStudentEmail()))
                );
                if (isSubmitter) {
                    return FileAccessResult.allowed();
                }
                if (modules.isEmpty() && schedules.isEmpty() && assignments.isEmpty() && courseResources.isEmpty()) {
                    return FileAccessResult.forbidden("You do not have permission to access another student's submission or correction");
                }
            }

            // Course Modules: sequential module lock + course enrollment
            if (!modules.isEmpty()) {
                for (CourseModule mod : modules) {
                    Course course = mod.getCourse();
                    if (course != null) {
                        String courseId = course.getId();
                        if (!isStudentEnrolledInCourse(userId, userEmail, courseId, course.getTitle())) {
                            return FileAccessResult.notEnrolled("You are not enrolled in this course");
                        }
                        if (courseService != null && courseService.isModuleLockedForStudent(courseId, mod.getId(), userId, userEmail)) {
                            int modNum = (mod.getModuleOrder() != null && mod.getModuleOrder() > 1) ? (mod.getModuleOrder() - 1) : 1;
                            return FileAccessResult.lockedModule("Complete Module " + modNum + " to unlock this resource");
                        }
                    }
                }
            }

            // Schedules: batch membership + 60-minute pre-session unlock
            if (!schedules.isEmpty()) {
                for (Schedule sched : schedules) {
                    if (!isStudentInBatch(userId, userEmail, sched.getBatchId(), sched.getBatch(), sched.getCourseId(), sched.getCourse())) {
                        return FileAccessResult.forbidden("This schedule resource is for another batch");
                    }
                    if (scheduleService != null && scheduleService.isScheduleLockedForStudent(sched, userId, userEmail)) {
                        String unlockLabel = com.zoroacademy.util.ScheduleTimeUtil.formatUnlockTime(
                                sched.getDate(), sched.getTime(), scheduleService.getResourcesUnlockMinutes()
                        );
                        return FileAccessResult.lockedSchedule("Schedule resources are locked. " + unlockLabel, unlockLabel);
                    }
                }
            }

            // Assignments: course + batch enrollment
            if (!assignments.isEmpty()) {
                for (Assignment a : assignments) {
                    if (!isStudentEnrolledInCourse(userId, userEmail, a.getCourseId(), a.getCourse())) {
                        return FileAccessResult.notEnrolled("You are not enrolled in this course");
                    }
                    if (a.getBatchId() != null && !a.getBatchId().isBlank()) {
                        if (!isStudentInBatch(userId, userEmail, a.getBatchId(), a.getBatch(), a.getCourseId(), a.getCourse())) {
                            return FileAccessResult.forbidden("This assignment is for another batch");
                        }
                    }
                }
            }

            // Course Resources: course enrollment
            if (!courseResources.isEmpty()) {
                for (CourseResource cr : courseResources) {
                    Course c = cr.getCourse();
                    if (c != null && !isStudentEnrolledInCourse(userId, userEmail, c.getId(), c.getTitle())) {
                        return FileAccessResult.notEnrolled("You are not enrolled in this course");
                    }
                }
            }

            return FileAccessResult.allowed();
        }

        // TRAINER access authorization
        if ("TRAINER".equals(roleUpper)) {
            String trainerUsername = currentUser.getUsername();

            // Submissions: submitter, assigned reviewer, or course/batch teacher
            if (!submissions.isEmpty()) {
                boolean canAccessSub = submissions.stream().anyMatch(sub ->
                        isTrainerAuthorizedForSubmission(userId, userEmail, trainerUsername, sub)
                );
                if (canAccessSub) {
                    return FileAccessResult.allowed();
                }
                if (modules.isEmpty() && schedules.isEmpty() && assignments.isEmpty() && courseResources.isEmpty()) {
                    return FileAccessResult.forbidden("You do not have permission to access this submission");
                }
            }

            // Modules: courses they teach or approved trainer learning
            if (!modules.isEmpty()) {
                boolean authorized = modules.stream().anyMatch(m ->
                        isTrainerAuthorizedForCourse(userId, userEmail, trainerUsername, m.getCourse())
                );
                if (!authorized) {
                    return FileAccessResult.forbidden("You are not assigned to teach or enrolled in this course");
                }
            }

            // Schedules: assigned schedule or batch
            if (!schedules.isEmpty()) {
                boolean authorized = schedules.stream().anyMatch(s ->
                        isTrainerAuthorizedForSchedule(userId, trainerUsername, s)
                );
                if (!authorized) {
                    return FileAccessResult.forbidden("You are not assigned to this schedule");
                }
            }

            // Assignments: assigned assignment or course teacher
            if (!assignments.isEmpty()) {
                boolean authorized = assignments.stream().anyMatch(a ->
                        isTrainerAuthorizedForAssignment(userId, trainerUsername, a)
                );
                if (!authorized) {
                    return FileAccessResult.forbidden("You are not assigned to teach this assignment");
                }
            }

            // Course Resources: course teacher or approved learner
            if (!courseResources.isEmpty()) {
                boolean authorized = courseResources.stream().anyMatch(cr ->
                        isTrainerAuthorizedForCourse(userId, userEmail, trainerUsername, cr.getCourse())
                );
                if (!authorized) {
                    return FileAccessResult.forbidden("You do not have permission to access this resource");
                }
            }

            return FileAccessResult.allowed();
        }

        return FileAccessResult.forbidden("Access denied: role not permitted");
    }

    private boolean isStudentEnrolledInCourse(String studentId, String studentEmail, String courseId, String courseTitle) {
        if (courseId == null && courseTitle == null) return false;

        if (studentId != null && courseId != null) {
            if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) return true;
            if (studentCourseBatchRepository.findByStudentIdAndCourseId(studentId, courseId).isPresent()) return true;
        }

        if (studentEmail != null && courseId != null) {
            if (enrollmentRepository.existsByStudentEmailIgnoreCaseAndCourseId(studentEmail, courseId)) return true;
        }

        // Check user profile for enrolled course title/id
        Optional<User> uOpt = Optional.empty();
        if (studentId != null) {
            uOpt = userRepository.findById(studentId);
        }
        if (uOpt.isEmpty() && studentEmail != null) {
            uOpt = userRepository.findByEmailIgnoreCase(studentEmail);
        }

        if (uOpt.isPresent()) {
            User u = uOpt.get();
            if (u.getCourse() != null) {
                if (courseId != null && (u.getCourse().equalsIgnoreCase(courseId) || u.getCourse().toLowerCase().contains(courseId.toLowerCase()))) {
                    return true;
                }
                if (courseTitle != null && (u.getCourse().equalsIgnoreCase(courseTitle) || u.getCourse().toLowerCase().contains(courseTitle.toLowerCase()))) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean isStudentInBatch(String studentId, String studentEmail, String batchId, String batchName, String courseId, String courseTitle) {
        if ((batchId == null || batchId.isBlank()) && (batchName == null || batchName.isBlank())) {
            return isStudentEnrolledInCourse(studentId, studentEmail, courseId, courseTitle);
        }

        if (studentId != null) {
            List<StudentCourseBatch> scbs = studentCourseBatchRepository.findByStudentId(studentId);
            if (scbs.stream().anyMatch(scb -> batchId != null && batchId.equalsIgnoreCase(scb.getBatchId()))) {
                return true;
            }
            List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
            if (enrollments.stream().anyMatch(e ->
                    (batchId != null && batchId.equalsIgnoreCase(e.getBatchId()))
                            || (batchName != null && batchName.equalsIgnoreCase(e.getBatchName()))
            )) {
                return true;
            }
        }

        if (studentEmail != null) {
            List<Enrollment> enrollments = enrollmentRepository.findByStudentEmailIgnoreCase(studentEmail);
            if (enrollments.stream().anyMatch(e ->
                    (batchId != null && batchId.equalsIgnoreCase(e.getBatchId()))
                            || (batchName != null && batchName.equalsIgnoreCase(e.getBatchName()))
            )) {
                return true;
            }
        }

        return false;
    }

    private boolean isTrainerAuthorizedForCourse(String trainerId, String trainerEmail, String trainerUsername, Course course) {
        if (course == null) return false;

        // Check assigned trainer on course
        if (trainerId != null) {
            if (trainerId.equalsIgnoreCase(course.getTrainerId()) || trainerId.equalsIgnoreCase(course.getAssignedTrainerId())) {
                return true;
            }
        }
        if (trainerUsername != null && trainerUsername.equalsIgnoreCase(course.getAssignedTrainer())) {
            return true;
        }

        // Check if trainer teaches any batch of this course
        List<Batch> batches = batchRepository.findByCourseId(course.getId());
        for (Batch b : batches) {
            if (trainerId != null) {
                if (trainerId.equalsIgnoreCase(b.getTrainerId())) return true;
                if (b.getTrainerIds() != null && b.getTrainerIds().contains(trainerId)) return true;
            }
            if (trainerUsername != null && trainerUsername.equalsIgnoreCase(b.getTrainerName())) {
                return true;
            }
        }

        // Check if trainer has an approved TrainerCourseRequest for this course
        if (trainerId != null) {
            if (trainerCourseRequestRepository.findByTrainerIdAndCourseIdAndStatusIgnoreCase(trainerId, course.getId(), "Approved").isPresent()) {
                return true;
            }
        }
        if (trainerEmail != null) {
            List<TrainerCourseRequest> reqs = trainerCourseRequestRepository.findByTrainerEmailIgnoreCase(trainerEmail);
            if (reqs.stream().anyMatch(r -> course.getId().equalsIgnoreCase(r.getCourseId()) && "Approved".equalsIgnoreCase(r.getStatus()))) {
                return true;
            }
        }

        return false;
    }

    private boolean isTrainerAuthorizedForSchedule(String trainerId, String trainerUsername, Schedule schedule) {
        if (schedule == null) return false;
        if (trainerId != null && trainerId.equalsIgnoreCase(schedule.getTrainerId())) return true;
        if (trainerUsername != null && trainerUsername.equalsIgnoreCase(schedule.getTrainer())) return true;

        if (schedule.getBatchId() != null) {
            Batch b = batchRepository.findById(schedule.getBatchId()).orElse(null);
            if (b != null) {
                if (trainerId != null) {
                    if (trainerId.equalsIgnoreCase(b.getTrainerId())) return true;
                    if (b.getTrainerIds() != null && b.getTrainerIds().contains(trainerId)) return true;
                }
                if (trainerUsername != null && trainerUsername.equalsIgnoreCase(b.getTrainerName())) return true;
            }
        }

        return false;
    }

    private boolean isTrainerAuthorizedForAssignment(String trainerId, String trainerUsername, Assignment assignment) {
        if (assignment == null) return false;
        if (trainerId != null && trainerId.equalsIgnoreCase(assignment.getTrainerId())) return true;
        if (trainerUsername != null && trainerUsername.equalsIgnoreCase(assignment.getTrainer())) return true;

        if (assignment.getCourseId() != null) {
            Course c = courseRepository.findById(assignment.getCourseId()).orElse(null);
            if (c != null && isTrainerAuthorizedForCourse(trainerId, null, trainerUsername, c)) {
                return true;
            }
        }

        return false;
    }

    private boolean isTrainerAuthorizedForSubmission(String trainerId, String trainerEmail, String trainerUsername, AssignmentSubmission sub) {
        if (sub == null) return false;

        // Submitter is this trainer
        if (trainerId != null && (trainerId.equalsIgnoreCase(sub.getStudentId()) || trainerId.equalsIgnoreCase(sub.getTrainerId()))) {
            return true;
        }
        if (trainerEmail != null && trainerEmail.equalsIgnoreCase(sub.getStudentEmail())) {
            return true;
        }

        // Assigned reviewer / trainer
        if (trainerId != null && trainerId.equalsIgnoreCase(sub.getTrainerId())) {
            return true;
        }
        if (trainerUsername != null && trainerUsername.equalsIgnoreCase(sub.getAssignedTrainer())) {
            return true;
        }

        // Teaches the course or batch
        if (sub.getCourseId() != null) {
            Course c = courseRepository.findById(sub.getCourseId()).orElse(null);
            if (c != null && isTrainerAuthorizedForCourse(trainerId, trainerEmail, trainerUsername, c)) {
                return true;
            }
        }

        if (sub.getBatchId() != null) {
            Batch b = batchRepository.findById(sub.getBatchId()).orElse(null);
            if (b != null) {
                if (trainerId != null) {
                    if (trainerId.equalsIgnoreCase(b.getTrainerId())) return true;
                    if (b.getTrainerIds() != null && b.getTrainerIds().contains(trainerId)) return true;
                }
                if (trainerUsername != null && trainerUsername.equalsIgnoreCase(b.getTrainerName())) return true;
            }
        }

        return false;
    }
}
