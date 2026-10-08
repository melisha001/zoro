package com.zoroacademy.repository;

import com.zoroacademy.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    List<Enrollment> findByStudentId(String studentId);
    List<Enrollment> findByStudentEmailIgnoreCase(String studentEmail);
    List<Enrollment> findByCourseId(String courseId);
    Optional<Enrollment> findByStudentIdAndCourseId(String studentId, String courseId);
    Optional<Enrollment> findByStudentEmailIgnoreCaseAndCourseId(String studentEmail, String courseId);
    boolean existsByStudentIdAndCourseId(String studentId, String courseId);
    boolean existsByStudentEmailIgnoreCaseAndCourseId(String studentEmail, String courseId);
}
