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
    public AssignmentService(AssignmentRepository assignmentRepository, AssignmentSubmissionRepository submissionRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
    }


    @Transactional(readOnly = true)
    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    @Transactional
    public Assignment createAssignment(Assignment assignment) {
        if (assignment.getId() == null || assignment.getId().isBlank()) {
            assignment.setId("asg_" + System.currentTimeMillis());
        }
        return assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getAllSubmissions() {
        return submissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getSubmissionsByStudent(String email) {
        return submissionRepository.findByStudentEmailIgnoreCase(email);
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmission> getSubmissionsByTrainer(String trainer) {
        return submissionRepository.findByAssignedTrainerIgnoreCase(trainer);
    }

    @Transactional
    public AssignmentSubmission createSubmission(AssignmentSubmission submission) {
        if (submission.getId() == null || submission.getId().isBlank()) {
            submission.setId("sub_" + System.currentTimeMillis());
        }
        if (submission.getSubmittedAt() == null || submission.getSubmittedAt().isBlank()) {
            submission.setSubmittedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a")));
        }
        if (submission.getStatus() == null || submission.getStatus().isBlank()) {
            submission.setStatus("Pending Correction");
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

        return submissionRepository.save(sub);
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
