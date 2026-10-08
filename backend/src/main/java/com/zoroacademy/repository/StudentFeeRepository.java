package com.zoroacademy.repository;

import com.zoroacademy.entity.StudentFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFeeRepository extends JpaRepository<StudentFee, String> {
    List<StudentFee> findByStudentId(String studentId);
    List<StudentFee> findByCourseId(String courseId);
    List<StudentFee> findByBatchId(String batchId);
    List<StudentFee> findByStatusIgnoreCase(String status);
    Optional<StudentFee> findByStudentIdAndCourseId(String studentId, String courseId);
    Optional<StudentFee> findByStudentIdAndCourseIgnoreCase(String studentId, String course);
}
