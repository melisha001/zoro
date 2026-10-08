package com.zoroacademy.repository;

import com.zoroacademy.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, String> {
    List<AssignmentSubmission> findByCourseId(String courseId);
    List<AssignmentSubmission> findByStudentEmailIgnoreCase(String studentEmail);
    List<AssignmentSubmission> findByAssignedTrainerIgnoreCase(String assignedTrainer);
    List<AssignmentSubmission> findByStatusIgnoreCase(String status);
}
