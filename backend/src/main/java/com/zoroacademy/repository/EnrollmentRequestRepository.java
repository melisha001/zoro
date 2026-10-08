package com.zoroacademy.repository;

import com.zoroacademy.entity.EnrollmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, String> {
    List<EnrollmentRequest> findByStudentId(String studentId);
    List<EnrollmentRequest> findByStudentEmailIgnoreCase(String studentEmail);
    List<EnrollmentRequest> findByStatusIgnoreCase(String status);
    Optional<EnrollmentRequest> findByStudentIdAndCourseIdAndStatus(String studentId, String courseId, String status);
    Optional<EnrollmentRequest> findByStudentEmailIgnoreCaseAndCourseIdAndStatus(String studentEmail, String courseId, String status);
}
