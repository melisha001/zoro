package com.zoroacademy.service;

import com.zoroacademy.entity.Assignment;
import com.zoroacademy.entity.AssignmentSubmission;
import com.zoroacademy.repository.AssignmentRepository;
import com.zoroacademy.repository.AssignmentSubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final com.zoroacademy.repository.CourseRepository courseRepository;
    private final com.zoroacademy.repository.BatchRepository batchRepository;
    private final com.zoroacademy.repository.UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             AssignmentSubmissionRepository submissionRepository,
                             com.zoroacademy.repository.CourseRepository courseRepository,
                             com.zoroacademy.repository.BatchRepository batchRepository,
                             com.zoroacademy.repository.UserRepository userRepository,
                             NotificationService notificationService,
                             ActivityLogService activityLogService) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    @Transactional
    public Assignment createAssignment(Assignment assignment) {
        if (assignment.getId() == null || assignment.getId().isBlank()) {
            assignment.setId("asg_" + java.util.UUID.randomUUID());
        }

        // Relational course resolution
        if (assignment.getCourseId() != null && !assignment.getCourseId().isBlank()) {
            courseRepository.findById(assignment.getCourseId()).ifPresent(c -> assignment.setCourse(c.getTitle()));
        } else if (assignment.getCourse() != null && !assignment.getCourse().isBlank()) {
            courseRepository.findByTitleIgnoreCase(assignment.getCourse()).ifPresent(c -> assignment.setCourseId(c.getId()));
        }

        // Relational batch resolution
        if (assignment.getBatchId() != null && !assignment.getBatchId().isBlank()) {
            batchRepository.findById(assignment.getBatchId()).ifPresent(b -> assignment.setBatch(b.getName()));
        } else if (assignment.getBatch() != null && !assignment.getBatch().isBlank()) {
            batchRepository.findByNameIgnoreCaseAndCourseId(assignment.getBatch(), assignment.getCourseId())
                    .or(() -> batchRepository.findByNameIgnoreCaseAndCourseNameIgnoreCase(assignment.getBatch(), assignment.getCourse()))
                    .ifPresent(b -> assignment.setBatchId(b.getId()));
        }

        // Relational trainer resolution
        if (assignment.getTrainerId() != null && !assignment.getTrainerId().isBlank()) {
            userRepository.findById(assignment.getTrainerId()).ifPresent(u -> assignment.setTrainer(u.getName()));
        } else if (assignment.getTrainer() != null && !assignment.getTrainer().isBlank()) {
            userRepository.findByNameIgnoreCase(assignment.getTrainer()).stream()
                    .filter(u -> "TRAINER".equalsIgnoreCase(u.getRole()))
                    .findFirst()
                    .ifPresent(u -> assignment.setTrainerId(u.getId()));
        }

        Assignment saved = assignmentRepository.save(assignment);

        activityLogService.logAction(
                saved.getTrainerId() != null ? saved.getTrainerId() : "TRAINER",
                saved.getTrainer() != null ? saved.getTrainer() : "Trainer",
                "ASSIGNMENT_CREATED",
                "Created assignment: " + saved.getTitle() + " for " + saved.getCourse(),
                "System"
        );

        notificationService.createNotification(com.zoroacademy.entity.Notification.builder()
                .id("notif_" + java.util.UUID.randomUUID())
                .recipientRole("STUDENT")
                .title("New Assignment Posted")
                .message("New assignment '" + saved.getTitle() + "' posted for " + saved.getCourse() + ".")
                .readStatus(false)
                .build());

        return saved;
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getAllSubmissions() {
        return submissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getSubmissionsByStudent(String studentIdOrEmail) {
        return submissionRepository.findByStudentIdOrStudentEmailIgnoreCase(studentIdOrEmail, studentIdOrEmail);
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getSubmissionsByTrainer(String trainerIdOrName) {
        return submissionRepository.findByTrainerIdOrAssignedTrainerIgnoreCase(trainerIdOrName, trainerIdOrName);
    }

    @Transactional
    public AssignmentSubmission createSubmission(AssignmentSubmission submission) {
        if (submission.getId() == null || submission.getId().isBlank()) {
            submission.setId("sub_" + java.util.UUID.randomUUID());
        }
        if (submission.getSubmittedAt() == null || submission.getSubmittedAt().isBlank()) {
            submission.setSubmittedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")));
        }
        if (submission.getStatus() == null || submission.getStatus().isBlank()) {
            submission.setStatus("Pending Correction");
        }

        // Relational student resolution
        if (submission.getStudentId() != null && !submission.getStudentId().isBlank()) {
            userRepository.findById(submission.getStudentId()).ifPresent(u -> {
                submission.setStudentName(u.getName());
                submission.setStudentEmail(u.getEmail());
            });
        } else if (submission.getStudentEmail() != null && !submission.getStudentEmail().isBlank()) {
            userRepository.findByEmailIgnoreCase(submission.getStudentEmail()).ifPresent(u -> {
                submission.setStudentId(u.getId());
                submission.setStudentName(u.getName());
            });
        }

        // Relational assignment resolution
        if (submission.getAssignmentId() != null && !submission.getAssignmentId().isBlank()) {
            assignmentRepository.findById(submission.getAssignmentId()).ifPresent(a -> {
                submission.setAssignmentTitle(a.getTitle());
                if (submission.getCourseId() == null) submission.setCourseId(a.getCourseId());
                if (submission.getCourseTitle() == null) submission.setCourseTitle(a.getCourse());
                if (submission.getBatchId() == null) submission.setBatchId(a.getBatchId());
                if (submission.getBatchName() == null) submission.setBatchName(a.getBatch());
                if (submission.getTrainerId() == null) submission.setTrainerId(a.getTrainerId());
                if (submission.getAssignedTrainer() == null) submission.setAssignedTrainer(a.getTrainer());
            });
        }

        return submissionRepository.save(submission);
    }

    @Transactional
    public AssignmentSubmission reviewSubmission(String id, String score, String remarks, String correctedBy, String correctionAttachment) {
        AssignmentSubmission sub = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + id));

        sub.setScore(score);
        sub.setRemarks(remarks);
        sub.setCorrectedBy(correctedBy);
        sub.setCorrectedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")));
        sub.setStatus("Corrected");
        if (correctionAttachment != null) {
            sub.setCorrectionAttachment(correctionAttachment);
        }

        AssignmentSubmission saved = submissionRepository.save(sub);

        activityLogService.logAction(
                correctedBy != null ? correctedBy : "TRAINER",
                correctedBy != null ? correctedBy : "Trainer",
                "SUBMISSION_GRADED",
                "Graded submission for " + saved.getStudentName() + " on " + saved.getAssignmentTitle() + " with score: " + score,
                "System"
        );

        if (saved.getStudentId() != null && !saved.getStudentId().isBlank()) {
            notificationService.createNotification(com.zoroacademy.entity.Notification.builder()
                    .id("notif_" + java.util.UUID.randomUUID())
                    .recipientId(saved.getStudentId())
                    .recipientRole("STUDENT")
                    .title("Assignment Graded")
                    .message("Your submission for '" + saved.getAssignmentTitle() + "' has been graded: " + score + ".")
                    .readStatus(false)
                    .build());
        }

        return saved;
    }

    @Transactional
    public void deleteAssignment(String id) {
        assignmentRepository.deleteById(id);
    }

    @Transactional
    public void deleteSubmission(String id) {
        submissionRepository.deleteById(id);
    }
}
