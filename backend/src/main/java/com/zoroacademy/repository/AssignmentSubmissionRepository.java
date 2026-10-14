package com.zoroacademy.repository;

import com.zoroacademy.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, String> {
    List<AssignmentSubmission> findByCourseId(String courseId);
    List<AssignmentSubmission> findByStudentId(String studentId);
    List<AssignmentSubmission> findByTrainerId(String trainerId);
    List<AssignmentSubmission> findByAssignmentId(String assignmentId);
    List<AssignmentSubmission> findByBatchId(String batchId);
    List<AssignmentSubmission> findByStudentEmailIgnoreCase(String studentEmail);
    List<AssignmentSubmission> findByAssignedTrainerIgnoreCase(String assignedTrainer);
    List<AssignmentSubmission> findByStatusIgnoreCase(String status);
    List<AssignmentSubmission> findByStudentIdOrStudentEmailIgnoreCase(String studentId, String studentEmail);
    List<AssignmentSubmission> findByTrainerIdOrAssignedTrainerIgnoreCase(String trainerId, String assignedTrainer);
    List<AssignmentSubmission> findBySourceTypeAndSourceId(String sourceType, String sourceId);
    List<AssignmentSubmission> findBySourceTypeAndSourceIdAndStudentId(String sourceType, String sourceId, String studentId);
    List<AssignmentSubmission> findBySourceTypeAndSourceIdAndStudentEmailIgnoreCase(String sourceType, String sourceId, String studentEmail);
    List<AssignmentSubmission> findBySubmitterRoleIgnoreCase(String submitterRole);
    List<AssignmentSubmission> findBySubmitterRoleIgnoreCaseOrderByCreatedAtDesc(String submitterRole);
    List<AssignmentSubmission> findByStudentIdAndSubmitterRoleIgnoreCase(String studentId, String submitterRole);
    List<AssignmentSubmission> findByStudentEmailIgnoreCaseAndSubmitterRoleIgnoreCase(String studentEmail, String submitterRole);
    List<AssignmentSubmission> findByTrainerIdAndSubmitterRoleIgnoreCase(String trainerId, String submitterRole);
}
